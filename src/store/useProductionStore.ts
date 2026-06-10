import { create } from 'zustand';
import type { ProductionState, ProductionActions, Workpiece, Machine, FaultRecord, MachineEfficiencySnapshot } from '../types/production';
import {
  INITIAL_MACHINES,
  CONVEYOR_LENGTH,
  WORKPIECE_SPEED,
  DATA_RECORD_INTERVAL,
  MAX_HISTORY_RECORDS,
  IDEAL_CYCLE_TIME,
  MAX_WORKPIECES,
  SPAWN_INTERVAL,
} from '../utils/constants';
import {
  calculateOEE,
  calculateEfficiency,
  calculateMachineEfficiency,
} from '../utils/efficiencyCalculator';
import {
  exportProductionDataToCSV,
  loadProductionDataFromStorage,
  saveProductionDataToStorage,
} from '../utils/csvExporter';

let workpieceIdCounter = 0;
let lastSpawnTime = 0;
let lastRecordTime = 0;

const createInitialState = (): ProductionState => ({
  machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
  workpieces: [],
  alerts: [],
  productionHistory: loadProductionDataFromStorage(),
  globalSpeed: 1,
  isRunning: true,
  totalProduced: 0,
  totalFaultTime: 0,
  totalRunTime: 0,
  currentOEE: 85,
  currentEfficiency: 90,
  cameraMode: 'overview',
  idealCycleTime: IDEAL_CYCLE_TIME,
  maxWorkpieces: MAX_WORKPIECES,
  spawnInterval: SPAWN_INTERVAL,
  selectedMachineId: null,
});

const getProgressPosition = (progress: number): [number, number, number] => {
  const x = -CONVEYOR_LENGTH / 2 + progress * CONVEYOR_LENGTH;
  return [x, 0.6, 0];
};

const getMachineProgressThreshold = (machineIndex: number): number => {
  const machineSpacing = 0.2;
  const machineWidth = 0.1;
  return 0.15 + machineIndex * (machineSpacing + machineWidth);
};

const getFaultProgressBlock = (machines: Machine[]): number | null => {
  let blockAt: number | null = null;
  for (let i = 0; i < machines.length; i++) {
    if (machines[i].status === 'fault') {
      const threshold = getMachineProgressThreshold(i);
      if (blockAt === null || threshold < blockAt) {
        blockAt = threshold;
      }
    }
  }
  return blockAt;
};

export const useProductionStore = create<ProductionState & ProductionActions>((set, get) => ({
  ...createInitialState(),

  triggerFault: (machineId: string) => {
    const { machines, alerts } = get();
    const machineIndex = machines.findIndex((m) => m.id === machineId);
    if (machineIndex === -1) return;

    const now = Date.now();
    const machine = machines[machineIndex];
    if (machine.status === 'fault') return;

    const faultRecord: FaultRecord = {
      id: `fault-${now}`,
      timestamp: now,
      resolvedAt: null,
      duration: 0,
    };

    const newAlerts = [
      ...alerts,
      {
        id: `alert-${now}`,
        machineId,
        message: `${machine.name} 发生故障，请及时处理！`,
        timestamp: now,
        severity: 'critical' as const,
      },
    ];

    const newMachines = [...machines];
    newMachines[machineIndex] = {
      ...machine,
      status: 'fault',
      faultTime: now,
      efficiency: 0,
      faultCount: machine.faultCount + 1,
      faultRecords: [...machine.faultRecords, faultRecord],
    };

    set({
      machines: newMachines,
      alerts: newAlerts,
    });
  },

  resetFault: (machineId?: string) => {
    const { machines, alerts } = get();
    const now = Date.now();

    let newMachines = [...machines];
    let newAlerts = [...alerts];

    if (machineId) {
      const machineIndex = machines.findIndex((m) => m.id === machineId);
      if (machineIndex !== -1 && machines[machineIndex].status === 'fault') {
        const machine = machines[machineIndex];
        let faultDuration = 0;
        if (machine.faultTime) {
          faultDuration = now - machine.faultTime;
        }

        const updatedFaultRecords = machine.faultRecords.map((fr) =>
          fr.resolvedAt === null ? { ...fr, resolvedAt: now, duration: faultDuration } : fr
        );

        newMachines[machineIndex] = {
          ...machine,
          status: 'running',
          faultTime: null,
          efficiency: 100,
          totalFaultDuration: machine.totalFaultDuration + faultDuration,
          faultRecords: updatedFaultRecords,
        };
        newAlerts = newAlerts.filter((a) => a.machineId !== machineId);
      }
    } else {
      newMachines = machines.map((m) => {
        if (m.status === 'fault' && m.faultTime) {
          const faultDuration = now - m.faultTime;
          const updatedFaultRecords = m.faultRecords.map((fr) =>
            fr.resolvedAt === null ? { ...fr, resolvedAt: now, duration: faultDuration } : fr
          );
          return {
            ...m,
            status: 'running' as const,
            faultTime: null,
            efficiency: 100,
            totalFaultDuration: m.totalFaultDuration + faultDuration,
            faultRecords: updatedFaultRecords,
          };
        }
        return m;
      });
      newAlerts = [];
    }

    set({
      machines: newMachines,
      alerts: newAlerts,
    });
  },

  setGlobalSpeed: (speed: number) => {
    set({ globalSpeed: speed });
  },

  setCameraMode: (mode) => {
    set({ cameraMode: mode });
  },

  setIsRunning: (running: boolean) => {
    set({ isRunning: running });
  },

  selectMachine: (machineId: string | null) => {
    set({ selectedMachineId: machineId });
  },

  spawnWorkpiece: () => {
    const { workpieces, maxWorkpieces, globalSpeed, spawnInterval, isRunning, machines } = get();
    const now = Date.now();

    if (!isRunning) return;
    if (workpieces.length >= maxWorkpieces) return;

    const hasFault = machines.some((m) => m.status === 'fault');
    if (hasFault) return;

    if (now - lastSpawnTime < spawnInterval / globalSpeed) return;

    lastSpawnTime = now;
    workpieceIdCounter++;

    const newWorkpiece: Workpiece = {
      id: `wp-${workpieceIdCounter}`,
      progress: 0,
      processed: false,
      inspected: false,
      passed: false,
      machineIndex: -1,
    };

    set((state) => ({
      workpieces: [...state.workpieces, newWorkpiece],
    }));
  },

  updateWorkpieces: (deltaTime: number) => {
    const { workpieces, machines, globalSpeed, isRunning, idealCycleTime } = get();

    if (!isRunning) return;

    const effectiveDelta = deltaTime * globalSpeed;
    const progressPerSecond = WORKPIECE_SPEED / CONVEYOR_LENGTH;

    const faultBlock = getFaultProgressBlock(machines);

    const sortedWorkpieces = [...workpieces].sort((a, b) => a.progress - b.progress);

    let producedThisUpdate = 0;
    let newWorkpieces: Workpiece[] = [];
    let machinesToUpdate = [...machines];

    for (let i = sortedWorkpieces.length - 1; i >= 0; i--) {
      const wp = sortedWorkpieces[i];
      let newProgress = wp.progress;

      let nextProgress = wp.progress + progressPerSecond * effectiveDelta;

      if (faultBlock !== null && nextProgress > faultBlock - 0.04) {
        nextProgress = Math.min(nextProgress, faultBlock - 0.04);
      }

      if (i < sortedWorkpieces.length - 1) {
        const aheadWp = sortedWorkpieces[i + 1];
        const minGap = 0.04;
        if (nextProgress + minGap > aheadWp.progress) {
          nextProgress = aheadWp.progress - minGap;
        }
      }

      nextProgress = Math.max(nextProgress, wp.progress - 0.0001);
      newProgress = nextProgress;

      let newProcessed = wp.processed;
      let newMachineIndex = wp.machineIndex;

      for (let mi = 0; mi < machines.length - 1; mi++) {
        const threshold = getMachineProgressThreshold(mi);
        if (
          machines[mi].status !== 'fault' &&
          wp.progress < threshold &&
          newProgress >= threshold &&
          !wp.processed
        ) {
          newProcessed = true;
          newMachineIndex = mi;
          machinesToUpdate[mi] = {
            ...machinesToUpdate[mi],
            processedCount: machinesToUpdate[mi].processedCount + 1,
          };
        }
      }

      let newInspected = wp.inspected;
      let newPassed = wp.passed;

      const inspectionThreshold = getMachineProgressThreshold(3);
      if (
        machines[3].status !== 'fault' &&
        wp.progress < inspectionThreshold &&
        newProgress >= inspectionThreshold
      ) {
        newInspected = true;
        newPassed = Math.random() > 0.05;
        machinesToUpdate[3] = {
          ...machinesToUpdate[3],
          processedCount: machinesToUpdate[3].processedCount + 1,
        };
      }

      if (newProgress >= 1) {
        producedThisUpdate++;
        continue;
      }

      newWorkpieces.push({
        ...wp,
        progress: newProgress,
        processed: newProcessed,
        machineIndex: newMachineIndex,
        inspected: newInspected,
        passed: newPassed,
      });
    }

    machinesToUpdate = machinesToUpdate.map((m) => ({
      ...m,
      efficiency: calculateMachineEfficiency(m, get().totalRunTime / 1000 + deltaTime, idealCycleTime),
    }));

    if (producedThisUpdate > 0) {
      set((state) => ({
        totalProduced: state.totalProduced + producedThisUpdate,
      }));
    }

    set({
      workpieces: newWorkpieces.sort((a, b) => a.progress - b.progress),
      machines: machinesToUpdate,
    });
  },

  recordProductionData: () => {
    const {
      productionHistory,
      totalProduced,
      totalFaultTime,
      currentEfficiency,
      currentOEE,
      globalSpeed,
      machines,
    } = get();
    const now = Date.now();

    if (now - lastRecordTime < DATA_RECORD_INTERVAL / globalSpeed) return;
    lastRecordTime = now;

    let liveFaultTime = totalFaultTime;
    for (const m of machines) {
      if (m.status === 'fault' && m.faultTime) {
        liveFaultTime += now - m.faultTime;
      }
    }

    const newRecord = {
      timestamp: now,
      count: totalProduced,
      efficiency: currentEfficiency,
      oee: currentOEE,
      faultDuration: liveFaultTime,
    };

    const newHistory = [...productionHistory, newRecord].slice(-MAX_HISTORY_RECORDS);
    saveProductionDataToStorage(newHistory);

    set({ productionHistory: newHistory });
  },

  updateEfficiencyMetrics: () => {
    const {
      totalProduced,
      totalFaultTime,
      totalRunTime,
      idealCycleTime,
      machines,
    } = get();

    const now = Date.now();
    let liveFaultTime = totalFaultTime;
    for (const m of machines) {
      if (m.status === 'fault' && m.faultTime) {
        liveFaultTime += now - m.faultTime;
      }
    }

    const plannedRunTime = totalRunTime > 0 ? totalRunTime : 1;
    const actualRuntimeSec = (totalRunTime - liveFaultTime) / 1000;
    const goodCount = Math.floor(totalProduced * 0.95);
    const totalCount = totalProduced > 0 ? totalProduced : 1;

    const oee = calculateOEE(
      plannedRunTime / 1000,
      liveFaultTime / 1000,
      totalProduced,
      idealCycleTime,
      actualRuntimeSec > 0 ? actualRuntimeSec : 1,
      goodCount,
      totalCount
    );

    const idealOutputPerSecond = 1 / idealCycleTime;
    const efficiency = calculateEfficiency(
      totalProduced,
      actualRuntimeSec > 0 ? actualRuntimeSec : 1,
      idealOutputPerSecond
    );

    const updatedMachines = machines.map((m) => {
      const snapshot: MachineEfficiencySnapshot = {
        timestamp: now,
        efficiency: m.efficiency,
      };
      const trimmedHistory = m.efficiencyHistory.length > 60
        ? m.efficiencyHistory.slice(-60)
        : m.efficiencyHistory;
      return {
        ...m,
        efficiencyHistory: [...trimmedHistory, snapshot],
      };
    });

    set({
      currentOEE: oee,
      currentEfficiency: efficiency,
      machines: updatedMachines,
    });
  },

  addRunTime: (deltaTime: number) => {
    set((state) => ({
      totalRunTime: state.totalRunTime + deltaTime * 1000 * state.globalSpeed,
    }));
  },

  dismissAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  exportToCSV: () => {
    const { productionHistory, machines } = get();
    exportProductionDataToCSV(productionHistory, machines);
  },

  resetAll: () => {
    workpieceIdCounter = 0;
    lastSpawnTime = 0;
    lastRecordTime = 0;
    set(createInitialState());
  },
}));

export const getWorkpiecePosition = (progress: number): [number, number, number] => {
  return getProgressPosition(progress);
};
