import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  Terminal,
  Zap,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Shuffle,
  ShieldAlert,
  Network,
  Activity,
} from 'lucide-react';

export const Module_SimPyPrinciples: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'concepts' | 'functions' | 'lifecycle' | 'patterns'>('architecture');
  const [selectedFunc, setSelectedFunc] = useState<string>('env_timeout');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // SimPy core functions dictionary
  const simpyFunctions = [
    {
      id: 'env_now',
      category: '环境与时钟',
      name: 'env.now',
      syntax: 'env.now -> float',
      desc: '只读属性，返回当前仿真环境的虚拟时间（浮点数）。仿真时间无固定时间单位，通常定义为秒、分或小时。',
      example: `import simpy

env = simpy.Environment()
print("当前虚拟时刻:", env.now)  # 0.0`,
    },
    {
      id: 'env_timeout',
      category: '环境与时钟',
      name: 'env.timeout()',
      syntax: 'env.timeout(delay: float, value: Any = None) -> Timeout',
      desc: '核心时钟推进事件。返回一个在当前时刻推进 delay 个时间单位后触发的事件。进程必须通过 yield env.timeout() 挂起自身以推进虚拟时钟。',
      example: `def customer(env):
    print(f"[{env.now}] 顾客到达")
    # 模拟办理业务耗时 5.0 单位时间
    yield env.timeout(5.0)
    print(f"[{env.now}] 业务办理完毕")`,
    },
    {
      id: 'env_process',
      category: '协程与进程',
      name: 'env.process()',
      syntax: 'env.process(generator) -> Process',
      desc: '将 Python 生成器函数注册为仿真环境的一个并发进程实体。Process 继承自 Event，可在其他进程中被 yield 等待其完成。',
      example: `def car(env):
    yield env.timeout(10)

env = simpy.Environment()
proc = env.process(car(env))  # 注册并启动进程
env.run(until=15)`,
    },
    {
      id: 'env_run',
      category: '环境与时钟',
      name: 'env.run()',
      syntax: 'env.run(until: Union[float, Event] = None) -> Any',
      desc: '启动仿真主循环。依次从优先队列二叉堆中弹出最早发生的事件并执行其回调，直到时钟达到 until 或指定事件完成或堆为空。',
      example: `env = simpy.Environment()
env.process(traffic_flow(env))
# 推进仿真直至虚拟时间 1000.0
env.run(until=1000.0)`,
    },
    {
      id: 'res_resource',
      category: '资源与排队',
      name: 'simpy.Resource',
      syntax: 'simpy.Resource(env, capacity=1)',
      desc: '容量为 capacity 的标准 FIFO 共享资源。并发实体通过 request() 排队申请，并于使用后 release() 归还。支持 with 语法糖。',
      example: `server = simpy.Resource(env, capacity=2)

def user(env, name, res):
    with res.request() as req:
        yield req  # 等待空闲服务台
        print(f"[{env.now}] {name} 正在被服务")
        yield env.timeout(3)
    print(f"[{env.now}] {name} 释放服务台")`,
    },
    {
      id: 'res_priority',
      category: '资源与排队',
      name: 'simpy.PriorityResource',
      syntax: 'simpy.PriorityResource(env, capacity=1)',
      desc: '优先级队列资源。请求参数 priority 取较小数值者优先出队（如 priority=0 优先于 priority=10）。非抢占机制（正在服务的实体不被打断）。',
      example: `vip_server = simpy.PriorityResource(env, capacity=1)

# VIP 客户优先出队
req = vip_server.request(priority=0)
yield req
yield env.timeout(2)
vip_server.release(req)`,
    },
    {
      id: 'res_preemptive',
      category: '资源与排队',
      name: 'simpy.PreemptiveResource',
      syntax: 'simpy.PreemptiveResource(env, capacity=1)',
      desc: '抢占式优先级资源。当资源全忙且到达更高优先级实体时，强行中断当前正在服务的最低优先级实体，被抢占进程抛出 simpy.Interrupt 异常。',
      example: `room = simpy.PreemptiveResource(env, capacity=1)

def patient(env, prio):
    with room.request(priority=prio, preempt=True) as req:
        try:
            yield req
            yield env.timeout(10)
        except simpy.Interrupt as interrupt:
            print(f"[{env.now}] 患者被紧急手术抢占！")`,
    },
    {
      id: 'container',
      category: '连续物料容器',
      name: 'simpy.Container',
      syntax: 'simpy.Container(env, capacity=float("inf"), init=0)',
      desc: '均质连续物料/流体容器（如油箱、水库、料斗）。支持 put(amount) 与 get(amount) 阻塞原语，满溢或料尽时自动挂起进程。',
      example: `tank = simpy.Container(env, capacity=100, init=20)

# 加油 50 升
yield tank.put(50)
# 消耗 30 升
yield tank.get(30)`,
    },
    {
      id: 'store',
      category: '离散对象仓库',
      name: 'simpy.FilterStore',
      syntax: 'simpy.FilterStore(env, capacity=float("inf"))',
      desc: '支持条件属性过滤匹配的离散对象缓冲区。消费者可通过 filter=lambda item: condition 从缓冲区精准匹配提取特定工件。',
      example: `store = simpy.FilterStore(env)
yield store.put({'type': 'VIP', 'id': 1})

# 仅提取 VIP 类型物品
item = yield store.get(filter=lambda x: x['type'] == 'VIP')`,
    },
    {
      id: 'conditions',
      category: '复合条件事件',
      name: 'simpy.AnyOf / AllOf',
      syntax: 'simpy.AnyOf(env, events) | simpy.AllOf(env, events)',
      desc: '复合事件触发器。AnyOf (等价于 event1 | event2) 在任意一个事件触发时返回（常用于超时放弃 Reneging）；AllOf (等价于 event1 & event2) 在所有事件均触发后返回。',
      example: `req = server.request()
patience_timeout = env.timeout(10.0)

# 等待排上队 OR 超时放弃 (取先到达者)
result = yield env.any_of([req, patience_timeout])
if req in result:
    print("成功排上服务")
else:
    server.release(req)
    print("等待超时放弃离开")`,
    },
  ];

  const currentFuncData = simpyFunctions.find((f) => f.id === selectedFunc) || simpyFunctions[1];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>基础核心体系</span>
            <span>·</span>
            <span>离散事件形式化原理</span>
            <span>·</span>
            <span>SimPy 4 函数库与架构指南</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>SimPy 离散事件仿真知识导引 (Simulation Principles & API Guide)</span>
          </h2>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
          {[
            { id: 'architecture', label: '核心架构框架图' },
            { id: 'concepts', label: '离散代数原理' },
            { id: 'functions', label: '核心函数库速查' },
            { id: 'lifecycle', label: '协程生命周期' },
            { id: 'patterns', label: '典型模式与避坑' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 0: Architecture Framework Blueprint Module (Requested by user: 将架构框架图放到知识导引切片 作为一个单独模块) */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Main Blueprint Showcase Card */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  SimPy System Architecture Blueprint
                </span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
                  SimPy 离散事件系统内核架构与二叉堆调度蓝图
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  以事件优先队列二叉堆为枢纽，贯通主动实体进程协程（Process / Generator）与被动资源队列（Resource / Container）。
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                  三元组: <strong>(t_i, prio, event_id)</strong>
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold shadow-2xs">
                  复杂度: <strong>O(log N)</strong>
                </span>
              </div>
            </div>

            {/* High-Resolution Blueprint Illustration Container */}
            <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl relative group">
              <img
                src="/src/assets/images/simpy_architecture_blueprint_1791027102177.jpg"
                alt="SimPy Discrete-Event Architecture Blueprint"
                referrerPolicy="no-referrer"
                className="w-full max-h-[380px] object-cover sm:object-contain bg-slate-950 transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="p-3 bg-slate-900/90 backdrop-blur-xs border-t border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Network className="w-4 h-4" />
                  <span>调度中枢：Binary Min-Heap Priority Queue ➔ Event Callback Pipeline</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  基于 Python PEP 342 增强型生成器协程驱动
                </span>
              </div>
            </div>

            {/* 4 Deep Structural Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Card 1: Key tuple */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">1. 事件三元组排序键</span>
                  <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1 rounded">Key(e)</span>
                </div>
                <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-800">
                  Key = (t_i, prio, id)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  二叉堆首选物理时间戳 $t_i$，相同时间按优先级 $prio$ 出队，同优先级按自增 $id$ 保证严格因果先来先服务（FIFO）。
                </p>
              </div>

              {/* Card 2: O(log N) */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">2. 时钟跳跃复杂度</span>
                  <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">O(log N)</span>
                </div>
                <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-800">
                  Δt_jump = min(t_e) - now
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  无论两次业务间隔数秒还是数小时，仿真时钟直接瞬移到堆顶时刻，每步仅需 O(log N) 堆调整，规避微步长空转。
                </p>
              </div>

              {/* Card 3: Yield loop */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">3. 协程 yield 挂起环</span>
                  <span className="font-mono text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Generator</span>
                </div>
                <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-800">
                  yield req ➔ yield timeout
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  实体进程在申请资源或等待时，通过 <code className="font-mono">yield</code> 将生成器句柄登记至事件回调，释放执行权等待唤醒。
                </p>
              </div>

              {/* Card 4: Resource interlock */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">4. 资源并发互锁管线</span>
                  <span className="font-mono text-[10px] text-purple-600 bg-purple-50 px-1 rounded">Resource</span>
                </div>
                <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-800">
                  Users ≤ c | Queue &gt; 0
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  资源维护槽位占用、排队队列与抢占堆栈，支持被抢占任务中断（Interrupt）并精确恢复剩余服务时长。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Concepts & Mathematical Principles */}
      {activeTab === 'concepts' && (
        <div className="space-y-6">
          {/* Conceptual Blueprint Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 items-center">
            <div className="lg:col-span-2 space-y-3">
              <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Discrete-Event Simulation (DES) 核心范式
              </span>
              <h3 className="text-base font-bold text-slate-900">
                为什么离散事件仿真是现代运筹学、排队论与供应链的黄金工具？
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                在物理现实中，绝大多数并发业务（如银行柜台、医院急诊、物流输送带、网络数据包）的状态跃迁发生在<strong>离散的不均匀时间点</strong>。在两个相邻事件（例如顾客到达与服务完成）之间，系统状态完全不变。
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 space-y-1">
                <div className="font-semibold text-slate-900">时钟跳跃公理 (Time-Jump Axiom):</div>
                <div className="text-emerald-700">t_{'{k+1}'} = min_{'{e ∈ Queue}'} {'{'} t_e {'}'} = t_k + Δt_{'{jump}'}</div>
                <div className="text-[11px] text-slate-500">
                  二叉最小堆维护事件三元组：Key = (Timestamp, Priority, EventID)
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-slate-600" />
                <span>计算复杂度显著差异</span>
              </div>
              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>SimPy 离散事件:</span>
                  <span className="font-mono font-bold text-emerald-600">O(log N) / 事件</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>定步长连续仿真:</span>
                  <span className="font-mono text-rose-600">O(T / Δt) 算力空转</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>协程并发开销:</span>
                  <span className="font-mono text-slate-900">微秒级单线程无锁</span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Foundational Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-semibold text-xs text-slate-900">环境 Environment</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                维护仿真主时钟 <code className="font-mono bg-slate-100 px-1 rounded">now</code> 与优先队列（PriorityQueue），驱动事件弹出与调度，充当全局时间权威。
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-semibold text-xs text-slate-900">进程 Process 与生成器</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                采用 Python 生成器 <code className="font-mono bg-slate-100 px-1 rounded">yield</code> 语法表达生命周期，实体在等待资源或计时时主动挂起，由环境按时唤醒。
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-semibold text-xs text-slate-900">共享资源 Resource</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                对柜员、机器、缓冲区等有限容量实体进行互斥或并发排队控制，支持 FIFO 先来先到、优先级排序与硬抢占（Preemption）。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Functions & API Interactive Playground */}
      {activeTab === 'functions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Functions List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-slate-700 pb-1">SimPy 核心函数与语法清单</div>
            {simpyFunctions.map((fn) => {
              const isSelected = selectedFunc === fn.id;
              return (
                <button
                  key={fn.id}
                  onClick={() => setSelectedFunc(fn.id)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all text-xs ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold truncate">{fn.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {fn.category}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {fn.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Function Detail & Code Snippet View */}
          <div className="lg:col-span-2 p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                    {currentFuncData.category}
                  </span>
                  <h3 className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentFuncData.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(currentFuncData.example)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '已复制代码' : '复制代码'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800">
                <span className="text-slate-400">调用签名: </span>
                <span className="font-semibold text-blue-700">{currentFuncData.syntax}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {currentFuncData.desc}
              </p>

              {/* Code Example View */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-700">标准 Python 代码实践：</div>
                <div className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                  <pre>
                    <code>{currentFuncData.example}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>SimPy 4.x / Python 3.10+ 标准语法规范</span>
              <span className="text-emerald-700 font-medium">无锁高并发协程调度</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Generator Lifecycle Flow */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">协程生命周期的本质：</span>
            SimPy 并不依赖真实操作系统的线程休眠（如 <code className="font-mono bg-white px-1 rounded">time.sleep()</code>），而是通过 Python 生成器的 <code className="font-mono bg-white px-1 rounded">yield</code> 机制将控制权交还给仿真事件循环。
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">阶段 1: 实例化</span>
                <span className="text-slate-400 font-mono">01</span>
              </div>
              <div className="font-mono text-xs text-emerald-700">env.process(p())</div>
              <p className="text-[11px] text-slate-600">
                创建生成器迭代器，并自动推进执行至第一个 yield 点。
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">阶段 2: 挂起 Yield</span>
                <span className="text-slate-400 font-mono">02</span>
              </div>
              <div className="font-mono text-xs text-amber-700">yield event</div>
              <p className="text-[11px] text-slate-600">
                生成器函数冻结局部变量堆栈，将自身作为回调登记到等待事件中。
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">阶段 3: 时钟跳跃</span>
                <span className="text-slate-400 font-mono">03</span>
              </div>
              <div className="font-mono text-xs text-blue-700">env.step()</div>
              <p className="text-[11px] text-slate-600">
                时钟跳跃至该事件触发时刻，执行 event.succeed() 唤醒所有监听进程。
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">阶段 4: 唤醒并终结</span>
                <span className="text-slate-400 font-mono">04</span>
              </div>
              <div className="font-mono text-xs text-slate-800">generator.next()</div>
              <p className="text-[11px] text-slate-600">
                从 yield 断点继续向下执行，直到函数 return 或 StopIteration。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Design Patterns and Anti-Patterns */}
      {activeTab === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>常见建模误区与反模式 (Anti-Patterns)</span>
            </div>
            <ul className="text-xs text-rose-950 space-y-2 leading-relaxed">
              <li>
                <strong>❌ 误用真实睡眠：</strong> 使用了 <code className="font-mono bg-white px-1 rounded">time.sleep(5)</code> 导致主线程卡死，应使用 <code className="font-mono bg-white px-1 rounded">yield env.timeout(5)</code>。
              </li>
              <li>
                <strong>❌ 忘记 yield 挂起：</strong> 写成 <code className="font-mono bg-white px-1 rounded">env.timeout(5)</code> 而未加 <code className="font-mono bg-white px-1 rounded">yield</code>，时钟根本不会推进。
              </li>
              <li>
                <strong>❌ 资源未配对释放：</strong> 调用 <code className="font-mono bg-white px-1 rounded">res.request()</code> 后异常退出导致资源永久泄露，必须使用 <code className="font-mono bg-white px-1 rounded">with res.request() as req: yield req</code>。
              </li>
            </ul>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>工程级最佳实践 (Best Practices)</span>
            </div>
            <ul className="text-xs text-emerald-950 space-y-2 leading-relaxed">
              <li>
                <strong>✅ 固定伪随机种子：</strong> 在实验入口固定 <code className="font-mono bg-white px-1 rounded">random.seed(seed)</code> 保证仿真严格可复现。
              </li>
              <li>
                <strong>✅ 超时放弃防死锁：</strong> 申请资源时使用 <code className="font-mono bg-white px-1 rounded">yield env.any_of([req, env.timeout(max_wait)])</code> 防范队列永久堵死。
              </li>
              <li>
                <strong>✅ 剔除预热期：</strong> 统计前 15%~20% 的瞬态数据应予以剔除，确保评估处于稳定各态历经区。
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
