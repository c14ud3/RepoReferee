import { config, DetectionRepos, ToxicTextContext } from "./config/config.js";
import { ProbotLogger } from "./ProbotLogger.js";
import {
  TOXICITY_DEFINITION,
  TOXICITY_TYPES,
  PROMPT_COMMENTS,
  GUIDELINES,
} from "./config/TOXICITY_DEFINITIONS.js";
import OpenAI from "openai";
import { deleteReplays, shortenToxicText } from "./helpers.js";

interface ExtractedValues {
  TEXT_TOXICITY: boolean;
  TOXICITY_REASONS: string;
  VIOLATED_GUIDELINE: string;
  REPHRASED_TEXT_OPTIONS: string;
}

export class GPTApiService {
  private Logger: ProbotLogger;
  DETECTION_REPOS: DetectionRepos;
  MODERATION_REPO: string;
  GPT_API_KEY: string;
  MODEL: string;
  TEMPERATURE: number;
  gptClient: OpenAI;
  systemInfoTag: string;

  constructor(Logger: ProbotLogger) {
    this.Logger = Logger;
    this.DETECTION_REPOS = config.DETECTION_REPOS;
    this.MODERATION_REPO = config.MODERATION_REPO;
    this.GPT_API_KEY = config.GPT_API_KEY;
    this.MODEL = "gpt-4o";
    this.TEMPERATURE = 0.2;
    this.gptClient = new OpenAI({
      apiKey: this.GPT_API_KEY,
    });
    this.systemInfoTag = `\t [GPTApi]: `;
  }

  public async getToxicityResponse(
    commentContext: ToxicTextContext
  ): Promise<{ isToxic: boolean; moderationResponse: string }> {
    try {
      this.Logger.info(`${this.systemInfoTag}Checking toxicity of the text`);
      let textWithContext = "";

      if (commentContext.previousComments.length !== 0) {
        this.Logger.info(
          `${this.systemInfoTag}Generating context for the text`
        );
        textWithContext = this.generateContext(commentContext);
      }

      this.Logger.info(`${this.systemInfoTag}Generating prompt for the text`);
      const prompt = this.generatePrompt(textWithContext, commentContext);

      this.Logger.info(
        `${this.systemInfoTag}Calling GPT API to check toxicity`
      );
      const response = await this.makeGPTRequest(prompt);

      this.Logger.info(`${this.systemInfoTag}Processing response`);
      const processedResponse = this.processGPTResponse(response);

      this.Logger.info(`${this.systemInfoTag}Generating final message`);
      const finalMessage = this.generateFinalMessage(
        processedResponse,
        commentContext
      );

      return {
        isToxic: processedResponse.TEXT_TOXICITY,
        moderationResponse: finalMessage,
      };
    } catch (error) {
      this.Logger.error(`${this.systemInfoTag}Error in toxicity check`);
      throw error;
    }
  }

  private generateFinalMessage(
    processedResponse: ExtractedValues,
    commentContext: ToxicTextContext
  ): string {
    // INITAL part with mnentioning the original comment
    let finalMessage = `<pre><i>${shortenToxicText(
      commentContext.targetComment.body
    ).replace(/[\r\n]+$/, "")}</i></pre>\n\n`;

    // TOXICITY and REASONING part
    finalMessage += `Hi @${commentContext.toxicTextAuthor}, your input was indetified as toxic. `;
    finalMessage += `${processedResponse.TOXICITY_REASONS}\n\n`;

    // GUIDELINE part
    finalMessage += `${processedResponse.VIOLATED_GUIDELINE}\n\n`;

    // REPHRASED TEXT OPTIONS part
    let firstRephrasedOption = processedResponse.REPHRASED_TEXT_OPTIONS.split(
      "2. "
    )[0].replace("1. ", "");
    const lastIndex = firstRephrasedOption.lastIndexOf("\n");
    if (lastIndex !== -1) {
      firstRephrasedOption =
        firstRephrasedOption.slice(0, lastIndex) +
        firstRephrasedOption.slice(lastIndex + 1);
    }

    if (firstRephrasedOption.length > 500) {
      finalMessage += `Here is a possible rephrasing option:\n${firstRephrasedOption}\n`;
    } else {
      finalMessage += `Here are possible rephrasing options:\n${processedResponse.REPHRASED_TEXT_OPTIONS}\n`;
    }

    return finalMessage;
  }

  private async makeGPTRequest(prompt: string): Promise<string> {
    try {
      const completion = await this.gptClient.chat.completions.create({
        model: this.MODEL,
        temperature: this.TEMPERATURE,
        messages: [{ role: "user", content: prompt }],
      });
      const message: string | null = completion.choices[0].message.content;
      if (!message) {
        throw new Error("No message in completion");
      }
      return message;
    } catch (error) {
      console.error("Error creating completion:", error);
      throw error;
    }
  }

  private processGPTResponse(response: string): ExtractedValues {
    const patterns = {
      TEXT_TOXICITY: /TEXT_TOXICITY:\s*(Yes|No)\s*/s,
      TOXICITY_REASONS: /TOXICITY_REASONS:\s*(.*?)\s*VIOLATED_GUIDELINE/s,
      VIOLATED_GUIDELINE:
        /VIOLATED_GUIDELINE:\s*(.*?)\s*REPHRASED TEXT OPTIONS:/s,
      REPHRASED_TEXT_OPTIONS: /REPHRASED TEXT OPTIONS:\s*(.*)/s,
    };

    const textToxicityMatch = patterns.TEXT_TOXICITY.exec(response);
    if (!textToxicityMatch) {
      throw new Error("Unexpected value for TEXT_TOXICITY");
    }

    const textToxicity = textToxicityMatch[1].trim().toLowerCase();
    const isToxic = textToxicity === "yes";
    const extractedValues: ExtractedValues = {
      TEXT_TOXICITY: isToxic,
      TOXICITY_REASONS: "",
      VIOLATED_GUIDELINE: "",
      REPHRASED_TEXT_OPTIONS: "",
    };

    for (const key of [
      "TOXICITY_REASONS",
      "VIOLATED_GUIDELINE",
      "REPHRASED_TEXT_OPTIONS",
    ] as const) {
      const pattern = patterns[key];
      const match = pattern.exec(response);
      if (!match) {
        throw new Error(`Unexpected value for ${key}`);
      }
      extractedValues[key] = match[1].trim();
    }

    return extractedValues;
  }

  private generateContext(textContext: ToxicTextContext): string {
    // PREVIOUS comments
    const previousCommentsStr = textContext.previousComments
      .map(
        (comment, index) =>
          `Comment nr.${index + 1} (created at: ${
            comment.timestamp
          }, by user ID: ${comment.user_id}): '''${comment.body}'''\n\n`
      )
      .join("");

    // TITLE
    let message = `Title: ${textContext.parentTitle}\nComments before the TARGET comment:\n${previousCommentsStr}`;

    // TARGET comment
    const targetComment = textContext.targetComment;
    const targetCommentStr = `TARGET comment (created at: ${
      targetComment.timestamp
    }, by user ID: ${targetComment.user_id}): '''${deleteReplays(
      targetComment.body
    )}'''\n`;

    message += targetCommentStr;
    return message;
  }

  private generatePrompt(
    textWithContext: string,
    commentContext: ToxicTextContext
  ): string {
    let prompt =
      TOXICITY_DEFINITION +
      "\n" +
      "Sub-concepts of toxicity are defined below:\n";

    const targetComment = deleteReplays(commentContext.targetComment.body);

    // SUB TOXICITY DEFINITIONS
    Object.keys(TOXICITY_TYPES).forEach((key) => {
      const toxicityType = TOXICITY_TYPES[key as keyof typeof TOXICITY_TYPES];
      const toxicityDefinition = PROMPT_COMMENTS[toxicityType][0]; // at 0 there is definition
      prompt += ` - ${toxicityType}: ${toxicityDefinition}. Examples of ${toxicityType}: `;
      prompt += `"${PROMPT_COMMENTS[toxicityType][1]}", `;
      prompt += `"${PROMPT_COMMENTS[toxicityType][2]}", `;
      prompt += `"${PROMPT_COMMENTS[toxicityType][3]}";\n`;
    });

    // CONTEXT
    if (textWithContext !== "") {
      prompt += `Based on the provided toxicity definition and context analyze the text and decide whether this TARGET text is toxic: '''${targetComment}'''\n`;
      prompt += `Context:\n'''${textWithContext}'''\n\n`;
    } else {
      prompt += `Based on the provided toxicity definition analyze the text and decide whether this TARGET text is toxic: '''${targetComment}'''\n\n`;
    }

    // GUIDELINES
    prompt += `Additionally, these are Community Participation Guidelines:\n'''${GUIDELINES}'''\n\n`;
    prompt +=
      "If the comment is toxic, explain why the text is considered toxic, referencing the specific sub-concept definition, indicate which specific guideline from the Community Participation Guidelines was violated and provide three rephrased versions of the text that maintain the original intent but without the toxicity.\n";

    // ANSWER FORMAT
    prompt += "Structure your answer in the following format:\n";
    prompt += "TEXT_TOXICITY: [Yes/No]\n";
    prompt +=
      "TOXICITY_REASONS: [Short explanation based on the definitions provided, citing specific sub-concepts]\n";
    prompt +=
      "VIOLATED_GUIDELINE: [Short explanation of the specific guideline broken]\n";
    prompt += "REPHRASED TEXT OPTIONS: [Option 1, Option 2, Option 3]\n";

    return prompt;
  }
}
