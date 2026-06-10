import { create } from 'zustand';
import type { ProductionState, ProductionActions, Workpiece, Machine } from '../types/production';
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
});

const getProgressPosition = (progress: number): [number, number, number] => {
  const x = -CONVEYOR_LENGTH / 2 + progress * CONVEYOR_LENGTH;
  return [x, 0.6, 0];
};

const getMachineProgressRange = (machineIndex: number): [number, number] => {
  const machineSpacing = 0.2;
  const machineWidth = 0.1;
  const start = 0.15 + machineIndex * (machineSpacing + machineWidth);
  return [start, start + machineWidth];
};

const hasAnyFault = (machines: Machine[]): boolean => {
  return machines.some((m) => m.status === 'fault');
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
        if (machine.faultTime) {
          const faultDuration = now - machine.faultTime;
          set((state) => ({
            totalFaultTime: state.totalFaultTime + faultDuration,
          }));
        }
        newMachines[machineIndex] = {
          ...machine,
          status: 'running',
          faultTime: null,
          efficiency: 100,
        };
        newAlerts = newAlerts.filter((a) => a.machineId !== machineId);
      }
    } else {
      let totalAdditionalFaultTime = 0;
      newMachines = machines.map((m) => {
        if (m.status === 'fault' && m.faultTime) {
          totalAdditionalFaultTime += now - m.faultTime;
          return { ...m, status: 'running' as const, faultTime: null, efficiency: 100 };
        }
        return m;
      });
      newAlerts = [];
      if (totalAdditionalFaultTime > 0) {
        set((state) => ({
          totalFaultTime: state.totalFaultTime + totalAdditionalFaultTime,
        }));
      }
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

  spawnWorkpiece: () => {
    const { workpieces, maxWorkpieces, globalSpeed, spawnInterval, isRunning } = get();
    const now = Date.now();

    if (!isRunning) return;
    if (workpieces.length >= maxWorkpieces) return;
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
    const hasFault = hasAnyFault(machines);

    if (!isRunning) return;

    const effectiveDelta = deltaTime * globalSpeed;
    const progressPerSecond = WORKPIECE_SPEED / CONVEYOR_LENGTH;

    const sortedWorkpieces = [...workpieces].sort((a, b) => a.progress - b.progress);

    let producedThisUpdate = 0;
    let passedThisUpdate = 0;
    let totalInspected = 0;
    let newWorkpieces: Workpiece[] = [];
    let machinesToUpdate = [...machines];

    for (let i = 0; i < sortedWorkpieces.length; i++) {
      const wp = sortedWorkpieces[i];
      let newProgress = wp.progress;

      const canMove = !hasFault || wp.progress < 0.4;

      if (canMove) {
        let nextProgress = wp.progress + progressPerSecond * effectiveDelta;
        let blocked = false;

        if (i > 0) {
          const prevWp = sortedWorkpieces[i - 1];
          const minGap = 0.04;
          if (nextProgress + minGap > prevWp.progress) {
            nextProgress = prevWp.progress - minGap;
            blocked = true;
          }
        }

        if (blocked && hasFault) {
          const blockingFaultMachine = machines.find(
            (m, idx) => m.status === 'fault' && wp.progress < getMachineProgressRange(idx)[1]
          );
          if (blockingFaultMachine) {
            newProgress = wp.progress;
          } else {
            newProgress = nextProgress;
          }
        } else {
          newProgress = nextProgress;
        }
      }

      let newProcessed = wp.processed;
      let newMachineIndex = wp.machineIndex;

      for (let mi = 0; mi < machines.length - 1; mi++) {
        const [start, end] = getMachineProgressRange(mi);
        if (
          machines[mi].status !== 'fault' &&
          wp.progress < start &&
          newProgress >= start &&
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

      const inspectionRange = getMachineProgressRange(3);
      if (
        machines[3].status !== 'fault' &&
        wp.progress < inspectionRange[0] &&
        newProgress >= inspectionRange[0]
      ) {
        newInspected = true;
        newPassed = Math.random() > 0.05;
        totalInspected++;
        if (newPassed) {
          passedThisUpdate++;
        }
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

    machinesToUpdate = machinesToUpdate.map((m, idx) => ({
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
    } = get();
    const now = Date.now();

    if (now - lastRecordTime < DATA_RECORD_INTERVAL / globalSpeed) return;
    lastRecordTime = now;

    const newRecord = {
      timestamp: now,
      count: totalProduced,
      efficiency: currentEfficiency,
      oee: currentOEE,
      faultDuration: totalFaultTime,
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
      productionHistory,
    } = get();

    const plannedRunTime = totalRunTime > 0 ? totalRunTime : 1;
    const actualRuntimeSec = (totalRunTime - totalFaultTime) / 1000;
    const goodCount = Math.floor(totalProduced * 0.95);
    const totalCount = totalProduced > 0 ? totalProduced : 1;

    const oee = calculateOEE(
      plannedRunTime / 1000,
      totalFaultTime / 1000,
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

    set({
      currentOEE: oee,
      currentEfficiency: efficiency,
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
    const { productionHistory } = get();
    exportProductionDataToCSV(productionHistory);
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
