import { AbstractGame } from "../abstract_game";
import { rengoRulesDescription } from "../templates/rengo_rules";
import { Variant } from "../variant";
import { getPlayerColors, makeGameObject } from "../variant_map";
import { Baduk } from "./baduk";

export type IHigherOrderConfig = {
  subVariant: string;
  subVariantConfig: object;
};

export type RengoConfig = IHigherOrderConfig & {
  teamSize: number;
};

export class Rengo<TSubstate extends object> extends AbstractGame<
  RengoConfig,
  TSubstate
> {
  private _subGame: AbstractGame<object, TSubstate>;
  private movesByTeam: number[];
  private hasTeamPlayedThisRound: boolean[];

  constructor(config: RengoConfig) {
    super(config);
    this._subGame = makeGameObject(
      config.subVariant,
      config.subVariantConfig,
    ) as AbstractGame<object, TSubstate>;
    this.movesByTeam = new Array(this._subGame.numPlayers()).fill(0);
    this.hasTeamPlayedThisRound = new Array(this._subGame.numPlayers()).fill(
      false,
    );
  }

  numPlayers(): number {
    return this.config.teamSize * this._subGame.numPlayers();
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
          team * this.config.teamSize +
          (this.movesByTeam[team] % this.config.teamSize),
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
    return Math.trunc(player / this.config.teamSize);
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

export const rengoVariant: Variant<RengoConfig, object> = {
  gameClass: Rengo,
  defaultConfig: () => ({
    subVariant: "baduk",
    subVariantConfig: Baduk.defaultConfig(),
    teamSize: 2,
  }),
  time_handling: "parallel",
  description: "Team game where moves cycle through all team members.",
  rulesDescription: rengoRulesDescription,
  getPlayerColors: (config: RengoConfig, playerNr: number) =>
    getPlayerColors(
      config.subVariant,
      config.subVariantConfig,
      Math.trunc(playerNr / config.teamSize),
    ),
};
