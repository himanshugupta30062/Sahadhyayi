import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const sourcePath = path.resolve("src/data/lifeStories.ts");
const outputPath = path.resolve("public/data/life-stories.json");
const source = fs.readFileSync(sourcePath, "utf8");
const result = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
  getCurrentDirectory: () => process.cwd(),
  getCanonicalFileName: (fileName) => fileName,
  getNewLine: () => "\\n",
}));

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sahadhyayi-life-stories-"));
const modulePath = path.join(tempDir, "lifeStories.mjs");
try {
  fs.writeFileSync(modulePath, result.outputText, "utf8");
  const { lifeStories } = await import(pathToFileURL(modulePath).href);
  if (!Array.isArray(lifeStories) || lifeStories.some((story) => !story.slug || !story.name || !Array.isArray(story.story))) {
    throw new Error("Life story source is missing required fields.");
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(lifeStories), "utf8");
  console.log(`[life-stories] Exported ${lifeStories.length} biographies to public/data/life-stories.json`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
