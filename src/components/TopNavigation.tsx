import React from 'react';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface TopNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunSimulation: () => void;
  onResetSimulation: () => void;
  isSimulating: boolean;
  virtualTime: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  setActiveTab,
  onRunSimulation,
  onResetSimulation,
  isSimulating,
  virtualTime,
}) => {
  // Navigation tabs strictly conforming to the user's layout requirements:
  // 综合实验台 -> 知识导引 -> 经典排队案例 -> 生产物流流水线 -> 蒙特卡洛统计 -> SimPy代码引擎 -> AI仿真导引 -> 仿真报告
  const navTabs = [
    { id: 'workbench', label: '综合实验台' },
    { id: 'principles', label: '知识导引' },
    { id: 'scenarios', label: '经典排队案例' },
    { id: 'logistics', label: '生产物流流水线' },
    { id: 'montecarlo', label: '蒙特卡洛统计' },
    { id: 'code', label: 'SimPy代码引擎' },
    { id: 'knowledge', label: 'AI仿真导引' },
    { id: 'reports', label: '仿真报告' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element Brand wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('workbench')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors text-left"
          >
            SimPy 离散事件仿真实验室
          </button>
          <span className="hidden xl:inline-block text-xs font-mono tabular-nums text-slate-500">
            虚拟时钟: T={virtualTime.toFixed(1)}s
          </span>
        </div>

        {/* Zone 2: Navigation slices with 知识导引 next to 综合实验台, and 仿真报告 next to AI仿真导引 */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 overflow-x-auto">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetSimulation}
            title="重置仿真实验"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRunSimulation}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg transition-all shadow-xs whitespace-nowrap ${
              isSimulating
                ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isSimulating ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>仿真演播中...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>运行仿真</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 gap-1 border-t border-slate-100 bg-slate-50 text-xs">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
