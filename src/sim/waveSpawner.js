export function buildWaveSchedule(wave, defaultLaneId) {
  const schedule = [];
  for (const group of wave?.groups || []) {
    for (let i = 0; i < group.count; i++) {
      schedule.push({
        type: group.type,
        laneId: group.laneId || defaultLaneId,
        time: group.delay + i * group.interval,
      });
    }
  }
  schedule.sort((a, b) => a.time - b.time);
  return schedule;
}

export function advancePrepTimer(prepTimer, dt) {
  return prepTimer - dt;
}

export function shouldStartWave(phase, prepTimer, inputStart = false) {
  return phase === "prep" && (inputStart || prepTimer <= 0);
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
