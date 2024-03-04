import { createHash } from 'crypto';
import chalk from 'chalk';
import { Node } from './tree';
import { Person } from './reader';

const nformatter = new Intl.NumberFormat();

export const err = (message: string): void => {
  console.log(chalk.red(message));
  process.exit();
}

export const checksum = (digest: string): string => {
  return createHash('sha256')
    .update(digest)
    .digest()
    .toString('hex')
}

export const nfmt = (num: number): string => nformatter.format(num);

export const prettyPrintPerson = (n: Node<Person>): string => {
  const allReports = [...n.breadthFirst()].length - 1;
  const isMgrMgr = allReports > n.children.length;
  const isManager = n.children.length > 0 && !isMgrMgr;
  const title = chalk.blue(n.data.title);
  const loc = chalk.green(n.data.location);
  const parts = [
    n.data.name,
    isManager ? chalk.yellow(`(${allReports} directs)`) : '',
    isMgrMgr ? chalk.yellow(`(${n.children.length} directs, ${allReports} total)`) : '',
    title,
    loc
  ]
  return parts.filter(p => p).join(' ');
}
