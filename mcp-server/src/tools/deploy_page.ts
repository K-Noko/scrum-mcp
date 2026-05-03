import { z } from "zod";
import { Storage } from "@google-cloud/storage";
import { nanoid } from "nanoid";

const storage = new Storage();

export const deployPageSchema = z.object({
  html_content: z.string().describe("デプロイするHTMLの全文"),
  filename: z.string().optional().describe("ファイル名（省略時は自動生成）例: sprint-1-report"),
});

export async function deployPage(args: z.infer<typeof deployPageSchema>) {
  const bucket = process.env.GCS_BUCKET;
  if (!bucket) throw new Error("GCS_BUCKET is not set");

  const filename = args.filename ? `${args.filename}.html` : `pages/${nanoid(12)}.html`;

  const file = storage.bucket(bucket).file(filename);

  await file.save(args.html_content, {
    contentType: "text/html; charset=utf-8",
    metadata: { cacheControl: "no-cache" },
  });

  await file.makePublic();

  const url = `https://storage.googleapis.com/${bucket}/${filename}`;
  return { url, filename };
}
