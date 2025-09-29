export const Notifications = {
  gameEnd: 1,
  newRound: 2,
  myMove: 3,
  seatChange: 4,
} as const;

export type NotificationType =
  (typeof Notifications)[keyof typeof Notifications];

export type GameSubscriptions = {
  [userId: string]: NotificationType[];
};
