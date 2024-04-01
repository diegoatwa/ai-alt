import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import fetch from "node-fetch";
import fs from "fs";

export async function run(filePath) {
  let imageBase64, mimeType;

  if (filePath.startsWith("http")) {
    const imageResponse = await fetch(filePath);
    mimeType = imageResponse.headers.get("content-type");
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");
  } else {
    mimeType = `image/${filePath.split(".").pop()}`;
    imageBase64 = Buffer.from(fs.readFileSync(filePath)).toString("base64");
  }

  const MODEL_NAME = "gemini-1.0-pro-vision-latest";
  const API_KEY = "AIzaSyCd8wCVewTr-6L82AcAfnJTVx35dKWdFJY";
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096,
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
      text: "Gere o texto alternativo para o attr alt da tag img da image a seguir:\n",
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

  const inputTokens = await model.countTokens(parts);
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
    "https://user-images.githubusercontent.com/26748277/167853363-1551aadc-3c53-4d72-83ad-c647ea65a92f.png";

  const localFile = "static/folder.png";

  await run(urlFile);
  await run(urlFile2);
  await run(localFile);
}
