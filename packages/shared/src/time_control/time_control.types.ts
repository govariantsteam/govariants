export enum TimeControlType {
    Invalid = 0,
    Absolute = 1,
    Fischer = 2,
    // unlimited time is configured by config.time_control = undefined
}

export interface IWithConfig<TConfig> {
    config: TConfig;
}

export interface ITimeControlConfig {
    type: TimeControlType;
    mainTimeMS: number;
}

export interface IConfigWithTimeControl {
    time_control: ITimeControlConfig;
}

export interface ITimeControlBase {
    moveTimestamps: Date[];
    remainingTimeMS: {
        [player: number]: number;
    };
    onThePlaySince: {
        [player: number]: Date | null;
    };
}