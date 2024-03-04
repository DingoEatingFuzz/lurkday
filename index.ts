import { EOL } from 'os';
import * as readline from 'readline/promises';
import { parseArgs } from 'util';
import { writeFileSync } from 'fs';
import { stdin, stdout } from 'process';
import chalk from 'chalk';
import select from '@inquirer/select';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { nfmt, prettyPrintPerson } from './utils';
import reader, { Person } from './reader';
import Tree, { Node } from './tree';
import { parse, shouldExport, ParseError, Command, TreeFunctions, Filetype } from './parse';

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
  const commander = new Commander(orgtree);

  while (true) {
    const prompt = firstCmd ? `Lurking ${nfmt(orgtree.size())} people${EOL}> ` : `${EOL}> `;
    firstCmd = false;

    // This is an artifact of inquirer, which pauses stdin and doesn't clean up
    stdin.resume();

    const cmdstr = await rl.question(prompt);
    const cmd = parse(cmdstr);

    if ((cmd as ParseError).error) {
      // Handle error
    } else {
      await commander.exec(cmd as Command);
    }
  }
}

class Commander {
  data;

  constructor(data: Tree<Person>) {
    this.data = data;
  }

  async exec(cmd: Command) {
    // If help, print and return
    if (cmd.fn === TreeFunctions.help) {
      console.log('Lurkday, yep');
      return;
    }

    // This traverses the whole tree, there should be an index of names and also some fuzzy search.
    const nodes = this.data.search(cmd.name);
    if (nodes.length === 0) {
      console.log(chalk.red(`No match for name ${cmd.name}`));
      return;
    }

    const node = await this.disambiguate(nodes);

    // Handle tree case
    if (cmd.fn === TreeFunctions.tree) {
      if (shouldExport(cmd)) {
        const flatlist = Array.from(node.breadthFirst()) as Node<Person>[];
        try {
          await this.save(flatlist, cmd.filename, cmd.filetype);
          console.log(`Saved file ${cmd.filename}`);
        } catch (err) {
          console.log(chalk.red(`Could not save file: ${err}`));
        }

        return;
      }

      node.print(prettyPrintPerson);
      return;
    }

    // Handle all other cases
    let selection: Node<Person>[];

    if (cmd.fn === TreeFunctions.directs) {
      selection = node.children;
    } else if (cmd.fn === TreeFunctions.chain) {
      selection = Array.from(node.parents()).reverse();
    } else if (cmd.fn === TreeFunctions.peers) {
      selection = node.parent?.children ?? [node];
    } else {
      console.log(chalk.red('No matches? Somehow???'));
      return;
    }

    if (shouldExport(cmd)) {
      try {
        await this.save(selection, cmd.filename, cmd.filetype);
        console.log(`Saved file ${cmd.filename}`);
      } catch (err) {
        console.log(chalk.red(`Could not save file: ${err}`));
      }
    } else {
      selection.forEach(n => {
        console.log(`${n === node ? '*' : ' '}  ${prettyPrintPerson(n)}`);
      });
    }
  }

  async disambiguate(nodes: Node<Person>[]): Promise<Node<Person>> {
    if (nodes.length === 1) return nodes[0];

    return await select({
      message: chalk.yellow('Multiple potential matches. Please select one:'),
      choices: nodes.map(n => ({ name: prettyPrintPerson(n), value: n })),
      loop: false,
    });
  }

  async save(nodes: Node<Person>[], name: string, ext: Filetype) {
    let str;

    if (ext === Filetype.json) {
      str = JSON.stringify(nodes.map(n => n.serialize()));
    } else if (ext === Filetype.ndjson) {
      str = nodes.map(n => JSON.stringify(n.serialize())).join(EOL);
    } else if (ext === Filetype.csv || ext === Filetype.tsv) {
      const delimiter = ext === Filetype.csv ? ',' : '\t';
      str = csvStringify([
        ['id', 'parent', 'name', 'title', 'location'],
        ...nodes.map(n => [n.id, n.parent, n.data.name, n.data.title, n.data.location])
      ], { delimiter });
    }

    writeFileSync(name, str ?? '');
  }
}
