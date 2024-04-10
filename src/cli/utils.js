import inquirer from "inquirer";
import fs from "node:fs";
import { Languages } from "../languages.js";
import { run } from "../test.js";
import "dotenv/config";

function logSuccess(message) {
  console.log(`\x1b[32m✅ ${message}\x1b[0m`);
}

function logError(message) {
  console.error(`\x1b[31m❌ ${message}\x1b[0m`);
}

export async function check() {
  try {
    if (!allRequiredEnvsAreSet()) {
      logError("Environment variables are not set.");

      const answers = await inquirer.prompt([
        {
          type: "confirm",
          name: "configure_init",
          message: "Configure now?",
          default: true,
        },
      ]);

      if (answers.configure_init) {
        await init();
        logSuccess("Environment variables are successfully set.");
      }
    } else {
      logSuccess("Environment variables are set.");
    }
  } catch (error) {
    logError(`An error occurred: ${error.message}`);
    throw error;
  }
}

let imageResizeOptions = [
  "64px",
  "128px",
  "256px",
  "512px",
  "1024px",
  "disabled (caution: may consume many, many tokens)",
];

export const AIs = [
  {
    model: "Gemini 1.0 Pro Vision (by Google)",
    modelInternalName: "gemini-1.0-pro-vision-latest",
    providers: ["Google AI Studio" /**, "Vertex AI" */],
  },
  //   { model: "GPT-3.5 (by OpenAI)", providers: ["OpenAI"] },
  //   {
  //     model: "LLaVA (Large Language and Vision Assistant)",
  //     providers: ["ollama (by localhost)", "ollama (remote)"],
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
  {
    title: "AI_ALT_RESIZE_IMAGES_SIZE",
    description: "The size to resize images to.",
    required: false,
    value: 256,
  },
];

export function allRequiredEnvsAreSet() {
  for (const i in environmentVariables) {
    const { required, title } = environmentVariables[i];
    if (required && !process.env[title]) {
      return false;
    }
  }

  return true;
}

export async function getAltByImgSrcOrPath(path) {
  const hasInit = allRequiredEnvsAreSet();
  if (!hasInit && !(await init())) return;

  const alt = await run(path);
  console.log(alt);
}

export async function init() {
  if (allRequiredEnvsAreSet()) {
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
      type: "list",
      name: "AI_ALT_RESIZE_IMAGES_SIZE",
      message: "The longest side of the image must be at most:",
      choices: imageResizeOptions,
    },
    {
      type: "confirm",
      name: "limits",
      message: "Define token limit per session?",
    },
    {
      type: "number",
      name: "AI_ALT_MAX_INPUT_TOKENS",
      message: "MAX input  tokens per session:",
      when: (answers) => answers.limits,
    },
    {
      type: "number",
      name: "AI_ALT_MAX_OUTPUT_TOKENS",
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
