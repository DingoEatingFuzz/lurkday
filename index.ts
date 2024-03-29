#!/usr/bin/env node

import { EOL } from 'os';
import * as readline from 'readline/promises';
import { parseArgs } from 'util';
import { stdin, stdout } from 'process';
import chalk from 'chalk';
import { nfmt } from './utils';
import reader, { Person } from './reader';
import Tree from './tree';
import { parse, isError, ParseError, Filetype } from './parse';
import Commander from './commander';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'no-cache': { type: 'boolean' },
    'c': { type: 'string' },
    'format': { type: 'string' },
  }
});

const NO_CACHE = args.values['no-cache'];
const FILE = args.positionals[0];
const COMMAND = args.values['c'];
const FORMAT = args.values['format'] as keyof typeof Filetype;

const printParseError = (err: ParseError) => {
  console.log(chalk.red(err.error + EOL + EOL + err.context));
}

let orgtree = reader(FILE, !NO_CACHE);
if (!orgtree) process.exit();

await main(orgtree);

async function main(orgtree: Tree<Person>) {
  let firstCmd = true;
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const commander = new Commander(orgtree);

  if (COMMAND) {
    const cmd = parse(COMMAND);
    if (isError(cmd)) printParseError(cmd);
    else {
      if (FORMAT) {
        cmd.exports = true;
        cmd.filetype = Filetype[FORMAT];
      }
      await commander.exec(cmd, true);
    }
  } else {
    while (true) {
      const prompt = firstCmd ? `Lurking ${nfmt(orgtree.size())} people${EOL}> ` : `${EOL}> `;
      firstCmd = false;

      // This is an artifact of inquirer, which pauses stdin and doesn't clean up
      stdin.resume();

      const cmdstr = await rl.question(prompt);
      const cmd = parse(cmdstr);

      if (isError(cmd)) printParseError(cmd);
      else await commander.exec(cmd);
    }
  }

  process.exit(0);
}
