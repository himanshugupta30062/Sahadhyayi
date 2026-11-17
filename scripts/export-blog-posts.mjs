import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const sourcePath = path.resolve("src/data/blogPostDetails.ts");
const outputPath = path.resolve("public/blog-posts.json");
const source = fs.readFileSync(sourcePath, "utf8");
const result = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  reportDiagnostics: true,
});
const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
if (errors.length) {
  throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => "\\n",
  }));
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sahadhyayi-blog-data-"));
const modulePath = path.join(tempDir, "blogPostDetails.mjs");
try {
  fs.writeFileSync(modulePath, result.outputText, "utf8");
  const { blogPostDetails } = await import(pathToFileURL(modulePath).href);
  if (!blogPostDetails || typeof blogPostDetails !== "object" || Array.isArray(blogPostDetails)) {
    throw new Error("Blog post source did not export a valid article map.");
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(blogPostDetails), "utf8");
  console.log(`[blog-data] Exported ${Object.keys(blogPostDetails).length} journal stories to public/blog-posts.json`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
