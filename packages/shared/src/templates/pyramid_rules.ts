export const pyramidRuleDescription = `
# Introduction
Pyramid is a variant of Go/Baduk with modified point values. Every intersection has an individual point value, and the score is equal to the sum of point values of intersections in the area that a player controls.
# Pyramid Point Values
The point value of an intersection is equal to one plus the minimum distance to a board edge. The points that are close to the board center are worth significantly more.
# Scoring
For the automated scoring to be correct, all dead stones need to be captured manually.
# Credit
[https://forums.online-go.com/t/pyramid-go/36944](https://forums.online-go.com/t/pyramid-go/36944)
`;
