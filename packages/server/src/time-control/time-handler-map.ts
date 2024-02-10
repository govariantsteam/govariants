import { ITimeHandler } from "./time-control";
import { TimeHandlerSequentialMoves } from "./time-handler-sequential";
import { TimeHandlerParallelMoves } from "./time-handler-parallel";

export const timeControlHandlerMap: {
  [variant: string]: new () => ITimeHandler;
} = {
  baduk: TimeHandlerSequentialMoves,
  badukWithAbstractBoard: TimeHandlerSequentialMoves,
  phantom: TimeHandlerSequentialMoves,
  parallel: TimeHandlerParallelMoves,
  capture: TimeHandlerSequentialMoves,
  chess: TimeHandlerSequentialMoves,
  tetris: TimeHandlerSequentialMoves,
  pyramid: TimeHandlerSequentialMoves,
  "thue-morse": TimeHandlerSequentialMoves,
  freeze: TimeHandlerSequentialMoves,
  keima: TimeHandlerSequentialMoves,
  "one color": TimeHandlerSequentialMoves,
  drift: TimeHandlerSequentialMoves,
};
