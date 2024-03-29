import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configFile = path.join(process.cwd(), "ai-alt.json"); // Caminho para o arquivo de configuração na raiz do projeto do cliente
const defaultConfig = {
  option: "value",
};

if (!fs.existsSync(configFile)) {
  fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), {
    encoding: "utf8",
  });
  console.log("Arquivo de configuração criado com sucesso.");
} else {
  console.log("O arquivo de configuração já existe.");
}
