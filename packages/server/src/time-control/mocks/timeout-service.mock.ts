import { ITimeoutService } from "../timeout";

export class TestTimeoutService implements ITimeoutService {
  clearGameTimeouts(_gameId: string): void {}
  clearPlayerTimeout(_gameId: string, _playerNr: number): void {}
  scheduleTimeout(
    _gameId: string,
    _playerNr: number,
    _inTimeMs: number,
  ): void {}
}
