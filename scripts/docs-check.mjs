import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const documents = [
  "README.md",
  "DESIGN.md",
  "SPEC.md",
  "EPIC.md",
  "ROADMAP.md",
  "TASK.md",
  "DOCUMENTATION_STANDARD.md",
  "CHANGELOG.md",
  "BENCHMARK.md"
];
const failures = [];
const contents = new Map();
for (const document of documents) {
  const path = resolve(document);
  if (!existsSync(path)) {
    failures.push(`${document}: missing`);
    continue;
  }
  const content = readFileSync(path, "utf8");
  contents.set(document, content);
  for (const field of ["Status", "Owner", "Last reviewed"]) {
    if (!new RegExp(`\\| ${field} \\| .+\\|`).test(content)) failures.push(`${document}: missing ${field} metadata`);
  }
  for (const match of content.matchAll(/\]\((\.\/[^)#]+)(?:#[^)]+)?\)/g)) {
    if (!existsSync(resolve(match[1]))) failures.push(`${document}: broken local link ${match[1]}`);
  }
}
const readme = contents.get("README.md") ?? "";
for (const phrase of ["npm ci", "npm run verify", "TypeScript", "JSON", "read-only", "SPEC.md", "TASK.md"]) {
  if (!readme.includes(phrase)) failures.push(`README.md: missing required phrase ${phrase}`);
}
const spec = contents.get("SPEC.md") ?? "";
for (const phrase of ["schemaVersion", "AMBIGUOUS_SYMBOL", "MAX_RESULTS_REACHED", "PATH_OUTSIDE_ROOT", "UTF-16", "project"]) {
  if (!spec.includes(phrase)) failures.push(`SPEC.md: missing contract phrase ${phrase}`);
}
const task = contents.get("TASK.md") ?? "";
if (!task.includes("npm run verify")) failures.push("TASK.md: missing executable verification command");
const changelog = contents.get("CHANGELOG.md") ?? "";
if (!/0\.1\.0/.test(changelog)) failures.push("CHANGELOG.md: missing runtime version entry");
for (const schema of ["schemas/request.schema.json", "schemas/result.schema.json", "schemas/capabilities.schema.json"]) {
  try {
    JSON.parse(readFileSync(resolve(schema), "utf8"));
  } catch (error) {
    failures.push(`${schema}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
}
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`docs: ${documents.length} documents, local links, contract markers, and schemas checked`);
}
