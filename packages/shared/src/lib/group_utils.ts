// Perhaps we can remove some of these functions if it becomes cumbersome to
// implement these functions every time.  For example, `forEach` can be replaced
// by map if we ignore the output
export interface Fillable<K, V> {
  at(index: K): V | undefined;
  set(index: K, val: V): void;
  map<V2>(f: (val: V) => V2): Fillable<K, V2>;
  neighbors(index: K): K[];
  isInBounds(index: K): boolean;
  forEach(f: (value: V, index: K) => void): void;
}

export function getGroup<K, V>(index: K, g: Fillable<K, V>): K[] {
  if (!g.isInBounds(index)) {
    return [];
  }

  const ret: K[] = [];

  // The type assertion (as V) is regrettable, but I can't think
  // of a better way to satisfy the strict null checks
  // At any rate, calling floodDo on an out-of-bounds index should be a no-op
  const starting_value = g.at(index) as V;
  const visited = g.map(() => false);

  function helper(index: K) {
    if (g.at(index) !== starting_value || visited.at(index)) {
      return;
    }
    visited.set(index, true);
    ret.push(index);
    g.neighbors(index).forEach(helper);
  }
  helper(index);

  return ret;
}

export function floodFill<K, V>(value: V, index: K, g: Fillable<K, V>) {
  return getGroup(index, g).forEach((index) => g.set(index, value));
}

export function getOuterBorder<K, V>(group: K[], graph: Fillable<K, V>) {
  // true if index is in group
  const group_on_graph = graph.map(() => false);
  // mark "expanded" group on graph
  group.forEach((index) =>
    graph.neighbors(index).forEach((index) => group_on_graph.set(index, true)),
  );
  // unmark group
  group.forEach((index) => group_on_graph.set(index, false));

  const ret: K[] = [];
  group_on_graph.forEach((is_outer_border, index) => {
    if (is_outer_border) {
      ret.push(index);
    }
  });

  return ret;
}

export function getInnerBorder<K, V>(group: K[], graph: Fillable<K, V>) {
  // true if index is in group
  const group_on_graph = graph.map(() => false);
  group.forEach((index) => group_on_graph.set(index, true));

  return group.filter((index) =>
    group_on_graph.neighbors(index).some((index) => !group_on_graph.at(index)),
  );
}
