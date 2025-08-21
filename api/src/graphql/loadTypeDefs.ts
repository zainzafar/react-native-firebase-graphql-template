import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fg from 'fast-glob';

const TYPES_DIR = join(__dirname, 'types');

export async function loadTypeDefs(): Promise<string[]> {
  const files = await fg('**/*.graphql', { cwd: TYPES_DIR, absolute: true });
  const sdlPromises = (files as string[]).map((filePath) => readFile(filePath, 'utf8'));
  return Promise.all(sdlPromises);
}


