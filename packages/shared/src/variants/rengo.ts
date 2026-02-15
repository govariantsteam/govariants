import { AbstractGame } from "../abstract_game";
import { sum } from "../lib/utils";
import { rengoRulesDescription } from "../templates/rengo_rules";
import { Variant } from "../variant";
import {
  getMovePreview,
  getPlayerColors,
  makeGameObject,
} from "../variant_map";
import { Baduk } from "./baduk";

export type IHigherOrderConfig = {
  subVariant: string;
  subVariantConfig: object;
};

export type RengoConfig = IHigherOrderConfig & {
  teamSizes: number[];
};

export class Rengo<TSubstate extends object> extends AbstractGame<
  RengoConfig,
  TSubstate
> {
  private _subGame: AbstractGame<object, TSubstate>;
  private movesByTeam: number[];
  private hasTeamPlayedThisRound: boolean[];
  private teamStartIndices: readonly number[];

  constructor(config: RengoConfig) {
    if (config.teamSizes.some((size) => !Number.isFinite(size) || size < 1)) {
      throw new Error(`invalid rengo config`);
    }
    super(config);
    this._subGame = makeGameObject(
      config.subVariant,
      config.subVariantConfig,
    ) as AbstractGame<object, TSubstate>;
    if (config.teamSizes.length !== this._subGame.numPlayers()) {
      throw new Error("Incorrect number of configured teams.");
    }
    this.movesByTeam = new Array(this._subGame.numPlayers()).fill(0);
    this.hasTeamPlayedThisRound = new Array(this._subGame.numPlayers()).fill(
      false,
    );
    this.teamStartIndices = this.initTeamStartIndices();
  }

  private initTeamStartIndices(): number[] {
    const result = [];
    let pos = 0;
    for (let i = 0; i < this._subGame.numPlayers(); i++) {
      result.push(pos);
      pos += this.config.teamSizes[i];
    }
    return result;
  }

  numPlayers(): number {
    return sum(this.config.teamSizes);
  }
  exportState(player?: number): TSubstate {
    if (!player) {
      return this._subGame.exportState(player);
    }
    return this._subGame.exportState(this.getTeamOfPlayer(player));
  }
  nextToPlay() {
    return this._subGame
      .nextToPlay()
      .map(
        (team) =>
          this.teamStartIndices[team] +
          (this.movesByTeam[team] % this.config.teamSizes[team]),
      );
  }
  playMove(player: number, move: string): void {
    if (!this.nextToPlay().includes(player)) {
      throw new Error(`not turn of player ${player}`);
    }
    const roundBefore = this._subGame.round;

    this._subGame.playMove(this.getTeamOfPlayer(player), move);
    this.hasTeamPlayedThisRound[this.getTeamOfPlayer(player)] = true;

    this.syncInternals();
    if (roundBefore !== this._subGame.round) {
      this.prepareForNextRound();
    }
  }

  specialMoves(): { [key: string]: string } {
    return this._subGame.specialMoves();
  }

  private getTeamOfPlayer(player: number): number {
    return getTeamOfPlayer(player, this.config);
  }
  private prepareForNextRound(): void {
    this.hasTeamPlayedThisRound.forEach((has, index) => {
      if (has) this.movesByTeam[index]++;
    });
    this.hasTeamPlayedThisRound.fill(false);
    this.increaseRound();
  }
  private syncInternals(): void {
    this.result = this._subGame.result;
    this.phase = this._subGame.phase;
  }
}

function getTeamOfPlayer(player: number, config: RengoConfig): number {
  let pos = 0;
  for (let i = 0; i < config.teamSizes.length; i++) {
    if (player < pos) return i - 1;
    pos += config.teamSizes[i];
  }
  return config.teamSizes.length - 1;
}

export const rengoVariant: Variant<RengoConfig, object> = {
  gameClass: Rengo,
  defaultConfig: () => ({
    subVariant: "baduk",
    subVariantConfig: Baduk.defaultConfig(),
    teamSizes: [2, 2],
  }),
  time_handling: "parallel",
  description: "Team game where moves cycle through all team members.",
  rulesDescription: rengoRulesDescription,
  getPlayerColors: (config: RengoConfig, playerNr: number) =>
    getPlayerColors(
      config.subVariant,
      config.subVariantConfig,
      getTeamOfPlayer(playerNr, config),
    ),
  movePreview: (config, state, move, player) =>
    getMovePreview(
      config.subVariant,
      config.subVariantConfig,
      state,
      move,
      getTeamOfPlayer(player, config),
    ),
};
