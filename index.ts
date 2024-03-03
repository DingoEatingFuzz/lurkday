import { EOL } from 'os';
import * as readline from 'readline/promises';
import { parseArgs } from 'util';
import { stdin, stdout } from 'process';
import chalk from 'chalk';
import { nfmt } from './utils';
import reader, { Person } from './reader';
import type Tree from './tree';
import { parse } from './parse';


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

await main(orgtree);

async function main(orgtree: Tree<Person>) {
  let firstCmd = true;
  const rl = readline.createInterface({ input: stdin, output: stdout });

  while (true) {
    const prompt = firstCmd ? `Lurking ${nfmt(orgtree.size())} people${EOL}> ` : '> ';
    firstCmd = false;

    const cmdstr = await rl.question(prompt);
    console.log(`Got command ${chalk.bold.yellow(cmdstr)} now to parse...`);

    const cmd = parse(cmdstr);
    console.log(cmd);
  }
}
