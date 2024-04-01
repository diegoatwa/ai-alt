#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "node:fs";
import { Languages } from "./languages.js";
import { IAs } from "./IAs.js";

async function init() {
  console.log();

  const filePath = "ai-alt.json";
  let defaultAnswers = {};

  if (fs.existsSync(filePath)) {
    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: `The file ${filePath} already exists. Do you want to continue?`,
        default: false,
      },
    ]);

    if (!answers.continue) {
      return;
    }

    defaultAnswers = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  let answers = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Model:",
      choices: IAs.map((ia) => ia.model),
      default: defaultAnswers.model,
    },
    {
      type: "list",
      name: "provider",
      message: "Provider:",
      choices: (answers) =>
        IAs.find((ia) => ia.model === answers.model).providers,
      default: defaultAnswers.provider,
    },
    {
      type: "password",
      name: "apikey",
      message: "API_KEY:",
      default: defaultAnswers.apikey,
    },
    {
      type: "confirm",
      name: "limits",
      message: "Define token limit per session?",
      default: defaultAnswers.limits,
    },
    {
      type: "number",
      name: "MAX_INPUT_TOKENS",
      message: "MAX input tokens per session:",
      when: (answers) => answers.limits,
      default: defaultAnswers.MAX_INPUT_TOKENS,
    },
    {
      type: "number",
      name: "MAX_OUTPUT_TOKENS",
      message: "MAX output tokens per session:",
      when: (answers) => answers.limits,
      default: defaultAnswers.MAX_OUTPUT_TOKENS,
    },
    {
      type: "list",
      name: "language",
      message: "Select the language for automatic prompt configuration:",
      choices: Languages.map((lang) => lang.name),
      default: defaultAnswers.language,
    },
    {
      type: "input",
      name: "customPrompt",
      message: "Custom prompt:",
      when: (answers) => answers.language === "CUSTOM",
      validate: (input) => {
        if (!input || input.trim().length < 10) {
          return "Please enter a valid prompt.";
        }
        return true;
      },
      default: defaultAnswers.customPrompt,
    },
  ]);

  {
    fs.appendFileSync(
      ".env",
      `# ai-alt\nAI_ALT_MODEL="${answers.model}"\nAI_ALT_PROVIDER="${answers.provider}"\nAI_ALT_PROVIDER_APIKEY="${answers.apikey}"\nAI_ALT_LANGUAGE="${answers.language}"\n`
    );

    if (answers.language === "CUSTOM") {
      fs.appendFileSync(
        ".env",
        `AI_ALT_LANGUAGE_CUSTOM_PROMPT="${answers.customPrompt}"\n`
      );
    }

    if (answers.limits) {
      fs.appendFileSync(
        ".env",
        `AI_ALT_MAX_INPUT_TOKENS="${answers.MAX_INPUT_TOKENS}"\nAI_ALT_MAX_OUTPUT_TOKENS="${answers.MAX_OUTPUT_TOKENS}"\n`
      );
    }

    fs.appendFileSync(
      ".gitignore",
      `\n\n# ai-alt (prevent sensitive data leak) \n.env\n`
    );
  }
}

const commands = {
  "-i": { description: "Configure the AI model", action: init },
  "--init": { description: "Configure the AI model", action: init },
};

function help() {
  let helpText = "Usage: ai-alt [command]\n\nCommands:\n";

  for (const command in commands) {
    helpText += `\t${command}\t${commands[command].description}\n`;
  }

  console.log(helpText);
}

const command = process.argv[2];
if (commands[command]) {
  commands[command].action();
} else {
  help();
}
