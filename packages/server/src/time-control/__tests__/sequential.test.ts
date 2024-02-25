import {
  BadukConfig,
  GameResponse,
  IConfigWithTimeControl,
  IFischerConfig,
  TimeControlType,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { TestClock } from "../clock";
import { TimeHandlerSequentialMoves } from "../time-handler-sequential";
import { TestTimeoutService } from "../timeout";

test("Sequential Moves Time Handler Test", () => {
  const mainTimeMS = 60_000;
  const incrementMS = 5_000;
  const maxTimeMS = 61_000;
  var timeControlConfig: IFischerConfig = {
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
  const timeoutService = new TestTimeoutService();
  const handler = new TimeHandlerSequentialMoves(clock, timeoutService);

  let timeControl = handler.initialState(variant, config);
  const gameResponse: GameResponse = {
    id: "",
    config: config,
    moves: [],
    variant: variant,
    players: [{ id: "" }, { id: "" }],
    time_control: timeControl,
  };

  const seconds1 = 10;
  clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds1));
  timeControl = handler.handleMove(gameResponse, game, 0);
  const time1 = timeControl.forPlayer[0].remainingTimeMS;

  const seconds2 = 20;
  clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds2));
  timeControl = handler.handleMove(gameResponse, game, 1);
  const time2 = timeControl.forPlayer[1].remainingTimeMS;

  // time control should start here

  const seconds3 = 24;
  clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds3));
  timeControl = handler.handleMove(gameResponse, game, 0);
  const time3 = timeControl.forPlayer[0].remainingTimeMS;

  const seconds4 = 30;
  clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds4));
  timeControl = handler.handleMove(gameResponse, game, 1);
  const time4 = timeControl.forPlayer[1].remainingTimeMS;

  const seconds5 = 40;
  gameResponse.time_control = timeControl;
  clock.setTimestamp(new Date(0, 0, 0, 0, 0, seconds5));
  const time5 = handler.getMsUntilTimeout(gameResponse, 1);

  // assertions

  expect(time1).toEqual(mainTimeMS);
  expect(time2).toEqual(mainTimeMS);
  expect(time3).toEqual(
    Math.min(
      maxTimeMS,
      mainTimeMS + incrementMS - (seconds3 - seconds2) * 1000,
    ),
  );
  expect(time4).toEqual(
    Math.min(
      maxTimeMS,
      mainTimeMS + incrementMS - (seconds4 - seconds3) * 1000,
    ),
  );
  expect(time5).toEqual(time3 - (seconds5 - seconds4));
});
