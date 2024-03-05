import { EOL } from 'os';
import { writeFileSync } from 'fs';
import chalk from 'chalk';
import select from '@inquirer/select';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { prettyPrintPerson } from './utils';
import { Person } from './reader';
import Tree, { Node } from './tree';
import { help, shouldExport, Command, TreeFunctions, Filetype } from './parse';

export default class Commander {
  data;

  constructor(data: Tree<Person>) {
    this.data = data;
  }

  async exec(cmd: Command, nonInteractive: boolean = false) {
    // If help, print and return
    if (cmd.fn === TreeFunctions.help) {
      console.log(help().print());
      return;
    }

    if (!cmd.name) return;

    const seiLookup = cmd.name.startsWith('l/') || cmd.name.startsWith('t/');

    const nodes = seiLookup ? this.lookup(cmd.name) : this.data.search(cmd.name);
    if (nodes.length === 0) {
      console.log(chalk.red(`No match for name ${cmd.name}`));
      return;
    }

    if (nonInteractive && nodes.length > 1) {
      console.log(chalk.red(`Must provide an exact match when using command mode. Provided: "${cmd.name}"`));
      return;
    }

    const node = nonInteractive ? nodes[0] : await this.disambiguate(nodes);

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

  lookup(sei: string) {
    const matches = sei.match(/^(\w)\/(.+?)::(.+?)\/$/);
    if (!matches) return [];

    const [, mode, name, dynamic] = matches;

    const exactMatches = this.data.search(name);
    const filtered = exactMatches.filter(n => {
      if (mode === 'l') {
        return n.data.location === dynamic;
      } else if (mode === 't') {
        return n.data.title === dynamic;
      }
      return false;
    });

    if (filtered.length > 1) {
      console.log(chalk.red(`Strong Enough Identifier "${sei}" wasn't strong enough! Matched ${filtered.length} people`));
    }

    return filtered;
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
        ...nodes.map(n => [n.id, n.parent?.id, n.data.name, n.data.title, n.data.location])
      ], { delimiter });
    }

    writeFileSync(name, str ?? '');
  }
}
