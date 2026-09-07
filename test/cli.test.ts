import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { fixtureRoot } from "./helpers";

const cli = resolve(process.cwd(), "dist/cli.js");

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: process.cwd(), encoding: "utf8" });
}

test("CLI keeps JSON on stdout and human diagnostics on stderr", () => {
  const result = runCli("definition", "--root", fixtureRoot, "--symbol", "FileAdapter");
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.equal(json.status, "complete");
  assert.equal(json.data.matches[0].name, "FileAdapter");
  assert.equal(result.stderr, "");

  const ambiguous = runCli("definition", "--root", fixtureRoot, "--symbol", "resolveConfig");
  assert.equal(ambiguous.status, 0);
  assert.equal(JSON.parse(ambiguous.stdout).status, "complete");
  assert.match(ambiguous.stderr, /AMBIGUOUS_SYMBOL/);
});

test("CLI reports invalid requests with valid JSON and a non-zero exit", () => {
  const result = runCli("search", "--root", "/definitely/not/a/repository", "--symbol", "anything");
  assert.notEqual(result.status, 0);
  const json = JSON.parse(result.stdout);
  assert.equal(json.status, "error");
  assert.ok(json.diagnostics.some((item: { code: string }) => item.code === "INVALID_ROOT"));
  assert.match(result.stderr, /INVALID_ROOT/);

  const malformed = runCli("search", "--root", fixtureRoot, "--symbol", "anything", "--unknown", "value");
  assert.equal(malformed.status, 2);
  assert.equal(JSON.parse(malformed.stdout).status, "error");
  assert.match(malformed.stderr, /INVALID_REQUEST/);
});
