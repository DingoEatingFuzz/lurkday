// This is a bun import, dunno if it make things be bad in node
import { parseArgs } from 'util';
import { createHash } from 'crypto';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'no-cache': { type: 'boolean' },
  }
});

const NO_CACHE = args.values['no-cache'];
const FILE = args.positionals[0];

console.log('File', NO_CACHE, FILE, checksum(FILE));

// Take in an excel sheet
// Convert into json records
// Cache records in a local file
// Construct a tree with it
// Start repl


function checksum(digest: string): string {
  return createHash('sha256')
    .update(digest)
    .digest()
    .toString('hex')
}
