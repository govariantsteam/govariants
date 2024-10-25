export interface KoDetector {
  push(state: object): void;
}

export class SuperKoDetector<T extends object> implements KoDetector {
  seen = new Set<string>();

  push(state: T): void {
    const state_str = JSON.stringify(state);
    if (this.seen.has(state_str)) throw new KoError("state repeated");
    this.seen.add(state_str);
  }
}

export class KoError extends Error {
  name = "KoError";
}

export class NoKoRuleDetector implements KoDetector {
  push(_: object): void {}
}
