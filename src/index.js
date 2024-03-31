import fs from "fs/promises";
import { glob } from "glob";

const DEBUG = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createAltByLocalFile(filePath) {
  // # TODO: Implement logic to generate alt based on image filePath

  await sleep(1000);
  const description = `Image description: ${filePath}`;
  if (DEBUG) {
    console.warn(`AiAlt by filePath: ${filePath}`);
  }
  return description;
}

async function createAltBySrc(src) {
  // # TODO: Implement logic to generate alt based on image src
  await sleep(1000);
  const description = "Image description: " + src.split("/").pop();
  if (DEBUG) {
    console.warn(`AiAlt by src: ${src}`);
  }
  return description;
}

async function addGenericAltToImages(filePath) {
  try {
    let htmlContent = await fs.readFile(filePath, "utf8");
    const imgRegex = /<img\s+(?=(?:[^>]*?\s+)?src=(['"])(.*?)\1)[^>]*?>/g;
    let promises = [];
    let matches = [];

    htmlContent = htmlContent.replace(imgRegex, (match, quote, src) => {
      if (!match.includes("alt=")) {
        const placeholder = `TEMP_PLACEHOLDER_${promises.length}`;
        matches.push(placeholder);

        const promise = (async () => {
          let alt = "";

          if (src.startsWith("http")) {
            alt = await createAltBySrc(src);
          } else if (src.startsWith("/")) {
            alt = await createAltByLocalFile(src);
          } else {
            console.warn(`❌ AiAlt: Invalid image src: ${src}`);
          }

          return match.replace(/<img/, `<img alt="${alt}"`);
        })();

        promises.push(promise);
        return placeholder;
      }
      return match;
    });

    // Aguardar todas as promessas
    const results = await Promise.all(promises);

    // Substituir os placeholders pelos valores reais
    results.forEach((result, index) => {
      htmlContent = htmlContent.replace(`TEMP_PLACEHOLDER_${index}`, result);
    });

    await fs.writeFile(filePath, htmlContent, "utf8");
  } catch (err) {
    console.error("❌ AiAlt: An error occurred:", err);
  }
}

export async function AiAlt() {
  const htmlFiles = await glob("*.html", { ignore: "node_modules/**" });

  for (let file of htmlFiles) {
    await addGenericAltToImages(file);
  }

  console.log("Hello a11y!");
}
