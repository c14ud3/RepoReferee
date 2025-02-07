# Bot usage and deployment

---

## General RepoReferee Configuration

Following the instructions from Probot documentation is sufficient enough to set up a bot both for local development and production enviroment. However, there are some additional steps that need to be taken to ensure the correct operation of the bot:

1. Besides the general Probot env variables, RepoReferee requires additional variables to be set, such as:

   ```
   REPOS_OWNER=
   MODERATION_REPO=
   DETECTION_REPOS=
   IS_AUTOMATIC_MODE=
   GPT_API_KEY=
   ```

   Full example can be found in the [.env.example](../.env.example) file.
   <br/>

2. The bot requires the following permissions to be set in the [GitHub app settings](https://github.com/settings/apps):

   <u>Repository permissions:</u>

   - Issues: read & write
   - Pull requests: read & write
   - Discussions: read & write
   - Metadata: read-only

   <u>Events Subscription:</u>

   - Issues
   - Issue comment
   - Pull request
   - Pull request review
   - Pull request review comment
   - Discussion
   - Discussion comment
     <br/>

3. RepoReferee uses additional issue labels to ensure the full functionality, thus, the following labels should be created in the moderation repository:

   ```
   APPROVE = "✅ MODERATOR APPROVED",
   REJECT = "❌ MODERATOR REJECTED",
   EXPIRED = "🕛 EXPIRED",
   AUTOMATIC_RESPONSE = "🤖 AUTOMATIC RESPONSE",
   EXECUTED = "👍 EXECUTED SUCCESSFULLY",
   APPEALED = "⚖️ APPEALED",
   RESPONSE_CLEANED = "🧹 RESPONSE CLEANED",
   ```

   <br/>

4. The configuration of [src/config/event-config.ts](../src/config/event-config.ts) allows to specify which events related to GitHub entities such as issues, pull requests, and discussions should trigger the moderation bot. Each entity type and associated events can be toggled on or off based the requirements.

## Local Development

Probot framework provides the extensive documentation on how to run the project locally.
The exact details can be found [here](https://probot.github.io/docs/development/) and [here](https://probot.github.io/docs/development/#manually-configuring-a-github-app).

In short the process requires:

- cloning the repository
- [registering a new GitHub](https://github.com/settings/apps/new) app
- cofiguring the .env file
- additional configuration need for RepoReferee, [shown above](./3_setup_and_deployment.md#General-RepoReferee-Configuration).

#### Testing

The framework offers the functionality of [simulating receiving webhooks](https://probot.github.io/docs/simulating-webhooks/) from GitHub to allow for easier local development and testing.

All that's required are JSON payload files in the `test/fixtures` directory. For details on how to obtain them, please refer to the link above.
Folder stucture I used looks like this:

```plaintext
test/fixtures/
├── discussion/
├── discussion_comment/
├── issue_comment/
├── issues/
├── pull_request/
├── pull_request_review/
└── pull_request_review_comment/
```

Once our files are ready, we can set up a debug configurations in the IDE, for instance:

```
    {
      "type": "node",
      "request": "launch",
      "name": "Debug IS_OPENED",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "program": "${workspaceFolder}/node_modules/.bin/probot",
      "args": [
        "receive",
        "-e",
        "issues",
        "-p",
        "${workspaceFolder}/test/fixtures/issues/issues.opened.json",
        "${workspaceFolder}/lib/index.js"
      ],
      "outFiles": ["${workspaceFolder}/lib/**/*.js"],
      "internalConsoleOptions": "openOnSessionStart",
      "console": "integratedTerminal",
      "sourceMaps": true
    }
```

## Deployment

Probot provides a detailed guide on [how to deploy the bot](https://probot.github.io/docs/deployment/#deploy-the-app) to the production environment.
Possible options include:
- as a node app:
  - Glitch
  - Heroku
- as serverless function:
  - AWS Lambda
  - Azure Functions
  - Google Cloud Functions
  - GitHub Actions
  - Begin
  - Vercel
  - Netlify Functions

Here I would like to include additional details on how to [deploy the bot to Heroku](https://probot.github.io/docs/deployment/#deploy-the-app).
- [.env.example](../.env.example) file lays out which environment variables need to be set
- once the Heroku app is created (e.g.: http://arcane-lowlands-8408.herokuapp.com/), the Webhook URL needs to be set up, for that we need to visit [GitHub app settings](https://github.com/settings/apps) and update the URL to http://arcane-lowlands-8408.herokuapp.com/api/github/webhooks

  ⚠️ **Important**: The URL should end with "api/github/webhooks".
- for setting up a private key in heroku env variables, the following command is advised to be used:
  ```
  heroku config:set PRIVATE_KEY="$(cat ~/GitHubAppPrivateKeys/*.private-key.pem)"
  ```
  New private key for the app can be generated in the GitHub app settings.

## Notifications Adjustments

GitHub offers a wide range of notification settings that can be adjusted to suit the moderation needs. [Ths link](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/configuring-notifications#configuring-your-watch-settings-for-an-individual-repository) provides more information on how to configure them.

## Contact

If case of any issues or questions, please feel free to contact me at:

<p><i><a href="mailto:szymon.kaczmarski@uzh.ch">szymon.kaczmarski@uzh.ch</a></i></p>
