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

async function getImageBase64(filePath) {
  let mimeType;
  let imageBase64;

  if (filePath.startsWith("http")) {
    const imageResponse = await fetch(filePath);
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const fileType = await fileTypeFromBuffer(Buffer.from(imageArrayBuffer));
    mimeType = fileType.mime;
    console.log(mimeType);
    imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");
  } else {
    const buffer = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(buffer);
    mimeType = fileType.mime;
    imageBase64 = Buffer.from(buffer).toString("base64");
  }

  return { mimeType, imageBase64 };
}

export async function run(filePath) {
  let { mimeType, imageBase64 } = await getImageBase64(filePath);

  let image = await Jimp.read(Buffer.from(imageBase64, "base64"));
  let { height } = image.bitmap;

  if (height > 100) {
    console.time("Redimensionando a imagem");
    image = image.resize(Jimp.AUTO, 100);
    let resizedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    imageBase64 = resizedImageBuffer.toString("base64");
    console.timeEnd("Redimensionando a imagem");
  }

  const MODEL_NAME = "gemini-1.0-pro-vision-latest";
  const API_KEY = "AIzaSyCd8wCVewTr-6L82AcAfnJTVx35dKWdFJY"; // RELAX, THIS IS A DISABLED KEY, but don't do that, not even in a draft, this key almost went to a public repository while it was still activated...
  const genAI = new GoogleGenerativeAI(API_KEY);
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
      text: "Generate an image description for the HTML img tag's alt attribute. The alt should be in English.\n",
    },
    {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    },
  ];

  console.log(parts);

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  const responseText = response.text();

  const inputTokens = await model.countTokens(JSON.stringify(parts));
  const outputTokens = await model.countTokens(responseText);

  console.table({
    inputTokens: inputTokens.totalTokens,
    outputTokens: outputTokens.totalTokens,
  });

  console.log(responseText + "\n");
}

{
  const urlFile =
    "https://user-images.githubusercontent.com/26748277/167853312-df10387d-7826-43a6-8b08-51984562f7b8.png";

  const urlFile2 =
    "https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_1280.jpg";

  const localFile = "static/folder.png";

  // await run(localFile);
  // await run(urlFile);
  await run(urlFile2);
}
