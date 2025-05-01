export const pyramidRuleDescription = `
# Introduction
Pyramid is a variant of Go/Baduk with modified point values. Every intersection has an individual point value, and the score is equal to the sum of point values of intersections in the area that a player controls.
# Pyramid Point Values
The point value of an intersection is equal to one plus the minimum distance to a board edge. The points that are close to the board center are worth significantly more.
# Scoring
For the automated scoring to be correct, all dead stones need to be captured manually.
# Credit
[https://forums.online-go.com/t/pyramid-go/36944](https://forums.online-go.com/t/pyramid-go/36944)
# Pyramid on Graph boards
On graph boards pyramid scoring can be generalized as follows. A node v has value 1 + d + e(v), where d is the diameter of the graph, and e(v) is the eccentricity of v. These definitions can be found at [https://en.wikipedia.org/wiki/Distance_(graph_theory)](https://en.wikipedia.org/wiki/Distance_(graph_theory))
`;
