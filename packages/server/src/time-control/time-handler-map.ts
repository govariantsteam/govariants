import { ITimeHandler } from "./time-control";
import { TimeHandlerSequentialMoves } from "./time-handler-sequential";
import { TimeHandlerParallelMoves } from "./time-handler-parallel";
import { ITimeoutService } from "./timeout";
import { IClock } from "./clock";

export const timeControlHandlerMap: {
  [variant: string]: new (
    clock: IClock,
    timeoutService: ITimeoutService,
  ) => ITimeHandler;
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
  quantum: TimeHandlerSequentialMoves,
  sfractional: TimeHandlerSequentialMoves,
};
