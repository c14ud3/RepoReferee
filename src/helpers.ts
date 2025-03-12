import {
	TOXIC_TEXT_ID,
	PARENT_NUMBER,
	EVENT_TYPE,
	parentTypes,
	EventType,
	PayloadIdentifiers,
	MOD_COMMENT_ID,
	EventTypes,
	REPLAY_ID,
	ContextText,
	ToxicTextContext,
  } from "./config/config.js";
  
  export const capitalizeFirstLetter = (someWord: string): string => {
	return someWord.charAt(0).toUpperCase() + someWord.slice(1);
  };
  
  // get the number of discussion, issue, or PR
  export const extractNumberFromPayload = (
	context: any,
	parentType: parentTypes
  ): number => {
	return context.payload[parentType].number;
  };
  
  export const getTextId = (
	context: any,
	payloadIdentifier: PayloadIdentifiers
  ): number => {
	return context.payload[payloadIdentifier].id;
  };
  
  export const getModIssueDescription = (
	eventType: EventType,
	repoFullName: string,
	repoHtmlUrl: string,
	body: string,
	htmlUrl: string,
	toxicTextId: string,
	modResponseCommentId: number,
	parentNumber: number,
	isAutomatic: boolean
  ): string => {
	let ModIssueDescirption = `### 🚨 Toxicity Alert for ${eventType.actionType} ${eventType.payloadIdentifier} in [${repoFullName}](${repoHtmlUrl}).\n`;
	ModIssueDescirption += `**Detected Toxic Content:**\n <pre><i>${body.replace(
	  /[\r\n]+$/,
	  ""
	)}</i></pre>\n\n`;
	if (!isAutomatic) {
	  ModIssueDescirption += `**Action Required:**\n`;
	  ModIssueDescirption += `- [ ] Please review and address the toxic content identified in the description of the issue.\n`;
	  ModIssueDescirption += `- [ ] You can edit the moderation response in the comment below or leave it as is.\n\n`;
	  ModIssueDescirption += `- [ ] You can then set a label to this issue, either \`✅ MODERATOR APPROVED\` or \`❌ MODERATOR REJECTED\`.\n\n`;
	  ModIssueDescirption += `- [ ] Finally, please answer the quick survey below by editing this comment.\n\n`;
	}
	ModIssueDescirption += `👉 [Review Detected Content](${htmlUrl})\n\n`;

	// Feedback
	ModIssueDescirption += `---\n`;
	ModIssueDescirption += `📢 **Feedback:**\n`;

	ModIssueDescirption += `1. How much time did you need to review or handle this comment?\n`;
	ModIssueDescirption += `> 00:00:00 (HH:MM:SS)\n`;

	ModIssueDescirption += `2. How satisfied are you with the <ins>toxicity explanation</ins>?\n`;
	ModIssueDescirption += `  - [ ] Very dissatisfied\n`;
	ModIssueDescirption += `  - [ ] Dissatisfied\n`;
	ModIssueDescirption += `  - [ ] Neutral\n`;
	ModIssueDescirption += `  - [ ] Satisfied\n`;
	ModIssueDescirption += `  - [ ] Very Satisfied\n`;

	ModIssueDescirption += getFooter(
	  toxicTextId,
	  modResponseCommentId,
	  parentNumber,
	  eventType
	);
	return ModIssueDescirption;
  };
  
  export const getFooter = (
	toxicTextId: string,
	modResponseCommentId: number,
	parentNumber: number,
	eventType: EventType
  ): string => {
	let footer = `---\n*⚠️do not delete the below comment with moderation response!*\n`;
	footer += `>${TOXIC_TEXT_ID}${toxicTextId}\n `;
	footer += `>${PARENT_NUMBER}${parentNumber}\n `;
	footer += `>${EVENT_TYPE}${eventType.fullName}\n `;
	footer += `>${MOD_COMMENT_ID}${modResponseCommentId}`;
	return footer;
  };
  
  export const getModIssueTitle = (
	payloadNumber: number,
	repoFullName: string
  ): string => {
	return `Toxicity in #${payloadNumber} in ${repoFullName}`;
  };
  
  export const getRepoOwner = (context: any): string => {
	const owner = context.payload.repository.owner.login ?? "";
	if (!owner) {
	  console.error("Repository owner not found");
	  throw new Error("Repository owner not found");
	}
	return owner;
  };
  
  export const extractRepoName = (text: string, repoOwner: string): string => {
	const repoNamePattern = new RegExp(`\\[${repoOwner}\\/([^\\]]+)\\]`);
	const match = repoNamePattern.exec(text);
	return match ? match[1] : "";
  };
  
  export const extractToxicParentNumber = (text: string): number => {
	const textNumberPattern = new RegExp(`${PARENT_NUMBER}(\\d+)`);
	const match = textNumberPattern.exec(text);
	return match ? parseInt(match[1], 10) : 0;
  };
  
  export const extractEventType = (text: string): EventType => {
	const eventTypePattern = new RegExp(`${EVENT_TYPE}([\\w.]+)`);
	const match = eventTypePattern.exec(text);
	if (match) {
	  const eventTypeString = match[1];
	  const eventType = Object.values(EventTypes).find(
		(event) => event.fullName === eventTypeString
	  );
	  if (eventType) {
		return eventType;
	  }
	}
	console.error("Event type not found");
	throw new Error("Event type not found");
  };
  
  export const extractModCommentId = (text: string): number => {
	const modCommentIdPattern = new RegExp(`${MOD_COMMENT_ID}(\\d+)`);
	const match = modCommentIdPattern.exec(text);
	return match ? parseInt(match[1], 10) : 0;
  };
  
  export const extractReplayId = (text: string): number => {
	const replayIdPattern = new RegExp(`${REPLAY_ID}(\\d+)`);
	const match = replayIdPattern.exec(text);
	return match ? parseInt(match[1], 10) : 0;
  };
  
  export const isAppeal = (
	commentBody: string,
	eventType: EventType
  ): boolean => {
	// we can make an appeal by making issue/pr comment or PR review commentContext
	if (
	  eventType.payloadIdentifier !== PayloadIdentifiers.COMMENT &&
	  eventType.parentType !== parentTypes.DISCUSSION
	) {
	  return false;
	}
  
	const containsAppeal = commentBody.trim().toLowerCase().startsWith("/appeal");
	const urlPattern = /https:\/\/github\.com\//;
	const idAtEndPattern = /\d+$/;
	const validAppeal =
	  urlPattern.test(commentBody) && idAtEndPattern.test(commentBody);
	return containsAppeal && validAppeal;
  };
  
  export const extractIdFromAppeal = (url: string): number | null => {
	const regex = /(\d+)$/;
	const match = regex.exec(url);
	return match ? parseInt(match[0], 10) : null;
  };
  
  export const evaluateEventType = (eventType: EventType): any => {
	const { parentType, payloadIdentifier, fullName } = eventType;
  
	// for those we replay using the commentOnIssue
	const isIssueOrPR =
	  parentType === parentTypes.ISSUE ||
	  payloadIdentifier === PayloadIdentifiers.PR ||
	  payloadIdentifier === PayloadIdentifiers.REVIEW;
  
	const isDiscussion = parentType === parentTypes.DISCUSSION;
  
	// for a review comment we need to use the replayToReviewCommentInDetectionRepo
	const isReviewComment = fullName.includes("pull_request_review_comment");
  
	return { isIssueOrPR, isDiscussion, isReviewComment };
  };
  
  export const shortenToxicText = (text: string): string => {
	if (text.length > 100) {
	  return text.substring(0, 100) + "...";
	} else {
	  return text;
	}
  };
  
  export const getResponseTextFooter = (isAutomatic: boolean): string => {
	let footer = "";
	if (isAutomatic) {
	  footer = `> 🤖 Automated response\n`;
	} else {
	  footer = `> ✅ Response reviewed and approved by a human moderator\n`;
	}
	footer += `📢 If you have concerns or want to discuss this decision, reply using \`\`\`/appeal link_to_the_bot_comment\`\`\`.\n`;
	footer += `👉 Link to [Guidelines](https://www.mozilla.org/en-US/about/governance/policies/participation/)`;
	return footer;
  };
  
  export const sortComments = (comments: ContextText[]): ContextText[] => {
	return comments.sort(
	  (a: ContextText, b: ContextText) =>
		new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);
  };
  
  export const mapCommentToContextText = (comment: any): ContextText => {
	return {
	  id: comment.id,
	  timestamp: comment.created_at || comment.submitted_at,
	  body: comment.body,
	  user_id: comment.user.id,
	};
  };
  
  export const prepareToxicTextContext = (
	comments: ContextText[],
	textId: number,
	parentTitle: string,
	toxicTextAuthor: string,
	parentDetails: ContextText
  ): ToxicTextContext => {
	const sortedComments = sortComments(comments);
	const index = sortedComments.findIndex((comment) => comment.id === textId);
	if (index === -1) {
	  throw new Error(`Comment with id ${textId} not found.`);
	}
  
	const previousComments: ContextText[] = sortedComments.slice(0, index);
	const targetComment: ContextText = sortedComments[index];
  
	return {
	  parentTitle,
	  toxicTextAuthor,
	  previousComments: [parentDetails, ...previousComments],
	  targetComment,
	};
  };
  
  export const deleteReplays = (text: string): string => {
	const lines = text.split("\n");
	// filter out lines that start with ">"
	const filteredLines = lines.filter(
	  (line) => !line.trimStart().startsWith(">")
	);
	return filteredLines.join("\n");
  };
  