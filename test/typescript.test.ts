import assert from "node:assert/strict";
import test from "node:test";
import { findDefinition, findImplementations, findReferences, listSymbols, searchSymbols } from "../src";
import { fixtureRoot } from "./helpers";

function matchNames(result: ReturnType<typeof searchSymbols>): string[] {
  return result.data.matches.map((match) => match.name);
}

test("search returns normalized TypeScript declarations with deterministic ranges and IDs", () => {
  const result = searchSymbols({ root: fixtureRoot, symbol: "resolve", match: "prefix" });
  assert.equal(result.status, "complete");
  assert.deepEqual(matchNames(result), ["resolveConfig", "resolveConfig", "resolveConfig"]);
  for (const match of result.data.matches) {
    assert.equal(match.language, "typescript");
    assert.match(match.symbolId, /^sha256-v1:[a-f0-9]{64}$/);
    assert.equal(match.path, "src/config.ts");
    assert.ok(match.range.end.line >= match.range.start.line);
    assert.ok(match.nameRange);
    assert.equal(match.confidence, "confirmed");
  }
  assert.deepEqual(result, searchSymbols({ root: fixtureRoot, symbol: "resolve", match: "prefix" }));
});

test("symbols lists nested declarations, normalized kinds, and UTF-16 positions", () => {
  const result = listSymbols({ root: fixtureRoot, path: "src/config.ts" });
  assert.equal(result.status, "complete");
  const kinds = new Map(result.data.matches.map((match) => [match.name, match.kind]));
  assert.equal(kinds.get("StorageAdapter"), "interface");
  assert.equal(kinds.get("FileAdapter"), "class");
  assert.equal(kinds.get("get"), "method");
  assert.equal(kinds.get("key"), "parameter");
  assert.equal(result.data.matches.find((match) => match.qualifiedName === "projectName")?.kind, "constant");
  const exportedConstant = result.data.matches.find((match) => match.qualifiedName === "projectName");
  assert.equal(exportedConstant?.exported, true);
  assert.equal(result.data.matches.find((match) => match.name === "commentOnly")?.exported, false);
  assert.equal(result.data.matches.find((match) => match.name === "exportedBinding")?.exported, true);
  assert.equal(result.data.matches.find((match) => match.name === "localBinding")?.exported, false);
  assert.equal(result.data.matches.find((match) => match.qualifiedName === "localExportSpecifier")?.exported, true);
  const reExport = searchSymbols({ root: fixtureRoot, symbol: "reExportedProjectName" });
  assert.equal(reExport.data.matches.length, 1);
  assert.equal(reExport.data.matches[0]?.exported, true);
  const adapter = result.data.matches.find((match) => match.name === "FileAdapter");
  assert.equal(adapter?.nameRange?.start.line, 9);
  assert.equal(adapter?.nameRange?.start.column, 13);
  const constructors = result.data.matches.filter((match) => match.kind === "constructor");
  assert.equal(constructors.length, 1);
  assert.equal(constructors[0]?.name, "constructor");
  assert.ok(constructors[0]?.nameRange);
  assert.equal(constructors[0]?.nameRange?.start.line, adapter?.nameRange?.start.line + 1);
  assert.equal(constructors[0]?.nameRange?.start.line, constructors[0]?.nameRange?.end.line);
  const constructorSearch = searchSymbols({ root: fixtureRoot, symbol: "constructor" });
  assert.deepEqual(constructorSearch.data.matches.map((match) => [match.name, match.kind, match.path]), [["constructor", "constructor", "src/config.ts"]]);
  assert.equal(listSymbols({ root: fixtureRoot, path: "src\\config.ts" }).data.matches.length, result.data.matches.length);
});

test("definitions return all overload declarations and mark context-free ambiguity", () => {
  const result = findDefinition({ root: fixtureRoot, symbol: "resolveConfig" });
  assert.equal(result.status, "complete");
  assert.equal(result.data.ambiguous, true);
  assert.equal(result.diagnostics.filter((item) => item.code === "AMBIGUOUS_SYMBOL").length, 1);
  assert.equal(result.data.matches.length, 3);
  assert.ok(result.data.matches.every((match) => match.relation === "definition"));
});

test("a source position resolves an import alias to its semantic definition", () => {
  const result = findDefinition({
    root: fixtureRoot,
    symbol: "ignored-query-name",
    from: { path: "src/consumer.ts", line: 6, column: 9 }
  });
  assert.equal(result.status, "complete");
  assert.equal(result.data.matches.length, 3);
  assert.ok(result.data.matches.every((match) => match.path === "src/config.ts"));
});

test("references use compiler symbols and ignore comments and string literals", () => {
  const shorthand = findReferences({ root: fixtureRoot, symbol: "projectName" });
  assert.equal(shorthand.status, "complete");
  assert.ok(!shorthand.diagnostics.some((item) => item.code === "SYMBOL_NOT_FOUND"));
  assert.ok(shorthand.data.matches.some((match) => match.relation === "reference" && match.path === "src/config.ts"));

  const result = findReferences({ root: fixtureRoot, symbol: "resolveConfig" });
  assert.equal(result.status, "complete");
  assert.ok(result.data.matches.some((match) => match.relation === "import_alias" && match.path === "src/consumer.ts"));
  assert.ok(result.data.matches.some((match) => match.relation === "reference" && match.range.start.line === 6));
  assert.ok(result.data.matches.every((match) => match.range.start.line !== 9 && match.range.start.line !== 10));
});

test("explicit inheritance and implementation relationships are distinct", () => {
  const interfaceResult = findImplementations({ root: fixtureRoot, symbol: "StorageAdapter" });
  assert.equal(interfaceResult.status, "complete");
  assert.deepEqual(interfaceResult.data.matches.map((match) => [match.name, match.relation]), [["FileAdapter", "implementation"]]);

  const baseResult = findImplementations({ root: fixtureRoot, symbol: "BaseService" });
  assert.equal(baseResult.status, "complete");
  assert.deepEqual(baseResult.data.matches.map((match) => [match.name, match.relation]), [["ChildService", "inheritance"]]);

  const expressionInterfaceResult = findImplementations({ root: fixtureRoot, symbol: "ExpressionAdapter" });
  assert.equal(expressionInterfaceResult.status, "complete");
  assert.deepEqual(expressionInterfaceResult.data.matches.map((match) => [match.name, match.kind, match.relation]), [["ExpressionAdapterImpl", "class", "implementation"]]);

  const expressionBaseResult = findImplementations({ root: fixtureRoot, symbol: "ExpressionBase" });
  assert.equal(expressionBaseResult.status, "complete");
  assert.deepEqual(expressionBaseResult.data.matches.map((match) => [match.name, match.kind, match.relation]), [["ExpressionChild", "class", "inheritance"]]);

  const methodResult = findImplementations({ root: fixtureRoot, symbol: "run" });
  assert.equal(methodResult.status, "complete");
  assert.deepEqual(methodResult.data.matches.map((match) => [match.name, match.relation]), [["run", "implementation"]]);

  const structuralResult = findImplementations({ root: fixtureRoot, symbol: "StructuralAdapter" });
  assert.equal(structuralResult.status, "partial");
  assert.ok(structuralResult.diagnostics.some((item) => item.code === "SEMANTIC_RESOLUTION_UNAVAILABLE"));
});

test("default exports and declaration merging have stable, path-independent identities", () => {
  const defaultResult = searchSymbols({ root: fixtureRoot, symbol: "default" });
  assert.equal(defaultResult.status, "complete");
  assert.equal(defaultResult.data.matches.length, 1);
  assert.equal(defaultResult.data.matches[0]?.kind, "class");
  assert.equal(defaultResult.data.matches[0]?.qualifiedName, "default");
  assert.ok(!defaultResult.data.matches[0]?.path.includes("\\\\"));

  const merged = listSymbols({ root: fixtureRoot, path: "src/advanced.ts" }).data.matches.filter((match) => match.name === "Merged");
  assert.equal(merged.length, 2);
  assert.equal(merged[0]?.symbolId, merged[1]?.symbolId);
});

test("result limits are bounded and explicitly reported", () => {
  const result = searchSymbols({ root: fixtureRoot, symbol: "resolveConfig", limit: 1 });
  assert.equal(result.status, "partial");
  assert.equal(result.data.matches.length, 1);
  assert.equal(result.truncation.truncated, true);
  assert.ok(result.truncation.reasons.includes("MAX_RESULTS_REACHED"));
});
