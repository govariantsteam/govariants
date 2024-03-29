export enum TimeControlType {
  Invalid = 0,
  Absolute = 1,
  Fischer = 2,
  Simple = 3,
  ByoYomi = 4,
  Canadian = 5,
  // unlimited time is configured by config.time_control = undefined
}

export interface ITimeControlConfig {
  type: TimeControlType;
  mainTimeMS: number;
}
export interface IFischerConfig extends ITimeControlConfig {
  type: TimeControlType.Fischer;
  incrementMS: number;
  maxTimeMS: number | null;
}

export interface IConfigWithTimeControl {
  time_control: ITimeControlConfig;
}

export interface IPerPlayerTimeControlBase {
  remainingTimeMS: number;
  onThePlaySince: Date | null;
}
export type PerPlayerTimeControlParallel = IPerPlayerTimeControlBase & {
  stagedMoveAt: Date | null;
};

export interface GenericTimeControl<TPerPlayer> {
  moveTimestamps: Date[];
  forPlayer: {
    [player: number]: TPerPlayer;
  };
}

export interface ITimeControlBase
  extends GenericTimeControl<IPerPlayerTimeControlBase> {}
export type TimeControlParallel =
  GenericTimeControl<PerPlayerTimeControlParallel>;
