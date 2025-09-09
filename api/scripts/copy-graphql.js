/* eslint-disable */
const { cpSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const SRC = join(process.cwd(), 'src', 'graphql');
const DEST = join(process.cwd(), 'dist', 'graphql');

try {
  mkdirSync(DEST, { recursive: true });
  cpSync(SRC, DEST, { recursive: true, filter: (src) => src.endsWith('.graphql') || !src.includes('.') });
  // Above filter copies directories and .graphql files only
  console.log('Copied GraphQL SDL to dist');
} catch (e) {
  console.error('Failed to copy GraphQL SDL', e);
  process.exit(1);
}
