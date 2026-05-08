import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = resolve(__dirname, "../../components");

const sectionSchema = z.object({
  component: z.string().describe("コンポーネント名（list_components で確認）"),
  props: z.record(z.unknown()).describe("コンポーネントに渡す props"),
});

export const buildArtifactSchema = z.object({
  sections: z.array(sectionSchema).describe(
    "表示するセクションの配列。Claudeがデータの内容に応じて含めるコンポーネントと順序を決定する。"
  ),
});

export async function buildArtifact(args: z.infer<typeof buildArtifactSchema>) {
  const schemasPath = resolve(COMPONENTS_DIR, "schemas.json");
  const schemas = JSON.parse(readFileSync(schemasPath, "utf-8"));

  for (const section of args.sections) {
    if (!schemas[section.component]) {
      throw new Error(`Unknown component: ${section.component}. Run list_components to see available components.`);
    }
  }

  const distHtml = resolve(COMPONENTS_DIR, "dist/index.html");

  if (!existsSync(distHtml)) {
    execSync("npm install", { cwd: COMPONENTS_DIR, stdio: "inherit" });
    execSync("npm run build", { cwd: COMPONENTS_DIR, stdio: "inherit" });
  }

  let html = readFileSync(distHtml, "utf-8");

  const injection = `<script>window.__ARTIFACT__ = ${JSON.stringify({ sections: args.sections })};</script>`;
  html = html.replace('<script type="module"', `${injection}<script type="module"`);

  return { html };
}
