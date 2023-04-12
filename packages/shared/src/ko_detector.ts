export class SuperKoDetector<T> {
  seen = new Set<string>();

  push(state: T): void {
    const state_str = JSON.stringify(state);
    if (this.seen.has(state_str)) throw new KoError();
    this.seen.add(state_str);
  }
}

export class KoError extends Error {
  name = "KoError";
}
