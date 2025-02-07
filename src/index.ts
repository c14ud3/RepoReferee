import { Probot } from "probot";
import { GitHubEventHandler } from "./GitHubEventHandler.js";
import { ProbotLogger } from "./ProbotLogger.js";
import { exit } from "process";
import { config, areEnvSet, EventTypes, Config } from "./config/config.js";
import eventConfig from "./config/event-config.js";

export default (app: Probot) => {
  const Logger = new ProbotLogger(app.log);
  probotInit(config, Logger);
  const eventHandler = new GitHubEventHandler(Logger);

  // INFO - HANDLING OF ISSUES
  app.on(EventTypes.ISSUES_OPENED.fullName, async (context) => {
    if (eventConfig.issues.opened) {
      eventHandler.handleEvent(context, EventTypes.ISSUES_OPENED);
    }
  });

  app.on(EventTypes.ISSUES_EDITED.fullName, async (context) => {
    if (eventConfig.issues.edited) {
      eventHandler.handleEvent(context, EventTypes.ISSUES_EDITED);
    }
  });

  app.on(EventTypes.ISSUES_DELETED.fullName, async (context) => {
    if (eventConfig.issues.deleted) {
      eventHandler.handleEvent(context, EventTypes.ISSUES_DELETED);
    }
  });

  app.on(EventTypes.ISSUES_TRANSFERRED.fullName, async (context) => {
    if (eventConfig.issues.transferred) {
      eventHandler.handleEvent(context, EventTypes.ISSUES_TRANSFERRED);
    }
  });

  // INFO - HANDLING OF ISSUE COMMENTS
  app.on(EventTypes.ISSUE_COMMENT_CREATED.fullName, async (context) => {
    if (eventConfig.issue_comments.created) {
      eventHandler.handleEvent(context, EventTypes.ISSUE_COMMENT_CREATED);
    }
  });

  app.on(EventTypes.ISSUE_COMMENT_EDITED.fullName, async (context) => {
    if (eventConfig.issue_comments.edited) {
      eventHandler.handleEvent(context, EventTypes.ISSUE_COMMENT_EDITED);
    }
  });

  app.on(EventTypes.ISSUE_COMMENT_DELETED.fullName, async (context) => {
    if (eventConfig.issue_comments.deleted) {
      eventHandler.handleEvent(context, EventTypes.ISSUE_COMMENT_DELETED);
    }
  });

  // INFO - HANDLING OF PRs
  // comment under PR is treated as issue_comment
  app.on(EventTypes.PR_OPENED.fullName, async (context) => {
    if (eventConfig.pull_request.opened) {
      eventHandler.handleEvent(context, EventTypes.PR_OPENED);
    }
  });

  app.on(EventTypes.PR_EDITED.fullName, async (context) => {
    if (eventConfig.pull_request.edited) {
      eventHandler.handleEvent(context, EventTypes.PR_EDITED);
    }
  });
  // INFO - HANDLING OF PRR
  app.on(EventTypes.PR_REVIEW_SUBMITTED.fullName, async (context) => {
    if (eventConfig.pull_request_review.submitted) {
      eventHandler.handleEvent(context, EventTypes.PR_REVIEW_SUBMITTED);
    }
  });

  app.on(EventTypes.PR_REVIEW_EDITED.fullName, async (context) => {
    if (eventConfig.pull_request_review.edited) {
      eventHandler.handleEvent(context, EventTypes.PR_REVIEW_EDITED);
    }
  });

  // INFO - HANDLING OF PRR COMMENTS
  app.on(EventTypes.PR_REVIEW_COMMENT_CREATED.fullName, async (context) => {
    if (eventConfig.pull_request_review_comment.created) {
      eventHandler.handleEvent(context, EventTypes.PR_REVIEW_COMMENT_CREATED);
    }
  });

  app.on(EventTypes.PR_REVIEW_COMMENT_DELETED.fullName, async (context) => {
    if (eventConfig.pull_request_review_comment.deleted) {
      eventHandler.handleEvent(context, EventTypes.PR_REVIEW_COMMENT_DELETED);
    }
  });

  app.on(EventTypes.PR_REVIEW_COMMENT_EDITED.fullName, async (context) => {
    if (eventConfig.pull_request_review_comment.edited) {
      eventHandler.handleEvent(context, EventTypes.PR_REVIEW_COMMENT_EDITED);
    }
  });

  // INFO - HANDLING OF DISCUSSIONS
  app.on(EventTypes.DISCUSSION_CREATED.fullName, async (context) => {
    if (eventConfig.discussion.created) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_CREATED);
    }
  });

  app.on(EventTypes.DISCUSSION_EDITED.fullName, async (context) => {
    if (eventConfig.discussion.edited) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_EDITED);
    }
  });

  app.on(EventTypes.DISCUSSION_DELETED.fullName, async (context) => {
    if (eventConfig.discussion.deleted) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_DELETED);
    }
  });

  app.on(EventTypes.DISCUSSION_TRANSFERRED.fullName, async (context) => {
    if (eventConfig.discussion.transferred) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_TRANSFERRED);
    }
  });

  // INFO - HANDLING OF DISCUSSION COMMENTS
  app.on(EventTypes.DISCUSSION_COMMENT_CREATED.fullName, async (context) => {
    if (eventConfig.discussion_comment.created) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_COMMENT_CREATED);
    }
  });

  app.on(EventTypes.DISCUSSION_COMMENT_EDITED.fullName, async (context) => {
    if (eventConfig.discussion_comment.edited) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_COMMENT_EDITED);
    }
  });

  app.on(EventTypes.DISCUSSION_COMMENT_DELETED.fullName, async (context) => {
    if (eventConfig.discussion_comment.deleted) {
      eventHandler.handleEvent(context, EventTypes.DISCUSSION_COMMENT_DELETED);
    }
  });

  // INFO - HANDLING OF MODERATOR ACTIONS
  app.on(EventTypes.ISSUES_CLOSED.fullName, async (context) => {
    if (!config.IS_AUTOMATIC_MODE) {
      eventHandler.handleModerationAction(context, EventTypes.ISSUES_CLOSED);
    }
  });
};

const validateEnv = (Logger: ProbotLogger): void => {
  if (!areEnvSet()) {
    Logger.error(
      "🚫 Environment setup error: Missing required environment variables."
    );
    exit(1);
  }
};

const probotInit = (config: Config, Logger: ProbotLogger): void => {
  validateEnv(Logger);
  Logger.info(`
    🌟🚀🌟 Welcome to RepoReferre! Launching... 🌟🚀🌟
    -------------------------------------------------
    🔧 Checking configurations:
      - 🗂️  Detection Repositories: ${config.DETECTION_REPOS.reposNames.join(
        ", "
      )}
      - 🗃️  Moderation Repository: ${config.MODERATION_REPO}
      - 👤 Repositories Owner: ${config.REPOS_OWNER}
      - 🤖 Automatic Mode: ${config.IS_AUTOMATIC_MODE}
    -------------------------------------------------
    ⏰ Timestamp: ${new Date().toISOString()}
    ✅ All systems ready! Time to referee the repos!
  `);
};
