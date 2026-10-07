import React, { useState } from 'react';
import { Code2, Copy, Check, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { SimulationParams, SimulationResults } from '../simpy-core/types';
import {
  generateSimPyPythonCode,
  generateMarkdownReport,
  generateCSVTrace,
} from '../simpy-core/code-generator';

interface Module9Props {
  params: SimulationParams;
  scenarioName: string;
  results: SimulationResults | null;
}

export const Module9_CodeEngine: React.FC<Module9Props> = ({
  params,
  scenarioName,
  results,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const code = generateSimPyPythonCode(params, scenarioName === 'logistics' ? 'logistics' : 'queue');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownloadPy = () => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simpy_simulation_${Date.now()}.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    if (!results) return;
    const md = generateMarkdownReport(results, scenarioName);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simpy_report_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!results) return;
    const csv = generateCSVTrace(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simpy_entities_trace_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 09</span>
            <span>·</span>
            <span>Python 生态落地</span>
            <span>·</span>
            <span>原生 SimPy 脚本生成、导出与实验报告</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Python / SimPy 原生代码引擎 (Executable Code Engine)
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制代码' : '复制代码'}</span>
          </button>
          <button
            onClick={handleDownloadPy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 .py 脚本</span>
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>导出 Markdown 实验报告</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>导出实体流水 (CSV)</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Python 3.10+ / SimPy 4.0+ 真实可运行代码</span>
          <span>与当前沙盒参数实时双向绑定</span>
        </div>
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 shadow-xl max-h-[500px] overflow-y-auto">
          <pre className="leading-relaxed whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Code Breakdown & Architecture Footnote */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-2">
        <div className="font-semibold text-slate-900">SimPy 核心语法与设计范式速查：</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 bg-white rounded border border-slate-200/60">
            <div className="font-mono text-emerald-700 font-semibold mb-1">env.process(func())</div>
            <div className="text-[11px] text-slate-600">将 Python 生成器注册为仿真环境的一个并发进程实体。</div>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200/60">
            <div className="font-mono text-blue-700 font-semibold mb-1">yield req / res.request()</div>
            <div className="text-[11px] text-slate-600">申请并发资源并在无可用槽位时自动进入等待队列挂起。</div>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200/60">
            <div className="font-mono text-amber-700 font-semibold mb-1">yield env.timeout(delay)</div>
            <div className="text-[11px] text-slate-600">离散推进虚拟时间，在此期间让出单线程事件循环控制权。</div>
          </div>
        </div>
      </div>
    </div>
  );
};
