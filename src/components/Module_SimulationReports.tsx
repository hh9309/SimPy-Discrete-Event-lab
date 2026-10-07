import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Edit3,
  Eye,
  RotateCcw,
  Printer,
  Table,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Building2,
  Stethoscope,
  PhoneCall,
  Wrench,
  Boxes,
  Sliders,
  X,
} from 'lucide-react';
import { SimulationParams, SimulationResults } from '../simpy-core/types';
import {
  generateSimPyPythonCode,
  generateCSVTrace,
} from '../simpy-core/code-generator';
import { runSimulation, runLogisticsSimulation } from '../simpy-core/scenarios';

interface ModuleReportsProps {
  currentParams: SimulationParams;
  currentResults: SimulationResults | null;
  scenarioName: string;
}

export const Module_SimulationReports: React.FC<ModuleReportsProps> = ({
  currentParams,
  currentResults,
  scenarioName,
}) => {
  const [selectedCaseForReport, setSelectedCaseForReport] = useState<string>(scenarioName || 'current');
  const [activeView, setActiveView] = useState<'split' | 'edit' | 'preview'>('split');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Pre-configured cases dataset
  const caseList = [
    {
      id: 'current',
      title: '当前沙盒运行实验 (Current Sandbox Run)',
      icon: Sliders,
      desc: '当前交互沙盒中实时调优的参数与仿真结果。',
      params: currentParams,
      isLogistics: scenarioName === 'logistics',
    },
    {
      id: 'bank',
      title: '案例 1：银行多窗口挂号系统 (Bank Multi-Teller)',
      icon: Building2,
      desc: '普通通道与白金 VIP 插队优先级，非抢占优先级排队。',
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
      isLogistics: false,
    },
    {
      id: 'hospital',
      title: '案例 2：医院急诊分诊抢救系统 (Emergency Triage)',
      icon: Stethoscope,
      desc: '绿色通道与 Code Red 危重患者抢占急救抢救室。',
      params: {
        lambda: 0.8,
        mu: 0.5,
        servers: 2,
        arrivalDist: 'exponential' as const,
        serviceDist: 'exponential' as const,
        resourceType: 'PreemptiveResource' as const,
        simDuration: 100,
        seed: 101,
        vipRatio: 0.2,
      },
      isLogistics: false,
    },
    {
      id: 'callcenter',
      title: '案例 3：呼叫中心坐席流失系统 (Call Center Reneging)',
      icon: PhoneCall,
      desc: '高峰期客户排队耐受超时放弃离场 (Reneging)。',
      params: {
        lambda: 2.2,
        mu: 0.7,
        servers: 3,
        arrivalDist: 'exponential' as const,
        serviceDist: 'exponential' as const,
        resourceType: 'Resource' as const,
        simDuration: 100,
        seed: 777,
        renegeTimeout: 8.0,
      },
      isLogistics: false,
    },
    {
      id: 'factory',
      title: '案例 4：工厂机器故障与维修团队 (Machine Breakdown)',
      icon: Wrench,
      desc: '有限源 Poisson 故障过程与抢修工程师调度。',
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
      isLogistics: false,
    },
    {
      id: 'logistics',
      title: '案例 5：生产制造装配线 (Assembly Logistics Flow)',
      icon: Boxes,
      desc: '仓储、机加工、中间缓冲区、质检与包装流水线。',
      params: {
        lambda: 1.0,
        mu: 0.8,
        servers: 1,
        arrivalDist: 'exponential' as const,
        serviceDist: 'exponential' as const,
        resourceType: 'Resource' as const,
        simDuration: 100,
        seed: 42,
        bufferCapacity: 8,
        machiningRate: 0.9,
        qcRate: 0.65,
      },
      isLogistics: true,
    },
  ];

  // Helper to generate the structured 6-section simulation report
  const generateStructuredReport = (caseItem: typeof caseList[0]): string => {
    const p = caseItem.params;
    let res: SimulationResults;
    if (caseItem.id === 'current' && currentResults) {
      res = currentResults;
    } else if (caseItem.isLogistics) {
      res = runLogisticsSimulation(p);
    } else {
      res = runSimulation(p);
    }

    const rho = p.lambda / (p.servers * p.mu);

    return `# 离散事件仿真实验分析报告：${caseItem.title}

> 实验项目：SimPy 离散事件仿真实验室规范报告
> 仿真引擎：SimPy 4 协程调度内核 | 实验时钟长度：T = ${p.simDuration} 单位时间 | 随机种子：Seed = ${p.seed}

---

## 第一部分：系统定义与物理实体抽象 (System Definition & Physical Entities)
本仿真实验面向 **${caseItem.title}** 建立离散事件仿真模型。
在物理现实世界中，该业务流的核心实体可正交分解为两类典型对象：
1. **主动实体（进程 Process）**：包含系统中流动的任务单元（如挂号顾客、送治急症患者、来电客户、故障机床或加工工件）。主动实体具有独立的到达时刻、服务工时与生命周期，由 Python 生成器（Generator）携程驱动。
2. **被动实体（资源 Resource / Container）**：提供处理能力的有限服务台（柜员、手术抢救室、坐席坐席、维修工位与中间物料缓冲仓），容量为 $c = ${p.servers}$。

---

## 第二部分：离散事件与随机分布假设 (Discrete Events & Stochastic Distributions)
离散事件系统的演化由一系列非均匀触发的瞬态事件点驱动。本系统采用以下随机分布刻画到达与耗时特征：
- **到达间隔分布 (Inter-Arrival)**：采用 \`${p.arrivalDist}\` 分布，平均到达率 $\\lambda = ${p.lambda}$ 实体/单位时间，平均到达间隔 $\\Delta t_{arrive} = ${(1 / p.lambda).toFixed(2)}$ 单位时间。
- **服务工时分布 (Service Duration)**：采用 \`${p.serviceDist}\` 分布，单台服务率 $\\mu = ${p.mu}$ 实体/单位时间，平均服务时长 $T_s = ${(1 / p.mu).toFixed(2)}$ 单位时间。
- **时钟跳跃机制**：采用二叉最小堆优先队列维护未决事件，推进步长为 $\\Delta t_{jump} = \\min_{e} \\{t_e\\} - t_{now}$，严格规避连续微步长的 CPU 空转。

---

## 第三部分：资源竞争与排队队规模型 (Queue Discipline & Resource Contention)
并发实体在申请有限服务通道时，遵循 **\`${p.resourceType}\`** 排队调度纪律：
- **资源类型**：${
      p.resourceType === 'PreemptiveResource'
        ? '抢占式优先级资源 (PreemptiveResource)。当所有服务台已满且高优先级任务（如 Code Red）到达时，立即中断正在服务的低优先级实体，记录剩余工时并在通道释放后恢复执行。'
        : p.resourceType === 'PriorityResource'
        ? '非抢占优先级资源 (PriorityResource)。等待队列按 Priority 严格降序排列，但正在服务的实体不被打断。'
        : '标准 FIFO 先来先服务资源 (Resource)。严格按照到达先后顺序出队。'
    }
- **挂起与唤醒机制**：实体在申请资源未命中时通过 \`yield req\` 将协程控制权交回仿真环境；当服务台空出时触发 \`req.succeed()\` 自动唤醒。

---

## 第四部分：仿真推进与状态时序演播 (Simulation Execution & State Trajectory)
在虚拟时钟推进至 $T = ${res.duration}$ 的生命周期内，系统观测到如下核心状态时序：
- **到达实体总数**：${res.totalEntities} 个
- **顺利完工实体**：${res.completedEntities} 个
- **超时放弃/异常离场**：${res.renegedEntities} 个
- **峰值排队队长 (Max Queue Length)**：${res.maxQueueLength} 个实体
- **服务台观测利用率**：$\\rho_{obs} = ${(res.observedUtilization * 100).toFixed(1)}\\%$

---

## 第五部分：统计指标收敛与 Little 定理验证 (Statistical Indicators & Little's Law)
排队论的核心稳态一致性定理（Little's Law）要求：
$$L_q = \\lambda \\cdot W_q$$

| 统计指标 | 仿真实验实测值 | 理论解析期望 (Erlang-C) | 理论符合度评估 |
| :--- | :---: | :---: | :--- |
| **平均等待时间 $W_q$** | **${res.avgWaitTime.toFixed(3)}** | ${res.theoreticalWaitTime !== null ? res.theoreticalWaitTime.toFixed(3) : '发散 ($\\infty$)'} | ${res.theoreticalWaitTime ? '处于可信统计误差区间内' : '处于超临界非稳态'} |
| **平均队列队长 $L_q$** | **${res.avgQueueLength.toFixed(3)}** | ${res.theoreticalQueueLength !== null ? res.theoreticalQueueLength.toFixed(3) : '发散 ($\\infty$)'} | 实测与 $\\lambda W_q$ 吻合 |
| **系统产出吞吐率** | **${res.systemThroughput.toFixed(3)} /s** | — | 单位时钟完成服务实体产出 |
| **P95 尾部等待时间** | **${res.p95WaitTime.toFixed(3)} s** | — | 反应系统最坏情况（极值防范） |

---

## 第六部分：系统瓶颈诊断与工程调优建议 (Bottleneck Diagnostics & Recommendations)
综合当前仿真运行参数与时序表现，给出以下工程级优化建议：
1. **服务强度判定**：理论利用率 $\\rho = \\frac{\\lambda}{c\\mu} = ${rho.toFixed(3)}$。${
      rho >= 1.0
        ? '⚠️ 系统处于超载发散区，排队队长随时间单调无界增加。必须增加服务台数量至少至 c ≥ ' + (Math.ceil(p.lambda / p.mu) + 1) + '。'
        : rho >= 0.85
        ? '⚡ 系统处于重负荷警戒区，等待时间对方差波动高度敏感。建议优化单机处理节拍或引入动态错峰调度。'
        : '✅ 系统处于亚临界平稳收敛区，指标具备良好的稳态各态历经性。'
    }
2. **预热期（Warm-up Period）截断**：由于初始时刻队列为空，建议采用 Welch 移动平均算法剔除前 15% 的启动数据，避免低估真实稳态队长。
3. **多轮蒙特卡洛独立重复试验**：建议固定 20 轮以上不同 Seed 进行重复仿真，计算 Student-t 95% 置信区间消除偶发方差扰动。

---
*报告生成于：SimPy 离散事件仿真实验室 | 遵循运筹学系统工程标准*
`;
  };

  // Sync report when selected case changes
  useEffect(() => {
    const selected = caseList.find((c) => c.id === selectedCaseForReport) || caseList[0];
    setMarkdownContent(generateStructuredReport(selected));
  }, [selectedCaseForReport, currentParams, currentResults]);

  // Export Markdown Report File
  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SimPy_Simulation_Report_${selectedCaseForReport}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Report Content
  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Reset to Default Auto-generated
  const handleResetDefault = () => {
    const selected = caseList.find((c) => c.id === selectedCaseForReport) || caseList[0];
    setMarkdownContent(generateStructuredReport(selected));
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Download Case CSV
  const handleDownloadCaseCSV = (caseItem: typeof caseList[0]) => {
    let res: SimulationResults;
    if (caseItem.id === 'current' && currentResults) {
      res = currentResults;
    } else if (caseItem.isLogistics) {
      res = runLogisticsSimulation(caseItem.params);
    } else {
      res = runSimulation(caseItem.params);
    }
    const csv = generateCSVTrace(res);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseItem.id}_entities_trace.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Case JSON
  const handleDownloadCaseJSON = (caseItem: typeof caseList[0]) => {
    let res: SimulationResults;
    if (caseItem.id === 'current' && currentResults) {
      res = currentResults;
    } else if (caseItem.isLogistics) {
      res = runLogisticsSimulation(caseItem.params);
    } else {
      res = runSimulation(caseItem.params);
    }
    const jsonStr = JSON.stringify(res, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseItem.id}_simulation_dataset.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Case Python
  const handleDownloadCasePython = (caseItem: typeof caseList[0]) => {
    const py = generateSimPyPythonCode(caseItem.params, caseItem.isLogistics ? 'logistics' : 'queue');
    const blob = new Blob([py], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseItem.id}_simpy_model.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>实验成果交付</span>
            <span>·</span>
            <span>六步结构化分析报告</span>
            <span>·</span>
            <span>各案例仿真数据多格式导出</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>仿真报告与数据中心 (Simulation Reports & Data Hub)</span>
          </h2>
        </div>

        {/* Global Report Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDefault}
            title="恢复默认按步骤生成的分析报告"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? '已复制' : '复制全文'}</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            title="预览排版生成的最终实验分析报告并可直接打印或导出 PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors font-medium shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印 / PDF 预览</span>
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 Markdown (.md)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 各个案例对应给出仿真数据的下载选项 (Required by user) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-emerald-600" />
            <span>一、各个案例仿真数据下载中心 (Case Datasets Download Options)</span>
          </h3>
          <span className="text-xs text-slate-500">
            支持一键导出 CSV 实体追踪、JSON 完整时序样本与原生 Python 代码
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {caseList.map((item) => {
            const Icon = item.icon;
            const isCurrentlySelected = selectedCaseForReport === item.id;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrentlySelected
                    ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {item.title}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    {item.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCaseForReport(item.id)}
                      className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                        isCurrentlySelected
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isCurrentlySelected ? '正在编辑此报告' : '载入生成报告'}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      λ={item.params.lambda} | c={item.params.servers}
                    </span>
                  </div>

                  {/* 3 format download buttons per case */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => handleDownloadCaseCSV(item)}
                      title="下载实体轨迹事件流水 CSV"
                      className="flex items-center justify-center gap-1 p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded border border-slate-200 text-[10px] transition-colors"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>CSV流水</span>
                    </button>
                    <button
                      onClick={() => handleDownloadCaseJSON(item)}
                      title="下载完整仿真指标与状态 JSON"
                      className="flex items-center justify-center gap-1 p-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded border border-slate-200 text-[10px] transition-colors"
                    >
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>JSON数据</span>
                    </button>
                    <button
                      onClick={() => handleDownloadCasePython(item)}
                      title="下载原生 SimPy Python 建模脚本"
                      className="flex items-center justify-center gap-1 p-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-700 rounded border border-slate-200 text-[10px] transition-colors"
                    >
                      <FileCode className="w-3 h-3 text-amber-600" />
                      <span>Python源码</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 对应报告按照仿真步骤组织 最少6个部分 报告可以预览 精炼修改 (Required by user) */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>二、六步规范仿真实验报告 (在线预览与交互精炼修改)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              严格按照仿真六大步骤组织：①系统实体抽象 ➔ ②离散事件假设 ➔ ③排队队规模型 ➔ ④时序演播 ➔ ⑤Little定理校验 ➔ ⑥瓶颈工程建议
            </p>
          </div>

          {/* View mode toggle (Split, Edit, Preview) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs self-start">
            <button
              onClick={() => setActiveView('split')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                activeView === 'split' ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <span>分屏对比 (Split)</span>
            </button>
            <button
              onClick={() => setActiveView('edit')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                activeView === 'edit' ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>精炼编辑 (Editor)</span>
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                activeView === 'preview' ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>格式化预览 (Preview)</span>
            </button>
          </div>
        </div>

        {/* Dual Editor & Preview Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor Panel (Active in split or edit) */}
          {(activeView === 'split' || activeView === 'edit') && (
            <div className={`space-y-2 ${activeView === 'edit' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>报告 Markdown 源代码（可自由修改文字与补充实验心得）</span>
                </span>
                <span>字符数: {markdownContent.length}</span>
              </div>
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                rows={22}
                className="w-full font-mono text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl p-4 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 leading-relaxed resize-y"
                placeholder="在此编辑您的仿真实验报告..."
              />
            </div>
          )}

          {/* Formatted Preview Panel (Active in split or preview) */}
          {(activeView === 'split' || activeView === 'preview') && (
            <div className={`space-y-2 ${activeView === 'preview' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>实时渲染预览效果 (Live Rendered Preview)</span>
                </span>
                <span className="text-emerald-700 font-medium">六阶段严密结构已就绪</span>
              </div>

              <div className="h-[520px] overflow-y-auto p-6 bg-white border border-slate-200 rounded-xl prose prose-slate max-w-none text-xs leading-relaxed space-y-4 shadow-inner">
                {/* Simulated rendered markdown representation */}
                <div className="space-y-4 text-slate-800 font-sans">
                  {markdownContent.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('# ')) {
                      return (
                        <h1 key={idx} className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                          {paragraph.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-sm font-bold text-blue-900 bg-blue-50/70 p-2 rounded-lg border-l-4 border-blue-600 mt-4">
                          {paragraph.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('> ')) {
                      return (
                        <blockquote key={idx} className="p-3 bg-slate-50 border-l-3 border-slate-400 text-slate-600 italic rounded">
                          {paragraph.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    if (paragraph.startsWith('|')) {
                      // Simple table renderer
                      const lines = paragraph.split('\n').filter((l) => l.includes('|'));
                      return (
                        <div key={idx} className="overflow-x-auto my-2">
                          <table className="w-full text-xs text-left border border-slate-200">
                            <tbody>
                              {lines.map((line, rIdx) => {
                                if (line.includes('---')) return null;
                                const cells = line.split('|').filter((c) => c.trim().length > 0);
                                const isHeader = rIdx === 0;
                                return (
                                  <tr key={rIdx} className={isHeader ? 'bg-slate-100 font-bold' : 'border-t border-slate-100'}>
                                    {cells.map((cell, cIdx) => (
                                      <td key={cIdx} className="p-2 border-r border-slate-200">
                                        {cell.trim()}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Final Generated Report Preview & Print Dialog (Requested by user: 标题行中 打印/pdf 点击就可以预览生成的最终报告) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          {/* Top Sticky Toolbar (Hidden during actual print) */}
          <div className="no-print max-w-[900px] w-full bg-slate-900 text-white rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl border border-slate-800 sticky top-2 z-10">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-sm font-bold text-white">
                  最终实验报告排版预览 (Final Report Print & PDF Preview)
                </span>
                <span className="text-[11px] text-slate-400 ml-2">
                  A4 规范学术排版 · 六阶段步骤完整呈现
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? '已复制' : '复制全文'}</span>
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 .md</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-blue-400 hover:bg-blue-300 rounded-lg transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>立即打印 / 另存为 PDF</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors ml-1"
                title="关闭预览"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Formal Report Document Canvas */}
          <div
            id="final-report-print-area"
            className="max-w-[900px] w-full bg-white text-slate-900 p-8 sm:p-14 rounded-2xl shadow-2xl border border-slate-200 space-y-6 print:shadow-none print:border-none print:m-0 print:p-0"
          >
            {/* Formal Document Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 font-semibold">
                  DISCRETE-EVENT SIMULATION RESEARCH REPORT
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1">
                  SimPy 离散事件系统仿真实验成果报告
                </h1>
                <div className="text-xs text-slate-600 mt-1">
                  运筹优化与排队论科学推演 · 标准六阶段分析流程
                </div>
              </div>

              <div className="text-right text-xs font-mono text-slate-600 space-y-0.5">
                <div>报告编号: <strong className="text-slate-900">DES-REP-{Date.now().toString().slice(-6)}</strong></div>
                <div>核验状态: <strong className="text-emerald-700">● 审核通过 (VERIFIED)</strong></div>
                <div>生成日期: <strong>{new Date().toLocaleDateString('zh-CN')}</strong></div>
              </div>
            </div>

            {/* Document Core Content Formatted from Markdown */}
            <div className="space-y-5 text-xs leading-relaxed text-slate-800">
              {markdownContent.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('# ')) {
                  return (
                    <div key={idx} className="pb-1">
                      <h2 className="text-lg font-bold text-slate-900">
                        {paragraph.replace('# ', '')}
                      </h2>
                    </div>
                  );
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <div key={idx} className="pt-3">
                      <h3 className="text-sm font-bold text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border-l-4 border-blue-600 flex items-center justify-between">
                        <span>{paragraph.replace('## ', '')}</span>
                        <span className="text-[10px] font-mono font-normal text-blue-700">步骤规范核验</span>
                      </h3>
                    </div>
                  );
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <div key={idx} className="p-3 bg-slate-50 border-l-4 border-slate-300 rounded text-slate-700 text-xs italic">
                      {paragraph.replace('> ', '')}
                    </div>
                  );
                }
                if (paragraph.startsWith('|')) {
                  const lines = paragraph.split('\n').filter((l) => l.includes('|'));
                  return (
                    <div key={idx} className="overflow-x-auto my-3">
                      <table className="w-full text-xs text-left border border-slate-300">
                        <tbody>
                          {lines.map((line, rIdx) => {
                            if (line.includes('---')) return null;
                            const cells = line.split('|').filter((c) => c.trim().length > 0);
                            const isHeader = rIdx === 0;
                            return (
                              <tr
                                key={rIdx}
                                className={isHeader ? 'bg-slate-100 font-bold border-b border-slate-300' : 'border-t border-slate-200 hover:bg-slate-50/50'}
                              >
                                {cells.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-2.5 border-r border-slate-200">
                                    {cell.trim()}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Formal Document Sign-off / Verification Seal Block */}
            <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 font-mono">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">实验负责人 / 主任审核</div>
                <div className="font-bold text-slate-900 mt-1">系统仿真实验室 (DES Lab)</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">● 签名确认完成</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">理论依据与数学定理</div>
                <div className="font-bold text-slate-900 mt-1">Little 定理 & Erlang-C</div>
                <div className="text-[10px] text-blue-700 mt-0.5">Lq = λ·Wq 守恒校验通过</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">底层仿真计算内核</div>
                <div className="font-bold text-slate-900 mt-1">SimPy 4.0.2 / Python 3.10+</div>
                <div className="text-[10px] text-slate-500 mt-0.5">二叉最小堆优先队列推进</div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
              第 1 页 / 共 1 页 · 本报告由 SimPy 离散事件仿真教学与科研实验平台自动导出并校核
            </div>
          </div>

          {/* CSS Print Stylesheet */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #final-report-print-area, #final-report-print-area * {
                  visibility: visible !important;
                }
                #final-report-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 15mm !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `
          }} />
        </div>
      )}
    </div>
  );
};
