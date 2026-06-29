export function buildWaveSchedule(wave, defaultLaneId) {
  const schedule = [];
  for (const group of wave?.groups || []) {
    for (let i = 0; i < group.count; i++) {
      schedule.push({
        type: group.type,
        laneId: group.laneId || defaultLaneId,
        time: group.delay + i * group.interval,
        elite: !!group.elite,
        eliteId: group.elite ? String(group.eliteId || `${group.type}-elite`) : "",
        eliteName: group.elite && group.eliteName ? String(group.eliteName) : "",
        eliteHpMultiplier: group.elite && group.eliteHpMultiplier ? Number(group.eliteHpMultiplier) : undefined,
        eliteScale: group.elite && group.eliteScale ? Number(group.eliteScale) : undefined,
      });
    }
  }
  schedule.sort((a, b) => a.time - b.time);
  return schedule;
}

export function advancePrepTimer(prepTimer, dt) {
  return prepTimer - dt;
}

export const HOLD_START_SECONDS = 1.5;

export function holdStartProgress(elapsed, threshold = HOLD_START_SECONDS) {
  if (!(threshold > 0)) return 0;
  return Math.max(0, Math.min(1, elapsed / threshold));
}

export function holdStartReady(elapsed, threshold = HOLD_START_SECONDS) {
  return threshold > 0 && elapsed >= threshold;
}

export function shouldStartWave(phase, prepTimer, inputStart = false, opts = {}) {
  if (phase !== "prep") return false;
  if (opts.holdGate) return !!opts.holdReady; // round 1: only a completed E-hold starts (timer + tap ignored)
  return inputStart || prepTimer <= 0;
}

export function advanceWaveSpawns(schedule, spawnCursor, waveElapsed, dt) {
  const elapsed = waveElapsed + dt;
  const spawns = [];
  let cursor = spawnCursor;
  while (cursor < schedule.length && schedule[cursor].time <= elapsed) {
    spawns.push(schedule[cursor]);
    cursor++;
  }
  return { waveElapsed: elapsed, spawnCursor: cursor, spawns };
}

export function isWaveCleared(phase, spawnCursor, schedule, liveEnemyCount) {
  return phase === "active" && spawnCursor >= schedule.length && liveEnemyCount === 0;
}

export function completeWave(waves, waveIndex) {
  const cleared = waves[waveIndex];
  const nextWaveIndex = waveIndex + 1;
  if (nextWaveIndex >= waves.length) {
    return {
      clearedWaveNumber: waveIndex + 1,
      reward: cleared.reward,
      waveIndex: nextWaveIndex,
      phase: "won",
      status: "won",
      prepTimer: 0,
    };
  }
  return {
    clearedWaveNumber: waveIndex + 1,
    reward: cleared.reward,
    waveIndex: nextWaveIndex,
    phase: "prep",
    status: "playing",
    prepTimer: waves[nextWaveIndex].prepTime,
  };
}
