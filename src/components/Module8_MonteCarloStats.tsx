import React, { useState } from 'react';
import { BarChart3, TrendingUp, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { MonteCarloSummary, SimulationParams, SimulationResults } from '../simpy-core/types';
import { runMonteCarloReplications } from '../simpy-core/scenarios';

interface Module8Props {
  results: SimulationResults | null;
  params: SimulationParams;
}

export const Module8_MonteCarloStats: React.FC<Module8Props> = ({ results, params }) => {
  const [repCount, setRepCount] = useState<number>(20);
  const [mcSummary, setMcSummary] = useState<MonteCarloSummary | null>(null);
  const [isRunningMC, setIsRunningMC] = useState<boolean>(false);

  const handleRunMonteCarlo = () => {
    setIsRunningMC(true);
    setTimeout(() => {
      const summary = runMonteCarloReplications(params, repCount);
      setMcSummary(summary);
      setIsRunningMC(false);
    }, 50);
  };

  if (!results) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 08</span>
            <span>·</span>
            <span>严谨统计推断</span>
            <span>·</span>
            <span>单次仿真指标与多轮蒙特卡洛 95% 置信区间</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            统计指标与多轮蒙特卡洛分析 (Statistical Analysis & Replications)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={repCount}
            onChange={(e) => setRepCount(parseInt(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
          >
            <option value={10}>10 轮重复试验 (Replications)</option>
            <option value={20}>20 轮重复试验 (推荐)</option>
            <option value={50}>50 轮高精度试验</option>
          </select>
          <button
            onClick={handleRunMonteCarlo}
            disabled={isRunningMC}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningMC ? 'animate-spin' : ''}`} />
            <span>{isRunningMC ? '蒙特卡洛运算中...' : '运行多轮独立试验'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Wq */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500">平均等待时间 Wq</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {results.avgWaitTime.toFixed(3)}s
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            理论解: {results.theoreticalWaitTime !== null ? `${results.theoreticalWaitTime.toFixed(2)}s` : '发散'}
          </div>
        </div>

        {/* KPI 2: Lq */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500">平均队列队长 Lq</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {results.avgQueueLength.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Little 定理: λWq={(params.lambda * results.avgWaitTime).toFixed(2)}
          </div>
        </div>

        {/* KPI 3: Utilization */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500">实测利用率 ρ_obs</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {(results.observedUtilization * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            理论负载: {(results.theoreticalRho * 100).toFixed(1)}%
          </div>
        </div>

        {/* KPI 4: Throughput */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500">系统产出吞吐量</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {results.systemThroughput.toFixed(3)} /s
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            共计完工: {results.completedEntities} 个
          </div>
        </div>

        {/* KPI 5: P95 */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500">P95 尾部等待时间</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {results.p95WaitTime.toFixed(3)}s
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            最长极端等待: {results.maxWaitTime.toFixed(2)}s
          </div>
        </div>

        {/* KPI 6: Reneged */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500">放弃/流失实体数</div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {results.renegedEntities} 个
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            流失率: {results.totalEntities > 0 ? ((results.renegedEntities / results.totalEntities) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Monte Carlo Summary Section */}
      <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            多轮独立重复试验 (Monte Carlo Replications) 与 95% 置信区间
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {mcSummary ? `已完成 ${mcSummary.replications} 轮运算` : '尚未运行多轮分析'}
          </span>
        </div>

        {!mcSummary ? (
          <div className="p-6 bg-white rounded-lg border border-dashed border-slate-200 text-center space-y-2">
            <div className="text-xs text-slate-600">
              单次离散事件仿真可能因特定随机数种子偶发偏倚，无法代表系统的真实统计稳态。
            </div>
            <button
              onClick={handleRunMonteCarlo}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              点击立即启动 {repCount} 轮独立 Seed 蒙特卡洛统计
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Confidence Interval Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CI for Wq */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">平均等待时间 Wq 的 95% 置信区间</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                  [{mcSummary.ci95LowWq.toFixed(3)}s, {mcSummary.ci95HighWq.toFixed(3)}s]
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  样本均值: {mcSummary.meanWq.toFixed(3)}s | 标准误差 SE: {mcSummary.stdErrorWq.toFixed(3)}
                </div>
              </div>

              {/* CI for Lq */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">平均队列队长 Lq 的 95% 置信区间</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold font-mono text-blue-700 tabular-nums">
                  [{mcSummary.ci95LowLq.toFixed(3)}, {mcSummary.ci95HighLq.toFixed(3)}]
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  样本均值: {mcSummary.meanLq.toFixed(3)} | 标准误差 SE: {mcSummary.stdErrorLq.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Distribution Bar Chart / Scatter of Replications */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-700">
                <span className="font-semibold">各轮独立实验平均等待时间分布 (Wq per Replication)</span>
                <span className="font-mono text-slate-500 text-[10px]">
                  理论期望值: {mcSummary.theoreticalWq ? `${mcSummary.theoreticalWq}s` : 'N/A'}
                </span>
              </div>

              <div className="flex items-end gap-1.5 h-24 pt-3 border-b border-slate-200">
                {(() => {
                  const maxVal = Math.max(...mcSummary.avgWaitTimes, 1);
                  return mcSummary.avgWaitTimes.map((val, idx) => {
                    const heightPercent = (val / maxVal) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative cursor-pointer"
                      >
                        <div
                          className="w-full bg-slate-800 hover:bg-emerald-600 rounded-t-xs transition-colors"
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                          Seed #{mcSummary.seeds[idx]}: {val.toFixed(2)}s
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>第 1 轮</span>
                <span>中心极限定理收敛检验 (n={mcSummary.replications})</span>
                <span>第 {mcSummary.replications} 轮</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
