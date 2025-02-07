import {
	config,
	TOXIC_TEXT_ID,
	ActionTypes,
	EventType,
	DetectionRepos,
	LabelNames,
	REPLAY_ID,
	ContextText,
	ToxicTextContext,
	PayloadIdentifiers,
	parentTypes,
  } from "./config/config.js";
  import {
	getModIssueDescription,
	extractNumberFromPayload,
	getTextId,
	getModIssueTitle,
	extractRepoName,
	extractEventType,
	extractModCommentId,
	extractToxicParentNumber,
	isAppeal,
	extractIdFromAppeal,
	extractReplayId,
	evaluateEventType,
	getResponseTextFooter,
	mapCommentToContextText,
	prepareToxicTextContext,
  } from "./helpers.js";
  import { ProbotLogger } from "./ProbotLogger.js";
  import { GPTApiService } from "./GPTApiService.js";
  import { GitHubApiService } from "./GitHubApiService.js";
  
  export class GitHubEventHandler {
	private Logger: ProbotLogger;
	private GPTApiService: GPTApiService;
	private GitHubApiService: GitHubApiService;
	private readonly DETECTION_REPOS: DetectionRepos;
	private readonly MODERATION_REPO: string;
	private readonly IS_AUTOMATIC_MODE: boolean;
	private readonly REPOS_OWNER: string;
	private systemInfoTag: string;
  
	constructor(Logger: ProbotLogger) {
	  this.Logger = Logger;
	  this.GPTApiService = new GPTApiService(Logger);
	  this.GitHubApiService = new GitHubApiService(Logger);
	  this.DETECTION_REPOS = config.DETECTION_REPOS;
	  this.MODERATION_REPO = config.MODERATION_REPO;
	  this.IS_AUTOMATIC_MODE = config.IS_AUTOMATIC_MODE;
	  this.REPOS_OWNER = config.REPOS_OWNER;
	  this.systemInfoTag = `#### [SYSTEM_INFO]\n`;
	}
  
	private isBot(context: any): boolean {
	  return context.isBot;
	}
  
	private isFromModerationRepo(context: any): boolean {
	  return context.payload.repository.name === this.MODERATION_REPO;
	}
  
	private isFromDetectionRepo(context: any): boolean {
	  return this.DETECTION_REPOS.reposNames.includes(
		context.payload.repository.name
	  );
	}
  
	private canProceed(
	  context: any,
	  eventType: EventType,
	  repoCheck: (context: any) => boolean
	): boolean {
	  if (!this.isBot(context) && repoCheck(context)) {
		this.Logger.info(
		  `Handling ${eventType.fullName} for repo: ${context.payload.repository.name}`
		);
		return true;
	  }
	  this.Logger.info(
		`Ignoring ${eventType.fullName} for repo: ${context.payload.repository.name}`
	  );
	  return false;
	}
  
	private canProceedWithDetection(context: any, eventType: EventType): boolean {
	  return this.canProceed(
		context,
		eventType,
		this.isFromDetectionRepo.bind(this)
	  );
	}
  
	private canProceedWithModeration(
	  context: any,
	  eventType: EventType
	): boolean {
	  return this.canProceed(
		context,
		eventType,
		this.isFromModerationRepo.bind(this)
	  );
	}
  
	private async findModIssueById(
	  context: any,
	  Id: number,
	  isTextId: boolean,
	  getExpired?: boolean
	): Promise<any> {
	  this.Logger.info(`Finding MOD issue`);
	  const issues = await this.GitHubApiService.listAllModIssues(context);
	  if (issues.length === 0) {
		this.Logger.info(`No MOD issues found`);
		return null;
	  }
  
	  let filteredIssues = issues;
	  if (!getExpired) {
		filteredIssues = issues.filter(
		  (issue: any) =>
			!issue.labels.some((label: any) => label.name === LabelNames.EXPIRED)
		);
		if (filteredIssues.length === 0) {
		  this.Logger.info(
			`No MOD issues found after filtering out EXPIRED instances`
		  );
		  return null;
		}
	  }
  
	  let idSection: RegExp;
	  if (isTextId) {
		idSection = new RegExp(`${TOXIC_TEXT_ID}${Id}`); //  TOXIC_TEXT_ID: 2170548037
	  } else {
		idSection = new RegExp(`${REPLAY_ID}${Id}`); //  REPLAY_ID: 2168266972
	  }
  
	  const targetIssues = filteredIssues.filter(
		(issue: any) => issue.body && idSection.test(issue.body)
	  );
	  if (targetIssues.length === 0) {
		this.Logger.info(
		  `No MOD issues found after filtering. No need for further action.`
		);
		return null;
	  }
  
	  // return first element from targetIssues which is the newest one
	  return targetIssues[0];
	}
  
	private async findAndDeleteModResponses(
	  context: any,
	  detectionRepoName: string,
	  modIssueNumber: number
	): Promise<boolean> {
	  const modIssue = await this.GitHubApiService.getModIssue(
		context,
		modIssueNumber
	  );
	  const replayId = extractReplayId(modIssue.body);
	  if (!replayId) {
		throw new Error(`Failed to extract replayId from the mod issue`);
	  }
  
	  // deleting old moderation responses
	  if (
		context.name === "issue_comment" ||
		context.name === "pull_request_review" ||
		context.name === "issues" ||
		context.name === "pull_request"
	  ) {
		await this.GitHubApiService.deleteIssueComment(
		  context,
		  detectionRepoName,
		  replayId
		);
	  } else if (context.name === "pull_request_review_comment") {
		await this.GitHubApiService.deleteReviewComment(
		  context,
		  detectionRepoName,
		  replayId
		);
	  } else {
		throw new Error(
		  `Unknown context.name: ${context.name} for deleting old moderation responses`
		);
	  }
  
	  this.Logger.info(
		`Old moderation responses were deleted for replayId: ${replayId}`
	  );
	  await this.GitHubApiService.addLabelsToModIssue(context, modIssueNumber, [
		LabelNames.RESPONSE_CLEANED,
	  ]);
	  return true;
	}
  
	private async handleExistingModIssues(
	  context: any,
	  eventType: EventType,
	  issueToEdit: any,
	  isToxic?: boolean
	): Promise<void> {
	  if (issueToEdit === null) {
		// if sth was not toxic and now toxic so we do not have existing moderation issue that is not expired
		// if sth was not toxic and now is deleted so we do not have existing moderation issue that is not expired
		// if sth was not toxic and now is transfered so we do not have existing moderation issue that is not expired
		return;
	  }
  
	  const detectionRepoName = context.payload.repository.name;
	  const systemInfoText = `\nThis moderation issue will be closed and marked as expired.`;
	  const issueCommentCommon = `${this.systemInfoTag}This instance in ${detectionRepoName}`;
	  const modIssueNumber = issueToEdit.number;
	  this.Logger.info(
		`Issue for this text already exists in MODERATION_REPO: ${issueToEdit.html_url}`
	  );
  
	  // helper functions
	  const addComment = async (message: string) => {
		await this.GitHubApiService.commentOnIssue(
		  context,
		  this.MODERATION_REPO,
		  modIssueNumber,
		  message
		);
	  };
  
	  const handleDeletion = async (
		areModResponsesAlreadyDeleted: boolean,
		canDeleteModResponsesInSemiAutomatic: boolean
	  ) => {
		// for issues and discussions & discussion comments when is deleted we do not need to delete the MOD reponses, PR cannot be deleted
		const dontDeleteModResponses =
		  ((eventType.parentType == parentTypes.DISCUSSION ||
			eventType.payloadIdentifier == PayloadIdentifiers.ISSUE) &&
			eventType.actionType == ActionTypes.DELETED) ||
		  canDeleteModResponsesInSemiAutomatic;
		// if entire issue or discussion is deleted then we need to expire all the mod issues that contain comments
		if (
		  eventType.payloadIdentifier === PayloadIdentifiers.ISSUE ||
		  eventType.payloadIdentifier === PayloadIdentifiers.DISCUSSION
		) {
		  this.Logger.info(
			`${eventType.payloadIdentifier} was deleted. Expiring related MOD issues.`
		  );
		  const parentNumber =
			context.payload[eventType.payloadIdentifier].number;
		  const issues = await this.GitHubApiService.listAllModIssues(context);
		  let idSection = new RegExp(`#${parentNumber}`); //  e.g. #74
		  const relatedModIssues = issues.filter(
			(issue: any) => issue.title && idSection.test(issue.title)
		  );
		  if (relatedModIssues.length !== 0) {
			// find all mod issues that have #number in title, for each of them expire and leave a comment
			for (const relatedModIssue of relatedModIssues) {
			  await this.GitHubApiService.updateModIssue(
				context,
				relatedModIssue.number,
				undefined,
				"closed"
			  );
			  await this.GitHubApiService.addLabelsToModIssue(
				context,
				relatedModIssue.number,
				[LabelNames.EXPIRED]
			  );
			  await this.GitHubApiService.commentOnIssue(
				context,
				this.MODERATION_REPO,
				relatedModIssue.number,
				`${this.systemInfoTag}This moderation issue was closed and marked as expired because the entire parent ${eventType.payloadIdentifier} was deleted.`
			  );
			}
		  } else {
			this.Logger.info(
			  `No MOD issues found after filtering. No need for further action.`
			);
		  }
		}
  
		if (dontDeleteModResponses || areModResponsesAlreadyDeleted) {
		  this.Logger.info(
			`No need to delete MOD responses for ${eventType.fullName}`
		  );
		  await addComment(
			`${issueCommentCommon} was ${eventType.actionType}. ${systemInfoText}`
		  );
		} else {
		  this.Logger.info(
			`${eventType.fullName} - was deleted. Deleting associated moderation responses.`
		  );
		  await this.findAndDeleteModResponses(
			context,
			detectionRepoName,
			modIssueNumber
		  );
		  await addComment(
			`${issueCommentCommon} was ${eventType.actionType}. Associated moderation responses were deleted. ${systemInfoText}`
		  );
		}
	  };
  
	  const handleEdit = async (
		areModResponsesAlreadyDeleted: boolean,
		canDeleteModResponsesInSemiAutomatic: boolean
	  ) => {
		// for discussions & discussion comments when is edited we do not need to delete the MOD reponsesbecuase there are none
		const dontDeleteModResponses =
		  (eventType.parentType == parentTypes.DISCUSSION &&
			eventType.actionType == ActionTypes.EDITED) ||
		  canDeleteModResponsesInSemiAutomatic;
  
		if (areModResponsesAlreadyDeleted) return;
  
		const commentAddText = isToxic
		  ? "After edit it is still toxic.\nLook into a newly opened moderation issue for more details.\n"
		  : "After edit it is no longer toxic.\n";
  
		if (dontDeleteModResponses) {
		  this.Logger.info(
			`No need to delete MOD responses for ${eventType.fullName}`
		  );
		  await addComment(
			`${issueCommentCommon} was ${eventType.actionType}. ${commentAddText} ${systemInfoText}`
		  );
		  return;
		}
  
		this.Logger.info(`${eventType.fullName} - ${commentAddText}`);
		if (
		  await this.findAndDeleteModResponses(
			context,
			detectionRepoName,
			modIssueNumber
		  )
		) {
		  await addComment(
			`${issueCommentCommon} was ${eventType.actionType}. ${commentAddText} Associated moderation responses were deleted. ${systemInfoText}`
		  );
		} else {
		  await addComment(
			`${issueCommentCommon} was ${eventType.actionType}. ${commentAddText} ${systemInfoText}`
		  );
		}
	  };
  
	  const handleTransfer = async () => {
		// when sth is transfered we do not need to delete the MOD reponses
		const newRepoUrl =
		  context.payload.changes[`new_${eventType.payloadIdentifier}`]?.html_url;
		await addComment(
		  `${issueCommentCommon} was transferred to new repo: ${newRepoUrl}. ${systemInfoText}`
		);
	  };
  
	  // COMMENT - handling the event
	  // for elements that were toxic and are no longer toxic we do not have to delete responses -> check if the MOD responses are already deleted
	  // also for mod issues in which moderator rejected the proposed answer we do not have to delete responses as there are none
	  const areModResponsesAlreadyDeleted = issueToEdit.labels.some(
		(label: any) => label.name === LabelNames.RESPONSE_CLEANED
	  );
  
	  /*for semi automatic mode when mod response was rejected by moderator or issue is still open and was not yet addressed by 
	  moderator and delete/edit event is triggered we do not need to delete the MOD responses as they are none*/
	  const canDeleteModResponsesInSemiAutomatic =
		!this.IS_AUTOMATIC_MODE &&
		(issueToEdit.labels.some(
		  (label: any) => label.name === LabelNames.REJECT
		) ||
		  (issueToEdit.state === "open" && issueToEdit.labels.length === 0));
  
	  switch (eventType.actionType) {
		case ActionTypes.DELETED:
		  await handleDeletion(
			areModResponsesAlreadyDeleted,
			canDeleteModResponsesInSemiAutomatic
		  );
		  break;
		case ActionTypes.EDITED:
		  await handleEdit(
			areModResponsesAlreadyDeleted,
			canDeleteModResponsesInSemiAutomatic
		  );
		  break;
		case ActionTypes.TRANSFERRED:
		  await handleTransfer();
		  break;
	  }
  
	  await this.GitHubApiService.updateModIssue(
		context,
		modIssueNumber,
		undefined,
		"closed"
	  );
	  await this.GitHubApiService.addLabelsToModIssue(context, modIssueNumber, [
		LabelNames.EXPIRED,
	  ]);
	}
  
	private async completeModIssueHandling(
	  context: any,
	  modIssueNumber: number,
	  modIssueBody: string,
	  modReplayTextId: number
	): Promise<void> {
	  if (this.IS_AUTOMATIC_MODE) {
		// close the mod issue and add labels
		await this.GitHubApiService.updateModIssue(
		  context,
		  modIssueNumber,
		  undefined,
		  "closed"
		);
		await this.GitHubApiService.addLabelsToModIssue(context, modIssueNumber, [
		  LabelNames.AUTOMATIC_RESPONSE,
		  LabelNames.EXECUTED,
		]);
	  } else {
		// add labels to the mod issue
		await this.GitHubApiService.addLabelsToModIssue(context, modIssueNumber, [
		  LabelNames.EXECUTED,
		]);
	  }
  
	  // COMMENT - add the replay ID to the MOD issue
	  // get the current ody of mod issue here and append new value and REPLACE MOD ISSUE BODY
	  await this.GitHubApiService.updateModIssue(
		context,
		modIssueNumber,
		modIssueBody + `\n >${REPLAY_ID}${modReplayTextId}`
	  );
	}
  
	private async handleModerationResponse(
	  context: any,
	  eventType: EventType,
	  payloadNumber: number,
	  modIssueNumber: number,
	  modIssueBody: string,
	  detectionRepoName: string,
	  toxicyResponseText: string,
	  isAutomatic: boolean
	): Promise<void> {
	  const { isIssueOrPR, isDiscussion, isReviewComment } =
		evaluateEventType(eventType);
	  const responseTextFooter = getResponseTextFooter(isAutomatic);
  
	  if (isIssueOrPR) {
		this.Logger.info(
		  `Replaying with moderation response to the originating place`
		);
		const responseCommentId = await this.GitHubApiService.commentOnIssue(
		  context,
		  detectionRepoName,
		  payloadNumber,
		  toxicyResponseText + responseTextFooter
		);
		await this.completeModIssueHandling(
		  context,
		  modIssueNumber,
		  modIssueBody,
		  responseCommentId
		);
	  } else if (isDiscussion) {
		this.Logger.info(
		  `Replaying with moderation response for a discussion or a discussion comment is currently not supported`
		);
	  } else if (isReviewComment) {
		this.Logger.info(
		  `Replaying with moderation response to the originating place`
		);
		const responseReplayId =
		  await this.GitHubApiService.replayToReviewCommentInDetectionRepo(
			context,
			detectionRepoName,
			payloadNumber,
			toxicyResponseText + responseTextFooter
		  );
		await this.completeModIssueHandling(
		  context,
		  modIssueNumber,
		  modIssueBody,
		  responseReplayId
		);
	  } else {
		this.Logger.error(
		  `Unknown parentType: ${eventType.parentType} for replaying moderation response`
		);
	  }
	}
  
	private async handleEditedAction(
	  context: any,
	  eventType: EventType,
	  isToxic: boolean
	): Promise<void> {
	  this.Logger.info(`Handling edited action`);
	  const textId = context.payload[eventType.payloadIdentifier]?.id;
	  const issueWithTextId = await this.findModIssueById(
		context,
		textId,
		true,
		false
	  );
	  // if sth was not toxic and now toxic so we do not have existing moderation issue that is not expired
	  await this.handleExistingModIssues(
		context,
		eventType,
		issueWithTextId,
		isToxic
	  );
	}
  
	private async createModerationIssue(
	  context: any,
	  moderationResponse: string,
	  payloadNumber: number
	): Promise<{ newModIssueNumber: number; newModResponseCommentId: number }> {
	  const messageTitle = getModIssueTitle(
		payloadNumber,
		context.payload.repository.full_name
	  );
	  const newModIssueNumber = await this.GitHubApiService.createModIssue(
		context,
		messageTitle
	  );
	  // adding comment with proposed moderation response to MODERATION_REPO
	  const newModResponseCommentId = await this.GitHubApiService.commentOnIssue(
		context,
		this.MODERATION_REPO,
		newModIssueNumber,
		moderationResponse
	  );
	  return { newModIssueNumber, newModResponseCommentId };
	}
  
	private async updateModerationIssue(
	  context: any,
	  eventType: EventType,
	  modIssueNumber: number,
	  modResponseCommentId: number,
	  payloadNumber: number,
	  isAutomatic: boolean
	): Promise<string> {
	  const payload = context.payload[eventType.payloadIdentifier];
	  const modIssueBody = getModIssueDescription(
		eventType,
		context.payload.repository.full_name,
		context.payload.repository.html_url,
		payload.body,
		payload.html_url,
		payload.id,
		modResponseCommentId,
		payloadNumber,
		isAutomatic
	  );
  
	  await this.GitHubApiService.updateModIssue(
		context,
		modIssueNumber,
		modIssueBody
	  );
  
	  this.Logger.info(
		`Moderation actions documented in ${this.MODERATION_REPO}`
	  );
  
	  return modIssueBody;
	}
  
	private async handleToxicity(
	  context: any,
	  eventType: EventType,
	  toxicyResponse: { isToxic: boolean; moderationResponse: string }
	): Promise<void> {
	  // COMMENT - check if there is already an issue in MODERATION_REPO with the same textId
	  // if the text is still toxic / no longer toxic we first need to handle the existing MOD issue
	  if (eventType.actionType === ActionTypes.EDITED) {
		await this.handleEditedAction(context, eventType, toxicyResponse.isToxic);
	  }
  
	  // COMMENT - a) if the text is toxic/ still toxic we open new MOD issue
	  // COMMENT - b) if the text is no toxic/ no longer toxic we do not open new MOD
	  if (!toxicyResponse.isToxic) {
		this.Logger.info(
		  `${eventType.fullName} is not toxic. No moderating action needed.`
		);
		return;
	  }
  
	  // COMMENT - proceed with moderation and creating new MOD issue
	  this.Logger.info(
		`${eventType.fullName} is toxic. Documenting moderation actions in ${this.MODERATION_REPO}`
	  );
  
	  const payloadNumber = extractNumberFromPayload(
		context,
		eventType.parentType
	  );
  
	  const { newModIssueNumber, newModResponseCommentId } =
		await this.createModerationIssue(
		  context,
		  toxicyResponse.moderationResponse,
		  payloadNumber
		);
  
	  const modIssueBody = await this.updateModerationIssue(
		context,
		eventType,
		newModIssueNumber,
		newModResponseCommentId,
		payloadNumber,
		this.IS_AUTOMATIC_MODE
	  );
  
	  // replay with moderation response to DETECTION_REPOS
	  if (!this.IS_AUTOMATIC_MODE) {
		this.Logger.info(
		  `Automatic moderation is disabled. Waiting for moderator to take action.`
		);
	  } else {
		const detectionRepoName = context.payload.repository.name;
  
		await this.handleModerationResponse(
		  context,
		  eventType,
		  payloadNumber,
		  newModIssueNumber,
		  modIssueBody,
		  detectionRepoName,
		  toxicyResponse.moderationResponse,
		  true
		);
	  }
	}
  
	private getClosedModIssueLabel(context: any) {
	  const closedIssueLabels = context.payload.issue.labels;
  
	  const labelNames = closedIssueLabels.map(
		(label: { name: string }) => label.name
	  );
  
	  const hasApproved = labelNames.includes(LabelNames.APPROVE);
	  const hasRejected = labelNames.includes(LabelNames.REJECT);
	  const hasExpired = labelNames.includes(LabelNames.EXPIRED);
	  const hasAppealed = labelNames.includes(LabelNames.APPEALED);
	  const hasAutomaticResponse = labelNames.includes(
		LabelNames.AUTOMATIC_RESPONSE
	  );
	  if (hasAppealed) {
		return LabelNames.APPEALED;
	  }
  
	  if (hasApproved && !hasRejected && !hasExpired && !hasAutomaticResponse) {
		return LabelNames.APPROVE;
	  }
  
	  if (hasRejected && !hasApproved && !hasExpired && !hasAutomaticResponse) {
		return LabelNames.REJECT;
	  }
  
	  return undefined;
	}
  
	private async handleInvalidModerationAction(
	  context: any,
	  eventType: EventType
	): Promise<void> {
	  this.Logger.warn(
		`No moderation action was taken. Reopening the issue in the moderation repo: ${context.payload.issue.html_url}`
	  );
	  const payloadNumber = extractNumberFromPayload(
		context,
		eventType.parentType
	  );
	  // comment on the issue in the moderation repo
	  await this.GitHubApiService.commentOnIssue(
		context,
		this.MODERATION_REPO,
		payloadNumber,
		`${this.systemInfoTag}No moderation action was taken. Issue is reopened, please add a label and then close the issue to take action.`
	  );
	  // reopen the issue in the moderation repo
	  await this.GitHubApiService.updateModIssue(
		context,
		payloadNumber,
		undefined,
		"open"
	  );
	}
  
	private extractAndValidateRepoName(payloadBody: string): string | null {
	  const detectionRepoName = extractRepoName(payloadBody, this.REPOS_OWNER);
  
	  if (!this.DETECTION_REPOS.reposNames.includes(detectionRepoName)) {
		this.Logger.error(
		  `Detection repo name: ${detectionRepoName} is not in the list of detection repos`
		);
		return null;
	  }
  
	  return detectionRepoName;
	}
  
	private extractModIssueDetails(payloadBody: string): {
	  toxicParentNumber: number;
	  toxicEventType: EventType;
	  modResponseCommentId: number;
	} {
	  const toxicParentNumber = extractToxicParentNumber(payloadBody);
	  const toxicEventType = extractEventType(payloadBody);
	  const modResponseCommentId = extractModCommentId(payloadBody);
  
	  return { toxicParentNumber, toxicEventType, modResponseCommentId };
	}
  
	private async handleApprovedModerationAction(context: any): Promise<void> {
	  this.Logger.info(
		"Moderation action was APPROVED. Replaying with moderation response to the detection repo"
	  );
  
	  const payloadBody = context.payload.issue.body;
	  const detectionRepoName = this.extractAndValidateRepoName(payloadBody);
	  if (!detectionRepoName) return;
  
	  const { toxicParentNumber, toxicEventType, modResponseCommentId } =
		this.extractModIssueDetails(payloadBody);
  
	  const modProposedResponseComment =
		await this.GitHubApiService.getModComment(context, modResponseCommentId);
  
	  // replay with moderation response to target detection repo
	  await this.handleModerationResponse(
		context,
		toxicEventType,
		toxicParentNumber,
		context.payload.issue.number,
		payloadBody,
		detectionRepoName,
		modProposedResponseComment,
		false
	  );
	}
  
	private async handleAppeal(context: any, textBody: string): Promise<void> {
	  this.Logger.info(`Appeal from the bot's decision`);
  
	  const modResponseId: number | null = extractIdFromAppeal(textBody);
	  if (!modResponseId) {
		this.Logger.error(`Failed to extract modResponseId from the appeal`);
		return;
	  }
	  const modIssueWithModResponseId = await this.findModIssueById(
		context,
		modResponseId,
		false,
		false
	  );
	  // if the mod issue does not exist, it means that the appeal is not relevant
	  if (!modIssueWithModResponseId) {
		this.Logger.info(
		  `Invalid appeal. There is no MOD issue for this appeal.`
		);
		return;
	  }
  
	  const modIssueLabels = modIssueWithModResponseId.labels;
	  if (
		modIssueLabels.some((label: any) =>
		  label.name.includes(LabelNames.APPEALED)
		) ||
		modIssueLabels.some((label: any) =>
		  label.name.includes(LabelNames.EXPIRED)
		)
	  ) {
		this.Logger.info(`Appeal not relevant for the issue.`);
		return;
	  }
  
	  // add label that the user appealed
	  await this.GitHubApiService.addLabelsToModIssue(
		context,
		modIssueWithModResponseId.number,
		[LabelNames.APPEALED]
	  );
	  // make the mod issue open, regradless if it was closed or not
	  await this.GitHubApiService.updateModIssue(
		context,
		modIssueWithModResponseId.number,
		undefined,
		"open"
	  );
	}
  
	private async getIssueComments(
	  context: any,
	  payloadNumber: number,
	  detectionRepoName: string
	): Promise<ContextText[]> {
	  const issueComments = await this.GitHubApiService.listIssueComments(
		context,
		payloadNumber,
		detectionRepoName
	  );
	  return issueComments.map(mapCommentToContextText);
	}
  
	private async getAllPullRequestComments(
	  context: any,
	  payloadNumber: number,
	  detectionRepoName: string
	): Promise<ContextText[]> {
	  const issueComments = await this.getIssueComments(
		context,
		payloadNumber,
		detectionRepoName
	  );
  
	  const reviewCommentsOnPR =
		await this.GitHubApiService.listReviewCommentsOnPr(
		  context,
		  detectionRepoName,
		  payloadNumber
		).then((comments) => comments.map(mapCommentToContextText));
  
	  const reviewsOnPR = await this.GitHubApiService.listReviewsForPr(
		context,
		detectionRepoName,
		payloadNumber
	  ).then((reviews) =>
		reviews
		  .filter((review: any) => review.body !== "")
		  .map(mapCommentToContextText)
	  );
  
	  return [...issueComments, ...reviewCommentsOnPR, ...reviewsOnPR];
	}
  
	private async getCommentContext(
	  context: any,
	  eventType: EventType
	): Promise<ToxicTextContext> {
	  /* We need only need to check the previous comments for:
		a) issue comment 
		b) PR comment(in API treated as issue_comment) & pull_request_review_comment
		- for discussion comment we don't have the endpoint to list the comments
		- for the rest we are not providing context, as when issue, pr, or discussion is open, there is just a description and no comments.
	  */
	  const detectionRepoName = context.payload.repository.name;
	  const payloadNumber = extractNumberFromPayload(
		context,
		eventType.parentType
	  );
	  const textId = getTextId(context, eventType.payloadIdentifier);
	  const toxicTextAuthor: string =
		context.payload[eventType.payloadIdentifier].user.login;
  
	  // COMMENT - get the parent(Issue or PR) title and description
	  const parentTitle: string = context.payload[eventType.parentType].title;
	  const parentDetails: ContextText = {
		id: context.payload[eventType.parentType].id,
		timestamp: context.payload[eventType.parentType].created_at,
		body: context.payload[eventType.parentType].body,
		user_id: context.payload[eventType.parentType].user.id,
	  };
  
	  let allComments: ContextText[] = [];
  
	  // COMMENT - handling ISSUE COMMENTS
	  if (
		eventType.fullName.includes("issue_comment") &&
		!context.payload.issue?.pull_request
	  ) {
		allComments = await this.getIssueComments(
		  context,
		  payloadNumber,
		  detectionRepoName
		);
	  }
  
	  // COMMENT - handling PR Comments and PR Review Comments
	  else if (
		eventType.fullName.includes("pull_request_review_comment") || // detect pull_request_review_comment
		context.payload.issue?.pull_request // detect comment under PR, which is treated as issue_comment in GitHub API
	  ) {
		allComments = await this.getAllPullRequestComments(
		  context,
		  payloadNumber,
		  detectionRepoName
		);
	  }
  
	  if (allComments.length > 0) {
		return prepareToxicTextContext(
		  allComments,
		  textId,
		  parentTitle,
		  toxicTextAuthor,
		  parentDetails
		);
	  }
  
	  // all other types for which we do not provide context as there is none
	  const targetComment: ContextText = {
		id: 0,
		timestamp: "",
		body: context.payload[eventType.payloadIdentifier].body,
		user_id: 0,
	  };
	  return {
		parentTitle: "",
		toxicTextAuthor: toxicTextAuthor,
		previousComments: [],
		targetComment: targetComment,
	  };
	}
  
	private hasEmptyChanges(
	  context: any,
	  eventType: EventType,
	  textBody: string | null | undefined
	): boolean {
	  if (
		(textBody === "" || textBody === null || textBody === undefined) &&
		eventType.actionType !== ActionTypes.EDITED
	  ) {
		this.Logger.info(
		  `=>Text body is empty. It is not an EDIT so no need for further action.`
		);
		return true;
	  }
	  /*When pull request review is started and then comments are being added next to code,  
		they do not appear in the webhook until the review is submitted.
		The code review comments(pull_request_review_comment) and 
		review finishing comment(pull_request_review) appear once review is submitted. 
		  => At this point pull_request_review is executed twice with the same body.
		  => once pull_request_review.submitted with "review submission comment"
		  => once pull_request_review.edited with the same "review submission comment" and same timestamp
		When we add code review comments(pull_request_review_comment) without starting 
		the review, they appear immediatelly in the webhook.
	  */
	  if (
		eventType.actionType === ActionTypes.EDITED &&
		eventType.fullName === "pull_request_review.edited"
	  ) {
		const changes = context.payload.changes;
		if (changes && Object.keys(changes).length === 0) {
		  this.Logger.info(
			`=>pull_request_review.edited with no changes. Skipping.`
		  );
		  return true;
		}
	  }
  
	  return false;
	}
  
	// ====================================================================
	// ========================= PUBLIC METHODS ===========================
	// ====================================================================
	public async handleEvent(context: any, eventType: EventType): Promise<void> {
	  try {
		// check if the event was not made by the bot and is from the detection repo
		if (!this.canProceedWithDetection(context, eventType)) return;
		// COMMENT - handle the deletion or transfer event
		if (
		  eventType.actionType === ActionTypes.DELETED ||
		  eventType.actionType === ActionTypes.TRANSFERRED
		) {
		  const textId = getTextId(context, eventType.payloadIdentifier);
		  // for transfered / deleted we also need issues that are expired
		  // so in case sth ended up not toxic and was transfered / deleted
		  const issueWithTextId = await this.findModIssueById(
			context,
			textId,
			true,
			true
		  );
		  // if sth was not toxic and now is deleted so we do not have existing moderation issue that is not expired
		  await this.handleExistingModIssues(context, eventType, issueWithTextId);
		} else {
		  // COMMENT - handle the creation, opening, submision or editing event
		  const textBody = context.payload[eventType.payloadIdentifier]?.body;
		  if (this.hasEmptyChanges(context, eventType, textBody)) return;
		  // COMMENT - handling appeal
		  if (isAppeal(textBody, eventType)) {
			try {
			  await this.handleAppeal(context, textBody);
			} catch (error: any) {
			  this.Logger.error(`Failed to handle appeal: ${error.message}`);
			  return;
			}
		  } else {
			// COMMENT - handling toxicity
			try {
			  const commentContext = await this.getCommentContext(
				context,
				eventType
			  );
			  const toxicityResponse =
				await this.GPTApiService.getToxicityResponse(commentContext);
			  await this.handleToxicity(context, eventType, toxicityResponse);
			} catch (error: any) {
			  this.Logger.error(`Failed to handle toxicity: ${error.message}`);
			  return;
			}
		  }
		}
	  } catch (error: any) {
		this.Logger.error(`Failed to proceed: ${error.message}`);
		return;
	  }
	}
  
	public async handleModerationAction(context: any, eventType: EventType) {
	  // check if the event was not made by the bot and is from the moderation repo
	  if (!this.canProceedWithModeration(context, eventType)) return;
  
	  // check label of the closed moderation issue
	  const closedModIssueLabel = this.getClosedModIssueLabel(context);
	  if (!closedModIssueLabel) {
		try {
		  await this.handleInvalidModerationAction(context, eventType);
		} catch (error: any) {
		  this.Logger.error(
			`Failed to handle invalid moderation action: ${error.message}`
		  );
		  return;
		}
	  } else if (closedModIssueLabel === LabelNames.APPEALED) {
		this.Logger.info(
		  `Moderation response was APPEALED and moderator closed the moderation issue. No need for further action.`
		);
	  } else if (closedModIssueLabel === LabelNames.APPROVE) {
		try {
		  await this.handleApprovedModerationAction(context);
		} catch (error: any) {
		  this.Logger.error(
			`Failed to handle approved moderation action: ${error.message}`
		  );
		  return;
		}
	  } else if (closedModIssueLabel === LabelNames.REJECT) {
		this.Logger.info(
		  `Moderation action was REJECTED. Issue is closed, no need for further action.`
		);
	  } else {
		this.Logger.error(`Unknown label for the closed moderation issue`);
	  }
	}
  }
  