import chalk from 'chalk';
import { EOL } from 'os';

export enum TreeFunctions {
  help = 'help',
  tree = 'tree',
  directs = 'directs',
  chain = 'chain',
  peers = 'peers',
};

export enum Filetype {
  csv = 'csv',
  tsv = 'tsv',
  json = 'json',
  ndjson = 'ndjson',
}

export interface ParseError {
  error: string;
  context: string;
};

export interface Command {
  fn: TreeFunctions;
  name?: string;
  exports: boolean;
  filename?: string;
  filetype?: Filetype;
};

export interface ExportCommand {
  fn: TreeFunctions;
  name?: string;
  exports: boolean;
  filename: string;
  filetype: Filetype;
}

export function help() {
  const functions = {
    [TreeFunctions.help]:    [ 'help', 'Print this message' ],
    [TreeFunctions.tree]:    [ 'tree {name}', 'Get the full reporting tree from {name} downward' ],
    [TreeFunctions.directs]: [ 'directs {name}', 'Get the people who report direcly to {name}' ],
    [TreeFunctions.chain]:   [ 'chain {name}', 'Get the full management chain for {name}' ],
    [TreeFunctions.peers]:   [ 'peers {name}', "Get everyone who also reports to {name}'s boss" ],
  }

  const exporting = `All commands can be exported via ${chalk.yellow('[command] > filename.ext')}`;

  return {
    functions,
    exporting,
    print() {
      const sb = [];
      Object.entries(this.functions).forEach(([key, val]) => {
        sb.push(`${key}: ${chalk.yellow(val[0])}${EOL}  ${val[1]}`);
      });
      sb.push(this.exporting);
      sb.push('Available export formats:' + EOL + chalk.yellow(Object.values(Filetype).map(t => `  .${t}`).join(EOL)));
      return sb.join(EOL + EOL);
    }
  }
}

export function shouldExport(cmd: Command): cmd is ExportCommand {
  return cmd.exports;
}

export function parse(str: string): Command | ParseError {
  const tokens = str.split(' ');
  if (!tokens.length) {
    return {
      error: 'No command found',
      context: `Expected at least one token`
    };
  }

  const fnstr = tokens[0];
  const fn: TreeFunctions = TreeFunctions[fnstr as keyof typeof TreeFunctions];

  if (!fn) {
    return {
      error: 'Nonexistent function.',
      context: `Function received was "${fnstr}", available functions are ${Object.values(TreeFunctions).join(', ')}.`
    }
  }

  if (fn === TreeFunctions.help) return { fn, exports: false };

  if (!tokens[1]) {
    return {
      error: 'Invalid command.',
      context: `Only "help" takes no arguments, function was "${fn}"`
    }
  }

  let exports = false;
  let filetype: Filetype | undefined = undefined;
  let filename;
  let name;

  const [peekName, peekExport] = tokens.slice().reverse().slice(0, 2);
  if (peekExport === '>') {
    exports = true;
    const matches = peekName.match(/(.+)\.(.+)$/);

    if (!matches) {
      return {
        error: 'Invalid export filename',
        context: `Filename must include extension, received "${peekName}"`
      }
    }

    filename = matches[0];
    filetype = Filetype[matches[2] as keyof typeof Filetype];

    if (!filetype) {
      return {
        error: 'Invalid export filetype',
        context: `Extension received was "${filetype}", available formats are ${Object.keys(Filetype).join(', ')}`
      }
    }

    name = tokens.slice(1, tokens.length - 2).join(' ');
  } else {
    name = tokens.slice(1).join(' ');
  }

  return { fn, name, exports, filename, filetype };
}
