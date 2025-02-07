import { config, LabelNames, DetectionRepos } from "./config/config.js";
import { ProbotLogger } from "./ProbotLogger.js";

export class GitHubApiService {
  private Logger: ProbotLogger;
  DETECTION_REPOS: DetectionRepos;
  MODERATION_REPO: string;
  REPOS_OWNER: string;
  systemInfoTag: string;

  constructor(Logger: ProbotLogger) {
    this.Logger = Logger;
    this.DETECTION_REPOS = config.DETECTION_REPOS;
    this.MODERATION_REPO = config.MODERATION_REPO;
    this.REPOS_OWNER = config.REPOS_OWNER;
    this.systemInfoTag = `\t [GithubAPI]: `;
  }

  private getStatusAndMessage(error: any): { status: number; message: string } {
    return {
      status: parseInt(error.response.data.status.toString()),
      message: error.response.data.message,
    };
  }

  private handleError(error: any): void {
    const { status, message } = this.getStatusAndMessage(error);
    this.Logger.error(`${this.systemInfoTag} ERROR ${status} - ${message}`);
  }

  // ====================================================================
  // ======================== MOD REPO METHODS ==========================
  // ====================================================================
  public async getModIssue(context: any, issueNumber: number): Promise<any> {
    // 200	OK
    // 301	Moved permanently
    // 304	Not modified
    // 404	Resource not found
    // 410	Gone
    this.Logger.info(
      `${this.systemInfoTag}Getting issue ${issueNumber} in ${this.MODERATION_REPO}`
    );
    try {
      const response = await context.octokit.issues.get({
        owner: this.REPOS_OWNER,
        repo: this.MODERATION_REPO,
        issue_number: issueNumber,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to get moderation issue");
    }
  }

  public async getModComment(context: any, commentId: number): Promise<any> {
    // 200 OK
    // 404 Resource not found
    this.Logger.info(
      `${this.systemInfoTag}Getting comment ${commentId} in ${this.MODERATION_REPO}`
    );
    try {
      const response = await context.octokit.issues.getComment({
        owner: this.REPOS_OWNER,
        repo: this.MODERATION_REPO,
        comment_id: commentId,
      });
      return response.data.body;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to get moderation comment");
    }
  }

  public async listAllModIssues(context: any): Promise<any> {
    // 200 OK
    // 301 Moved permanently
    // 404 Resource not found
    // 422 Validation failed, or the endpoint has been spammed
    this.Logger.info(
      `${this.systemInfoTag}Listing issues in ${this.MODERATION_REPO}`
    );
    try {
      const perPage = 100;
      let page = 1;
      let allIssues: any[] = [];

      while (true) {
        const response = await await context.octokit.issues.listForRepo({
          owner: this.REPOS_OWNER,
          repo: this.MODERATION_REPO,
          state: "all",
          sort: "created",
          direction: "desc",
          per_page: perPage,
          page: page,
        });

        const issues = response.data;
        if (issues.length === 0) {
          break;
        }

        allIssues = allIssues.concat(issues);
        page++;
      }

      return allIssues;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to list moderation issues");
    }
  }

  public async createModIssue(
    context: any,
    modIssuetitle: string
  ): Promise<number> {
    // 201	Created
    // 400	Bad Request
    // 403	Forbidden
    // 404	Resource not found
    // 410	Gone
    // 422	Validation failed, or the endpoint has been spammed.
    // 503	Service unavailable
    this.Logger.info(
      `${this.systemInfoTag}Creating issue in ${this.MODERATION_REPO}`
    );
    try {
      const newModIssue = await context.octokit.issues.create({
        owner: this.REPOS_OWNER,
        repo: this.MODERATION_REPO,
        title: modIssuetitle,
      });
      return newModIssue.data.number;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to create moderation issue");
    }
  }

  public async updateModIssue(
    context: any,
    issueNumber: number,
    modIssueBody?: string,
    state?: "open" | "closed",
    replacementLabels?: LabelNames[]
  ): Promise<void> {
    // 200	OK
    // 301	Moved permanently
    // 403	Forbidden
    // 404	Resource not found
    // 410	Gone
    // 422	Validation failed, or the endpoint has been spammed.
    // 503	Service unavailable
    this.Logger.info(
      `${this.systemInfoTag}Updating issue ${issueNumber} in ${this.MODERATION_REPO}`
    );
    try {
      const updateParams: any = {
        owner: this.REPOS_OWNER,
        repo: this.MODERATION_REPO,
        issue_number: issueNumber,
        ...(modIssueBody && { body: modIssueBody }),
        ...(state && { state: state }),
        ...(replacementLabels && { labels: replacementLabels }),
      };
      await context.octokit.issues.update(updateParams);
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to update issue");
    }
  }

  public async addLabelsToModIssue(
    context: any,
    issueNumber: number,
    labels: LabelNames[]
  ): Promise<void> {
    // 200	OK
    // 301	Moved permanently
    // 404	Resource not found
    // 410	Gone
    // 422	Validation failed, or the endpoint has been spammed.
    this.Logger.info(
      `${this.systemInfoTag}Adding labels to issue ${issueNumber} in ${this.MODERATION_REPO}`
    );
    try {
      await context.octokit.issues.addLabels({
        owner: this.REPOS_OWNER,
        repo: this.MODERATION_REPO,
        issue_number: issueNumber,
        labels: labels,
      });
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to add labels to moderation issue");
    }
  }

  public async deleteIssueComment(
    context: any,
    detectionRepoName: string,
    commentIdToDelete: number
  ): Promise<void> {
    // 204	No Content
    this.Logger.info(
      `${this.systemInfoTag}Deleting issue comment in ${detectionRepoName}`
    );
    try {
      await context.octokit.issues.deleteComment({
        owner: this.REPOS_OWNER,
        repo: detectionRepoName,
        comment_id: commentIdToDelete,
      });
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to delete old response to toxicity");
    }
  }
  public async deleteReviewComment(
    context: any,
    detectionRepoName: string,
    commentIdToDelete: number
  ): Promise<void> {
    // 204	No Content
    // 404	Resource not found
    this.Logger.info(
      `${this.systemInfoTag}Deleting review comment in ${detectionRepoName}`
    );
    try {
      await context.octokit.pulls.deleteReviewComment({
        owner: this.REPOS_OWNER,
        repo: detectionRepoName,
        comment_id: commentIdToDelete,
      });
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to delete review comment");
    }
  }
  // ====================================================================
  // ======================= DETECT REPO METHODS ========================
  // ====================================================================
  public async replayToReviewCommentInDetectionRepo(
    context: any,
    repo: string,
    pullNumber: number,
    message: string
  ): Promise<number> {
    // 201	Created
    // 404	Resource not found
    this.Logger.info(
      `${this.systemInfoTag}Replaying to review comment in ${repo}`
    );
    try {
      const newReplay = await context.octokit.pulls.createReplyForReviewComment(
        {
          owner: this.REPOS_OWNER,
          repo: repo,
          pull_number: pullNumber,
          comment_id: context.payload.comment.id,
          body: message,
        }
      );
      return newReplay.data.id;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to replay to review comment");
    }
  }

  public async listReviewCommentsOnPr(
    context: any,
    repo: string,
    pullNumber: number
  ): Promise<any> {
    //listReviewComments retrieves all review comments for the entire pull request, regardless of which review they are part of.
    // 200	OK
    this.Logger.info(
      `${this.systemInfoTag}Listing review comments for PR in ${repo}`
    );
    try {
      const response = await context.octokit.pulls.listReviewComments({
        owner: this.REPOS_OWNER,
        repo: repo,
        pull_number: pullNumber,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to list review comments");
    }
  }

  public async listReviewsForPr(
    context: any,
    repo: string,
    pullNumber: number
  ): Promise<any> {
    // 200	OK
    this.Logger.info(`${this.systemInfoTag}Listing reviews for PR in ${repo}`);
    try {
      const response = await context.octokit.pulls.listReviews({
        owner: this.REPOS_OWNER,
        repo: repo,
        pull_number: pullNumber,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to list reviews for PR");
    }
  }
  // ====================================================================
  // =================== DETECT & MOD REPO METHODS ======================
  // ====================================================================
  public async listIssueComments(
    context: any,
    issueNumber: number,
    repo: string
  ): Promise<any> {
    // Issue comments are ordered by ascending ID.
    // 200	OK
    // 404	Resource not found
    // 410	Gone
    this.Logger.info(
      `${this.systemInfoTag}Listing comments in issue ${issueNumber} in ${repo}`
    );
    try {
      const response = await context.octokit.issues.listComments({
        owner: this.REPOS_OWNER,
        repo: repo,
        issue_number: issueNumber,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to list comments in moderation issue");
    }
  }

  public async commentOnIssue(
    context: any,
    repo: string,
    issueNumber: number,
    message: string
  ): Promise<number> {
    // 200	OK
    // 403	Forbidden
    // 404	Resource not found
    // 410	Gone
    // 422	Validation failed, or the endpoint has been spammed.
    this.Logger.info(
      `${this.systemInfoTag}Commenting on issue ${issueNumber} in ${repo} under ${this.REPOS_OWNER}`
    );
    try {
      const newComment = await context.octokit.issues.createComment({
        owner: this.REPOS_OWNER,
        repo: repo,
        issue_number: issueNumber,
        body: message,
      });
      return newComment.data.id;
    } catch (error: any) {
      this.handleError(error);
      throw new Error("Failed to comment on issue");
    }
  }
}
