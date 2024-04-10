import inquirer from "inquirer";
import fs from "node:fs";
import { Languages } from "../languages.js";
import { run } from "../test.js";
import "dotenv/config";

export const AIs = [
  {
    model: "Gemini 1.0 Pro Vision",
    modelInternalName: "gemini-1.0-pro-vision-latest",
    providers: ["Google AI Studio" /**, "Vertex AI" */],
  },
  //   { model: "GPT-3.5", providers: ["OpenAI"] },
  //   {
  //     model: "LLaVA (Large Language and Vision Assistant)",
  //     providers: ["ollama (localhost)", "ollama (remote)"],
  //   },
];

const environmentVariables = [
  {
    title: "AI_ALT_MODEL",
    description: "The model to use for the AI.",
    required: true,
    value: null,
  },
  {
    title: "AI_ALT_PROVIDER",
    description: "The provider to use for the AI.",
    required: true,
    value: null,
  },
  {
    title: "AI_ALT_PROVIDER_APIKEY",
    description: "The API key for the provider.",
    required: true,
    value: null,
  },
  {
    title: "AI_ALT_LANGUAGE",
    description: "The language to use for the AI.",
    required: true,
    value: null,
  },
  {
    title: "AI_ALT_LANGUAGE_CUSTOM_PROMPT",
    description: "The custom prompt to use for the AI.",
    required: false,
    value: null,
  },
  {
    title: "AI_ALT_MAX_INPUT_TOKENS",
    description: "The maximum input tokens per session.",
    required: false,
    value: null,
  },
  {
    title: "AI_ALT_MAX_OUTPUT_TOKENS",
    description: "The maximum output tokens per session.",
    required: false,
    value: null,
  },
];

function check_environmentVariables() {
  environmentVariables.forEach((env) => {
    if (!process.env[env.title]) {
      return false;
    }
  });

  return true;
}

export async function init() {
  if (check_environmentVariables()) {
    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message:
          "ai-alt environment variables already exists.\n\nDo you want to continue?",
        default: false,
      },
    ]);

    if (!answers.continue) {
      return;
    }
  }

  let answers = await inquirer.prompt([
    {
      type: "list",
      name: "AI_ALT_MODEL",
      message: "Model:",
      choices: AIs.map((ia) => ia.model),
    },
    {
      type: "list",
      name: "AI_ALT_PROVIDER",
      message: "Provider:",
      choices: (answers) =>
        AIs.find((ia) => ia.model === answers.AI_ALT_MODEL).providers,
    },
    {
      type: "password",
      name: "AI_ALT_PROVIDER_APIKEY",
      message: "API_KEY:",
      validate(input) {
        if (!input || input.trim().length < 10) {
          return "Please, enter a valid API key.";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "limits",
      message: "Define token limit per session?",
    },
    {
      type: "number",
      name: "AI_ALT_MAX_OUTPUT_TOKENS",
      message: "MAX input tokens per session:",
      when: (answers) => answers.limits,
    },
    {
      type: "number",
      name: "AI_ALT_MAX_INPUT_TOKENS",
      message: "MAX output tokens per session:",
      when: (answers) => answers.limits,
    },
    {
      type: "list",
      name: "AI_ALT_LANGUAGE",
      message: "Select the language for automatic prompt configuration:",
      choices: Languages.map((lang) => lang.name),
    },
    {
      type: "input",
      name: "AI_ALT_LANGUAGE_CUSTOM_PROMPT",
      message: "Custom prompt:",
      when: (answers) => answers.AI_ALT_LANGUAGE === "CUSTOM",
      validate: (input) => {
        if (!input || input.trim().length < 10) {
          return "Please, enter a valid prompt.";
        }
        return true;
      },
    },
  ]);

  {
    const language = Languages.find(
      (lang) => lang.name === answers.AI_ALT_LANGUAGE
    );

    answers.AI_ALT_LANGUAGE_CUSTOM_PROMPT =
      answers.AI_ALT_LANGUAGE_CUSTOM_PROMPT || language.defaultPrompt;

    let writeToEnvFile = "# ai-alt\n";

    environmentVariables.forEach((env) => {
      if (answers[env.title]) {
        writeToEnvFile += `${env.title}="${answers[env.title]}"\n`;
      } else {
        if (env.required) {
          return new Error(
            `Please, provide the ${env.title} environment variable.`
          );
        }
      }
    });

    fs.appendFileSync(".env", writeToEnvFile);

    fs.appendFileSync(
      ".gitignore",
      `\n\n# ai-alt (prevent sensitive data leak) \n.env\n`
    );
  }
}

export async function getAltByImgSrcOrPath(path) {
  const hasInit = initIsOk();
  if (!hasInit) init();

  const alt = await run(path);
  process.stdout.write(alt);
}
