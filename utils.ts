import { createHash } from 'crypto';
import chalk from 'chalk';

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
