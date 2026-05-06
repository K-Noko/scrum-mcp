import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = resolve(__dirname, "../../../components");

export const buildArtifactSchema = z.object({
  component: z.string().describe("コンポーネント名（list_components で確認）例: SprintSummary"),
  props: z.record(z.unknown()).describe("コンポーネントに渡す props（list_components のスキーマに従う）"),
});

export async function buildArtifact(args: z.infer<typeof buildArtifactSchema>) {
  // Validate component name
  const schemasPath = resolve(COMPONENTS_DIR, "schemas.json");
  const schemas = JSON.parse(readFileSync(schemasPath, "utf-8"));
  if (!schemas[args.component]) {
    throw new Error(`Unknown component: ${args.component}. Run list_components to see available components.`);
  }

  const distHtml = resolve(COMPONENTS_DIR, "dist/index.html");

  // Build if dist doesn't exist
  if (!existsSync(distHtml)) {
    execSync("npm install", { cwd: COMPONENTS_DIR, stdio: "inherit" });
    execSync("npm run build", { cwd: COMPONENTS_DIR, stdio: "inherit" });
  }

  let html = readFileSync(distHtml, "utf-8");

  // Inject window.__ARTIFACT__ before the first <script type="module"
  const injection = `<script>window.__ARTIFACT__ = ${JSON.stringify({ component: args.component, props: args.props })};</script>`;
  html = html.replace('<script type="module"', `${injection}<script type="module"`);

  return { html };
}
