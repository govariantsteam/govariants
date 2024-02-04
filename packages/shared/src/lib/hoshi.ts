/*
Source borrowed (with heavy modifications) from Besogo, which is released under the MIT Licence:

Copyright (c) 2015-2018 Ye Wang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { Coordinate } from "./coordinate";

/** @returns the coordinates of the hoshi for a given board size */
export function getHoshi(width: number, height: number): Coordinate[] {
  const ret: Coordinate[] = [];
  const addStar = (i: number, j: number) =>
    // We subtract one here because the BesoGo implementation is 1-indexed
    ret.push(new Coordinate(i - 1, j - 1));
  let cx, cy; // Path string for drawing star points

  if (width % 2 && height % 2) {
    // Draw center hoshi if both dimensions are odd
    cx = (width - 1) / 2 + 1; // Calculate the center of the board
    cy = (height - 1) / 2 + 1;
    addStar(cx, cy);

    if (width >= 17 && height >= 17) {
      // Draw side hoshi if at least 17x17 and odd
      addStar(4, cy);
      addStar(width - 3, cy);
      addStar(cx, 4);
      addStar(cx, height - 3);
    }
  }

  if (width >= 11 && height >= 11) {
    // Corner hoshi at (4, 4) for larger sizes
    addStar(4, 4);
    addStar(4, height - 3);
    addStar(width - 3, 4);
    addStar(width - 3, height - 3);
  } else if (width >= 8 && height >= 8) {
    // Corner hoshi at (3, 3) for medium sizes
    addStar(3, 3);
    addStar(3, height - 2);
    addStar(width - 2, 3);
    addStar(width - 2, height - 2);
  } // No corner hoshi for smaller sizes

  return ret;
}
