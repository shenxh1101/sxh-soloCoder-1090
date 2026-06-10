import { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  X,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Activity,
  Package,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { STATUS_COLORS, STATUS_LABELS, THEME_COLORS } from '../../utils/constants';
import { formatDuration } from '../../utils/efficiencyCalculator';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ONE_HOUR_MS = 3600000;

export function ProductionAnalysisPanel() {
  const {
    activeView,
    setActiveView,
    productionHistory,
    machines,
    currentOEE,
    currentEfficiency,
    currentQuality,
    currentTaktTime,
    totalProduced,
    totalInspected,
    totalGood,
    totalRunTime,
    totalFaultTime,
    bottleneckMachineId,
    idealCycleTime,
    selectedSnapshotTimestamp,
    setSelectedSnapshot,
  } = useProductionStore();

  const lineChartRef = useRef<ChartJS<'line'>>(null);
  const barChartRef = useRef<ChartJS<'bar'>>(null);

  if (activeView !== 'analysis') return null;

  const handleClose = () => setActiveView('realtime');

  const filteredData = useMemo(() => {
    const now = Date.now();
    const windowStart = now - ONE_HOUR_MS;
    return productionHistory.filter((r) => r.timestamp >= windowStart);
  }, [productionHistory]);

  const selectedIndex = useMemo(() => {
    if (!selectedSnapshotTimestamp) return -1;
    return filteredData.findIndex((r) => r.timestamp === selectedSnapshotTimestamp);
  }, [selectedSnapshotTimestamp, filteredData]);

  const bottleneck = useMemo(
    () => machines.find((m) => m.id === bottleneckMachineId),
    [machines, bottleneckMachineId]
  );

  const liveFaultTime = useMemo(() => {
    let total = totalFaultTime;
    for (const m of machines) {
      if (m.status === 'fault' && m.faultTime) {
        total += Date.now() - m.faultTime;
      }
    }
    return total;
  }, [machines, totalFaultTime]);

  const runningMachines = useMemo(
    () => machines.filter((m) => m.status !== 'fault').length,
    [machines]
  );

  const qualityColor = (q: number) => {
    if (q >= 95) return THEME_COLORS.success;
    if (q >= 80) return THEME_COLORS.warning;
    return THEME_COLORS.error;
  };

  const oeeColor = (o: number) => {
    if (o >= 85) return THEME_COLORS.success;
    if (o >= 60) return THEME_COLORS.warning;
    return THEME_COLORS.error;
  };

  const trendChartData = useMemo(() => {
    if (filteredData.length === 0) return { labels: [], counts: [], oees: [] };
    const labels: string[] = [];
    const counts: number[] = [];
    const oees: number[] = [];
    const baseCount = filteredData[0].count;
    for (const r of filteredData) {
      labels.push(
        new Date(r.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      counts.push(r.count - baseCount);
      oees.push(r.oee);
    }
    return { labels, counts, oees };
  }, [filteredData]);

  const lineChartData = {
    labels: trendChartData.labels,
    datasets: [
      {
        label: '时段产量',
        data: trendChartData.counts,
        borderColor: THEME_COLORS.primary,
        backgroundColor: `${THEME_COLORS.primary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
        pointBackgroundColor: (ctx: any) =>
          ctx.dataIndex === selectedIndex ? THEME_COLORS.warning : undefined,
      },
      {
        label: 'OEE (%)',
        data: trendChartData.oees,
        borderColor: THEME_COLORS.success,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
        yAxisID: 'y1',
        pointBackgroundColor: (ctx: any) =>
          ctx.dataIndex === selectedIndex ? THEME_COLORS.warning : undefined,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: THEME_COLORS.textSecondary,
          font: { size: 11 },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(13, 17, 23, 0.95)',
        titleColor: THEME_COLORS.text,
        bodyColor: THEME_COLORS.textSecondary,
        borderColor: THEME_COLORS.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: any[]) => {
            if (items.length === 0) return '';
            const idx = items[0].dataIndex;
            const ts = filteredData[idx]?.timestamp;
            return ts ? new Date(ts).toLocaleString('zh-CN') : '';
          },
        },
      },
      onClick: (_evt: any, elements: any) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const ts = filteredData[idx].timestamp;
          setSelectedSnapshot(ts);
        }
      },
    },
    scales: {
      x: {
        grid: { color: `${THEME_COLORS.border}30`, drawBorder: false },
        ticks: {
          color: THEME_COLORS.textSecondary,
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 12,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: `${THEME_COLORS.border}30`, drawBorder: false },
        ticks: { color: THEME_COLORS.textSecondary, font: { size: 10 } },
        title: {
          display: true,
          text: '时段产量 (件)',
          color: THEME_COLORS.textSecondary,
          font: { size: 11 },
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: {
          color: THEME_COLORS.success,
          font: { size: 10 },
          callback: (v: number) => `${v}%`,
        },
        title: {
          display: true,
          text: 'OEE (%)',
          color: THEME_COLORS.success,
          font: { size: 11 },
        },
      },
    },
  };

  const barChartData = {
    labels: machines.map((m) => m.name),
    datasets: [
      {
        label: '设备效率 (%)',
        data: machines.map((m) => m.efficiency),
        backgroundColor: machines.map((m) => {
          if (m.status === 'fault') return `${THEME_COLORS.error}80`;
          if (m.id === bottleneckMachineId) return `${THEME_COLORS.warning}80`;
          return `${THEME_COLORS.primary}80`;
        }),
        borderColor: machines.map((m) => {
          if (m.status === 'fault') return THEME_COLORS.error;
          if (m.id === bottleneckMachineId) return THEME_COLORS.warning;
          return THEME_COLORS.primary;
        }),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13, 17, 23, 0.95)',
        titleColor: THEME_COLORS.text,
        bodyColor: THEME_COLORS.textSecondary,
        borderColor: THEME_COLORS.border,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => `效率: ${ctx.raw.toFixed(1)}%`,
          afterLabel: (ctx: any) => {
            const m = machines[ctx.dataIndex];
            return [
              `状态: ${STATUS_LABELS[m.status]}`,
              `加工数: ${m.processedCount}`,
              `故障次数: ${m.faultCount}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: THEME_COLORS.textSecondary, font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: `${THEME_COLORS.border}30`, drawBorder: false },
        ticks: {
          color: THEME_COLORS.textSecondary,
          font: { size: 10 },
          callback: (v: number) => `${v}%`,
        },
      },
    },
  };

  const suggestions = useMemo(() => {
    const items: { icon: any; text: string; color: string }[] = [];

    if (bottleneck) {
      items.push({
        icon: Zap,
        color: THEME_COLORS.warning,
        text: `${bottleneck.name} 当前效率仅 ${bottleneck.efficiency.toFixed(0)}%，为瓶颈设备，建议优化`,
      });
    }

    if (currentQuality < 90) {
      items.push({
        icon: Target,
        color: THEME_COLORS.error,
        text: `良品率仅 ${currentQuality.toFixed(1)}%，低于目标90%，建议检查质量检测站`,
      });
    }

    if (liveFaultTime > 60000) {
      items.push({
        icon: AlertTriangle,
        color: THEME_COLORS.error,
        text: `累计故障时间已达 ${formatDuration(liveFaultTime)}，建议排查设备可靠性`,
      });
    }

    if (currentTaktTime > idealCycleTime * 1200 && totalProduced > 0) {
      items.push({
        icon: Clock,
        color: THEME_COLORS.warning,
        text: `实际节拍 ${(currentTaktTime / 1000).toFixed(2)}s 高于理想 ${idealCycleTime}s，建议提速`,
      });
    }

    if (items.length === 0) {
      items.push({
        icon: TrendingUp,
        color: THEME_COLORS.success,
        text: '生产线运行状态良好，各项指标均在正常范围',
      });
    }

    return items;
  }, [bottleneck, currentQuality, liveFaultTime, currentTaktTime, idealCycleTime, totalProduced]);

  return (
    <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-[680px] overflow-y-auto border-l border-gray-700/50 bg-gray-900/95 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/95 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
            >
              <BarChart3 className="h-5 w-5" style={{ color: THEME_COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">生产分析中心</h2>
              <p className="text-xs text-gray-400">实时数据 · 深度分析 · 智能洞察</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <TrendingUp className="h-3 w-3" />
                OEE 综合效率
              </div>
              <div className="mt-1 font-mono text-2xl font-bold" style={{ color: oeeColor(currentOEE) }}>
                {currentOEE.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Activity className="h-3 w-3" />
                生产效率
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-blue-400">
                {currentEfficiency.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Target className="h-3 w-3" />
                良品率
              </div>
              <div className="mt-1 font-mono text-2xl font-bold" style={{ color: qualityColor(currentQuality) }}>
                {currentQuality.toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-500">
                {totalGood}/{totalInspected} 件
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                生产节拍
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
                {currentTaktTime ? (currentTaktTime / 1000).toFixed(2) : '-'}s
              </div>
              <div className="text-[10px] text-gray-500">理想 {idealCycleTime}s/件</div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Package className="h-3 w-3" />
                总产量
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-cyan-400">
                {totalProduced}
              </div>
              <div className="text-[10px] text-gray-500">件</div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Zap className="h-3 w-3" />
                瓶颈设备
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-orange-400">
                {bottleneck ? bottleneck.name : '无'}
              </div>
              <div className="text-[10px] text-gray-500">
                {bottleneck ? `效率 ${bottleneck.efficiency.toFixed(0)}%` : '运行正常'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 rounded-lg border border-gray-700/30 bg-gray-800/30 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">运行时间</span>
              <span className="font-mono font-semibold text-green-400">{formatDuration(totalRunTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">故障时间</span>
              <span className="font-mono font-semibold text-red-400">{formatDuration(liveFaultTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">设备状态</span>
              <span
                className="font-mono font-semibold"
                style={{ color: runningMachines === machines.length ? THEME_COLORS.success : THEME_COLORS.warning }}
              >
                {runningMachines}/{machines.length}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <TrendingUp className="h-3.5 w-3.5" />
                产量与OEE趋势
              </div>
              <span className="text-[10px] text-gray-500">点击数据点查看历史快照</span>
            </div>
            <div className="h-56 rounded-lg border border-gray-700/30 bg-gray-800/30 p-3">
              <Line ref={lineChartRef} data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <BarChart3 className="h-3.5 w-3.5" />
              设备效率对比
            </div>
            <div className="h-48 rounded-lg border border-gray-700/30 bg-gray-800/30 p-3">
              <Bar ref={barChartRef} data={barChartData} options={barChartOptions} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <Lightbulb className="h-3.5 w-3.5" />
              智能改进建议
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-gray-700/30 bg-gray-800/30 px-4 py-3"
                  style={{ borderColor: `${s.color}30` }}
                >
                  <div
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${s.color}15` }}
                  >
                    <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                  </div>
                  <p className="text-sm text-gray-300">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <Activity className="h-3.5 w-3.5" />
              设备实时状态
            </div>
            <div className="grid grid-cols-2 gap-2">
              {machines.map((m) => {
                const statusColor = STATUS_COLORS[m.status];
                const statusLabel = STATUS_LABELS[m.status];
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-gray-700/30 bg-gray-800/30 px-3 py-2.5"
                    style={{ borderColor: `${statusColor}30` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
                        />
                        <span className="text-sm font-medium text-gray-200">{m.name}</span>
                      </div>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="text-gray-500">
                        加工数 <span className="font-mono text-gray-300">{m.processedCount}</span>
                      </div>
                      <div className="text-gray-500">
                        效率 <span className="font-mono" style={{ color: statusColor }}>{m.efficiency.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
