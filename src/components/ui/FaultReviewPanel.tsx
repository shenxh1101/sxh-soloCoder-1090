import { useMemo, useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Package,
  Filter,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { STATUS_COLORS, STATUS_LABELS, THEME_COLORS } from '../../utils/constants';
import { formatDuration } from '../../utils/efficiencyCalculator';

interface FaultRecordWithMachine {
  machineId: string;
  machineName: string;
  id: string;
  timestamp: number;
  resolvedAt: number | null;
  duration: number;
  lostProduction: number;
}

export function FaultReviewPanel() {
  const {
    activeView,
    setActiveView,
    machines,
    reviewTimeFilter,
    setReviewTimeFilter,
    reviewMachineFilter,
    setReviewMachineFilter,
  } = useProductionStore();
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);

  if (activeView !== 'review') return null;

  const summaryStats = useMemo(() => {
    const totalFaultCount = machines.reduce((sum, m) => sum + m.faultCount, 0);

    const now = Date.now();
    const totalFaultDuration = machines.reduce((sum, m) => {
      let duration = m.totalFaultDuration;
      if (m.status === 'fault' && m.faultTime) {
        duration += now - m.faultTime;
      }
      return sum + duration;
    }, 0);

    const totalLostProduction = machines.reduce(
      (sum, m) =>
        sum +
        m.faultRecords.reduce((s, fr) => s + fr.lostProduction, 0),
      0
    );

    return { totalFaultCount, totalFaultDuration, totalLostProduction };
  }, [machines]);

  const filteredRecords = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const oneHourAgo = now - 3600000;

    let allRecords: FaultRecordWithMachine[] = [];

    for (const m of machines) {
      for (const fr of m.faultRecords) {
        allRecords.push({
          machineId: m.id,
          machineName: m.name,
          ...fr,
        });
      }
    }

    allRecords = allRecords.filter((fr) => {
      if (reviewMachineFilter && fr.machineId !== reviewMachineFilter) return false;

      if (reviewTimeFilter === 'today' && fr.timestamp < todayStartMs) return false;
      if (reviewTimeFilter === 'hour' && fr.timestamp < oneHourAgo) return false;

      return true;
    });

    allRecords.sort((a, b) => b.timestamp - a.timestamp);

    return allRecords;
  }, [machines, reviewTimeFilter, reviewMachineFilter]);

  const selectedMachine = machines.find((m) => m.id === reviewMachineFilter);

  return (
    <div className="fixed right-4 top-20 bottom-[260px] z-40 w-[500px] overflow-y-auto">
      <div className="h-full rounded-xl border border-gray-700/50 bg-gray-900/95 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between rounded-t-xl border-b border-gray-700/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${THEME_COLORS.error}20` }}
            >
              <Wrench className="h-4 w-4" style={{ color: THEME_COLORS.error }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">故障复盘分析</h3>
            </div>
          </div>
          <button
            onClick={() => setActiveView('realtime')}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-400">时间:</span>
              {(['today', 'hour', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setReviewTimeFilter(filter)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    reviewTimeFilter === filter
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {filter === 'today' ? '今天' : filter === 'hour' ? '最近1小时' : '全部'}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setMachineDropdownOpen(!machineDropdownOpen)}
                className="flex items-center gap-1 rounded-md border border-gray-600/50 bg-gray-800/50 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
              >
                <span>{selectedMachine ? selectedMachine.name : '全部设备'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {machineDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 rounded-md border border-gray-600/50 bg-gray-800 shadow-lg z-50">
                  <button
                    onClick={() => {
                      setReviewMachineFilter(null);
                      setMachineDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                      reviewMachineFilter === null
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    全部设备
                  </button>
                  {machines.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setReviewMachineFilter(m.id);
                        setMachineDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                        reviewMachineFilter === m.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <AlertTriangle className="h-3 w-3" />
                总故障次数
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-orange-400">
                {summaryStats.totalFaultCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                总停机时长
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-red-400">
                {formatDuration(summaryStats.totalFaultDuration)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Package className="h-3 w-3" />
                总损失产量
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-yellow-400">
                {summaryStats.totalLostProduction}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
              <Wrench className="h-3 w-3" />
              故障记录
              <span className="ml-auto rounded bg-gray-700/50 px-1.5 py-0.5 text-xs">
                {filteredRecords.length} 条记录
              </span>
            </div>
            <div className="space-y-2">
              {filteredRecords.length === 0 ? (
                <div className="rounded-lg border border-gray-700/30 bg-gray-800/30 p-6 text-center text-xs text-gray-500">
                  暂无故障记录
                </div>
              ) : (
                filteredRecords.map((fr) => {
                  const isOngoing = fr.resolvedAt === null;
                  const displayDuration = isOngoing
                    ? Date.now() - fr.timestamp + fr.duration
                    : fr.duration;

                  return (
                    <div
                      key={fr.id}
                      className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isOngoing ? 'animate-pulse' : ''
                            }`}
                            style={{
                              backgroundColor: isOngoing
                                ? STATUS_COLORS.fault
                                : STATUS_COLORS.running,
                            }}
                          />
                          <span className="text-xs font-medium text-white">
                            {fr.machineName}
                          </span>
                          {isOngoing && (
                            <span
                              className="rounded px-1.5 py-0.5 text-xs font-semibold text-red-400 animate-pulse"
                              style={{ backgroundColor: `${STATUS_COLORS.fault}20` }}
                            >
                              故障进行中
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDuration(displayDuration)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-400">
                          <span className="text-gray-500">开始: </span>
                          {new Date(fr.timestamp).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        {fr.lostProduction > 0 && (
                          <div className="text-yellow-400">
                            损失 {fr.lostProduction} 件
                          </div>
                        )}
                      </div>
                      {!isOngoing && (
                        <div className="mt-1 text-xs text-gray-400">
                          <span className="text-gray-500">修复: </span>
                          {new Date(fr.resolvedAt!).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
