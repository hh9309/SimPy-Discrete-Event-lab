import React, { useState } from 'react';
import { Package, ArrowRight, AlertOctagon, BatteryCharging, ShieldAlert } from 'lucide-react';
import { SimulationParams, SimulationResults } from '../simpy-core/types';
import { runLogisticsSimulation } from '../simpy-core/scenarios';

interface Module6Props {
  baseParams: SimulationParams;
}

export const Module6_LogisticsAssembly: React.FC<Module6Props> = ({ baseParams }) => {
  const [bufferCap, setBufferCap] = useState<number>(8);
  const [machiningRate, setMachiningRate] = useState<number>(0.9);
  const [qcRate, setQcRate] = useState<number>(0.65);
  const [results, setResults] = useState<SimulationResults | null>(() =>
    runLogisticsSimulation({
      ...baseParams,
      bufferCapacity: 8,
      machiningRate: 0.9,
      qcRate: 0.65,
    })
  );

  const handleRun = () => {
    const res = runLogisticsSimulation({
      ...baseParams,
      bufferCapacity: bufferCap,
      machiningRate,
      qcRate,
    });
    setResults(res);
  };

  const isBottleneckAtQC = machiningRate > qcRate;
  const isBottleneckAtMachine = qcRate > machiningRate;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 06</span>
            <span>·</span>
            <span>工业离散流向</span>
            <span>·</span>
            <span>缓冲区溢出、上游阻塞与下游饥饿</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            生产与物流流向仿真 (Manufacturing & Logistics Assembly Line)
          </h2>
        </div>
        <button
          onClick={handleRun}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          重新运行装配仿真
        </button>
      </div>

      {/* Industrial Flow Schematic */}
      <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900">装配流向拓扑：仓储 → 加工 → 缓冲区 → 质检包装</span>
          <span className="text-slate-500 font-mono">SimPy Container & Resource Pipeline</span>
        </div>

        {/* Pipeline Nodes Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          {/* Node 1: Raw Warehouse */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">1. 原料储料仓</span>
              <Package className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-[11px] text-slate-600">simpy.Container</div>
            <div className="font-mono text-xs font-semibold text-slate-900">
              容量: 200 / 初始: 50
            </div>
            <div className="text-[10px] text-slate-400">定时批量补给 (+5件/周期)</div>
          </div>

          {/* Node 2: Machining Station */}
          <div
            className={`p-4 rounded-lg border space-y-2 ${
              isBottleneckAtMachine ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">2. 数控机加工位</span>
              {isBottleneckAtMachine && (
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1 rounded">
                  瓶颈
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-600">加工速率 μ₁: {machiningRate}/s</div>
            <div className="text-[10px] text-slate-500">
              {isBottleneckAtQC ? '上游可能被阻塞 (Blocking)' : '正常推进'}
            </div>
          </div>

          {/* Node 3: Intermediate Buffer */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">3. 中间缓存区</span>
              <BatteryCharging className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-[11px] text-slate-600">容积上限: {bufferCap} 件</div>
            <div className="text-[10px] text-rose-600 font-medium">
              满溢 $\to$ 机加停摆 | 空置 $\to$ 质检饥饿
            </div>
          </div>

          {/* Node 4: QC Station */}
          <div
            className={`p-4 rounded-lg border space-y-2 ${
              isBottleneckAtQC ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">4. 质检包装工位</span>
              {isBottleneckAtQC && (
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1 rounded">
                  核心瓶颈
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-600">质检速率 μ₂: {qcRate}/s</div>
            <div className="text-[10px] text-slate-500">决定最终系统产出 (TOC 约束理论)</div>
          </div>
        </div>

        {/* Sliders for line balancing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200/60">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">机加工速率 (μ₁)</span>
              <span className="font-mono font-semibold">{machiningRate} /s</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.5"
              step="0.05"
              value={machiningRate}
              onChange={(e) => setMachiningRate(parseFloat(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">中间缓冲区容积 (Buffer Cap)</span>
              <span className="font-mono font-semibold">{bufferCap} 件</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={bufferCap}
              onChange={(e) => setBufferCap(parseInt(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">质检包装速率 (μ₂)</span>
              <span className="font-mono font-semibold">{qcRate} /s</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.05"
              value={qcRate}
              onChange={(e) => setQcRate(parseFloat(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Assembly Metrics & Bottleneck Analysis */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">合格品总产出</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {results.completedEntities} 件
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              系统吞吐: {results.systemThroughput.toFixed(3)} 件/s
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">上游阻塞事件 (Blocking)</div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
              {results.blockingPeriods?.length || 0} 次
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              因中间缓冲区满导致机加工位等待
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">下游饥饿事件 (Starvation)</div>
            <div className="text-xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
              {results.starvationPeriods?.length || 0} 次
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              因缓冲区料尽导致质检工位空转
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">整线协同效率评价</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              {isBottleneckAtQC
                ? '受到质检节拍约束'
                : isBottleneckAtMachine
                ? '机加节拍为全线瓶颈'
                : '节拍平衡良好'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">根据 Goldratt 约束理论优化</div>
          </div>
        </div>
      )}
    </div>
  );
};
