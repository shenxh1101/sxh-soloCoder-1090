import { useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Package, TrendingUp, AlertCircle, Gauge, Target, Zap } from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { formatDuration, formatNumber, getLiveTotalFaultDuration } from '../../utils/efficiencyCalculator';
import { THEME_COLORS } from '../../utils/constants';

export function EfficiencyPanel() {
  const {
    currentOEE,
    currentEfficiency,
    currentQuality,
    currentTaktTime,
    totalProduced,
    totalInspected,
    totalGood,
    totalRunTime,
    totalFaultTime,
    idealCycleTime,
    bottleneckMachineId,
    machines,
  } = useProductionStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const runningMachines = machines.filter((m) => m.status === 'running').length;
  const faultMachines = machines.filter((m) => m.status === 'fault').length;

  const liveFaultTime = useMemo(
    () => getLiveTotalFaultDuration(machines, totalFaultTime),
    [machines, totalFaultTime]
  );

  const bottleneck = useMemo(() => {
    if (!bottleneckMachineId) return null;
    return machines.find((m) => m.id === bottleneckMachineId) || null;
  }, [bottleneckMachineId, machines]);

  const getOEEColor = (oee: number) => {
    if (oee >= 85) return THEME_COLORS.success;
    if (oee >= 60) return THEME_COLORS.warning;
    return THEME_COLORS.error;
  };

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 90) return THEME_COLORS.success;
    if (eff >= 70) return THEME_COLORS.warning;
    return THEME_COLORS.error;
  };

  const getQualityColor = (q: number) => {
    if (q >= 95) return THEME_COLORS.success;
    if (q >= 80) return THEME_COLORS.warning;
    return THEME_COLORS.error;
  };

  const metrics = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'OEE 综合效率',
      value: `${formatNumber(currentOEE)}%`,
      color: getOEEColor(currentOEE),
      subValue: '整体设备效率',
    },
    {
      icon: <Gauge className="h-5 w-5" />,
      label: '生产效率',
      value: `${formatNumber(currentEfficiency)}%`,
      color: getEfficiencyColor(currentEfficiency),
      subValue: '实际/理论产出',
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: '良品率',
      value: `${formatNumber(currentQuality)}%`,
      color: getQualityColor(currentQuality),
      subValue: `${totalGood}/${totalInspected} 件`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: '生产节拍',
      value: `${(currentTaktTime / 1000).toFixed(2)}s/件`,
      color: THEME_COLORS.primary,
      subValue: `理想 ${idealCycleTime}s/件`,
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: '总产量',
      value: totalProduced.toString(),
      color: THEME_COLORS.primary,
      subValue: '件',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: '瓶颈设备',
      value: bottleneck ? bottleneck.name : '无',
      color: THEME_COLORS.warning,
      subValue: bottleneck ? `效率 ${bottleneck.efficiency.toFixed(0)}%` : '运行正常',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <div
        className="mx-auto max-w-7xl rounded-xl border border-gray-700/50 bg-gray-900/80 backdrop-blur-md shadow-2xl"
        style={{
          boxShadow: `0 0 40px ${THEME_COLORS.primary}20`,
        }}
      >
        <div className="flex items-center gap-2 border-b border-gray-700/50 px-4 py-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-gray-300">生产效率指标</span>
          <div className="ml-auto flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-400" />
              <span className="text-gray-400">运行时间:</span>
              <span className="font-mono text-green-400">{formatDuration(totalRunTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-red-400" />
              <span className="text-gray-400">故障时间:</span>
              <span className="font-mono text-red-400">{formatDuration(liveFaultTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-blue-400" />
              <span className="text-gray-400">设备状态:</span>
              <span className={`font-mono ${faultMachines > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {runningMachines}/{machines.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-green-400">在线</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 p-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg border border-gray-700/30 bg-gray-800/50 p-3 transition-all hover:border-gray-600/50"
            >
              <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ backgroundColor: metric.color }}
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">{metric.label}</span>
                <div style={{ color: metric.color }}>{metric.icon}</div>
              </div>
              <div
                className="font-mono text-2xl font-bold"
                style={{ color: metric.color }}
              >
                {metric.value}
              </div>
              <div className="mt-1 text-xs text-gray-500">{metric.subValue}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
