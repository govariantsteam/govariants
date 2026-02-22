export const parallel_rules = `
Parallel is a multiplayer variant of Go where moves are played *in parallel*. During a round, all players submit a move. Only when all players have submitted are the moves revealed, and the next round starts.

# Collision handling

When two or more players submit a move at the same position, a *collision* occurs. There are different ways to handle a collision that can be configured at the game start.
- Merge - A multicolored stone is placed, with the combined colors of the colliding players. For rules on multicolored stones, please refer to [https://www.govariants.com/variants/fractional/rules](https://www.govariants.com/variants/fractional/rules) or [https://www.govariants.com/variants/sfractional/rules](https://www.govariants.com/variants/sfractional/rules).
- Pass - No stone is placed at the place of collision.
- Ko - A temporary neutral stone occupies the place of collision for one round.
`;
