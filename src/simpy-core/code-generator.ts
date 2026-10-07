/**
 * SimPy Native Python Code Generator & Experiment Report Exporter
 */

import { SimulationParams, SimulationResults } from './types';

export function generateSimPyPythonCode(params: SimulationParams, scenarioType: string): string {
  if (scenarioType === 'logistics') {
    return `"""
SimPy 离散事件仿真：生产与物流装配线模型
包含：原料容器 (Container) -> 机加工位 -> 中间缓冲区 (FilterStore/Buffer) -> 质检与包装
"""
import simpy
import random
import numpy as np

RANDOM_SEED = ${params.seed}
SIM_TIME = ${params.simDuration}
BUFFER_CAPACITY = ${params.bufferCapacity || 10}
MACHINING_RATE = ${params.machiningRate || 0.8}
QC_RATE = ${params.qcRate || 0.7}

class AssemblyLine:
    def __init__(self, env):
        self.env = env
        self.machine = simpy.Resource(env, capacity=1)
        self.qc_station = simpy.Resource(env, capacity=1)
        self.raw_container = simpy.Container(env, capacity=200, init=50)
        self.intermediate_buffer = simpy.Container(env, capacity=BUFFER_CAPACITY, init=0)
        self.completed_parts = 0
        self.blocking_time = 0.0

    def supplier(self):
        """原料定时批量补给进程"""
        while True:
            yield self.env.timeout(random.expovariate(0.2))
            yield self.raw_container.put(5)

    def machining_process(self, part_id):
        """工位1：机加工进程"""
        # 从原料箱获取毛坯
        yield self.raw_container.get(1)
        with self.machine.request() as req:
            yield req
            # 加工时长服从设定分布
            duration = random.expovariate(MACHINING_RATE)
            yield self.env.timeout(duration)

        # 放入中间缓冲区（若已满则发生阻塞 Blocking）
        put_req = self.intermediate_buffer.put(1)
        t_start_wait = self.env.now
        yield put_req
        if self.env.now > t_start_wait:
            self.blocking_time += (self.env.now - t_start_wait)

    def qc_process(self):
        """工位2：质检与包装进程"""
        while True:
            # 从缓冲区取工件（若空则发生饥饿 Starvation）
            yield self.intermediate_buffer.get(1)
            with self.qc_station.request() as req:
                yield req
                # 质检工时服从高斯分布
                duration = max(0.1, random.gauss(1.0 / QC_RATE, 0.2))
                yield self.env.timeout(duration)
                self.completed_parts += 1

def run_simulation():
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)
    env = simpy.Environment()
    line = AssemblyLine(env)
    
    env.process(line.supplier())
    env.process(line.qc_process())

    # 生成机加工件输入流
    def feeder():
        pid = 0
        while True:
            yield env.timeout(random.expovariate(MACHINING_RATE * 1.1))
            pid += 1
            env.process(line.machining_process(pid))

    env.process(feeder())
    env.run(until=SIM_TIME)

    print(f"=== 仿真运行结束 (T={SIM_TIME}) ===")
    print(f"产出合格品总数: {line.completed_parts}")
    print(f"吞吐率: {line.completed_parts / SIM_TIME:.3f} parts/unit time")
    print(f"工位阻塞累计耗时: {line.blocking_time:.2f}")

if __name__ == '__main__':
    run_simulation()
`;
  }

  // Standard Queueing (Bank, Hospital, Call Center, Sandbox)
  const resClass =
    params.resourceType === 'PreemptiveResource'
      ? 'simpy.PreemptiveResource'
      : params.resourceType === 'PriorityResource'
      ? 'simpy.PriorityResource'
      : 'simpy.Resource';

  let distArrivalCode = `random.expovariate(${params.lambda})`;
  if (params.arrivalDist === 'normal') distArrivalCode = `max(0.01, random.gauss(1.0 / ${params.lambda}, 0.2))`;
  if (params.arrivalDist === 'uniform') distArrivalCode = `random.uniform(0.5 / ${params.lambda}, 1.5 / ${params.lambda})`;
  if (params.arrivalDist === 'constant') distArrivalCode = `${(1.0 / params.lambda).toFixed(3)}`;

  let distServiceCode = `random.expovariate(${params.mu})`;
  if (params.serviceDist === 'normal') distServiceCode = `max(0.01, random.gauss(1.0 / ${params.mu}, 0.2))`;
  if (params.serviceDist === 'uniform') distServiceCode = `random.uniform(0.5 / ${params.mu}, 1.5 / ${params.mu})`;
  if (params.serviceDist === 'constant') distServiceCode = `${(1.0 / params.mu).toFixed(3)}`;

  return `"""
SimPy 离散事件仿真：${params.resourceType} 排队模型
自动生成于 SimPy 离散事件仿真实验室
"""
import simpy
import random
import numpy as np

# 1. 实验参数配置
RANDOM_SEED = ${params.seed}
SIM_DURATION = ${params.simDuration}   # 仿真运行截止虚拟时钟
LAMBDA = ${params.lambda}           # 到达率 (到达间隔均值 = 1 / lambda)
MU = ${params.mu}               # 服务率 (单机服务均值 = 1 / mu)
SERVERS = ${params.servers}          # 服务台容量 c
RHO = LAMBDA / (SERVERS * MU) # 理论系统利用率 rho

class CustomerTrace:
    def __init__(self, cid, arrival_time, priority=10):
        self.cid = cid
        self.arrival_time = arrival_time
        self.priority = priority
        self.start_service_time = None
        self.finish_time = None
        self.wait_time = 0.0

traces = []

def customer(env, cid, server_resource, priority=10):
    """顾客/任务服务生命周期进程"""
    arrival_time = env.now
    trace = CustomerTrace(cid, arrival_time, priority)
    traces.append(trace)
    
    # 申请服务台资源 (支持抢占/优先级)
    ${
      params.resourceType === 'PreemptiveResource'
        ? `req = server_resource.request(priority=priority, preempt=True)`
        : params.resourceType === 'PriorityResource'
        ? `req = server_resource.request(priority=priority)`
        : `req = server_resource.request()`
    }
    
    try:
        # yield req 挂起生成器，进入事件优先队列等待资源空闲唤醒
        yield req
        trace.start_service_time = env.now
        trace.wait_time = trace.start_service_time - trace.arrival_time

        # 服务时长生成
        service_duration = ${distServiceCode}
        
        ${
          params.resourceType === 'PreemptiveResource'
            ? `try:
            # 执行服务：推进虚拟时间
            yield env.timeout(service_duration)
            trace.finish_time = env.now
        except simpy.Interrupt as interrupt:
            # 捕获高优先级抢占中断，计算剩余服务时间并重返队列
            remaining_duration = service_duration - (env.now - trace.start_service_time)
            print(f"[{env.now:.2f}] 实体 {cid} 被抢占中断！剩余工时: {remaining_duration:.2f}")
            yield env.timeout(remaining_duration)
            trace.finish_time = env.now`
            : `# 执行服务：推进虚拟时间
        yield env.timeout(service_duration)
        trace.finish_time = env.now`
        }
    finally:
        # 释放占用资源
        server_resource.release(req)

def arrival_generator(env, server_resource):
    """到达过程生成器"""
    cid = 0
    while True:
        # 到达间隔
        inter_arrival = ${distArrivalCode}
        yield env.timeout(inter_arrival)
        
        cid += 1
        priority = 10
        ${
          params.vipRatio && params.vipRatio > 0
            ? `if random.random() < ${params.vipRatio}:
            priority = 2  # 高优先级 VIP`
            : ''
        }
        env.process(customer(env, cid, server_resource, priority))

def main():
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)
    
    env = simpy.Environment()
    server_resource = ${resClass}(env, capacity=SERVERS)
    
    print(f"=== 启动 SimPy 仿真: c={SERVERS}, lambda={LAMBDA}, mu={MU}, rho={RHO:.3f} ===")
    env.process(arrival_generator(env, server_resource))
    env.run(until=SIM_DURATION)
    
    # 统计指标推导
    completed = [t for t in traces if t.finish_time is not None]
    if completed:
        avg_wait = sum(t.wait_time for t in completed) / len(completed)
        print(f"完成服务总数: {len(completed)}")
        print(f"平均排队等待时间 Wq: {avg_wait:.3f}")
        print(f"平均吞吐量: {len(completed) / SIM_DURATION:.3f} / unit time")
    else:
        print("未有完成服务的实体。")

if __name__ == '__main__':
    main()
`;
}

/** Generate Comprehensive Markdown Analysis Report */
export function generateMarkdownReport(results: SimulationResults, scenarioName: string): string {
  const p = results.params;
  const rho = p.lambda / (p.servers * p.mu);

  return `# SimPy 离散事件仿真实验分析报告

- **实验主题**：${scenarioName}
- **仿真引擎**：SimPy Discrete-Event Simulation Kernel (Python 4 / TS)
- **仿真时长**：$T = ${results.duration}$ 虚拟时间单位
- **随机数种子**：$Seed = ${p.seed}$

---

## 1. 仿真系统参数与理论排队推导

| 参数名称 | 符号 | 设定数值 | 分布类型 | 物理意义 |
| :--- | :---: | :---: | :---: | :--- |
| **到达率** | $\\lambda$ | ${p.lambda} | ${p.arrivalDist} | 单位时间内平均到达实体数 |
| **单台服务率** | $\\mu$ | ${p.mu} | ${p.serviceDist} | 单个服务台单位时间平均处理能力 |
| **服务台数量** | $c$ | ${p.servers} | — | 并发服务通道总数 |
| **理论服务强度** | $\\rho = \\frac{\\lambda}{c\\mu}$ | ${rho.toFixed(4)} | — | 系统负载因子（稳定性判据） |
| **资源调度策略** | — | \`${p.resourceType}\` | — | FIFO / Priority / Preemption |

### 稳定性状态判定：
${
  rho >= 1.0
    ? `> ⚠️ **超临界非稳态 (Unstable Divergence)**：$\\rho = ${rho.toFixed(3)} \\ge 1.0$。到达速率超越系统服务上限，根据 Lindley 积分方程与排队论基本公理，队长 $L_q(t)$ 将呈单调无界发散，无法收敛于稳态。`
    : rho >= 0.85
    ? `> ⚡ **近临界高负荷态 (High Congestion Region)**：$\\rho = ${rho.toFixed(3)}$ 处于临界高负荷区，方差对队列波动极其敏感，极易出现瞬时微拥塞。`
    : `> ✅ **亚临界稳定态 (Stable Ergodic Region)**：$\\rho = ${rho.toFixed(3)} < 0.85$。系统具备良好的各态历经性（Ergodicity），仿真时序指标能够迅速收敛于稳态均值。`
}

---

## 2. 仿真核心观测指标统计

| 观测指标 | 仿真实验实测值 | 理论解析值 (Erlang-C) | 相对误差 |
| :--- | :---: | :---: | :---: |
| **平均等待时间 $W_q$** | **${results.avgWaitTime.toFixed(3)}** | ${results.theoreticalWaitTime !== null ? results.theoreticalWaitTime.toFixed(3) : '发散 ($\\infty$)'} | ${results.theoreticalWaitTime ? ((Math.abs(results.avgWaitTime - results.theoreticalWaitTime) / results.theoreticalWaitTime) * 100).toFixed(1) + '%' : 'N/A'} |
| **平均队长 $L_q$** | **${results.avgQueueLength.toFixed(3)}** | ${results.theoreticalQueueLength !== null ? results.theoreticalQueueLength.toFixed(3) : '发散 ($\\infty$)'} | ${results.theoreticalQueueLength ? ((Math.abs(results.avgQueueLength - results.theoreticalQueueLength) / results.theoreticalQueueLength) * 100).toFixed(1) + '%' : 'N/A'} |
| **P95 尾部等待时间** | **${results.p95WaitTime.toFixed(3)}** | — | 衡量极端长尾等待风险 |
| **最大观测队长** | **${results.maxQueueLength}** | — | 用于评估物理缓冲区容积上限 |
| **系统吞吐量** | **${results.systemThroughput.toFixed(3)}** | — | 单位时间完成服务的实体产出量 |
| **观测服务台利用率 $\\rho_{obs}$** | **${(results.observedUtilization * 100).toFixed(1)}%** | ${(rho * 100).toFixed(1)}% | 实际服务台繁忙时间占比 |

---

## 3. Little's Law 守恒定理验证

离散事件仿真的核心一致性定理：
$$L_q = \\lambda \\cdot W_q$$

- 实测平均队长 $L_q = ${results.avgQueueLength.toFixed(3)}$
- 根据到达率计算值 $\\lambda \\cdot W_q = ${p.lambda} \\times ${results.avgWaitTime.toFixed(3)} = ${(p.lambda * results.avgWaitTime).toFixed(3)}$
- **符合度判定**：${Math.abs(results.avgQueueLength - p.lambda * results.avgWaitTime) < 0.8 ? '与 Little 定理吻合良好（受仿真启动预热期微小波动影响）' : '处于瞬态调整阶段，建议增加仿真时长 $T$ 或剔除预热期'}。

---

## 4. 离散仿真实验工程建议
1. **预热期（Warm-up Period）过滤**：对于高负荷系统，初始系统为空会拉低前置均值，建议采用 Welch 移动均线法截断前 15%~20% 数据。
2. **多轮蒙特卡洛独立重复试验 (Replications)**：单次仿真受特定伪随机数序列偶发性影响，需固定不同 Seed 开展 20 轮以上实验计算 95% 置信区间。
3. **抢占开销评估**：若采用 \`PreemptiveResource\`，在高并发下频繁抢占可能导致被抢占任务产生上下文切换震荡，工程上宜设定最低服务时长门槛。

*报告导出自：SimPy 离散事件仿真实验室*
`;
}

/** Export CSV entity trace data */
export function generateCSVTrace(results: SimulationResults): string {
  const header = 'EntityID,Name,Category,Priority,ArrivalTime,WaitTime,ServiceDuration,PreemptedCount,ServerIndex,Status\n';
  const rows = results.entities.map((e) =>
    [
      e.id,
      `"${e.name}"`,
      e.category,
      e.priority,
      e.arrivalTime.toFixed(2),
      e.totalWaitTime.toFixed(2),
      e.serviceDuration.toFixed(2),
      e.preemptedCount,
      e.serverAssigned !== null ? e.serverAssigned + 1 : 'None',
      e.status,
    ].join(',')
  );
  return header + rows.join('\n');
}
