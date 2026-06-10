import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Clock,
  Package,
  Zap,
  Activity,
  RotateCcw,
  TrendingDown,
} from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { STATUS_COLORS, STATUS_LABELS, THEME_COLORS } from '../../utils/constants';
import { formatDuration, getLiveMachineFaultDuration } from '../../utils/efficiencyCalculator';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export function MachineDetailPanel() {
  const { selectedMachineId, selectMachine, machines, triggerFault, resetFault } = useProductionStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!selectedMachineId) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [selectedMachineId]);

  const machine = useMemo(
    () => machines.find((m) => m.id === selectedMachineId) || null,
    [machines, selectedMachineId]
  );

  const liveFaultDuration = useMemo(() => {
    if (!machine) return 0;
    return getLiveMachineFaultDuration(machine);
  }, [machine]);

  const totalLostProduction = useMemo(() => {
    if (!machine) return 0;
    return machine.faultRecords.reduce((sum, fr) => sum + fr.lostProduction, 0);
  }, [machine]);

  const chartData = useMemo(() => {
    if (!machine) return { labels: [], datasets: [] };
    const history = machine.efficiencyHistory.slice(-30);
    return {
      labels: history.map((h) =>
        new Date(h.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      ),
      datasets: [
        {
          label: '效率 (%)',
          data: history.map((h) => h.efficiency),
          borderColor: THEME_COLORS.primary,
          backgroundColor: `${THEME_COLORS.primary}15`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5,
        },
      ],
    };
  }, [machine]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: THEME_COLORS.textSecondary, font: { size: 8 }, maxTicksLimit: 5, maxRotation: 0 },
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        grid: { color: `${THEME_COLORS.border}20` },
        ticks: { color: THEME_COLORS.textSecondary, font: { size: 9 }, stepSize: 25, callback: (v: number) => `${v}%` },
      },
    },
  };

  if (!machine) return null;

  const statusColor = STATUS_COLORS[machine.status];
  const statusLabel = STATUS_LABELS[machine.status];
  const recentFaults = machine.faultRecords.slice(-5).reverse();

  return (
    <div className="fixed right-[76px] top-1/2 z-50 -translate-y-1/2">
      <div
        className="w-96 rounded-xl border border-gray-700/50 bg-gray-900/95 backdrop-blur-md shadow-2xl"
        style={{ boxShadow: `0 0 40px ${statusColor}20` }}
      >
        <div
          className="flex items-center justify-between rounded-t-xl border-b border-gray-700/50 px-4 py-3"
          style={{ borderColor: `${statusColor}50` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <Activity className="h-4 w-4" style={{ color: statusColor }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{machine.name}</h3>
              <span
                className="rounded px-1.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => selectMachine(null)}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-5 gap-2">
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Package className="h-3 w-3" />
                加工数量
              </div>
              <div className="mt-1 font-mono text-xl font-bold" style={{ color: statusColor }}>
                {machine.processedCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Zap className="h-3 w-3" />
                当前效率
              </div>
              <div className="mt-1 font-mono text-xl font-bold" style={{ color: statusColor }}>
                {machine.efficiency.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <AlertTriangle className="h-3 w-3" />
                累计故障
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-orange-400">
                {machine.faultCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                故障时长
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-red-400">
                {formatDuration(liveFaultDuration)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <TrendingDown className="h-3 w-3" />
                损失产量
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-amber-400">
                {totalLostProduction}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-400">
              <Activity className="h-3 w-3" />
              效率变化趋势
            </div>
            <div className="h-24 rounded-lg border border-gray-700/30 bg-gray-800/30 p-1.5">
              <Line key={machine.id} data={chartData} options={chartOptions} />
            </div>
          </div>

          {recentFaults.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                <Wrench className="h-3 w-3" />
                故障记录
              </div>
              <div className="max-h-28 space-y-1 overflow-y-auto">
                {recentFaults.map((fr) => (
                  <div
                    key={fr.id}
                    className="flex items-center justify-between rounded border border-gray-700/20 bg-gray-800/30 px-2 py-1.5 text-xs"
                  >
                    <span className="text-gray-400">
                      {new Date(fr.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400">损失 {fr.lostProduction} 件</span>
                      {fr.resolvedAt ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>修复 ({formatDuration(fr.duration)})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          <span>进行中</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {machine.status !== 'fault' ? (
              <button
                onClick={() => triggerFault(machine.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30"
              >
                <AlertTriangle className="h-4 w-4" />
                模拟故障
              </button>
            ) : (
              <button
                onClick={() => resetFault(machine.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition-all hover:bg-green-500/30"
              >
                <RotateCcw className="h-4 w-4" />
                修复故障
              </button>
            )}
            <button
              onClick={() => selectMachine(null)}
              className="rounded-lg border border-gray-600/50 bg-gray-800/50 px-3 py-2 text-sm text-gray-400 transition-all hover:bg-gray-700"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
