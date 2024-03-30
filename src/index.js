import fs from "fs/promises";
import { glob } from "glob";

const DEBUG = true;

function createAltByLocalFile(filePath) {
  // # TODO: Implement logic to generate alt based on image filePath

  const description = `Image description: ${filePath}`;
  if (DEBUG) {
    console.warn(`AiAlt by filePath: ${filePath}`);
  }
  return description;
}

function createAltBySrc(src) {
  // # TODO: Implement logic to generate alt based on image src
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

    htmlContent = htmlContent.replace(imgRegex, (match, quote, src) => {
      if (!match.includes("alt=")) {
        let alt = "";

        if (src.startsWith("http")) {
          alt = createAltBySrc(src);
        } else if (src.startsWith("/")) {
          alt = createAltByLocalFile(src);
        } else {
          console.warn(`❌ AiAlt: Invalid image src: ${src}`);
        }

        return match.replace(/<img/, `<img alt="${alt}"`);
      }
      return match;
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
