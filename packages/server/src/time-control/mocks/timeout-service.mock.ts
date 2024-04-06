import { ITimeoutService } from "../timeout";

export class TestTimeoutService implements ITimeoutService {
  // ITimeoutService implementation
  clearGameTimeouts(gameId: string): void {
    delete this.scheduledTimeouts[gameId];
  }
  clearPlayerTimeout(gameId: string, playerNr: number): void {
    if (this.scheduledTimeouts[gameId])
      delete this.scheduledTimeouts[gameId][playerNr];
  }
  scheduleTimeout(gameId: string, playerNr: number, inTimeMs: number): void {
    if (!this.scheduledTimeouts[gameId]) {
      this.scheduledTimeouts[gameId] = {};
    }

    this.scheduledTimeouts[gameId][playerNr] = inTimeMs;
  }

  // test utils
  public getTimeoutTime(gameId: string, playerNr: number) {
    return this.scheduledTimeouts[gameId]?.[playerNr];
  }

  private scheduledTimeouts: Record<string, Record<string, number>> = {};
}
