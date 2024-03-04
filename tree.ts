import { EOL } from 'os';
import Fuse from 'fuse.js';

type NodeData = {
  id: string;
  parent?: string;
}

function limitList(list: unknown[], fmt: (v: any) => string) {
  let str = EOL + list.slice(0, 20).map(v => `  ${fmt(v)}`).join(EOL);
  if (list.length > 20) {
    str += `${EOL}  ...and ${list.length - 20} more`
  }
  return str;
}

export default class Tree<T extends NodeData> {
  nodes: Node<T>[];
  lookup: Record<string, Node<T>>;
  root;
  childrenOf: Record<string, Node<T>[]> = {};
  index: Record<string, Node<T>[]> = {};
  searchProp: keyof T;
  private fuse;

  constructor(arr: T[], searchProp: keyof T) {
    this.searchProp = searchProp;
    this.nodes = arr.map((n) => new Node(n.id, n));
    this.lookup = this.nodes.reduce((hash: Record<string, Node<T>>, node: Node<T>) => {
      hash[node.id] = node;
      return hash;
    }, {});

    this.index = this.nodes.reduce((hash: Record<string, Node<T>[]>, node: Node<T>) => {
      const key = node.data[this.searchProp]?.toString();
      if (key) {
        hash[key] = hash[key] ?? [];
        hash[key].push(node);
      }
      return hash;
    }, {})

    this.nodes.forEach((n) => {
      if (!n.data.parent) return;
      n.parent = this.lookup[n.data.parent];
      if (!n.parent) return;
      this.childrenOf[n.parent.id] = this.childrenOf[n.parent.id] ?? [];
      this.childrenOf[n.parent.id].push(n);
    });

    const roots = this.nodes.filter((n) => n.parent == null);

    if (roots.length > 1)
      throw new Error(
        `Cannot construct tree from collection with multiple roots: ${limitList(roots, (r: Node<T>) => `${r.id}`)}`
      );
    if (roots.length === 0)
      throw new Error(`Cannot construct tree from collection with no root`);

    const cycles = this.nodes
      .map((n) => n.detectCycle())
      .filter((c) => c != null);
    if (cycles.length)
      throw new Error(
        `Cannot construct tree from collection with cycles: \n\n${limitList(cycles, (c: Node<T>[]) => c?.toString() ?? '')}`,
      );

    this.root = roots[0];

    this.nodes.forEach((n) => {
      n.children = this.childrenOf[n.id] ?? [];
    });

    this.fuse = new Fuse(this.nodes, {
      keys: [`data.${String(this.searchProp)}`],
      threshold: 0.4
    });
  }

  size() {
    return this.root.size();
  }

  search(term: string = ''): Node<T>[] {
    // First look for exact matches
    const exactMatches = this.index[term];
    if (exactMatches?.length) return exactMatches;

    // Then fuzzy-find
    const res = this.fuse.search(term);
    return res.slice(0, 10).map(r => r.item);
  }
}

export class Node<T extends NodeData> {
  id: string;
  data: T;
  parent?: Node<T>;
  children:  Node<T>[] = [];

  constructor(id:string, data: T) {
    this.id = id;
    this.data = data;
  }

  detectCycle() {
    const marks: Record<string, boolean> = {};
    const chain: Node<T>[] = [];

    let cur:Node<T> = this;
    while (cur.parent) {
      marks[cur.id] = true;
      chain.push(cur);
      cur = cur.parent;
      if (marks[cur.id]) return chain;
    }

    return null;
  }

  *breadthFirst() {
    let queue: Node<T>[] = [this];
    while (queue.length) {
      const node = queue.shift();
      yield node;
      if (node) queue.push(...node.children);
    }
  }

  *depthFirst() {
    let queue: Node<T>[] = [this];
    while (queue.length) {
      const node = queue.pop();
      yield node;
      if (node) queue.push(...node.children);
    }
  }

  *parents() {
    let cur: Node<T> | undefined = this;

    while (cur) {
      yield cur;
      cur = cur.parent;
    }
  }

  find(idOrPredicate:(string | ((n?: Node<T>) => boolean))): Node<T> | null {
    const predicate =
      typeof idOrPredicate === "string" ? (n?: Node<T>) => n?.id : idOrPredicate;

    const gen = this.breadthFirst();
    for (const n of gen) {
      if (predicate(n) && n) return n;
    }

    return null;
  }

  findAll(idOrPredicate:(string | ((n?: Node<T>) => boolean))): Node<T>[] {
    const nodes: Node<T>[] = [];
    const predicate =
      typeof idOrPredicate === "string" ? (n?: Node<T>) => n?.id : idOrPredicate;

    const gen = this.breadthFirst();
    for (const n of gen) {
      if (predicate(n) && n) nodes.push(n);
    }

    return nodes;
  }

  size() {
    return Array.from(this.breadthFirst()).length;
  }

  print(fmt?: (n: Node<T>) => string, indent = 0) {
    const fmtr = fmt ?? ((n) => n.id);
    console.log(" ".repeat(indent * 2) + fmtr(this));
    this.children.forEach((c) => c.print(fmtr, indent + 1));
  }

  serialize(): T {
    return this.data;
  }
}

