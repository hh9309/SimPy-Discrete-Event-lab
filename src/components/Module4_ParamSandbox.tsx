import React from 'react';
import { Sliders, AlertTriangle, CheckCircle, Flame, Info } from 'lucide-react';
import { DistributionType, SimulationParams } from '../simpy-core/types';
import { calculateQueueTheory } from '../simpy-core/distributions';

interface Module4Props {
  params: SimulationParams;
  onChangeParams: (newParams: SimulationParams) => void;
}

export const Module4_ParamSandbox: React.FC<Module4Props> = ({
  params,
  onChangeParams,
}) => {
  const rho = params.lambda / (params.servers * params.mu);
  const theory = calculateQueueTheory(params.lambda, params.mu, params.servers);

  const distributions: { id: DistributionType; label: string }[] = [
    { id: 'exponential', label: '指数分布 (Poisson)' },
    { id: 'normal', label: '正态分布 (Gauss)' },
    { id: 'uniform', label: '均匀分布 (Uniform)' },
    { id: 'constant', label: '定长常数 (Constant)' },
  ];

  const update = (partial: Partial<SimulationParams>) => {
    onChangeParams({ ...params, ...partial });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 04</span>
            <span>·</span>
            <span>参数空间探索</span>
            <span>·</span>
            <span>利用率 ρ 临界崩塌与 Erlang-C 解析解</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            仿真参数调优沙盒 (Parameter Tuning Sandbox)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => update({ lambda: 1.2, mu: 1.5, servers: 1 })}
            className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded"
          >
            健康稳态 (ρ=0.8)
          </button>
          <button
            onClick={() => update({ lambda: 1.45, mu: 1.5, servers: 1 })}
            className="text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded"
          >
            近临界警戒 (ρ=0.97)
          </button>
          <button
            onClick={() => update({ lambda: 1.8, mu: 1.5, servers: 1 })}
            className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded"
          >
            超载崩塌 (ρ=1.20)
          </button>
        </div>
      </div>

      {/* Utilization rho Status Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          rho >= 1.0
            ? 'bg-rose-50/90 border-rose-300 text-rose-950'
            : rho >= 0.85
            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
        }`}
      >
        <div className="flex items-start gap-3">
          {rho >= 1.0 ? (
            <Flame className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : rho >= 0.85 ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                理论系统服务强度 $\rho = \frac{'\lambda'}{'c \cdot \mu'} = {rho.toFixed(3)}$
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  rho >= 1.0
                    ? 'bg-rose-200 text-rose-800'
                    : rho >= 0.85
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {rho >= 1.0 ? '超临界崩塌区 (发散)' : rho >= 0.85 ? '临界警戒区 (高延迟)' : '稳定收敛区 (稳态)'}
              </span>
            </div>
            <p className="text-xs mt-1 opacity-90 leading-relaxed">
              {rho >= 1.0
                ? '到达流量超越服务上限，Lindley 发散公理生效：排队长度随时间线性暴增，系统不存在理论稳态均值！'
                : rho >= 0.85
                ? '重负荷区间 (Kingman Approximation)：等待时间呈 1/(1-ρ) 双曲线激增，轻微方差波动即可引发雪崩式排长队。'
                : '排队系统运行平稳，等待时间快速衰减，统计指标具备良好的各态历经性。'}
            </p>
          </div>
        </div>

        {/* Theoretical Erlang-C Stats Badge */}
        <div className="shrink-0 bg-white/90 p-3 rounded-lg border border-slate-200/80 text-xs font-mono space-y-1 text-slate-800">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">理论等待 Wq:</span>
            <span className="font-bold">
              {theory && theory.isStable ? `${theory.Wq.toFixed(2)}s` : '∞ (发散)'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">理论队长 Lq:</span>
            <span className="font-bold">
              {theory && theory.isStable ? `${theory.Lq.toFixed(2)}` : '∞ (发散)'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">排队概率 P(wait):</span>
            <span className="font-bold">
              {theory && theory.isStable ? `${(theory.Pw * 100).toFixed(1)}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Parameter Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lambda Slider */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">到达率 λ (Arrival Rate)</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {params.lambda.toFixed(2)} /s
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="4.0"
            step="0.05"
            value={params.lambda}
            onChange={(e) => update({ lambda: parseFloat(e.target.value) })}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>平均到达间隔: {(1 / params.lambda).toFixed(2)}s</span>
            <span>范围: 0.2 ~ 4.0</span>
          </div>
        </div>

        {/* Mu Slider */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">单台服务率 μ (Service Rate)</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {params.mu.toFixed(2)} /s
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={params.mu}
            onChange={(e) => update({ mu: parseFloat(e.target.value) })}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>单次服务均值: {(1 / params.mu).toFixed(2)}s</span>
            <span>范围: 0.2 ~ 3.0</span>
          </div>
        </div>

        {/* Servers Slider */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">服务台并发数 c (Servers)</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {params.servers} 台
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="6"
            step="1"
            value={params.servers}
            onChange={(e) => update({ servers: parseInt(e.target.value) })}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>总系统容量 c·μ: {(params.servers * params.mu).toFixed(2)} /s</span>
            <span>范围: 1 ~ 6</span>
          </div>
        </div>
      </div>

      {/* Distribution Selectors & Seed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Arrival Distribution */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">到达间隔分布 (Inter-Arrival)</label>
          <select
            value={params.arrivalDist}
            onChange={(e) => update({ arrivalDist: e.target.value as DistributionType })}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            {distributions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Service Distribution */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">服务时长分布 (Service Time)</label>
          <select
            value={params.serviceDist}
            onChange={(e) => update({ serviceDist: e.target.value as DistributionType })}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            {distributions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Seed & Duration */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">仿真时长 T</label>
            <input
              type="number"
              min="20"
              max="500"
              value={params.simDuration}
              onChange={(e) => update({ simDuration: parseInt(e.target.value) || 100 })}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">随机种子 Seed</label>
            <input
              type="number"
              value={params.seed}
              onChange={(e) => update({ seed: parseInt(e.target.value) || 42 })}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
