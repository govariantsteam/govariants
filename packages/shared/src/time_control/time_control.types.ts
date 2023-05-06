export enum TimeControlType {
    Invalid = 0,
    Absolute = 1,
    // unlimited time is configured by config.time_control = undefined
}

export interface ITimeControlConfig {
    type: TimeControlType;
}

export interface IConfigWithTimeControl {
    time_control: ITimeControlConfig;
}

export interface ITimeControlBase {
    moveTimestamps: Date[];
    remainingMilliseconds: {
        [player: number]: number;
    };
    onThePlaySince: {
        [player: number]: Date | null;
    };
}