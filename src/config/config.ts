import dotenv from "dotenv";

dotenv.config();

export interface DetectionRepos {
  reposNames: string[];
}

function getDetectionRepos(): DetectionRepos {
  const detectionRepos = process.env.DETECTION_REPOS;
  const reposObject: DetectionRepos = {
    reposNames: [],
  };
  if (detectionRepos) {
    reposObject.reposNames = detectionRepos
      .split(",")
      .map((repo) => repo.trim());
  } else {
    console.error("DETECTION_REPOS is not set in the environment");
    throw new Error("DETECTION_REPOS is not set in the environment");
  }
  return reposObject;
}

const parseIsAutomatic = (): boolean => {
  const value = process.env.IS_AUTOMATIC_MODE;
  if (value === undefined) {
    console.error(
      "IS_AUTOMATIC_MODE is not set in the environment, defaulting to false"
    );
    return false;
  }
  return value.toLowerCase() === "true";
};

export interface Config {
  DETECTION_REPOS: DetectionRepos;
  MODERATION_REPO: string;
  REPOS_OWNER: string;
  IS_AUTOMATIC_MODE: boolean;
  GPT_API_KEY: string;
  LOGGER_URL: string;
  LOGGER_AUTH_TOKEN: string;
}

function getConfig(): Config {
  return {
    DETECTION_REPOS: getDetectionRepos(),
    MODERATION_REPO:
      process.env.MODERATION_REPO ??
      (() => {
        throw new Error("MODERATION_REPO is not set in the environment");
      })(),
    REPOS_OWNER:
      process.env.REPOS_OWNER ??
      (() => {
        throw new Error("REPOS_OWNER is not set in the environment");
      })(),
    IS_AUTOMATIC_MODE: parseIsAutomatic(),
    GPT_API_KEY:
      process.env.GPT_API_KEY ??
      (() => {
        throw new Error("GPT_API_KEY is not set in the environment");
      })(),
	LOGGER_URL:
      process.env.LOGGER_URL ??
      (() => {
        throw new Error("LOGGER_URL is not set in the environment");
      })(),
	LOGGER_AUTH_TOKEN:
      process.env.LOGGER_AUTH_TOKEN ??
      (() => {
        throw new Error("LOGGER_AUTH_TOKEN is not set in the environment");
      })(),
  };
}

export const config = getConfig();

// function to check if all required environment variables are set
export function areEnvSet(): boolean {
  const requiredVars = [
    "APP_ID",
    "PRIVATE_KEY",
    "WEBHOOK_SECRET",
    // "GITHUB_CLIENT_ID",
    // "GITHUB_CLIENT_SECRET",
    "DETECTION_REPOS",
    "MODERATION_REPO",
    "GPT_API_KEY",
	"LOGGER_URL",
	"LOGGER_AUTH_TOKEN",
  ];

  for (const variable of requiredVars) {
    if (!process.env[variable] || process.env[variable] === "") {
      console.error(`Missing or empty environment variable: ${variable}`);
      return false;
    }
  }
  return true;
}

// CONSTANTS
export enum PayloadIdentifiers {
  ISSUE = "issue",
  PR = "pull_request",
  DISCUSSION = "discussion",
  COMMENT = "comment",
  REVIEW = "review",
}

export enum ActionTypes {
  CREATED = "created",
  OPENED = "opened",
  EDITED = "edited",
  DELETED = "deleted",
  TRANSFERRED = "transferred",
  SUBMITTED = "submitted",
  CLOSED = "closed",
}

export enum parentTypes {
  ISSUE = "issue",
  PR = "pull_request",
  DISCUSSION = "discussion",
}

export interface EventType {
  fullName: string;
  payloadIdentifier: PayloadIdentifiers;
  actionType: ActionTypes;
  parentType: parentTypes;
}

export const EventTypes = {
  ISSUES_OPENED: {
    fullName: "issues.opened",
    payloadIdentifier: PayloadIdentifiers.ISSUE,
    actionType: ActionTypes.OPENED,
    parentType: parentTypes.ISSUE,
  },
  ISSUES_EDITED: {
    fullName: "issues.edited",
    payloadIdentifier: PayloadIdentifiers.ISSUE,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.ISSUE,
  },
  ISSUES_DELETED: {
    fullName: "issues.deleted",
    payloadIdentifier: PayloadIdentifiers.ISSUE,
    actionType: ActionTypes.DELETED,
    parentType: parentTypes.ISSUE,
  },
  ISSUES_CLOSED: {
    fullName: "issues.closed",
    payloadIdentifier: PayloadIdentifiers.ISSUE,
    actionType: ActionTypes.CLOSED,
    parentType: parentTypes.ISSUE,
  },
  ISSUES_TRANSFERRED: {
    fullName: "issues.transferred",
    payloadIdentifier: PayloadIdentifiers.ISSUE,
    actionType: ActionTypes.TRANSFERRED,
    parentType: parentTypes.ISSUE,
  },
  ISSUE_COMMENT_CREATED: {
    fullName: "issue_comment.created",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.CREATED,
    parentType: parentTypes.ISSUE,
  },
  ISSUE_COMMENT_EDITED: {
    fullName: "issue_comment.edited",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.ISSUE,
  },
  ISSUE_COMMENT_DELETED: {
    fullName: "issue_comment.deleted",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.DELETED,
    parentType: parentTypes.ISSUE,
  },
  PR_OPENED: {
    fullName: "pull_request.opened",
    payloadIdentifier: PayloadIdentifiers.PR,
    actionType: ActionTypes.OPENED,
    parentType: parentTypes.PR,
  },
  PR_EDITED: {
    fullName: "pull_request.edited",
    payloadIdentifier: PayloadIdentifiers.PR,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.PR,
  },
  PR_REVIEW_SUBMITTED: {
    fullName: "pull_request_review.submitted",
    payloadIdentifier: PayloadIdentifiers.REVIEW,
    actionType: ActionTypes.SUBMITTED,
    parentType: parentTypes.PR,
  },
  PR_REVIEW_EDITED: {
    fullName: "pull_request_review.edited",
    payloadIdentifier: PayloadIdentifiers.REVIEW,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.PR,
  },
  PR_REVIEW_COMMENT_CREATED: {
    fullName: "pull_request_review_comment.created",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.CREATED,
    parentType: parentTypes.PR,
  },
  PR_REVIEW_COMMENT_EDITED: {
    fullName: "pull_request_review_comment.edited",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.PR,
  },
  PR_REVIEW_COMMENT_DELETED: {
    fullName: "pull_request_review_comment.deleted",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.DELETED,
    parentType: parentTypes.PR,
  },
  DISCUSSION_CREATED: {
    fullName: "discussion.created",
    payloadIdentifier: PayloadIdentifiers.DISCUSSION,
    actionType: ActionTypes.CREATED,
    parentType: parentTypes.DISCUSSION,
  },
  DISCUSSION_EDITED: {
    fullName: "discussion.edited",
    payloadIdentifier: PayloadIdentifiers.DISCUSSION,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.DISCUSSION,
  },
  DISCUSSION_DELETED: {
    fullName: "discussion.deleted",
    payloadIdentifier: PayloadIdentifiers.DISCUSSION,
    actionType: ActionTypes.DELETED,
    parentType: parentTypes.DISCUSSION,
  },
  DISCUSSION_TRANSFERRED: {
    fullName: "discussion.transferred",
    payloadIdentifier: PayloadIdentifiers.DISCUSSION,
    actionType: ActionTypes.TRANSFERRED,
    parentType: parentTypes.DISCUSSION,
  },
  DISCUSSION_COMMENT_CREATED: {
    fullName: "discussion_comment.created",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.CREATED,
    parentType: parentTypes.DISCUSSION,
  },
  DISCUSSION_COMMENT_EDITED: {
    fullName: "discussion_comment.edited",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.EDITED,
    parentType: parentTypes.DISCUSSION,
  },
  DISCUSSION_COMMENT_DELETED: {
    fullName: "discussion_comment.deleted",
    payloadIdentifier: PayloadIdentifiers.COMMENT,
    actionType: ActionTypes.DELETED,
    parentType: parentTypes.DISCUSSION,
  },
} as const;

export const TOXIC_TEXT_ID: string = "TOXIC_TEXT_ID: ";
export const EVENT_TYPE: string = "EVENT_TYPE: ";
export const MOD_COMMENT_ID: string = "MOD_COMMENT_ID: ";
export const PARENT_NUMBER: string = "PARENT_NUMBER: ";
export const REPLAY_ID: string = "REPLAY_ID: ";

export enum LabelNames {
  APPROVE = "✅ MODERATOR APPROVED",
  REJECT = "❌ MODERATOR REJECTED",
  EXPIRED = "🕛 EXPIRED",
  AUTOMATIC_RESPONSE = "🤖 AUTOMATIC RESPONSE",
  EXECUTED = "👍 EXECUTED SUCCESSFULLY",
  APPEALED = "⚖️ APPEALED",
  RESPONSE_CLEANED = "🧹 RESPONSE CLEANED",
}

export type ContextText = {
  id: number;
  timestamp: string;
  body: string;
  user_id: number;
};

export type ToxicTextContext = {
  parentTitle: string;
  toxicTextAuthor: string;
  previousComments: ContextText[];
  targetComment: ContextText;
};
