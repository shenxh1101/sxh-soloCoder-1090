import { useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useProductionStore } from '../../store/useProductionStore';
import { THEME_COLORS } from '../../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ONE_HOUR_MS = 3600000;

export function ProductionChart() {
  const { productionHistory } = useProductionStore();
  const chartRef = useRef<ChartJS<'line'>>(null);

  const filteredData = useMemo(() => {
    const now = Date.now();
    const windowStart = now - ONE_HOUR_MS;
    return productionHistory.filter((r) => r.timestamp >= windowStart);
  }, [productionHistory]);

  const incrementalData = useMemo(() => {
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

  const chartData = {
    labels: incrementalData.labels,
    datasets: [
      {
        label: '时段产量',
        data: incrementalData.counts,
        borderColor: THEME_COLORS.primary,
        backgroundColor: `${THEME_COLORS.primary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'OEE (%)',
        data: incrementalData.oees,
        borderColor: THEME_COLORS.success,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
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
        displayColors: true,
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
          callback: (value: number) => `${value}%`,
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

  const timeSpan = useMemo(() => {
    if (filteredData.length < 2) return '不足1分钟';
    const span = filteredData[filteredData.length - 1].timestamp - filteredData[0].timestamp;
    const mins = Math.round(span / 60000);
    return mins >= 60 ? `过去${Math.round(mins / 60 * 10) / 10}小时` : `过去${mins}分钟`;
  }, [filteredData]);

  return (
    <div className="fixed left-4 top-1/2 z-30 -translate-y-1/2">
      <div
        className="w-80 rounded-xl border border-gray-700/50 bg-gray-900/80 p-4 backdrop-blur-md shadow-2xl"
        style={{ boxShadow: `0 0 40px ${THEME_COLORS.primary}20` }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">生产量趋势</h3>
          <span className="text-xs text-gray-500">{timeSpan}</span>
        </div>
        <div className="h-48">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="text-gray-500">
            数据点: <span className="font-mono text-gray-300">{filteredData.length}</span>
          </div>
          <div className="text-gray-500">
            更新间隔: <span className="font-mono text-gray-300">5s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
