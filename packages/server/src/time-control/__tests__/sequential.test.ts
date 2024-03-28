import {
  BadukConfig,
  GameResponse,
  IConfigWithTimeControl,
  IFischerConfig,
  ITimeControlBase,
  TimeControlType,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { TestClock } from "../clock";
import { TimeHandlerSequentialMoves } from "../time-handler-sequential";
import { TestTimeoutService } from "../mocks/timeout-service.mock";

describe("Sequential Time Control Tests", () => {
  test("Capped Fischer", () => {
    const mainTimeMS = 60_000;
    const incrementMS = 5_000;
    const maxTimeMS = 61_000;
    const timeControlConfig: IFischerConfig = {
      type: TimeControlType.Fischer,
      mainTimeMS: mainTimeMS,
      incrementMS: incrementMS,
      maxTimeMS: maxTimeMS,
    };

    const variant = "baduk";
    const config: BadukConfig & IConfigWithTimeControl = {
      komi: 0,
      height: 9,
      width: 9,
      time_control: timeControlConfig,
    };
    const game = makeGameObject(variant, config);

    const start = new Date(0, 0);
    const clock = new TestClock(start);

    const gameResponse: GameResponse = {
      id: "",
      config: config,
      moves: [],
      variant: variant,
      players: [{ id: "" }, { id: "" }],
      time_control: new TimeHandlerSequentialMoves(
        clock,
        new TestTimeoutService(),
      ).initialState(variant, config),
    };

    const mockPlayMove = (
      player: number,
      move: string,
      seconds: number,
    ): ITimeControlBase => {
      clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds));
      gameResponse.moves.push({ [player]: move });
      game.playMove(player, move);
      return new TimeHandlerSequentialMoves(
        clock,
        new TestTimeoutService(),
      ).handleMove(gameResponse, game, player, move);
    };

    const seconds1 = 10;
    gameResponse.time_control = mockPlayMove(0, "aa", seconds1);
    const time1 = gameResponse.time_control.forPlayer[0].remainingTimeMS;

    const seconds2 = 20;
    gameResponse.time_control = mockPlayMove(1, "bb", seconds2);
    const time2 = gameResponse.time_control.forPlayer[1].remainingTimeMS;

    // time control should start here

    const seconds3 = 24;
    gameResponse.time_control = mockPlayMove(0, "cc", seconds3);
    const time3 = gameResponse.time_control.forPlayer[0].remainingTimeMS;

    const seconds4 = 30;
    gameResponse.time_control = mockPlayMove(1, "dd", seconds4);
    const time4 = gameResponse.time_control.forPlayer[1].remainingTimeMS;

    const seconds5 = 40;
    clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds5));
    const time5 = new TimeHandlerSequentialMoves(
      clock,
      new TestTimeoutService(),
    ).getMsUntilTimeout(gameResponse, 0);

    // assertions

    expect(time1).toEqual(mainTimeMS);
    expect(time2).toEqual(mainTimeMS);
    expect(time3).toEqual(
      Math.min(maxTimeMS, time1 + incrementMS - (seconds3 - seconds2) * 1000),
    );
    expect(time4).toEqual(
      Math.min(maxTimeMS, time2 + incrementMS - (seconds4 - seconds3) * 1000),
    );
    expect(time5).toEqual(time3 - (seconds5 - seconds4) * 1000);
  });
});
