import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Eye,
  Download,
  Zap,
  FastForward,
  Settings,
} from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { SPEED_OPTIONS, THEME_COLORS } from '../../utils/constants';

export function ControlPanel() {
  const {
    globalSpeed,
    setGlobalSpeed,
    cameraMode,
    setCameraMode,
    resetFault,
    exportToCSV,
    isRunning,
    setIsRunning,
    resetAll,
  } = useProductionStore();

  const handleSpeedChange = (speed: number) => {
    setGlobalSpeed(speed);
  };

  const handleCameraToggle = () => {
    setCameraMode(cameraMode === 'overview' ? 'firstPerson' : 'overview');
  };

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2">
      <div
        className="flex flex-col gap-2 rounded-xl border border-gray-700/50 bg-gray-900/80 p-3 backdrop-blur-md shadow-2xl"
        style={{
          boxShadow: `0 0 40px ${THEME_COLORS.primary}30`,
        }}
      >
        <div className="mb-1 flex items-center gap-2 border-b border-gray-700/50 pb-2">
          <Settings className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold text-gray-300">控制面板</span>
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            isRunning
              ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? '暂停' : '运行'}
        </button>

        <div className="mt-1">
          <div className="mb-1 flex items-center gap-1">
            <Gauge className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">运行速度</span>
          </div>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition-all ${
                  globalSpeed === speed
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCameraToggle}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-gray-700"
        >
          <Eye className="h-4 w-4" />
          {cameraMode === 'overview' ? '第一人称' : '全局俯瞰'}
        </button>

        <button
          onClick={() => resetFault()}
          className="flex items-center gap-2 rounded-lg bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition-all hover:bg-green-500/30"
        >
          <Zap className="h-4 w-4" />
          重置故障
        </button>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-2 text-sm font-medium text-purple-400 transition-all hover:bg-purple-500/30"
        >
          <Download className="h-4 w-4" />
          导出CSV
        </button>

        <button
          onClick={resetAll}
          className="mt-1 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
        >
          <RotateCcw className="h-4 w-4" />
          重置全部
        </button>
      </div>
    </div>
  );
}
