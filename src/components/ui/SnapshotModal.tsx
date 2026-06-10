import { useMemo } from 'react';
import { X, Clock, Activity, Package, AlertTriangle } from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { STATUS_COLORS, STATUS_LABELS, THEME_COLORS } from '../../utils/constants';
import { formatDuration } from '../../utils/efficiencyCalculator';

export function SnapshotModal() {
  const { productionHistory, selectedSnapshotTimestamp, setSelectedSnapshot } = useProductionStore();

  const snapshot = useMemo(() => {
    if (!selectedSnapshotTimestamp) return null;
    return productionHistory.find((r) => r.timestamp === selectedSnapshotTimestamp);
  }, [productionHistory, selectedSnapshotTimestamp]);

  if (!snapshot || !selectedSnapshotTimestamp) return null;

  const handleClose = () => setSelectedSnapshot(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[600px] max-h-[80vh] overflow-y-auto rounded-xl border border-gray-700/50 bg-gray-900/95 shadow-2xl"
        style={{ boxShadow: `0 0 60px ${THEME_COLORS.primary}30` }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/95 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
            >
              <Clock className="h-5 w-5" style={{ color: THEME_COLORS.primary }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">历史时刻快照</h3>
              <p className="text-xs text-gray-400">
                {new Date(snapshot.timestamp).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
              <div className="text-xs text-gray-400">总产量</div>
              <div className="mt-1 font-mono text-xl font-bold text-blue-400">{snapshot.count}</div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
              <div className="text-xs text-gray-400">生产效率</div>
              <div className="mt-1 font-mono text-xl font-bold text-green-400">{snapshot.efficiency.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
              <div className="text-xs text-gray-400">综合OEE</div>
              <div className="mt-1 font-mono text-xl font-bold text-purple-400">{snapshot.oee.toFixed(1)}%</div>
            </div>
          </div>

          {snapshot.goodCount !== undefined && snapshot.totalInspected !== undefined && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
                <div className="text-xs text-gray-400">良品率</div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                  {snapshot.totalInspected > 0 ? ((snapshot.goodCount / snapshot.totalInspected) * 100).toFixed(1) : 'N/A'}%
                </div>
                <div className="mt-0.5 text-[10px] text-gray-500">
                  {snapshot.goodCount}/{snapshot.totalInspected} 件
                </div>
              </div>
              <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
                <div className="text-xs text-gray-400">生产节拍</div>
                <div className="mt-1 font-mono text-xl font-bold text-amber-400">
                  {snapshot.taktTime ? (snapshot.taktTime / 1000).toFixed(2) : 'N/A'}s
                </div>
              </div>
              <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-3">
                <div className="text-xs text-gray-400">故障时长</div>
                <div className="mt-1 font-mono text-xl font-bold text-red-400">
                  {formatDuration(snapshot.faultDuration)}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <Activity className="h-3.5 w-3.5" />
              各设备状态
            </div>
            <div className="space-y-2">
              {snapshot.machineStates && snapshot.machineStates.length > 0 ? (
                snapshot.machineStates.map((ms) => {
                  const statusColor = STATUS_COLORS[ms.status];
                  const statusLabel = STATUS_LABELS[ms.status];
                  return (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/30 px-4 py-2.5"
                      style={{ borderColor: `${statusColor}30` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${statusColor}15` }}
                        >
                          {ms.status === 'fault' ? (
                            <AlertTriangle className="h-4 w-4" style={{ color: statusColor }} />
                          ) : (
                            <Activity className="h-4 w-4" style={{ color: statusColor }} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{ms.name}</div>
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">加工数</div>
                          <div className="font-mono text-gray-300">{ms.processedCount}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">效率</div>
                          <div className="font-mono" style={{ color: statusColor }}>
                            {ms.efficiency.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-gray-500">
                  暂无设备状态数据
                </div>
              )}
            </div>
          </div>

          {snapshot.bottleneckMachineId && (
            <div
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
              style={{ borderStyle: 'dashed' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">瓶颈设备</span>
              </div>
              <div className="mt-1 text-sm text-amber-200">
                {snapshot.bottleneckMachineId} 为当时效率最低的设备，需重点关注
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="rounded-lg bg-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
