# ai-alt ✨

## (IN BETA DEVELOPMENT, only the cli is working)

Insert image alt automatically using computer vision and artificial intelligence.

Because the Web is for Everyone!

> **This package is in beta, expected release on 05/03/2024.**

## Installation

### Current project

```sh
npm i ai-alt
```

### Global

```sh
npm install -g ai-alt
```

## CLI

### Current project

Use npx to run the cli

Example: `npx ai-alt --help`

### Global

No npx required, you can just use `ai-alt`

Example: `ai-alt --help`

### CLI commands

```
Usage: ai-alt [options] [command]

A CLI tool for getting alt text from images

Options:
  -v, --version   output the version number
  -h, --help      display help for command

Commands:
  check           Check if the environment variables are set
  init            Configure the AI model
  url <url>       Get alt from URL image
  file <path>     Get alt from the path of a local image file
  help [command]  display help for command
```

## Support

- CLI

  - ✅ alt by image URL
  - ✅ alt by local image path
  - ✅ image resizing to save tokens
  - ❌ automated testing

- AI Providers

  - ✅ Gemini 1.0 Pro Vision (by Google AI Studio)
  - ❌ Gemini 1.0 Pro Vision (by Vertex AI)
  - ❌ Gemini 1.5 (by Google AI Studio)
  - ❌ Gemini 1.5 (by Vertex AI)
  - ❌ GPT (by OpenAI)
  - ❌ localhost custom models (by ollama)

- HTML files

  - ❌ images hosted on the web (ex: `<img src="http..." />`)
  - ❌ images hosted on local repository (ex: `<img src="/..." />`)

- React Frameworks

  - ❌ NextJS
  - ❌ Redux
  - more...
