import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repository = resolve(".");
const fixtureRoot = resolve("test/fixtures/typescript");
const temporary = mkdtempSync(join(tmpdir(), "agent-symbol-search-pack-"));
try {
  execFileSync("npm", ["run", "build"], { cwd: repository, stdio: "inherit" });
  const packOutput = execFileSync("npm", ["pack", "--json", "--pack-destination", temporary], { cwd: repository, encoding: "utf8" });
  const packageFile = JSON.parse(packOutput)[0]?.filename;
  if (!packageFile) throw new Error("npm pack did not report a package file");
  const archive = join(temporary, packageFile);
  const installRoot = join(temporary, "installed");
  execFileSync("npm", ["install", "--prefix", installRoot, "--no-save", "--ignore-scripts", "--no-audit", "--no-fund", archive], { cwd: repository, stdio: "inherit" });

  const cli = join(installRoot, "node_modules", ".bin", "agent-symbol-search");
  const cliRun = spawnSync(cli, ["definition", "--root", fixtureRoot, "--symbol", "resolveConfig"], { encoding: "utf8" });
  if (cliRun.status !== 0) throw new Error(`packaged CLI exited ${cliRun.status}: ${cliRun.stderr}`);
  const cliResult = JSON.parse(cliRun.stdout);
  if (cliResult.status !== "complete" || !cliResult.data.matches?.length) throw new Error("packaged CLI did not resolve the fixture definition");

  const libraryRun = spawnSync(process.execPath, ["-e", [
    "const api = require('agent-symbol-search');",
    `const result = api.findReferences({ root: ${JSON.stringify(fixtureRoot)}, symbol: 'resolveConfig' });`,
    "if (result.status !== 'complete' || !result.data.matches.length) process.exit(1);"
  ].join("\n")], { cwd: installRoot, encoding: "utf8" });
  if (libraryRun.status !== 0) throw new Error(`packaged library failed: ${libraryRun.stderr}`);
  console.log("smoke: packaged CLI and library API passed outside the source checkout");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
