import React, { useState } from 'react';
import { ShieldAlert, Zap, Users, Play, RefreshCw } from 'lucide-react';
import { ResourceKind } from '../simpy-core/types';

interface Module3Props {
  currentResourceType: ResourceKind;
  onSelectResourceType: (kind: ResourceKind) => void;
}

export const Module3_ResourceMechanisms: React.FC<Module3Props> = ({
  currentResourceType,
  onSelectResourceType,
}) => {
  // Preemption interactive stage
  const [preemptStage, setPreemptStage] = useState<number>(0); // 0: Normal serving, 1: High prio arrives, 2: Preempting & resume

  const resourceModes = [
    {
      id: 'Resource' as ResourceKind,
      title: 'simpy.Resource',
      badge: '标准 FIFO',
      desc: '先来先服务 (FCFS)。所有请求实体按时间到达次序排入先进先出队列，不可插队亦不可中断。',
      useCase: '银行常规存取款窗口、通用单通道排队',
    },
    {
      id: 'PriorityResource' as ResourceKind,
      title: 'simpy.PriorityResource',
      badge: '非抢占优先级',
      desc: '高优先级请求者（Priority数值小）先出队，但正在接受服务的低优先级实体不会被打断。',
      useCase: 'VIP 客户优先挂号、医院普通门诊分诊',
    },
    {
      id: 'PreemptiveResource' as ResourceKind,
      title: 'simpy.PreemptiveResource',
      badge: '硬实时抢占',
      desc: '若全部服务台已满，新到达的高优先级请求直接强行剥夺正在服务的最低优先级实体控制权。',
      useCase: '急诊创伤抢救室抢占、CPU 高优先级中断调度',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 03</span>
            <span>·</span>
            <span>资源调度与排队规则</span>
            <span>·</span>
            <span>FIFO / Priority / Preemption 抢占式恢复</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            资源竞争与抢占机制 (Resource Preemption Visualizer)
          </h2>
        </div>
        <div className="text-xs text-slate-500">
          选择不同 SimPy 资源类型并观察调度差异
        </div>
      </div>

      {/* Resource Types Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {resourceModes.map((mode) => {
          const isSelected = currentResourceType === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectResourceType(mode.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold">{mode.title}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded ${
                    isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {mode.badge}
                </span>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isSelected ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {mode.desc}
              </p>
              <div
                className={`text-[11px] mt-3 pt-2 border-t ${
                  isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                }`}
              >
                适用：{mode.useCase}
              </div>
            </button>
          );
        })}
      </div>

      {/* Preemption Mechanism Step Interactive Demonstration */}
      <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-slate-900">
              PreemptiveResource 抢占与恢复 (Preemption & Resume) 物理演播
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreemptStage((prev) => (prev + 1) % 4)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>演播下一步 (阶段 {preemptStage + 1}/4)</span>
            </button>
            <button
              onClick={() => setPreemptStage(0)}
              className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Stage Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {/* Box 1: Low Priority Job A */}
          <div
            className={`p-4 rounded-lg border transition-all ${
              preemptStage === 1 || preemptStage === 2
                ? 'bg-rose-50 border-rose-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-800">实体 A (普通优先级 = 10)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  preemptStage === 1 || preemptStage === 2
                    ? 'bg-rose-200 text-rose-800 font-bold'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {preemptStage === 0 && '服务中 (进行4s / 需10s)'}
                {preemptStage === 1 && '⚠️ 被紧急中断！剩余6s'}
                {preemptStage === 2 && '挂起等待高优先级完毕'}
                {preemptStage === 3 && '恢复服务，处理剩余6s'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  preemptStage === 1 || preemptStage === 2
                    ? 'bg-rose-500'
                    : preemptStage === 3
                    ? 'bg-emerald-500'
                    : 'bg-blue-600'
                }`}
                style={{
                  width:
                    preemptStage === 0
                      ? '40%'
                      : preemptStage === 1 || preemptStage === 2
                      ? '40%'
                      : '100%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {preemptStage === 0 && '实体 A 正常占用单服务台推进虚拟时钟。'}
              {preemptStage === 1 && 'SimPy 向生成器注入 simpy.Interrupt 异常，计算剩余服务时间 6s 并存盘。'}
              {preemptStage === 2 && '实体 A 被重新插回优先级队列首部，等待服务台空出。'}
              {preemptStage === 3 && '服务台释放，实体 A 从第 4s 位置无缝衔接完成剩余 6s。'}
            </p>
          </div>

          {/* Box 2: High Priority Job B */}
          <div
            className={`p-4 rounded-lg border transition-all ${
              preemptStage >= 1
                ? 'bg-amber-50 border-amber-300 shadow-xs'
                : 'bg-white border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-800">实体 B (极高紧急 = 1)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  preemptStage >= 1 ? 'bg-amber-200 text-amber-800 font-bold' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {preemptStage === 0 && '尚未到达'}
                {preemptStage === 1 && '⚡ 抢占服务台'}
                {preemptStage === 2 && '独占服务台执行 (需3s)'}
                {preemptStage === 3 && '已顺利完成离场'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{
                  width: preemptStage === 0 ? '0%' : preemptStage === 1 ? '30%' : preemptStage === 2 ? '75%' : '100%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {preemptStage === 0 && '等待突发到达事件...'}
              {preemptStage === 1 && '申请 preempt=True，检测到服务台已满且当前用户优先级低于自己，触发抢占。'}
              {preemptStage === 2 && '优先享有全部服务资源，零排队等待时间。'}
              {preemptStage === 3 && '完成所有工序，调用 release() 归还服务台。'}
            </p>
          </div>

          {/* Box 3: Single Server Resource */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  服务台 Server #1 状态
                </span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded">
                  Capacity: 1
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs font-mono space-y-1">
                <div className="text-slate-500">当前占有人:</div>
                <div className="font-semibold text-slate-900">
                  {preemptStage === 0 && '实体 A (优先级=10)'}
                  {preemptStage === 1 && '实体 B (优先级=1 [抢占夺取])'}
                  {preemptStage === 2 && '实体 B (优先级=1)'}
                  {preemptStage === 3 && '实体 A (优先级=10 [恢复服务])'}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              💡 核心启示：抢占确保了关键任务的最大延迟（Worst-Case Latency）上界受控。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
