// First Breach tutorial greybox.
//
// The map is intentionally plain: one west enemy breach, one straight lane, one
// mid-map choke framed by low curbs, and one Ward-Crystal defense apron. The
// renderer treats obstacles as low boundary markers; the sim treats them as
// blocked cells for hero movement and tower placement.

export const LEVEL = {
  name: "The First Seal",
  cols: 23,
  rows: 15,
  tile: 1,

  breach: { col: 0, row: 7 },
  core: { col: 22, row: 7 },

  // One readable lane: breach -> choke -> Ward-Crystal.
  waypoints: [
    { col: 0, row: 7 },
    { col: 22, row: 7 },
  ],

  // Low curbs/ruins that frame the lane without creating a maze.
  obstacles: [
    // outer boundary hints
    { col: 2, row: 2, w: 19, h: 1 },
    { col: 2, row: 12, w: 19, h: 1 },

    // mid-map choke shoulders; rows 6 and 8 remain open for tower teaching
    { col: 9, row: 5, w: 5, h: 1 },
    { col: 9, row: 9, w: 5, h: 1 },

    // low Ward approach rails, leaving the core apron readable and open
    { col: 17, row: 4, w: 3, h: 1 },
    { col: 17, row: 10, w: 3, h: 1 },
  ],

  coreHp: 24,
  startingMarrow: 180,
};
