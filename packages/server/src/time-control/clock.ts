export interface IClock {
  getTimestamp(): Date;
}

export class Clock implements IClock {
  getTimestamp(): Date {
    return new Date();
  }
}

export class TestClock implements IClock {
  private _time: Date;

  constructor(time: Date) {
    this._time = new Date(time);
  }

  setTimestamp(time: Date): void {
    this._time = new Date(time);
  }

  getTimestamp(): Date {
    return new Date(this._time);
  }
}
