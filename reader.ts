import * as fs from 'fs';
import { EOL } from 'os';
import xlsx from 'node-xlsx';
import { err, checksum } from './utils';
import Tree from './tree';

export interface Person {
  id: string;
  name: string;
  parent: string;
  title: string;
  location?: string;
};

export default function reader(file: string, useCache: boolean = true): Tree<Person> | undefined {
  if (!fs.existsSync(file)) err('xlsx file not found');

  const buffer = fs.readFileSync(file);
  const sha = checksum(buffer.toString());

  let records: Person[];

  if (useCache && fs.existsSync(`.${sha}.ndjson`)) {
    records = fs.readFileSync(`.${sha}.ndjson`).toString().split(EOL).map(r => JSON.parse(r));
  } else {
    const workSheetsFromBuffer = xlsx.parse(buffer);
    const sheet = workSheetsFromBuffer[0];
    if (!sheet) err('xlsx file contained no sheets');

    const [_, ...rows] = sheet.data;
    records = rows.map(([id, name, parent, title, location]) => ({
      id, name, parent, title, location
    }));

    if (useCache) fs.writeFileSync(`.${sha}.ndjson`, records.map(r => JSON.stringify(r)).join(EOL));
  }

  return makeTree(records);
}

function makeTree(records: Person[]): Tree<Person> | undefined {
  try {
    return new Tree<Person>(records, 'name');
  } catch (e) {
    err((e as Error).message);
  }
}
