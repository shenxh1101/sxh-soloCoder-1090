export type MachineStatus = 'running' | 'idle' | 'fault';

export type CameraMode = 'overview' | 'firstPerson';

export interface FaultRecord {
  id: string;
  timestamp: number;
  resolvedAt: number | null;
  duration: number;
}

export interface MachineEfficiencySnapshot {
  timestamp: number;
  efficiency: number;
}

export interface Machine {
  id: string;
  name: string;
  position: [number, number, number];
  status: MachineStatus;
  processedCount: number;
  efficiency: number;
  faultTime: number | null;
  faultCount: number;
  totalFaultDuration: number;
  faultRecords: FaultRecord[];
  efficiencyHistory: MachineEfficiencySnapshot[];
}

export interface Workpiece {
  id: string;
  progress: number;
  processed: boolean;
  inspected: boolean;
  passed: boolean;
  machineIndex: number;
}

export interface Alert {
  id: string;
  machineId: string;
  message: string;
  timestamp: number;
  severity: 'warning' | 'critical';
}

export interface ProductionRecord {
  timestamp: number;
  count: number;
  efficiency: number;
  oee: number;
  faultDuration: number;
}

export interface ProductionState {
  machines: Machine[];
  workpieces: Workpiece[];
  alerts: Alert[];
  productionHistory: ProductionRecord[];
  globalSpeed: number;
  isRunning: boolean;
  totalProduced: number;
  totalFaultTime: number;
  totalRunTime: number;
  currentOEE: number;
  currentEfficiency: number;
  cameraMode: CameraMode;
  idealCycleTime: number;
  maxWorkpieces: number;
  spawnInterval: number;
  selectedMachineId: string | null;
}

export interface ProductionActions {
  triggerFault: (machineId: string) => void;
  resetFault: (machineId?: string) => void;
  setGlobalSpeed: (speed: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  setIsRunning: (running: boolean) => void;
  selectMachine: (machineId: string | null) => void;
  spawnWorkpiece: () => void;
  updateWorkpieces: (deltaTime: number) => void;
  recordProductionData: () => void;
  updateEfficiencyMetrics: () => void;
  addRunTime: (deltaTime: number) => void;
  dismissAlert: (alertId: string) => void;
  exportToCSV: () => void;
  resetAll: () => void;
}
