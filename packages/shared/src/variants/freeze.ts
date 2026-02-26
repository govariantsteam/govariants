import { CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { Variant } from "../variant";
import { Baduk, BadukBoard, BadukState, badukVariant, Color } from "./baduk";
import { isGridBadukConfig, NewBadukConfig } from "./baduk_utils";

export interface FreezeGoState extends BadukState {
  frozen: boolean;
}

const NORMAL_COLORS = { background: undefined, black: "black", white: "white" };
const FROZEN_COLORS = {
  background: "#5cdcdc",
  black: "#0f2240",
  white: "#dae4f2",
};

export class FreezeGo extends Baduk {
  private frozen = false;

  playMove(player: number, move: string) {
    const captures_before = this.captures[player as 0 | 1];
    super.playMove(player, move);
    const captures_after = this.captures[player as 0 | 1];

    if (this.frozen && captures_before !== captures_after) {
      throw new Error("Cannot capture after opponent ataris");
    }

    const opponent = player === 0 ? Color.WHITE : Color.BLACK;
    this.frozen = this.board
      .neighbors(this.decodeMove(move))
      .some(
        (pos) =>
          this.board.at(pos) === opponent && is_in_atari(pos, this.board),
      );
  }

  override exportState(): FreezeGoState {
    return { ...super.exportState(), frozen: this.frozen };
  }

  static uiTransform<ConfigT extends NewBadukConfig = NewBadukConfig>(
    config: ConfigT,
    state: FreezeGoState,
  ) {
    const mapIntersection = (color: Color) => {
      const theme = state.frozen ? FROZEN_COLORS : NORMAL_COLORS;
      switch (color) {
        case Color.EMPTY:
          return { colors: [] };
        case Color.BLACK:
          return { colors: [theme.black] };
        case Color.WHITE:
          return { colors: [theme.white] };
      }
    };

    const board = isGridBadukConfig(config)
      ? Grid.from2DArray(state.board).map(mapIntersection).to2DArray()
      : (state.board.at(0) ?? []).map(mapIntersection);

    return {
      config,
      gamestate: {
        board,
        backgroundColor: state.frozen
          ? FROZEN_COLORS.background
          : NORMAL_COLORS.background,
      },
    };
  }
}

function is_in_atari(pos: CoordinateLike, board: BadukBoard<Color>) {
  const group = getGroup(pos, board);
  const num_liberties = getOuterBorder(group, board).filter(
    (pos) => board.at(pos) === Color.EMPTY,
  ).length;
  return num_liberties === 1;
}

export const freezeGoVariant: Variant<NewBadukConfig, FreezeGoState> = {
  ...badukVariant,
  gameClass: FreezeGo,
  description: "Baduk but after an Atari, stones can't be captured",
  uiTransform: FreezeGo.uiTransform,
  movePreview: Baduk.movePreview<FreezeGoState>,
};
