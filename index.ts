// This is a bun import, dunno if it make things be bad in node
import { parseArgs } from 'util';
import { createHash } from 'crypto';
import { EOL } from 'os';
import * as fs from 'fs';
import xlsx from 'node-xlsx';
import chalk from 'chalk';
import Tree from './tree';

interface Person {
  id: string;
  name: string;
  parent: string;
  title: string;
  location?: string;
};

const args = parseArgs({
  allowPositionals: true,
  options: {
    'no-cache': { type: 'boolean' },
  }
});

const NO_CACHE = args.values['no-cache'];
const FILE = args.positionals[0];

if (!fs.existsSync(FILE)) err('xlsx file not found');

const buffer = fs.readFileSync(FILE);
const sha = checksum(buffer.toString());

let records: Person[];

if (!NO_CACHE && fs.existsSync(`.${sha}.ndjson`)) {
  records = fs.readFileSync(`.${sha}.ndjson`).toString().split(EOL).map(r => JSON.parse(r));
} else {
  const workSheetsFromBuffer = xlsx.parse(buffer);
  const sheet = workSheetsFromBuffer[0];
  if (!sheet) err('xlsx file contained no sheets');

  const [_, ...rows] = sheet.data;
  records = rows.map(([id, name, parent, title, location]) => ({
    id, name, parent, title, location
  }));

  if (!NO_CACHE) fs.writeFileSync(`.${sha}.ndjson`, records.map(r => JSON.stringify(r)).join(EOL));
}

let orgtree = makeTree(records);
if (!orgtree) process.exit();

console.log(orgtree.root.data.name, orgtree.root.data.title);

function makeTree(records: Person[]): Tree<Person> | undefined {
  try {
    return new Tree<Person>(records);
  } catch (e) {
    err((e as Error).message);
  }
}

function checksum(digest: string): string {
  return createHash('sha256')
    .update(digest)
    .digest()
    .toString('hex')
}

function err(message: string): void {
  console.log(chalk.red(message));
  process.exit();
}
