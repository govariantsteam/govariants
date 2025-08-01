// Perhaps we can remove some of these functions if it becomes cumbersome to
// implement these functions every time.  For example, `forEach` can be replaced
// by map if we ignore the output
/**
 * Mutual interface for both grid and graph boards. Describes methods for interacting with the board in variants that support both board types.
 * @template K type of keys used to index fields
 * @template V type of values stored at fields
 */
export interface Fillable<K, V> {
  /**
   * access field value at index
   * @param index of the field
   * @returns the field value at index or undefined if index is out of bounds
   */
  at(index: K): V | undefined;
  /**
   * set field value at index
   * @param index of the field
   * @param val value to store
   */
  set(index: K, val: V): void;
  /**
   * Applies a callback function to every field value and returns a new fillable of the results.
   * @template V2 shape of the values of the new fillable
   * @param f callback function
   */
  map<V2>(f: (val: V) => V2): Fillable<K, V2>;
  /**
   * get indices of all neighbor fields (by adjacency)
   * @param index of the field
   * @returns an array of indices of neighbor fields
   */
  neighbors(index: K): K[];
  /**
   * check whether a key corresponds to a field
   * @param index the key to check
   * @returns true if a field exists that is indexed by index, otherwise false
   */
  isInBounds(index: K): boolean;
  /**
   * applies a callback function to every field value
   * @param f the callback function to apply
   */
  forEach(f: (value: V, index: K) => void): void;
  // It could be interesting to have this be some generic type that is
  // parameterized by V, but unfortunately it's not supported by TS
  // https://github.com/microsoft/TypeScript/issues/1213
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize(): unknown;
}

/**
 * Helper function to find a group starting at a field in a fillable. Adjacent fields are considered to be connected if their values are equal.
 * @param index of the field to start with
 * @param g the fillable to look into
 * @returns the array of indices of the group connected to start field
 */
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

/**
 * Sets a value at all fields connected to a start field.
 * @param value the value to store
 * @param index of the start field
 * @param g the fillable to mutate
 */
export function floodFill<K, V>(value: V, index: K, g: Fillable<K, V>): void {
  return getGroup(index, g).forEach((index) => g.set(index, value));
}

/**
 * Find fields that are outside of a set of fields, but adjacent to at least one of them.
 * @param group the set of field indices
 * @param graph the fillable to look into
 * @returns the set of indices of fields outside but adjacent to group
 */
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

/**
 * Find fields that are inside of a set of fields, but adjacent to at least one field outside.
 * @param group the set of field indices
 * @param graph the fillable to look into
 * @returns the set of indices of fields inside group that are adjacent to an outside field
 */
export function getInnerBorder<K, V>(group: K[], graph: Fillable<K, V>) {
  // true if index is in group
  const group_on_graph = graph.map(() => false);
  group.forEach((index) => group_on_graph.set(index, true));

  return group.filter((index) =>
    group_on_graph.neighbors(index).some((index) => !group_on_graph.at(index)),
  );
}

/**
 * Helper function for finding groups and liberties in fillables. Uses depth first search. Applies a callback function to determine wheter an adjacent field is considered connected to the group.
 * @param index of the field to start with
 * @param board the fillable to look into
 * @param groupIdentifier predicate that determines whether an adjacent field is connected
 * @param libertyIdentifier predicate that determines whether an adjacent field is a liberty
 * @returns an object containing the indices of fields in the group (members), fields adjacent to the group, and liberties.
 */
export function examineGroup<K, V>(input: {
  index: K;
  board: Fillable<K, V>;
  groupIdentifier: (v: V) => boolean;
  libertyIdentifier: (v: V) => boolean;
}): { members: K[]; adjacent: K[]; liberties: number } {
  const index = input.index;
  const board = input.board;
  const groupIdentifier = input.groupIdentifier;
  const libertyIdentifier = input.libertyIdentifier;

  const visited = board.map(() => false);
  const members: K[] = [];
  const adjacent: K[] = [];
  let liberties = 0;

  function searchHelper(index: K): void {
    if (visited.at(index)) {
      return;
    }

    const valueAtIndex = board.at(index);

    if (valueAtIndex === undefined) {
      // should not happen
      return;
    }

    visited.set(index, true);

    if (groupIdentifier(valueAtIndex)) {
      members.push(index);

      board.neighbors(index).forEach(searchHelper);
    } else {
      adjacent.push(index);

      if (libertyIdentifier(valueAtIndex)) {
        liberties++;
      }
    }
  }

  searchHelper(index);
  return { members: members, adjacent: adjacent, liberties: liberties };
}
