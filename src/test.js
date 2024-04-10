import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import fetch from "node-fetch";
import fs from "fs";
import Jimp from "jimp";
import { fileTypeFromBuffer } from "file-type";
import { Buffer } from "buffer";
import "dotenv/config";
import { AIs } from "./cli/utils.js";

async function getImageBase64FromUrl(url) {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL!");
  }

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`Network error on download image: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP error on download image! status: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer) {
    throw new Error("No data received from image download!");
  }

  const fileType = await fileTypeFromBuffer(Buffer.from(arrayBuffer));
  if (!fileType) {
    throw new Error("Could not determine file type from image!");
  }

  const mimeType = fileType.mime;
  if (!mimeType.startsWith("image")) {
    throw new Error("File is not an image!");
  }

  let imageBase64;
  try {
    imageBase64 = Buffer.from(arrayBuffer).toString("base64");
  } catch (err) {
    throw new Error(`Error converting image to base64: ${err.message}`);
  }

  if (!imageBase64) {
    throw new Error("Could not convert image to base64!");
  }

  return { mimeType, imageBase64 };
}

async function getImageBase64FromFile(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path!");
  }

  if (!fs.existsSync(filePath)) {
    console.log("File does not exist!");
    throw new Error("File does not exist!");
  }
  const buffer = fs.readFileSync(filePath);
  if (!buffer) {
    throw new Error("Could not read file!");
  }

  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) {
    throw new Error("Could not determine file type from image!");
  }

  const mimeType = fileType.mime;
  if (!mimeType.startsWith("image")) {
    throw new Error("File is not an image!");
  }

  let imageBase64;
  try {
    imageBase64 = Buffer.from(buffer).toString("base64");
  } catch (e) {
    throw new Error("Could not convert image to base64!");
  }

  if (!imageBase64) {
    throw new Error("Could not convert image to base64!");
  }

  return { mimeType, imageBase64 };
}

async function getImageBase64(filePath) {
  if (filePath.startsWith("http")) {
    return getImageBase64FromUrl(filePath);
  } else {
    return getImageBase64FromFile(filePath);
  }
}
export async function run(filePath, debug = false) {
  let { mimeType, imageBase64 } = await getImageBase64(filePath);

  let image = await Jimp.read(Buffer.from(imageBase64, "base64"));
  let { height } = image.bitmap;

  if (height > 150) {
    image = image.resize(Jimp.AUTO, 150);
    let resizedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    imageBase64 = resizedImageBuffer.toString("base64");
  }

  const MODEL_NAME = AIs.filter(
    (ai) => ai.model === process.env.AI_ALT_MODEL
  )[0].modelInternalName;

  if (!MODEL_NAME) {
    throw new Error(
      "Invalid model name!\n\nPlease, run `npx ai-alt --init` to initialize the project."
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.AI_ALT_PROVIDER_APIKEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 100,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [
    {
      text: process.env.AI_ALT_LANGUAGE_CUSTOM_PROMPT,
    },
    {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  const responseText = response.text();

  const inputTokens = await model.countTokens(JSON.stringify(parts));
  const outputTokens = await model.countTokens(responseText);

  if (debug) {
    console.table({
      inputTokens: inputTokens.totalTokens,
      outputTokens: outputTokens.totalTokens,
    });

    console.log(responseText + "\n");
  }

  return responseText;
}

// {
//   const urlFile =
//     "https://user-images.githubusercontent.com/26748277/167853312-df10387d-7826-43a6-8b08-51984562f7b8.png";

//   const urlFile2 =
//     "https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_1280.jpg";

//   const localFile = "static/folder.png";

//   run(localFile);
//   run(urlFile);
//   run(urlFile2);
// }
