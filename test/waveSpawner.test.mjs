import {
  advancePrepTimer,
  advanceWaveSpawns,
  buildWaveSchedule,
  completeWave,
  isWaveCleared,
  shouldStartWave,
} from "../src/sim/waveSpawner.js";
import { LEVEL } from "../src/config/level.js";
import { ENEMIES } from "../src/config/enemies.js";
import { World } from "../src/sim/World.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const waves = [
  {
    name: "One",
    prepTime: 5,
    reward: 10,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 2, interval: 1, delay: 2 },
      { type: "sprinter", count: 2, interval: 0.5, delay: 0 },
    ],
  },
  {
    name: "Two",
    prepTime: 7,
    reward: 20,
    groups: [{ type: "gravebreaker", laneId: "southeast-garden", count: 1, interval: 1, delay: 0, elite: true, eliteId: "test-elite", eliteName: "Test Elite", eliteHpMultiplier: 2.5, eliteScale: 1.2 }],
  },
];

{
  const schedule = buildWaveSchedule(waves[0], "legacy-lane");
  ok(schedule.length === 4, "wave schedule expands every spawn in every group");
  ok(schedule.map((s) => s.time).join(",") === "0,0.5,2,3", "wave schedule sorts spawns by time");
  ok(schedule[0].laneId === "legacy-lane" && schedule[1].laneId === "legacy-lane", "wave schedule fills missing lane ids with default lane");
  ok(schedule[2].laneId === "north-gate", "wave schedule preserves explicit lane ids");
}

{
  const schedule = buildWaveSchedule(waves[1], "legacy-lane");
  ok(schedule.length === 1 && schedule[0].elite && schedule[0].eliteId === "test-elite", "wave schedule preserves controlled elite metadata");
  ok(schedule[0].eliteName === "Test Elite" && schedule[0].eliteHpMultiplier === 2.5 && schedule[0].eliteScale === 1.2, "wave schedule preserves elite tuning metadata");
}

{
  ok(advancePrepTimer(3, 0.75) === 2.25, "prep timer advances by subtracting dt");
  ok(shouldStartWave("prep", 10, true), "manual start triggers only during prep");
  ok(shouldStartWave("prep", 0, false), "expired prep timer triggers wave start");
  ok(!shouldStartWave("active", -1, true), "active phase cannot restart wave");
}

{
  const schedule = buildWaveSchedule(waves[0], "legacy-lane");
  const first = advanceWaveSpawns(schedule, 0, 0, 0.6);
  ok(first.waveElapsed === 0.6 && first.spawnCursor === 2, "spawn advancement collects due spawns and moves cursor");
  ok(first.spawns.map((s) => s.type).join(",") === "sprinter,sprinter", "spawn advancement returns due spawns in schedule order");
  const second = advanceWaveSpawns(schedule, first.spawnCursor, first.waveElapsed, 2.5);
  ok(second.spawnCursor === schedule.length && second.spawns.length === 2, "spawn advancement resumes from cursor");
}

{
  const schedule = buildWaveSchedule(waves[0], "legacy-lane");
  ok(!isWaveCleared("prep", schedule.length, schedule, 0), "wave clear check ignores prep phase");
  ok(!isWaveCleared("active", 1, schedule, 0), "wave clear check waits for all spawns");
  ok(!isWaveCleared("active", schedule.length, schedule, 1), "wave clear check waits for living enemies");
  ok(isWaveCleared("active", schedule.length, schedule, 0), "wave clear check accepts fully spawned empty wave");

  const next = completeWave(waves, 0);
  ok(next.reward === 10 && next.waveIndex === 1 && next.phase === "prep" && next.prepTimer === waves[1].prepTime, "wave completion advances to next prep wave");
  const final = completeWave(waves, 1);
  ok(final.reward === 20 && final.phase === "won" && final.status === "won", "final wave completion wins the mission");
}

{
  const world = new World(LEVEL, waves);
  ok(world.startWave(), "World startWave still starts combat through extracted schedule");
  ok(world.schedule.length === 4 && world.phase === "active", "World stores expanded wave schedule");
  world.update(0.1, {});
  ok(world.enemies.length === 1 && world.enemies[0].laneId === world.defaultLaneId, "World spawns missing-lane groups on its default lane");
}

{
  const world = new World(LEVEL, [waves[1]]);
  ok(world.startWave(), "World starts elite test wave");
  world.update(0.1, {});
  const elite = world.enemies[0];
  ok(elite?.elite && elite.eliteId === "test-elite", "World spawns requested elite enemy metadata");
  ok(elite.name === "Test Elite" && elite.eliteScale === 1.2, "World spawns requested elite visual identity");
  ok(elite.maxHp === Math.round(ENEMIES.gravebreaker.hp * 2.5) && elite.hp === elite.maxHp, "elite spawns with higher HP than normal equivalent");
  world._damageEnemy(elite, elite.hp + 1);
  const kill = world.events.find((event) => event.kind === "kill");
  ok(kill?.elite && kill.eliteId === "test-elite", "elite kill event carries reward metadata");
}

{
  const world = new World(LEVEL, [waves[0]]);
  world.startWave();
  world.update(0.1, {});
  const normal = world.enemies[0];
  world._damageEnemy(normal, normal.hp + 1);
  const kill = world.events.find((event) => event.kind === "kill");
  ok(kill && !kill.elite && !kill.eliteId, "normal enemy kill events do not request physical loot source metadata");
}

console.log(`waveSpawner: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
