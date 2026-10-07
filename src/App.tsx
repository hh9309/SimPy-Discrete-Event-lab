/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { Module_SimPyPrinciples } from './components/Module_SimPyPrinciples';
import { Module_SimulationReports } from './components/Module_SimulationReports';
import { Module1_SimPyEnv } from './components/Module1_SimPyEnv';
import { Module2_ProcessYield } from './components/Module2_ProcessYield';
import { Module3_ResourceMechanisms } from './components/Module3_ResourceMechanisms';
import { Module4_ParamSandbox } from './components/Module4_ParamSandbox';
import { Module5_QueueScenarios } from './components/Module5_QueueScenarios';
import { Module6_LogisticsAssembly } from './components/Module6_LogisticsAssembly';
import { Module7_GanttTimeline } from './components/Module7_GanttTimeline';
import { Module8_MonteCarloStats } from './components/Module8_MonteCarloStats';
import { Module9_CodeEngine } from './components/Module9_CodeEngine';
import { Module10_AIDiagnosisKnowledge } from './components/Module10_AIDiagnosisKnowledge';
import { SimulationParams, SimulationResults, ResourceKind } from './simpy-core/types';
import { runSimulation, runLogisticsSimulation } from './simpy-core/scenarios';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('workbench');
  const [scenarioName, setScenarioName] = useState<string>('bank');

  // Default Simulation Parameters
  const [params, setParams] = useState<SimulationParams>({
    lambda: 1.5,
    mu: 0.6,
    servers: 3,
    arrivalDist: 'exponential',
    serviceDist: 'normal',
    resourceType: 'PriorityResource',
    simDuration: 100,
    seed: 42,
    vipRatio: 0.25,
  });

  // Current Simulation Results
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [virtualTime, setVirtualTime] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Run simulation once on mount or when parameters change
  const executeSimulation = useCallback((currentParams: SimulationParams, sName: string) => {
    let res: SimulationResults;
    if (sName === 'logistics') {
      res = runLogisticsSimulation(currentParams);
    } else {
      res = runSimulation(currentParams);
    }
    setResults(res);
    setVirtualTime(0);
  }, []);

  useEffect(() => {
    executeSimulation(params, scenarioName);
  }, [params, scenarioName, executeSimulation]);

  // Handle Scenario Selection
  const handleSelectScenario = (scId: string, presetParams: SimulationParams) => {
    setScenarioName(scId);
    setParams(presetParams);
    executeSimulation(presetParams, scId);
  };

  // Step Next Event handler
  const handleStepNextEvent = () => {
    if (!results) return;
    const futureEvents = results.queueTimeHistory.filter((q) => q.time > virtualTime);
    if (futureEvents.length > 0) {
      setVirtualTime(futureEvents[0].time);
    } else {
      setVirtualTime(results.duration);
      setIsSimulating(false);
    }
  };

  // Reset simulation
  const handleReset = () => {
    setIsSimulating(false);
    setVirtualTime(0);
    setParams((prev) => ({ ...prev, seed: prev.seed + 1 }));
  };

  // Trigger Play
  const handleRunPlay = () => {
    if (virtualTime >= (results?.duration || 100)) {
      setVirtualTime(0);
    }
    setIsSimulating(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-slate-800 flex flex-col font-sans selection:bg-slate-200">
      {/* 3-Zone Top Navigation with 知识导引 next to 综合实验台, and 仿真报告 next to AI仿真导引 */}
      <TopNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunSimulation={handleRunPlay}
        onResetSimulation={handleReset}
        isSimulating={isSimulating}
        virtualTime={virtualTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Section Banner */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>离散事件系统建模</span>
              <span>·</span>
              <span>DES 形式化体系</span>
              <span>·</span>
              <span>SimPy 4 运行内核</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              SimPy 离散事件仿真教学与科研实验台
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              基于优先队列二叉堆时钟推进机制，实时解析 Python 生成器 <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">yield</code> 挂起唤醒、资源排队与抢占中断；验证排队论 Little 定理与 Erlang-C 公式，探索利用率临界发散、装配线阻塞与多轮蒙特卡洛置信区间。
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="px-3 py-1.5 bg-slate-100 rounded-lg font-mono text-[11px] border border-slate-200">
              内核: SimPy 4.0 / Python 3.10+
            </span>
          </div>
        </section>

        {/* Tab-driven Viewports */}

        {/* 1. 综合实验台 */}
        {activeTab === 'workbench' && (
          <div className="space-y-6">
            {/* Module 4: Parameter Tuning Sandbox */}
            <Module4_ParamSandbox params={params} onChangeParams={setParams} />

            {/* Module 7: Gantt Chart & 2D Queue Animation */}
            <Module7_GanttTimeline
              results={results}
              virtualTime={virtualTime}
              setVirtualTime={setVirtualTime}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              onStepNextEvent={handleStepNextEvent}
            />

            {/* Module 8: Statistical Metrics & Monte Carlo */}
            <Module8_MonteCarloStats results={results} params={params} />

            {/* Modules 1 & 2: Environment & Process Yield */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Module1_SimPyEnv
                envInstance={null}
                onStepNextEvent={handleStepNextEvent}
                isSimulating={isSimulating}
              />
              <Module2_ProcessYield />
            </div>

            {/* Module 3: Resource Preemption Visualizer */}
            <Module3_ResourceMechanisms
              currentResourceType={params.resourceType}
              onSelectResourceType={(kind: ResourceKind) => setParams({ ...params, resourceType: kind })}
            />

            {/* Module 10: AI Diagnosis & 4 Knowledge Slices */}
            <Module10_AIDiagnosisKnowledge
              params={params}
              results={results}
              scenarioName={scenarioName}
            />

            {/* Module 9: SimPy Code Engine */}
            <Module9_CodeEngine
              params={params}
              results={results}
              scenarioName={scenarioName}
            />
          </div>
        )}

        {/* 2. 知识导引 (New dedicated slice to the right of 综合实验台) */}
        {activeTab === 'principles' && (
          <div className="space-y-6">
            <Module_SimPyPrinciples />
          </div>
        )}

        {/* 3. 经典排队案例 */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <Module5_QueueScenarios
              currentScenario={scenarioName}
              onSelectScenario={handleSelectScenario}
            />
            <Module7_GanttTimeline
              results={results}
              virtualTime={virtualTime}
              setVirtualTime={setVirtualTime}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              onStepNextEvent={handleStepNextEvent}
            />
            <Module8_MonteCarloStats results={results} params={params} />
            <Module9_CodeEngine params={params} results={results} scenarioName={scenarioName} />
          </div>
        )}

        {/* 4. 生产物流流水线 */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            <Module6_LogisticsAssembly baseParams={params} />
            <Module9_CodeEngine params={params} results={results} scenarioName="logistics" />
          </div>
        )}

        {/* 5. 蒙特卡洛统计 */}
        {activeTab === 'montecarlo' && (
          <div className="space-y-6">
            <Module8_MonteCarloStats results={results} params={params} />
            <Module4_ParamSandbox params={params} onChangeParams={setParams} />
          </div>
        )}

        {/* 6. SimPy代码引擎 */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <Module9_CodeEngine params={params} results={results} scenarioName={scenarioName} />
            <Module2_ProcessYield />
          </div>
        )}

        {/* 7. AI仿真导引 */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <Module10_AIDiagnosisKnowledge
              params={params}
              results={results}
              scenarioName={scenarioName}
            />
            <Module1_SimPyEnv
              envInstance={null}
              onStepNextEvent={handleStepNextEvent}
              isSimulating={isSimulating}
            />
          </div>
        )}

        {/* 8. 仿真报告与数据下载 (New dedicated slice to the right of AI仿真导引) */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Module_SimulationReports
              currentParams={params}
              currentResults={results}
              scenarioName={scenarioName}
            />
          </div>
        )}
      </main>

      {/* Subtle, restrained footer adhering to design constitution */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>SimPy 离散事件仿真实验室</span>
            <span>·</span>
            <span>运筹学与系统仿真工程</span>
          </div>
          <div>
            基于 SimPy 4 协程调度规范 · 符合 Little 守恒定理与 Lindley 稳定性准则
          </div>
        </div>
      </footer>
    </div>
  );
}
