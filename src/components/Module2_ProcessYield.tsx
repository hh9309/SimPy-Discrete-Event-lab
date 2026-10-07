import React, { useState } from 'react';
import { PlayCircle, GitCommit, CheckCircle2, PauseCircle } from 'lucide-react';

export const Module2_ProcessYield: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(2); // 0..4

  const steps = [
    {
      step: 1,
      title: '实体到达与实例化',
      codeLine: 'entity = Customer(cid, env.now)',
      desc: '实体由到达流进程唤醒生成，记录到达时间戳，进入初始等待态。',
      status: 'Ready',
      phase: '到达阶段',
    },
    {
      step: 2,
      title: '申请服务台资源 (Request)',
      codeLine: 'req = server_resource.request()',
      desc: '向系统资源提交服务申请事件，若当前服务台有余量则立即满足，否则入队等待。',
      status: 'Queueing',
      phase: '排队阶段',
    },
    {
      step: 3,
      title: 'yield 挂起与事件注册',
      codeLine: 'yield req  # 生成器在此暂停挂起，释放执行权',
      desc: 'Python 生成器暂停，等待事件循环。当服务台空出时触发事件回调，生成器被唤醒恢复执行。',
      status: 'Suspended (Yield)',
      phase: '挂起等待',
    },
    {
      step: 4,
      title: '执行服务与时钟推进 (Timeout)',
      codeLine: 'yield env.timeout(service_duration)',
      desc: '生成器再次挂起，向环境优先队列投递一个耗时为 service_duration 的 Timeout 事件。',
      status: 'In-Service',
      phase: '服务中',
    },
    {
      step: 5,
      title: '服务完成与资源释放 (Release)',
      codeLine: 'server_resource.release(req)',
      desc: '服务完成，生成器唤醒并释放占用的服务台，排队首位的等待实体被自动唤醒。',
      status: 'Completed',
      phase: '完成离场',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 02</span>
            <span>·</span>
            <span>协程核心机理</span>
            <span>·</span>
            <span>Python 生成器 yield 挂起与唤醒</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            进程与事件 (Process & Event) 交互演播
          </h2>
        </div>
        <div className="text-xs text-slate-500">
          点击不同阶段查看生成器函数调用栈状态
        </div>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((s, idx) => {
          const isCurrent = activeStep === idx;
          const isDone = activeStep > idx;
          return (
            <button
              key={s.step}
              onClick={() => setActiveStep(idx)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : isDone
                  ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  : 'bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={isCurrent ? 'text-slate-300' : 'text-slate-400'}>
                  第 {s.step} 步
                </span>
                {isCurrent ? (
                  <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <PauseCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
              </div>
              <div className="text-xs font-semibold truncate">{s.title}</div>
              <div className={`text-[10px] mt-1 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                {s.phase}
              </div>
            </button>
          );
        })}
      </div>

      {/* Code Synchronized View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
        {/* Left: Code Box with Highlighting Pointer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">SimPy 进程函数调用栈</span>
            <span className="text-xs font-mono text-emerald-600">def customer_process(env):</span>
          </div>
          <div className="p-4 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
            <div className="text-slate-500"># Python 协程生成器</div>
            <div className="text-slate-400">def customer_process(env, cid, server_resource):</div>
            <div className={`pl-4 py-1 rounded transition-colors ${activeStep === 0 ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-400' : ''}`}>
              trace.arrival_time = env.now
            </div>
            <div className={`pl-4 py-1 rounded transition-colors ${activeStep === 1 ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-400' : ''}`}>
              req = server_resource.request()
            </div>
            <div className={`pl-4 py-1 rounded transition-colors ${activeStep === 2 ? 'bg-amber-950/80 text-amber-300 border-l-2 border-amber-400 font-semibold' : ''}`}>
              yield req  # 挂起生成器，进入等待队列
            </div>
            <div className={`pl-4 py-1 rounded transition-colors ${activeStep === 3 ? 'bg-blue-950/80 text-blue-300 border-l-2 border-blue-400 font-semibold' : ''}`}>
              yield env.timeout(service_duration) # 占用服务台推进时钟
            </div>
            <div className={`pl-4 py-1 rounded transition-colors ${activeStep === 4 ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-400' : ''}`}>
              server_resource.release(req)
            </div>
          </div>
        </div>

        {/* Right: State Machine Explanation */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                当前阶段状态：{steps[activeStep].status}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {steps[activeStep].desc}
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs space-y-1.5">
            <div className="font-medium text-slate-800">生成器唤醒契机 (Trigger Condition):</div>
            <div className="text-slate-600">
              {activeStep === 2 && '当服务台有空位，SimPy 资源调用 req.succeed() 触发回调，事件循环将生成器从挂起态唤醒。'}
              {activeStep === 3 && '当时钟推进到 now + service_duration，优先队列弹出 Timeout 事件，触发生成器 next()。'}
              {activeStep !== 2 && activeStep !== 3 && '当前为原子指令，直接同步推进到下一个 yield 点。'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
            <span>执行上下文：线程级协程（单线程高并发，无锁开销）</span>
            <div className="flex gap-2">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40"
              >
                上一步
              </button>
              <button
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-2.5 py-1 text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-40"
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
