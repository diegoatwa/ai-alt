#!/usr/bin/env node

import { Command } from "commander";
const program = new Command();
import { init, getAltByImgSrcOrPath } from "./utils.js";

program
  .name("ai-alt")
  .description("A CLI tool for getting alt text from images")
  .version("1.0.0");

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
  .description("Get alt from file path image")
  .argument("<path>", "Path to the image file")
  .action((path) => getAltByImgSrcOrPath(path));

program.parse(process.argv);
