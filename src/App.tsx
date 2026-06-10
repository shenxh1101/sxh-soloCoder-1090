import { Scene } from './components/three/Scene';
import { AlertBar } from './components/ui/AlertBar';
import { ControlPanel } from './components/ui/ControlPanel';
import { EfficiencyPanel } from './components/ui/EfficiencyPanel';
import { MachineDetailPanel } from './components/ui/MachineDetailPanel';
import { ProductionChart } from './components/ui/ProductionChart';
import { Factory, Cpu, Activity } from 'lucide-react';

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0e14]">
      <div className="absolute left-4 top-4 z-40 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
          <Factory className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">
            数字孪生生产线监控系统
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              实时监控
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              <span className="text-green-400">运行中</span>
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0">
        <Scene />
      </div>

      <AlertBar />
      <ProductionChart />
      <ControlPanel />
      <MachineDetailPanel />
      <EfficiencyPanel />

      <div className="absolute right-4 bottom-[240px] z-30 rounded-lg border border-gray-700/50 bg-gray-900/70 px-3 py-2 text-xs text-gray-400 backdrop-blur-sm">
        <p className="mb-1 font-semibold text-gray-300">操作提示</p>
        <p>• 鼠标左键拖动：旋转视角</p>
        <p>• 鼠标滚轮：缩放</p>
        <p>• 点击机器：查看设备详情</p>
        <p>• 详情面板中模拟/修复故障</p>
      </div>
    </div>
  );
}
