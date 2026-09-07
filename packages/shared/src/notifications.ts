import { GameNotification, Notifications } from "./notifications.types";

/**
 * Short heading for a notification, used as the title of a push notification.
 */
export function renderNotificationTitle(
  notification: GameNotification,
): string {
  switch (notification.type) {
    case Notifications.gameEnd: {
      return "Game over";
    }
    case Notifications.myMove: {
      return "Your move";
    }
    case Notifications.newRound: {
      return "New round";
    }
    case Notifications.seatChange: {
      return "Seat change";
    }
  }
}

/**
 * Human-readable text for a notification.
 *
 * This lives in shared because the same sentence is rendered in two places:
 * the notifications page in the browser, and the push payload the server
 * builds. Keeping one implementation keeps the two from drifting apart.
 */
export function renderNotification(notification: GameNotification): string {
  switch (notification.type) {
    case Notifications.gameEnd: {
      return `Game has ended with result ${notification.params.result}.`;
    }
    case Notifications.myMove: {
      return `It's your move in round ${notification.params.round}.`;
    }
    case Notifications.newRound: {
      return `Round ${notification.params.round} has started.`;
    }
    case Notifications.seatChange: {
      return `${notification.params.user} has ${
        notification.params.didTakeSeat ? "taken" : "left"
      } seat ${notification.params.seat}.`;
    }
  }
}
