import { AlertTriangle, X } from 'lucide-react';
import { useProductionStore } from '../../store/useProductionStore';
import { THEME_COLORS } from '../../utils/constants';

export function AlertBar() {
  const { alerts, dismissAlert, resetFault } = useProductionStore();

  if (alerts.length === 0) return null;

  const handleAlertClick = (alert: typeof alerts[0]) => {
    resetFault(alert.machineId);
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex flex-col gap-1 p-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="ml-auto flex max-w-md animate-slide-in items-center gap-3 rounded-lg border border-red-500/50 bg-red-900/80 px-4 py-2 text-white backdrop-blur-md shadow-lg"
          style={{
            boxShadow: `0 0 20px ${THEME_COLORS.error}40`,
          }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/30">
            <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-200">{alert.message}</p>
            <p className="text-xs text-red-400">
              {new Date(alert.timestamp).toLocaleTimeString('zh-CN')}
            </p>
          </div>
          <button
            onClick={() => handleAlertClick(alert)}
            className="rounded bg-red-500/30 px-3 py-1 text-xs font-bold text-red-200 transition-all hover:bg-red-500/50"
          >
            修复
          </button>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="ml-1 rounded p-1 text-red-400 transition-all hover:bg-red-500/30 hover:text-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
