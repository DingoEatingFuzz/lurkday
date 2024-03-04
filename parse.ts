export enum TreeFunctions {
  help = 'help',
  tree = 'tree',
  directs = 'directs',
  chain = 'chain',
  peers = 'peers',
};

export interface ParseError {
  error: string;
  context: string;
};

export interface Command {
  fn: TreeFunctions;
  name?: string;
  exports: boolean;
  filename?: string;
  filetype?: string;
};

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
  let filename;
  let filetype;
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
    filetype = matches[2];

    if (!['csv', 'tsv', 'json', 'ndjson'].includes(filetype)) {
      return {
        error: 'Invalid export filetype',
        context: `Extension must be one of csv, tsv, json, or ndjson; received "${filetype}"`
      }
    }

    name = tokens.slice(1, tokens.length - 2).join(' ');
  } else {
    name = tokens.slice(1).join(' ');
  }

  return { fn, name, exports, filename, filetype };
}
