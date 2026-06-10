import type { Machine, ProductionRecord } from '../types/production';

export function calculateOEE(
  plannedRunTime: number,
  faultTime: number,
  actualOutput: number,
  idealCycleTime: number,
  runTime: number,
  goodCount: number,
  totalCount: number
): number {
  if (plannedRunTime <= 0 || runTime <= 0 || totalCount === 0) return 0;

  const availability = Math.max(0, (plannedRunTime - faultTime) / plannedRunTime);
  const performance = Math.min(1, Math.max(0, (idealCycleTime * actualOutput) / runTime));
  const quality = Math.max(0, goodCount / totalCount);

  return availability * performance * quality * 100;
}

export function calculateEfficiency(
  actualOutput: number,
  elapsedTime: number,
  idealOutputPerSecond: number
): number {
  if (elapsedTime <= 0 || idealOutputPerSecond <= 0) return 0;
  const expectedOutput = idealOutputPerSecond * elapsedTime;
  if (expectedOutput === 0) return 0;
  return Math.min(100, Math.max(0, (actualOutput / expectedOutput) * 100));
}

export function calculateMachineEfficiency(
  machine: Machine,
  elapsedTime: number,
  idealCycleTime: number
): number {
  if (machine.status === 'fault') {
    return 0;
  }
  if (elapsedTime <= 0) return machine.efficiency;
  const expectedCount = elapsedTime / idealCycleTime;
  if (expectedCount === 0) return 100;
  return Math.min(100, Math.max(0, (machine.processedCount / expectedCount) * 100));
}

export function getProductionRate(
  history: ProductionRecord[],
  windowMs: number = 3600000
): number {
  if (history.length < 2) return 0;

  const now = Date.now();
  const windowStart = now - windowMs;
  const recentRecords = history.filter((r) => r.timestamp >= windowStart);

  if (recentRecords.length < 2) return 0;

  const totalCount = recentRecords.reduce((sum, r) => sum + r.count, 0);
  const firstRecord = recentRecords[0];
  const lastRecord = recentRecords[recentRecords.length - 1];
  const elapsedHours = (lastRecord.timestamp - firstRecord.timestamp) / 3600000;

  if (elapsedHours <= 0) return 0;
  return totalCount / elapsedHours;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}
