interface EventConfig {
  issues: {
    opened: boolean;
    edited: boolean;
    deleted: boolean;
    transferred: boolean;
  };
  issue_comments: {
    created: boolean;
    edited: boolean;
    deleted: boolean;
  };
  pull_request: {
    opened: boolean;
    edited: boolean;
  };
  pull_request_review: {
    submitted: boolean;
    edited: boolean;
  };
  pull_request_review_comment: {
    created: boolean;
    edited: boolean;
    deleted: boolean;
  };
  discussion: {
    created: boolean;
    edited: boolean;
    deleted: boolean;
    transferred: boolean;
  };
  discussion_comment: {
    created: boolean;
    edited: boolean;
    deleted: boolean;
  };
}

const eventConfig: EventConfig = {
  issues: {
    opened: true,
    edited: true,
    deleted: true,
    transferred: true,
  },
  issue_comments: {
    created: true,
    edited: true,
    deleted: true,
  },
  pull_request: {
    opened: true,
    edited: true,
  },
  pull_request_review: {
    submitted: true,
    edited: true,
  },
  pull_request_review_comment: {
    created: true,
    edited: true,
    deleted: true,
  },
  discussion: {
    created: true,
    edited: true,
    deleted: true,
    transferred: true,
  },
  discussion_comment: {
    created: true,
    edited: true,
    deleted: true,
  },
};

export default eventConfig;
