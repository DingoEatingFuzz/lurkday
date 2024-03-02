// This is a bun import, dunno if it make things be bad in node
import { parseArgs } from 'util';
import reader from './reader';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'no-cache': { type: 'boolean' },
  }
});

const NO_CACHE = args.values['no-cache'];
const FILE = args.positionals[0];

let orgtree = reader(FILE, !NO_CACHE);
if (!orgtree) process.exit();

console.log(orgtree.root.data.name, orgtree.root.data.title);
