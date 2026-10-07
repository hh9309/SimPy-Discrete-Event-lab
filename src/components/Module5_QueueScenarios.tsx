import React from 'react';
import { Landmark, Stethoscope, PhoneCall, Wrench, Check } from 'lucide-react';
import { SimulationParams } from '../simpy-core/types';

interface Module5Props {
  currentScenario: string;
  onSelectScenario: (scenarioId: string, presetParams: SimulationParams) => void;
}

export const Module5_QueueScenarios: React.FC<Module5Props> = ({
  currentScenario,
  onSelectScenario,
}) => {
  const scenarios = [
    {
      id: 'bank',
      title: '银行多窗口挂号 (Bank Multi-Teller)',
      icon: Landmark,
      badge: '优先级排队 (Priority)',
      params: {
        lambda: 1.5,
        mu: 0.6,
        servers: 3,
        arrivalDist: 'exponential' as const,
        serviceDist: 'normal' as const,
        resourceType: 'PriorityResource' as const,
        simDuration: 100,
        seed: 42,
        vipRatio: 0.25,
      },
      story: '普通客户与白金 VIP 共享 3 个服务柜台。VIP 享有专属插队优先权，但不能打断正在办理业务的普通客户。',
      focus: 'VIP 等待时间压缩 vs 普通客户长尾积压补偿。',
    },
    {
      id: 'hospital',
      title: '医院急诊分诊 (Emergency Triage)',
      icon: Stethoscope,
      badge: '硬抢占中断 (Preemption)',
      params: {
        lambda: 0.8,
        mu: 0.5,
        servers: 2,
        arrivalDist: 'exponential' as const,
        serviceDist: 'exponential' as const,
        resourceType: 'PreemptiveResource' as const,
        simDuration: 100,
        seed: 101,
        vipRatio: 0.2, // 20% code red
      },
      story: '急诊创伤抢救室（ICU/手术台 2 间）。危重患者（Code Red）一旦送达，立即强行中断普通急症患者救治，被中断患者在情况稳定后恢复缝合。',
      focus: '抢占中断开销、极高危生命挽救成功率与恢复时延。',
    },
    {
      id: 'callcenter',
      title: '呼叫中心与超时放弃 (Call Center Reneging)',
      icon: PhoneCall,
      badge: '客户耐受超时 (Reneging)',
      params: {
        lambda: 2.2,
        mu: 0.7,
        servers: 3,
        arrivalDist: 'exponential' as const,
        serviceDist: 'exponential' as const,
        resourceType: 'Resource' as const,
        simDuration: 100,
        seed: 777,
        renegeTimeout: 8.0, // 8s patience
      },
      story: '热线坐席高峰期排队。客户在听到排队音乐时耐受时间有限，若等待超过心理预期（服从指数衰减）将直接挂机流失（Reneging）。',
      focus: '坐席利用率与客户流失率（Abandonment Rate）的权衡。',
    },
    {
      id: 'factory',
      title: '工厂机器故障与维修 (Machine Breakdown)',
      icon: Wrench,
      badge: '有限源闭环排队',
      params: {
        lambda: 1.0,
        mu: 0.9,
        servers: 2,
        arrivalDist: 'exponential' as const,
        serviceDist: 'uniform' as const,
        resourceType: 'Resource' as const,
        simDuration: 120,
        seed: 888,
        failureRate: 0.2,
        repairRate: 0.5,
      },
      story: '生产车间拥有多台数控机床，机床按 MTBF 随机发生故障停机，呼叫巡检维修工程师进行抢修。维修人员短缺将导致整条产线停摆。',
      focus: '机器可用度（Availability）与维修员冗余度设计。',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 05</span>
            <span>·</span>
            <span>行业典型模型</span>
            <span>·</span>
            <span>四类经典离散事件建模场景库</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            经典排队系统案例库 (Queueing Case Studies)
          </h2>
        </div>
        <div className="text-xs text-slate-500">
          点击一键载入场景参数并自动同步至仿真沙盒
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const isSelected = currentScenario === sc.id;
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50/80 text-slate-800 border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{sc.title}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sc.badge}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed mb-3 ${
                    isSelected ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {sc.story}
                </p>

                <div
                  className={`text-[11px] p-2.5 rounded-lg border mb-4 ${
                    isSelected
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-semibold">核心矛盾点：</span>
                  {sc.focus}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100/20 text-xs">
                <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                  λ={sc.params.lambda} | c={sc.params.servers} | μ={sc.params.mu}
                </span>
                <button
                  onClick={() => onSelectScenario(sc.id, sc.params)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已加载实验</span>
                    </>
                  ) : (
                    <span>载入本案例</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
