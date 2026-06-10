import { useEffect, useMemo, useState, useCallback } from 'react';
import { useProductionStore } from '../../store/useProductionStore';
import { STATUS_COLORS, STATUS_LABELS, THEME_COLORS } from '../../utils/constants';
import { formatDuration } from '../../utils/efficiencyCalculator';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Activity,
  AlertTriangle,
  Package,
  Gauge,
} from 'lucide-react';

const ONE_HOUR_MS = 3600000;

export function HistoryPlaybackPanel() {
  const { activeView, setActiveView, productionHistory, machines, idealCycleTime } =
    useProductionStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const windowStart = now - ONE_HOUR_MS;
    return productionHistory.filter((r) => r.timestamp >= windowStart);
  }, [productionHistory]);

  const currentSnapshot = filteredHistory[currentIndex] ?? null;

  useEffect(() => {
    if (!isPlaying || filteredHistory.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= filteredHistory.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, filteredHistory.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && currentIndex >= filteredHistory.length - 1) {
        setCurrentIndex(0);
      }
      return !prev;
    });
  }, [currentIndex, filteredHistory.length]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(Number(e.target.value));
    setIsPlaying(false);
  }, []);

  const handleSkipBack = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentIndex(Math.max(0, filteredHistory.length - 1));
    setIsPlaying(false);
  }, [filteredHistory.length]);

  if (activeView !== 'playback') return null;

  const maxIndex = Math.max(0, filteredHistory.length - 1);

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

  return (
    <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-[720px] overflow-y-auto border-l border-gray-700/50 bg-gray-900/95 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/95 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
            >
              <Clock className="h-5 w-5" style={{ color: THEME_COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">历史回放</h2>
              <p className="text-xs text-gray-400">回溯过去一小时生产记录</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('realtime')}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Clock className="mb-3 h-10 w-10" />
              <p className="text-sm">暂无历史数据</p>
              <p className="text-xs text-gray-600">生产运行后将自动记录</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-700/30 bg-gray-800/50 px-6 py-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSkipBack}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    <SkipBack className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                    style={{
                      backgroundColor: THEME_COLORS.primary,
                      boxShadow: `0 0 20px ${THEME_COLORS.primary}40`,
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 translate-x-0.5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={handleSkipForward}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    <SkipForward className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">速度</span>
                  {([1, 2, 4] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor:
                          playbackSpeed === speed ? THEME_COLORS.primary : 'transparent',
                        color: playbackSpeed === speed ? '#fff' : THEME_COLORS.textSecondary,
                        border: `1px solid ${playbackSpeed === speed ? THEME_COLORS.primary : THEME_COLORS.border}`,
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <div className="w-full">
                  <input
                    type="range"
                    min={0}
                    max={maxIndex}
                    value={currentIndex}
                    onChange={handleSliderChange}
                    className="w-full accent-blue-500"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                    <span>
                      {filteredHistory[0]
                        ? new Date(filteredHistory[0].timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : ''}
                    </span>
                    <span>
                      {filteredHistory[maxIndex]
                        ? new Date(filteredHistory[maxIndex].timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">
                    {currentSnapshot
                      ? new Date(currentSnapshot.timestamp).toLocaleString('zh-CN')
                      : '--'}
                  </span>
                </div>
              </div>

              {currentSnapshot && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Package className="h-3 w-3" />
                        产量
                      </div>
                      <div className="mt-1 font-mono text-2xl font-bold text-cyan-400">
                        {currentSnapshot.count}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Activity className="h-3 w-3" />
                        效率
                      </div>
                      <div className="mt-1 font-mono text-2xl font-bold text-blue-400">
                        {currentSnapshot.efficiency.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Gauge className="h-3 w-3" />
                        OEE
                      </div>
                      <div
                        className="mt-1 font-mono text-2xl font-bold"
                        style={{ color: oeeColor(currentSnapshot.oee) }}
                      >
                        {currentSnapshot.oee.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Package className="h-3 w-3" />
                        良品率
                      </div>
                      <div
                        className="mt-1 font-mono text-2xl font-bold"
                        style={{
                          color: qualityColor(
                            currentSnapshot.totalInspected > 0
                              ? (currentSnapshot.goodCount / currentSnapshot.totalInspected) * 100
                              : 0
                          ),
                        }}
                      >
                        {currentSnapshot.totalInspected > 0
                          ? ((currentSnapshot.goodCount / currentSnapshot.totalInspected) * 100).toFixed(1)
                          : '0.0'}
                        %
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {currentSnapshot.goodCount}/{currentSnapshot.totalInspected} 件
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        节拍
                      </div>
                      <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
                        {currentSnapshot.taktTime > 0
                          ? (currentSnapshot.taktTime / 1000).toFixed(2)
                          : '-'}
                        s
                      </div>
                      <div className="text-[10px] text-gray-500">理想 {idealCycleTime}s/件</div>
                    </div>
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/50 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <AlertTriangle className="h-3 w-3" />
                        故障时长
                      </div>
                      <div className="mt-1 font-mono text-2xl font-bold text-red-400">
                        {formatDuration(currentSnapshot.faultDuration)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                      <Activity className="h-3.5 w-3.5" />
                      设备状态快照
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentSnapshot.machineStates.map((ms) => {
                        const statusColor = STATUS_COLORS[ms.status];
                        const statusLabel = STATUS_LABELS[ms.status];
                        const isFault = ms.status === 'fault';
                        return (
                          <div
                            key={ms.id}
                            className={`rounded-lg border bg-gray-800/30 px-3 py-2.5 ${
                              isFault ? 'animate-pulse' : ''
                            }`}
                            style={{
                              borderColor: isFault ? `${statusColor}60` : `${statusColor}30`,
                              boxShadow: isFault ? `0 0 12px ${statusColor}30` : 'none',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isFault && (
                                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: statusColor }} />
                                )}
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: statusColor,
                                    boxShadow: `0 0 8px ${statusColor}`,
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-200">{ms.name}</span>
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
                                加工数{' '}
                                <span className="font-mono text-gray-300">{ms.processedCount}</span>
                              </div>
                              <div className="text-gray-500">
                                效率{' '}
                                <span className="font-mono" style={{ color: statusColor }}>
                                  {ms.efficiency.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/30 px-4 py-3 text-xs text-gray-400">
                <span>
                  记录{' '}
                  <span className="font-mono text-gray-300">
                    {currentIndex + 1}
                  </span>{' '}
                  / {filteredHistory.length}
                </span>
                {filteredHistory.length > 1 && (
                  <span>
                    {new Date(filteredHistory[0].timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    —{' '}
                    {new Date(filteredHistory[maxIndex].timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
