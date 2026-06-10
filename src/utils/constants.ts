import type { Machine } from '../types/production';

export const CONVEYOR_LENGTH = 20;
export const CONVEYOR_WIDTH = 1.5;
export const CONVEYOR_HEIGHT = 0.3;
export const WORKPIECE_SIZE = 0.6;
export const WORKPIECE_SPEED = 2;

export const MACHINE_POSITIONS: { id: string; name: string; position: [number, number, number] }[] = [
  { id: 'm1', name: 'CNC加工中心', position: [-6, 0, 2] },
  { id: 'm2', name: '焊接机器人', position: [-2, 0, 2] },
  { id: 'm3', name: '装配站', position: [2, 0, 2] },
  { id: 'm4', name: '质量检测站', position: [6, 0, 2] },
];

export const INITIAL_MACHINES: Machine[] = MACHINE_POSITIONS.map((m) => ({
  ...m,
  status: 'running' as const,
  processedCount: 0,
  efficiency: 100,
  faultTime: null,
  faultCount: 0,
  totalFaultDuration: 0,
  faultRecords: [],
  efficiencyHistory: [],
}));

export const STATUS_COLORS = {
  running: '#00B42A',
  idle: '#FF7D00',
  fault: '#F53F3F',
};

export const STATUS_LABELS = {
  running: '运行中',
  idle: '空闲',
  fault: '故障',
};

export const THEME_COLORS = {
  primary: '#165DFF',
  secondary: '#722ED1',
  background: '#0D1117',
  surface: '#161B22',
  border: '#30363D',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  success: '#00B42A',
  warning: '#FF7D00',
  error: '#F53F3F',
  info: '#165DFF',
};

export const SPEED_OPTIONS = [0.5, 1, 2];

export const DATA_RECORD_INTERVAL = 5000;
export const MAX_HISTORY_RECORDS = 720;
export const IDEAL_CYCLE_TIME = 0.5;
export const MAX_WORKPIECES = 15;
export const SPAWN_INTERVAL = 1500;
