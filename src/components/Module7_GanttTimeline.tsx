import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Activity, Clock, Layers, GitCommit } from 'lucide-react';
import { GanttInterval, QueueLengthSample, SimulationResults } from '../simpy-core/types';

interface Module7Props {
  results: SimulationResults | null;
  virtualTime: number;
  setVirtualTime: React.Dispatch<React.SetStateAction<number>>;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  onStepNextEvent: () => void;
}

export const Module7_GanttTimeline: React.FC<Module7Props> = ({
  results,
  virtualTime,
  setVirtualTime,
  isSimulating,
  setIsSimulating,
  onStepNextEvent,
}) => {
  const [speed, setSpeed] = useState<number>(2.0); // multiplier
  const [eventFilter, setEventFilter] = useState<'all' | 'arrival' | 'start_service' | 'release'>('all');
  const animFrameRef = useRef<number | null>(null);
  const lastWallTimeRef = useRef<number | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  const duration = results?.duration || 100;
  const serversCount = results?.params.servers || 1;

  // Real-time animation loop
  useEffect(() => {
    if (!isSimulating) {
      lastWallTimeRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (wallTime: number) => {
      if (lastWallTimeRef.current === null) {
        lastWallTimeRef.current = wallTime;
      }
      const dtSeconds = (wallTime - lastWallTimeRef.current) / 1000;
      lastWallTimeRef.current = wallTime;

      setVirtualTime((prev) => {
        const next = prev + dtSeconds * speed * 2;
        if (next >= duration) {
          setIsSimulating(false);
          return duration;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, speed, duration, setIsSimulating, setVirtualTime]);

  if (!results) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        正在初始化仿真环境数据...
      </div>
    );
  }

  // Active entities at current virtual time
  const currentIntervals = results.ganttIntervals.filter(
    (g) => g.startTime <= virtualTime && g.endTime >= virtualTime
  );

  // Current queue length interpolation
  const currentQueueSample = results.queueTimeHistory.reduce((prev, curr) => {
    return curr.time <= virtualTime ? curr : prev;
  }, results.queueTimeHistory[0] || { time: 0, queueLength: 0, busyServers: 0 });

  // Filtered events for the vertical discrete event stream timeline
  const filteredEvents = (results.eventLogs || []).filter((evt) => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'arrival') return evt.type === 'arrival';
    if (eventFilter === 'start_service') return evt.type === 'start_service' || evt.type === 'resume_service';
    if (eventFilter === 'release') return evt.type === 'release';
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 07</span>
            <span>·</span>
            <span>时序调度可视化</span>
            <span>·</span>
            <span>甘特图、2D 排队流与时钟控制器</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            动态仿真过程甘特图演播 (Gantt Chart & Real-Time Playback)
          </h2>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVirtualTime(0)}
            title="回拨到起始时刻"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all ${
              isSimulating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>暂停演播</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{virtualTime >= duration ? '重播演播' : '继续播放'}</span>
              </>
            )}
          </button>
          <button
            onClick={onStepNextEvent}
            title="单步推进到下一个事件"
            className="px-3 py-2 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            单步 (Step)
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-mono">
            {[0.5, 1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded transition-colors ${
                  speed === s ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Virtual Time Scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">时序指针 T={virtualTime.toFixed(2)}s</span>
          <span className="text-slate-500">截止 T={duration.toFixed(0)}s</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={virtualTime}
          onChange={(e) => {
            setIsSimulating(false);
            setVirtualTime(parseFloat(e.target.value));
          }}
          className="w-full accent-slate-900 cursor-pointer"
        />
      </div>

      {/* 2D Entity Flow & Server Occupancy Visualizer */}
      <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-600" />
            2D 实时排队队列与服务台占用态 (当前时刻 T={virtualTime.toFixed(1)}s)
          </span>
          <span className="text-slate-500 font-mono">
            排队队长: {currentQueueSample.queueLength} | 繁忙服务台: {currentIntervals.length}/
            {serversCount}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Waiting Queue Visualizer */}
          <div className="md:col-span-2 p-3 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-2">等待队列缓冲区 (Waiting Queue)</div>
            <div className="flex flex-wrap gap-1.5 min-h-[38px] items-center">
              {currentQueueSample.queueLength === 0 ? (
                <span className="text-xs text-slate-400 italic">当前无排队等待实体 (队列为空)</span>
              ) : (
                Array.from({ length: Math.min(18, currentQueueSample.queueLength) }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-mono flex items-center justify-center font-bold shadow-xs animate-in fade-in"
                  >
                    #{idx + 1}
                  </div>
                ))
              )}
              {currentQueueSample.queueLength > 18 && (
                <span className="text-xs text-slate-500 font-mono">
                  +{currentQueueSample.queueLength - 18}...
                </span>
              )}
            </div>
          </div>

          {/* Servers Grid */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: serversCount }).map((_, sIdx) => {
              const activeJob = currentIntervals.find((g) => g.serverId === sIdx);
              return (
                <div
                  key={sIdx}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    activeJob
                      ? activeJob.isPreempted
                        ? 'bg-rose-50 border-rose-300'
                        : activeJob.category === 'vip'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-semibold text-slate-700">服务台 #{sIdx + 1}</span>
                    <span
                      className={`px-1 rounded ${
                        activeJob ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      {activeJob ? 'BUSY' : 'IDLE'}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold truncate text-slate-900">
                    {activeJob ? activeJob.entityName : '空闲中'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {activeJob ? `${activeJob.startTime.toFixed(1)}s ~ ${activeJob.endTime.toFixed(1)}s` : '待命'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gantt Chart SVG Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            资源占用甘特图 (Server Gantt Chart)
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" /> 普通服务
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block" /> VIP/紧急
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" /> 抢占中断
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl overflow-x-auto shadow-inner">
          <svg
            className="w-full min-w-[700px] h-[160px]"
            viewBox={`0 0 1000 ${serversCount * 45 + 30}`}
          >
            {/* Background grid lines */}
            {Array.from({ length: 11 }).map((_, i) => {
              const x = (i / 10) * 940 + 50;
              const tVal = (i / 10) * duration;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={serversCount * 45}
                    stroke="#334155"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={serversCount * 45 + 20}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {tVal.toFixed(0)}s
                  </text>
                </g>
              );
            })}

            {/* Server rows */}
            {Array.from({ length: serversCount }).map((_, sIdx) => {
              const y = sIdx * 45 + 10;
              const rowIntervals = results.ganttIntervals.filter((g) => g.serverId === sIdx);

              return (
                <g key={sIdx}>
                  {/* Row label */}
                  <text
                    x={10}
                    y={y + 18}
                    fill="#cbd5e1"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    S{sIdx + 1}
                  </text>
                  {/* Base track */}
                  <rect
                    x={50}
                    y={y}
                    width={940}
                    height={26}
                    fill="#1e293b"
                    rx={4}
                  />

                  {/* Interval blocks */}
                  {rowIntervals.map((interval, iIdx) => {
                    const startX = 50 + (interval.startTime / duration) * 940;
                    const endX = 50 + (interval.endTime / duration) * 940;
                    const width = Math.max(3, endX - startX);
                    let fill = '#10b981'; // emerald
                    if (interval.isPreempted) fill = '#f43f5e'; // rose
                    else if (interval.category === 'vip') fill = '#f59e0b'; // amber

                    return (
                      <rect
                        key={iIdx}
                        x={startX}
                        y={y + 2}
                        width={width}
                        height={22}
                        fill={fill}
                        rx={3}
                        opacity={interval.startTime <= virtualTime ? 1 : 0.25}
                      >
                        <title>
                          {interval.entityName}: {interval.startTime.toFixed(1)}s - {interval.endTime.toFixed(1)}s
                        </title>
                      </rect>
                    );
                  })}
                </g>
              );
            })}

            {/* Current Virtual Time Needle */}
            {virtualTime <= duration && (
              <line
                x1={50 + (virtualTime / duration) * 940}
                y1={0}
                x2={50 + (virtualTime / duration) * 940}
                y2={serversCount * 45 + 5}
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Vertical Discrete Event Stream Timeline (Requested by user: 在甘特图下方添加一个垂直排列的事件流时间轴，使用不同颜色标识到达事件、服务开始事件和服务结束事件) */}
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">
                离散事件流垂直时间轴 (Discrete Event Stream Timeline)
              </span>
              <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded">
                共 {results.eventLogs.length} 个调度事件
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              点击时间轴上的任意事件卡片，可直接跳转并对齐甘特图与虚拟时钟 (T)。
            </p>
          </div>

          {/* Color Legend & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Color Legend Badges */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-600 mr-2 border-r border-slate-200 pr-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 到达
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 服务开始
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 服务结束
              </span>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
              {(
                [
                  { id: 'all', label: '全部' },
                  { id: 'arrival', label: '到达' },
                  { id: 'start_service', label: '开始' },
                  { id: 'release', label: '结束' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setEventFilter(f.id)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    eventFilter === f.id
                      ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Vertical Timeline Body */}
        <div
          ref={timelineScrollRef}
          className="max-h-72 overflow-y-auto pr-2 space-y-2 relative"
        >
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              当前筛选条件下无事件记录
            </div>
          ) : (
            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filteredEvents.map((evt, idx) => {
                const isPastOrCurrent = evt.time <= virtualTime;
                const isCurrentActive =
                  isPastOrCurrent &&
                  (idx === filteredEvents.length - 1 || filteredEvents[idx + 1].time > virtualTime);

                // Determine styling based on event type
                let nodeColor = 'bg-slate-400 ring-slate-100';
                let tagColor = 'bg-slate-100 text-slate-700 border-slate-200';
                let typeLabel = '事件';
                let dotIcon = '●';

                if (evt.type === 'arrival') {
                  nodeColor = 'bg-blue-500 ring-blue-100 text-white';
                  tagColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  typeLabel = '到达事件 (Arrival)';
                  dotIcon = '↓';
                } else if (evt.type === 'start_service' || evt.type === 'resume_service') {
                  nodeColor = 'bg-amber-500 ring-amber-100 text-white';
                  tagColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  typeLabel = evt.type === 'resume_service' ? '抢占恢复 (Resume)' : '服务开始 (Start)';
                  dotIcon = '▶';
                } else if (evt.type === 'release') {
                  nodeColor = 'bg-emerald-500 ring-emerald-100 text-white';
                  tagColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  typeLabel = '服务结束 (End/Release)';
                  dotIcon = '✓';
                } else if (evt.type === 'preempted') {
                  nodeColor = 'bg-rose-500 ring-rose-100 text-white';
                  tagColor = 'bg-rose-50 text-rose-800 border-rose-200';
                  typeLabel = '抢占中断 (Preempted)';
                  dotIcon = '⚡';
                } else if (evt.type === 'reneged') {
                  nodeColor = 'bg-purple-500 ring-purple-100 text-white';
                  tagColor = 'bg-purple-50 text-purple-800 border-purple-200';
                  typeLabel = '超时放弃 (Reneged)';
                  dotIcon = '✕';
                }

                // Time jump delta from previous event
                const prevEventTime = idx > 0 ? filteredEvents[idx - 1].time : 0;
                const timeDelta = evt.time - prevEventTime;

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setIsSimulating(false);
                      setVirtualTime(evt.time);
                    }}
                    className={`relative group cursor-pointer transition-all p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isCurrentActive
                        ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                        : isPastOrCurrent
                        ? 'bg-white hover:bg-slate-50/90 border-slate-200/90'
                        : 'bg-slate-50/40 hover:bg-white border-slate-200/60 opacity-60'
                    }`}
                  >
                    {/* Node Dot on the vertical spine */}
                    <div
                      className={`absolute -left-[19px] top-3.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 transition-transform group-hover:scale-110 ${nodeColor}`}
                    >
                      {dotIcon}
                    </div>

                    {/* Left: Event Type, Time, and Delta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Timestamp badge */}
                      <span className="font-mono font-bold text-slate-900 tabular-nums bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        T = {evt.time.toFixed(2)}s
                      </span>

                      {/* Event Type badge */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tagColor}`}>
                        {typeLabel}
                      </span>

                      {/* Entity Name */}
                      <span className="font-semibold text-slate-800 text-xs">
                        {evt.entityName}
                      </span>

                      {/* Server badge if available */}
                      {evt.serverIndex !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          服务台 #{evt.serverIndex + 1}
                        </span>
                      )}
                    </div>

                    {/* Right: Description & Discrete Time-Jump Delta */}
                    <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                      <span className="truncate max-w-xs">{evt.description}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        Δt={timeDelta >= 0 ? `+${timeDelta.toFixed(2)}s` : `${timeDelta.toFixed(2)}s`}
                      </span>
                      {isCurrentActive && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded shrink-0 animate-pulse">
                          当前时刻
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Queue Length Fluctuations Area Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            排队队长实时时序曲线 Lq(t)
          </span>
          <span className="text-slate-500 text-[11px] font-mono">
            峰值队长: {results.maxQueueLength} | 平均队长: {results.avgQueueLength.toFixed(2)}
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <svg className="w-full h-[90px]" viewBox="0 0 1000 90">
            {/* Grid line */}
            <line x1={0} y1={80} x2={1000} y2={80} stroke="#e2e8f0" strokeWidth="1" />
            <line x1={0} y1={40} x2={1000} y2={40} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

            {/* Queue polyline */}
            {(() => {
              const maxQ = Math.max(1, results.maxQueueLength);
              const points = results.queueTimeHistory.map((pt) => {
                const x = (pt.time / duration) * 1000;
                const y = 80 - (pt.queueLength / maxQ) * 65;
                return `${x},${y}`;
              });

              if (points.length === 0) return null;
              const pathData = `M 0,80 L ${points.join(' L ')} L 1000,80 Z`;

              return (
                <>
                  <path d={pathData} fill="#e0f2fe" opacity={0.7} />
                  <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="1.8"
                    points={points.join(' ')}
                  />
                  {/* Current virtual time indicator */}
                  <line
                    x1={(virtualTime / duration) * 1000}
                    y1={0}
                    x2={(virtualTime / duration) * 1000}
                    y2={85}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};
