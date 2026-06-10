import { useMemo } from 'react';
import { Activity, Clock, Package, TrendingUp, AlertCircle, Gauge } from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { formatDuration, formatNumber } from '../../utils/efficiencyCalculator';
import { THEME_COLORS } from '../../utils/constants';

export function EfficiencyPanel() {
  const {
    currentOEE,
    currentEfficiency,
    totalProduced,
    totalRunTime,
    totalFaultTime,
    globalSpeed,
    machines,
  } = useProductionStore();

  const runningMachines = machines.filter((m) => m.status === 'running').length;
  const faultMachines = machines.filter((m) => m.status === 'fault').length;

  const liveFaultTime = useMemo(() => {
    const now = Date.now();
    let t = totalFaultTime;
    for (const m of machines) {
      if (m.status === 'fault' && m.faultTime) {
        t += now - m.faultTime;
      }
    }
    return t;
  }, [totalFaultTime, machines]);

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
      icon: <Package className="h-5 w-5" />,
      label: '总产量',
      value: totalProduced.toString(),
      color: THEME_COLORS.primary,
      subValue: '件',
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: '运行时间',
      value: formatDuration(totalRunTime),
      color: THEME_COLORS.success,
      subValue: '累计运行',
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      label: '故障时间',
      value: formatDuration(liveFaultTime),
      color: faultMachines > 0 ? THEME_COLORS.error : THEME_COLORS.textSecondary,
      subValue: `停机损失 ${(totalRunTime > 0 ? (liveFaultTime / totalRunTime * 100) : 0).toFixed(1)}%`,
    },
    {
      icon: <Activity className="h-5 w-5" />,
      label: '设备状态',
      value: `${runningMachines}/${machines.length}`,
      color: faultMachines > 0 ? THEME_COLORS.warning : THEME_COLORS.success,
      subValue: `速度 ${globalSpeed}x`,
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
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
            <span>实时数据</span>
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
