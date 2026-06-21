// Level 1 — "The First Seal": a ruined courtyard. The lane is the path the dead
// march from the breach (west) to the ward (east). `obstacles` are impassable
// ruins (rubble, broken walls) that carve the open ground into lanes and
// chokepoints — neither hero nor enemies cross them, and you can't build on them.
//
// Data-driven: a new breach = a new LEVEL object (grid size, lane waypoints,
// obstacle rects). Obstacle rects that happen to overlap the lane are ignored
// automatically, so authoring is forgiving (see World: blockedSet).

export const LEVEL = {
  name: "The First Seal",
  cols: 27,
  rows: 19,
  tile: 1,

  breach: { col: 0, row: 9 },
  core: { col: 26, row: 9 },

  // Long winding march through the courtyard — turns create chokepoints.
  waypoints: [
    { col: 0, row: 9 },
    { col: 5, row: 9 },
    { col: 5, row: 4 },
    { col: 12, row: 4 },
    { col: 12, row: 14 },
    { col: 19, row: 14 },
    { col: 19, row: 6 },
    { col: 23, row: 6 },
    { col: 23, row: 9 },
    { col: 26, row: 9 },
  ],

  // Impassable ruins. {col,row,w,h} rectangles in grid cells.
  obstacles: [
    { col: 1, row: 1, w: 3, h: 3 }, // NW ruin
    { col: 8, row: 1, w: 7, h: 2 }, // north wall
    { col: 20, row: 1, w: 5, h: 3 }, // NE ruin
    { col: 7, row: 6, w: 3, h: 5 }, // left hall wall
    { col: 14, row: 7, w: 4, h: 5 }, // central collapsed hall
    { col: 21, row: 10, w: 4, h: 4 }, // east rubble
    { col: 1, row: 14, w: 5, h: 4 }, // SW ruin
    { col: 9, row: 16, w: 7, h: 2 }, // south wall
    { col: 20, row: 16, w: 5, h: 2 }, // SE rubble
  ],

  coreHp: 20,
  startingMarrow: 150,
};
