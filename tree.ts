export default class Tree {
  nodes;
  lookup;
  root;
  childrenOf = {};

  constructor(arr) {
    this.nodes = arr.map((n) => new Node(n.id, n));
    this.lookup = this.nodes.reduce((hash, node) => {
      hash[node.id] = node;
      return hash;
    }, {});

    this.nodes.forEach((n) => {
      n.parent = this.lookup[n.data.boss];
      if (!n.parent) return;
      this.childrenOf[n.parent.id] = this.childrenOf[n.parent.id] ?? [];
      this.childrenOf[n.parent.id].push(n);
    });

    const roots = this.nodes.filter((n) => n.parent == null);

    if (roots.length > 1)
      throw new Error(
        `Cannot construct tree from collection with multiple roots: ${roots.map(
          (r) => r.id,
        )}`,
      );
    if (roots.length === 0)
      throw new Error(`Cannot construct tree from collection with no root`);

    const cycles = this.nodes
      .map((n) => n.detectCycle())
      .filter((c) => c != null);
    if (cycles.length)
      throw new Error(
        `Cannot construct tree from collection with cycles: \n\n${cycles
          .map((c) => c.toString())
          .join("\n")}`,
      );

    this.root = roots[0];

    this.nodes.forEach((n) => {
      n.children = this.childrenOf[n.id] ?? [];
    });
  }
}

class Node {
  id;
  data;
  parent = null;
  children = [];

  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  detectCycle() {
    const marks = {};
    const chain = [];

    let cur = this;
    while (cur.parent) {
      marks[cur.id] = true;
      chain.push(cur);
      cur = cur.parent;
      if (marks[cur]) return chain;
    }

    return null;
  }

  *breadthFirst() {
    let queue = [this];
    while (queue.length) {
      const node = queue.shift();
      yield node;
      queue.push(...node.children);
    }
  }

  *depthFirst() {
    let queue = [this];
    while (queue.length) {
      const node = queue.pop();
      yield node;
      queue.push(...node.children);
    }
  }

  find(idOrPredicate) {
    const predicate =
      typeof idOrPredicate === "string" ? (n) => n.id : idOrPredicate;

    const gen = this.breadthFirst();
    for (const n of gen) {
      if (predicate(n)) return n;
    }
  }

  print(fmt, indent = 0) {
    const fmtr = fmt ?? ((n) => n.id);
    console.log(" ".repeat(indent * 2) + fmtr(this));
    this.children.forEach((c) => c.print(fmtr, indent + 1));
  }
}

