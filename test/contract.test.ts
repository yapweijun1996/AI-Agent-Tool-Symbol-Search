import assert from "node:assert/strict";
import test from "node:test";
import { execute, findDefinition, findImplementations, findReferences, getCapabilities, listSymbols, searchSymbols, validateCapabilities, validateRequest, validateResult } from "../src";
import { fixtureRoot } from "./helpers";

test("public request schemas accept every V1 operation", () => {
  const requests = [
    { operation: "capabilities", root: fixtureRoot },
    { operation: "search", root: fixtureRoot, symbol: "resolveConfig" },
    { operation: "definition", root: fixtureRoot, symbol: "resolveConfig" },
    { operation: "references", root: fixtureRoot, symbol: "resolveConfig" },
    { operation: "implementations", root: fixtureRoot, symbol: "StorageAdapter" },
    { operation: "symbols", root: fixtureRoot, path: "src/config.ts" }
  ];
  for (const request of requests) {
    const outcome = validateRequest(request);
    assert.equal(outcome.valid, true, outcome.errors.join("; "));
  }
});

test("invalid public requests are rejected before repository access", () => {
  for (const request of [
    { operation: "search", root: fixtureRoot, symbol: "x", limit: 0 },
    { operation: "search", root: fixtureRoot, symbol: "x", match: "fuzzy" },
    { operation: "unknown", root: fixtureRoot },
    { operation: "symbols", root: fixtureRoot, path: "src/a.ts", from: {} }
  ]) {
    const result = execute(request as never);
    assert.equal(result.status, "error");
    assert.ok(result.diagnostics.some((item) => item.code === "INVALID_REQUEST"));
    assert.equal(validateResult(result).valid, true);
  }
});

test("result and capability envelopes validate against maintained schemas", () => {
  const result = searchSymbols({ root: fixtureRoot, symbol: "resolveConfig" });
  assert.equal(validateResult(result).valid, true);
  const capabilities = execute({ operation: "capabilities", root: fixtureRoot });
  assert.equal(capabilities.status, "complete");
  assert.equal(getCapabilities({ root: fixtureRoot }).status, "complete");
  assert.ok(capabilities.data.capabilities);
  assert.equal(validateCapabilities(capabilities.data.capabilities!).valid, true);
});

test("library operation wrappers share the canonical operation contract", () => {
  assert.equal(searchSymbols({ root: fixtureRoot, symbol: "resolveConfig" }).data.matches.length, 3);
  assert.ok(findDefinition({ root: fixtureRoot, symbol: "FileAdapter" }).data.matches.length);
  assert.ok(findReferences({ root: fixtureRoot, symbol: "resolveConfig" }).data.matches.length);
  assert.ok(findImplementations({ root: fixtureRoot, symbol: "StorageAdapter" }).data.matches.length);
  assert.ok(listSymbols({ root: fixtureRoot, path: "src/config.ts" }).data.matches.length);
});
