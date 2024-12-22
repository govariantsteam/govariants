export const lighthouseRules = `
Introduction
------------
Lighthouse is a variant of Go / Baduk where players have partial information about the board position. Stones cast light rays that illuminate fields for their owner.

Partial Information
-------------------
Players see different parts of the true (hidden) board state. The visibility of fields and stones is different for each player.

Visibility
----------
Every stone illuminates fields for its owner in straight lines extending in all directions until meeting another stone.
- Illuminated fields display their true state (empty or black or white stone).
- Not illuminated fields display their last known information.

Last Known Information
----------------------
The last known information of a field is the state from the last time when the field was illuminated, or "empty" if the field was never illuminated before.

Revealing a field
-----------------
When a stone is placed on a field that is not illuminated, it is possible that this field is secretly occupied. In this case, the players move does not result in a stone placement, but the field gets revealed.

Revealing a field results in updating the last known information for this player.

Similarly when a chain gets captured, the owner can deduce that adjacent fields are occupied by the other color. To aid the player, the adjacent fields are revealed.

Ko and self capture
-------------------
A move is not allowed if it results in repeating a previous board position, and both times occurred during the same players turn.

Self capture is allowed.

Observer view
-------------
Observers can see a much smaller portion of the board. This is to avoid that players can gain information by looking at the observer view.
`;
