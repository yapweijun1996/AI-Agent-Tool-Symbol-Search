import { SymbolSearchEngine } from "./core/engine";
import type { CapabilitiesRequest, EngineOptions, Request, Result, SearchRequest, SemanticRequest, SymbolsRequest } from "./types";

export * from "./types";
export { SymbolSearchEngine, getCapabilitiesData } from "./core/engine";
export { validateCapabilities, validateRequest, validateResult } from "./core/validation";

export function createEngine(options: EngineOptions = {}): SymbolSearchEngine {
  return new SymbolSearchEngine(options);
}

export function execute(request: Request, options: EngineOptions = {}): Result {
  return new SymbolSearchEngine(options).execute(request);
}

function withOperation<T extends object>(operation: Request["operation"], input: T & Partial<Pick<Request, "operation">>): Request {
  return { ...input, operation } as unknown as Request;
}

export function getCapabilities(rootOrRequest: string | Omit<CapabilitiesRequest, "operation"> | CapabilitiesRequest, options: EngineOptions = {}): Result {
  const root = typeof rootOrRequest === "string" ? rootOrRequest : rootOrRequest.root;
  return new SymbolSearchEngine(options).getCapabilities(root);
}

export function searchSymbols(request: Omit<SearchRequest, "operation"> | SearchRequest, options: EngineOptions = {}): Result {
  const value = "operation" in request ? request : withOperation("search", request);
  return new SymbolSearchEngine(options).execute(value);
}

export function findDefinition(request: Omit<SemanticRequest, "operation"> | SemanticRequest, options: EngineOptions = {}): Result {
  const value = "operation" in request ? request : withOperation("definition", request);
  return new SymbolSearchEngine(options).execute(value);
}

export function findReferences(request: Omit<SemanticRequest, "operation"> | SemanticRequest, options: EngineOptions = {}): Result {
  const value = "operation" in request ? request : withOperation("references", request);
  return new SymbolSearchEngine(options).execute(value);
}

export function findImplementations(request: Omit<SemanticRequest, "operation"> | SemanticRequest, options: EngineOptions = {}): Result {
  const value = "operation" in request ? request : withOperation("implementations", request);
  return new SymbolSearchEngine(options).execute(value);
}

export function listSymbols(request: Omit<SymbolsRequest, "operation"> | SymbolsRequest, options: EngineOptions = {}): Result {
  const value = "operation" in request ? request : withOperation("symbols", request);
  return new SymbolSearchEngine(options).execute(value);
}
