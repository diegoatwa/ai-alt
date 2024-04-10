#!/usr/bin/env node

import { Command } from "commander";
import { init, getAltByImgSrcOrPath, check } from "./utils.js";

const program = new Command();

program
  .name("ai-alt")
  .description("A CLI tool for getting alt text from images")
  .version("0.0.8", "-v, --version");

program
  .command("check")
  .description("Check if the environment variables are set")
  .action(check);

program
  .command("init") //
  .description("Configure the AI model")
  .action(init);

program
  .command("url")
  .description("Get alt from URL image")
  .argument("<url>", "URL of the image")
  .action((url) => getAltByImgSrcOrPath(url));

program
  .command("file")
  .description("Get alt from the path of a local image file")
  .argument("<path>", "Path to the image file")
  .action((path) => getAltByImgSrcOrPath(path));

program.parse(process.argv);
