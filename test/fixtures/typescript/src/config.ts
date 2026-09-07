export interface StorageAdapter {
  get(key: string): string;
}

export abstract class BaseService {
  abstract run(input: string): string;
}

export class FileAdapter implements StorageAdapter {
  public get(key: string): string {
    return `file:${key}`;
  }
}

export class ChildService extends BaseService {
  public run(input: string): string {
    return `child:${input}`;
  }
}

export class StructuralAdapter {
  public get(key: string): string {
    return `structural:${key}`;
  }
}

export function resolveConfig(name: string): string;
export function resolveConfig(name: number): string;
export function resolveConfig(name: string | number): string {
  return `config:${name}`;
}

export const projectName = "agent-symbol-search";

const commentOnly = "resolveConfig is only text here";
void commentOnly;
