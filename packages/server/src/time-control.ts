import { ObjectId } from "mongodb";
import {
  TimeControlType,
  ITimeControlBase,
  ITimeControlConfig,
  IConfigWithTimeControl,
} from "@ogfcommunity/variants-shared";
import { gamesCollection } from "./games";
import { AbstractGame, GameResponse } from "@ogfcommunity/variants-shared";

export function HasTimeControlConfig(game_config: unknown): game_config is IConfigWithTimeControl {
    return (game_config && typeof game_config == "object" && 'time_control' in game_config);
}

export function ValidateTimeControlConfig(time_control_config: unknown): time_control_config is ITimeControlConfig {
    return (time_control_config && typeof time_control_config === "object" && 'type' in time_control_config);
}

export function ValidateTimeControlBase(time_control: unknown): time_control is ITimeControlBase {
    return (
      time_control &&
      typeof time_control === "object" &&
      "moveTimestamps" in time_control &&
      "remainingMilliseconds" in time_control &&
      "onThePlaySince" in time_control
    );
}

// validation of the config should happen before this is called
export interface ITimeHandler {
    handleMove(game: GameResponse, game_obj: AbstractGame<unknown, unknown>, playerNr: number, move: string): Promise<void>;
    // ToDo: this interface will probably need more functions, like handle create game etc.
}

class TimeHandlerSequentialMoves implements ITimeHandler {
    async handleMove( game: GameResponse, game_obj: AbstractGame<unknown, unknown>, playerNr: number, move: string): Promise<void> {
        if (!HasTimeControlConfig(game.config)) {
            return;
        }

        switch (game.config.time_control.type) {
            case TimeControlType.Absolute: {
                if (!ValidateTimeControlBase(game.time_control))
                {
                    console.error(`game with id ${game.id} has invalid time control data`);
                    return;
                }
                const timeData = game.time_control;

                if (timeData.remainingMilliseconds[playerNr] === undefined)
                {
                    console.error(`game with id ${game.id} is missing player nr ${playerNr} in time control`);
                    return;
                }

                if (!game.players) {
                    console.log(`game with id ${game.id} has no players array`);
                    return;
                }

                const nextPlayers = game_obj.nextToPlay();

                if (!timeData.onThePlaySince[playerNr] || nextPlayers.some(player => timeData.onThePlaySince[player] === undefined)) {
                    console.error(`game with id ${game.id} has defect time control date`);
                    return;
                }

                const timestamp = new Date();
                timeData.moveTimestamps.push(timestamp);
                timeData.remainingMilliseconds[playerNr] -= ((timestamp.getMilliseconds()) - timeData.onThePlaySince[playerNr].getMilliseconds());
                timeData.onThePlaySince[playerNr] = null;
                nextPlayers.forEach(player => timeData.onThePlaySince[player] = timestamp);

                await gamesCollection()
                .updateOne({ _id: new ObjectId(game.id) }, { $set: { "time_control": timeData } })
                .catch(console.log);
                break;
            }

            case TimeControlType.Invalid:
                console.error("game with invalid time control type");
                return;
        }
    }
}

class TimeHandlerParallelMoves implements ITimeHandler {
    handleMove( game: GameResponse, game_obj: AbstractGame<unknown, unknown>, playerNr: number, move: string): Promise<void> {
        console.log("time control handler for parallel moves is not implemented yet");
        return;
    }
}

export const timeControlHandlerMap: {
    [variant: string]: new () => ITimeHandler;
  } = {
    baduk: TimeHandlerSequentialMoves,
    badukWithAbstractBoard: TimeHandlerSequentialMoves,
    phantom: TimeHandlerSequentialMoves,
    parallel: TimeHandlerParallelMoves,
    capture: TimeHandlerSequentialMoves,
  };
