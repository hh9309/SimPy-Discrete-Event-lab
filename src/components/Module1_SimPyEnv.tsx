import React, { useState } from 'react';
import { Layers, ArrowRight, Clock, HelpCircle, Activity } from 'lucide-react';
import { SimPyEnvironment } from '../simpy-core/engine';

interface Module1Props {
  envInstance: SimPyEnvironment | null;
  onStepNextEvent?: () => void;
  isSimulating: boolean;
}

export const Module1_SimPyEnv: React.FC<Module1Props> = ({
  envInstance,
  onStepNextEvent,
  isSimulating,
}) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Inspect current pending events from the priority queue heap
  const pendingEvents = envInstance ? envInstance.pendingEvents.slice(0, 8) : [];
  const currentNow = envInstance ? envInstance.now : 0;
  const nextEventTime = pendingEvents.length > 0 ? pendingEvents[0].time : currentNow;
  const timeJump = Math.max(0, nextEventTime - currentNow);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Module Title & Mathematical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 01</span>
            <span>·</span>
            <span>核心运行架构</span>
            <span>·</span>
            <span>时钟推进与优先队列堆</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            SimPy 仿真环境基础构建 (Environment & Event Priority Queue)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showFormulaDetails ? '收起代数推导' : '查看代数推导'}</span>
          </button>
          {onStepNextEvent && (
            <button
              onClick={onStepNextEvent}
              disabled={isSimulating || !envInstance || pendingEvents.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>单步弹出堆顶事件 (Step)</span>
            </button>
          )}
        </div>
      </div>

      {/* Mathematical Principle Callout */}
      {showFormulaDetails && (
        <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-lg text-xs space-y-3 leading-relaxed text-slate-700">
          <p className="font-medium text-slate-900">
            代数原理：优先队列 (Binary Min-Heap) 驱动的非均匀时间跳跃推进
          </p>
          <div className="font-mono bg-white p-3 rounded border border-slate-200 text-slate-800">
            {'时钟跳跃公理：t_(k+1) = min_{e in E} { t_e } = t_k + Δt_jump'}
            <br />
            {'二叉堆比较三元组：Key(e) = (Timestamp ∈ R⁺, Priority ∈ Z, EventID ∈ N)'}
          </div>
          <p>
            与连续仿真依赖固定小步长 Δt → 0 进行微分数值迭代不同，SimPy 采用<strong>离散事件驱动 (Discrete-Event Driven)</strong>。在两个相邻事件触发点之间，系统状态保持完全恒定，仿真器直接将虚拟时钟跳跃至堆顶最早发生的时刻，单次时间推进算法复杂度为 O(log N)，彻底避免了空闲时钟滴答的计算浪费。
          </p>
        </div>
      )}

      {/* Clock Jump & Heap Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Clock Jump Visualizer */}
        <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              当前虚拟时钟与下一跳跃点
            </span>
            <span className="text-xs font-mono text-slate-500">env.now</span>
          </div>

          <div className="flex items-center justify-between py-2 border-y border-slate-200/60">
            <div>
              <div className="text-xs text-slate-500">当前仿真时刻 t</div>
              <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {currentNow.toFixed(3)}s
              </div>
            </div>
            <div className="text-center px-3 py-1 bg-white rounded border border-slate-200">
              <div className="text-[10px] text-slate-400">时间跳跃步长</div>
              <div className="text-xs font-mono font-semibold text-emerald-600 tabular-nums">
                + {timeJump.toFixed(3)}s
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">下一事件时刻 t+1</div>
              <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {nextEventTime.toFixed(3)}s
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span>待处理事件堆深 (Queue Depth):</span>
              <span className="font-mono font-medium text-slate-900">{envInstance?.pendingEventsCount || 0} 个事件</span>
            </div>
            <div className="flex justify-between">
              <span>时钟推进模式:</span>
              <span className="text-slate-900 font-medium">env.run(until=T)</span>
            </div>
          </div>
        </div>

        {/* Right: Min-Heap Queue State Visualizer */}
        <div className="lg:col-span-2 p-4 bg-slate-50/50 rounded-lg border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              优先队列事件堆检视 (Priority Queue Min-Heap Head)
            </span>
            <span className="text-xs text-slate-500">按时间戳升序排序</span>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
              <Activity className="w-5 h-5 mb-1 text-slate-300" />
              <span>事件堆为空（无等待调度事件）</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {pendingEvents.map((item, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                      isTop
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-mono px-1 rounded ${
                          isTop ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isTop ? '堆顶 Top' : `#${idx + 1}`}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">ID: {item.id}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-800 text-xs">
                      T = {item.time.toFixed(2)}s
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 truncate">
                      优先级: {item.priority}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
