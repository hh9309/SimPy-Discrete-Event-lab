import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
  CheckCircle,
  Settings,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { SimulationParams, SimulationResults } from '../simpy-core/types';
import {
  LLMConfig,
  LLMModelType,
  ChatMessage,
  loadLLMConfig,
  saveLLMConfig,
  loadChatHistory,
  saveChatHistory,
  callBrowserLLM,
} from '../simpy-core/llm-service';

interface Module10Props {
  params: SimulationParams;
  results: SimulationResults | null;
  scenarioName: string;
}

export const Module10_AIDiagnosisKnowledge: React.FC<Module10Props> = ({
  params,
  results,
  scenarioName,
}) => {
  const [activeSlice, setActiveSlice] = useState<number>(0); // 0..3

  // LLM Configuration State
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>(llmConfig.apiKey);
  const [selectedModel, setSelectedModel] = useState<LLMModelType>(llmConfig.model);
  const [inputBaseUrl, setInputBaseUrl] = useState<string>(llmConfig.baseUrl || '');
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<boolean>(false);

  // Chat Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChatHistory();
    if (saved.length > 0) return saved;
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 您好！我是 SimPy 离散事件仿真专属顾问。\n我已接入当前排队实验参数（λ=${params.lambda}, μ=${params.mu}, c=${params.servers}）。\n本系统已完全支持纯浏览器端大模型直连（适配 GitHub 静态部署）。请点击右上角小齿轮 ⚙️ 输入您的 API-Key，即可选择 **gemini 3 flash** 或 **deepseek-v4-pro** 进行多轮深度推演与代码优化指导！`,
        timestamp: Date.now(),
        model: '系统引导',
      },
    ];
  });

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const rho = params.lambda / (params.servers * params.mu);

  // Auto-scroll chat dialog
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist messages
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Slices definitions
  const slices = [
    {
      id: 'slice-1',
      title: '切片一：离散事件与连续仿真机理差异',
      badge: '时钟跳跃机制',
      summary: 'SimPy 依靠“事件驱动”在非均匀时间戳跳跃推进，极大地节省计算开销；连续仿真则依赖固定时间步长 (Δt) 微分推进。',
      content: {
        comparison: [
          {
            aspect: '时钟推进逻辑',
            discrete: '非均匀离散跳跃：t_{k+1} = t_k + Δt_{jump}，直接跳跃至事件堆顶',
            continuous: '均匀固定微步长：t_{k+1} = t_k + Δt，每步均需计算全量状态',
          },
          {
            aspect: '计算复杂度',
            discrete: 'O(log N) 仅在有事件触发时消耗 CPU，无事件期间零开销',
            continuous: 'O(T / Δt) 无论系统是否发生状态跃迁，算力持续空转',
          },
          {
            aspect: '典型应用载体',
            discrete: '排队系统、工单流转、网络数据包排队、装配线流向',
            continuous: '飞行力学、化学反应动力学、流体力学 ODE/PDE 求解',
          },
        ],
        takeaway: '离散仿真之所以能在瞬间模拟数万秒的生产物流，关键在于滤除了“无事件静默期”的无意义计算。',
      },
    },
    {
      id: 'slice-2',
      title: '切片二：适用条件与空间表示',
      badge: '进程与资源互锁',
      summary: '适用于排队论、供应链调度与并发资源竞争优化。将复杂业务流抽象为“进程 (Process)”与“资源 (Resource)”的互锁演化。',
      content: {
        points: [
          {
            name: '进程 Process (主动实体/生命周期)',
            desc: '顾客、工件、订单、故障事件。具有状态变量与时间推进动作，由 Python Generator (yield) 承载。',
          },
          {
            name: '资源 Resource (被动实体/服务通道)',
            desc: '柜员、机床、搬运AGV、质检工位。具备容量 Capacity、排队队规 (FIFO/Priority) 与抢占许可。',
          },
          {
            name: '容器 Container / Store (物料与缓冲区)',
            desc: '油罐、缓存仓、拣选货架。提供 put/get 阻塞原语，天然表达工业生产中的阻塞 (Blocking) 与饥饿 (Starvation)。',
          },
        ],
        takeaway: '任何复杂的离散系统，均可化简为“进程在流动中争夺资源”的拓扑网。',
      },
    },
    {
      id: 'slice-3',
      title: '切片三：三大致命建模陷阱',
      badge: '稳定性与稳态防坑',
      summary: '利用率 ρ ≥ 1 导致队列无界暴涨；死锁竞争未设置 Timeout 导致进程无限等待；未剔除预热期歪曲稳态指标。',
      content: {
        traps: [
          {
            name: '陷阱 1：ρ ≥ 1.0 系统发散崩溃',
            problem: '到达速率 λ 超过最大服务能力 c·μ，排队长度呈线性单调发散，仿真指标永不收敛。',
            solution: '建立参数预检守卫，若 ρ ≥ 1 则标红报警，提示增加服务通道或降低负载。',
          },
          {
            name: '陷阱 2：相互死锁 (Deadlock) 与无超时悬挂',
            problem: '进程 A 占有资源 1 等待资源 2，进程 B 占有资源 2 等待资源 1，双方陷入永久挂起。',
            solution: '申请资源时搭配 Timeout 机制：yield env.any_of([req, env.timeout(max_patience)])。',
          },
          {
            name: '陷阱 3：未剔除预热期 (Warm-up Period)',
            problem: '仿真启动时系统往往为空，前期的零等待时间拉低整体均值，导致稳态指标严重失真。',
            solution: '采用 Welch 移动平均法确定初始瞬态截断点，仅统计稳态时间段 (如 T > 0.2*T_max) 的数据。',
          },
        ],
        takeaway: '构建仿真模型不是写通代码就完事，严谨验证这三大陷阱是工程可信度的生命线。',
      },
    },
    {
      id: 'slice-4',
      title: '切片四：误区警示与诊断陷阱',
      badge: '统计学与置信区间',
      summary: '警惕均值假象（平均等待短不代表极值等待不超标）；伪随机数种子未固定会导致结果不可复现，须引入多轮独立重复试验。',
      content: {
        pitfalls: [
          {
            name: '误区 1：均值假象 (Flaw of Averages)',
            detail: '平均等待时间 2 分钟，可能掩盖了 5% 的极危客户等待超过 20 分钟！必须同屏观察 P95/P99 尾部指标。',
          },
          {
            name: '误区 2：单次运行的“假象收敛”',
            detail: '单个 Seed 偶然跑出极好指标。必须开展 20 轮以上独立重复试验，报告 95% 置信区间 [x̄ - t*SE, x̄ + t*SE]。',
          },
          {
            name: '误区 3：Little 定理的误用场景',
            detail: 'Lq = λ·Wq 仅在系统达到统计稳态（Ergodic Steady-State）时成立，瞬态过载阶段并不适用。',
          },
        ],
        takeaway: '用统计置信区间说话，杜绝“调参调到好看就收工”的草率仿真。',
      },
    },
  ];

  // Save Modal Settings
  const handleSaveSettings = () => {
    const trimmedKey = inputApiKey.trim();
    const newConfig: LLMConfig = {
      model: selectedModel,
      apiKey: trimmedKey,
      baseUrl: inputBaseUrl.trim(),
    };
    setLlmConfig(newConfig);
    saveLLMConfig(newConfig);
    setConfigSaveSuccess(true);
    setTimeout(() => {
      setConfigSaveSuccess(false);
      setShowSettingsModal(false);
    }, 1200);
  };

  // Clear API Key
  const handleClearKey = () => {
    setInputApiKey('');
    const newConfig: LLMConfig = {
      ...llmConfig,
      apiKey: '',
    };
    setLlmConfig(newConfig);
    saveLLMConfig(newConfig);
  };

  // Handle Send Question to LLM
  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputQuestion).trim();
    if (!query) return;

    // Check if API key is provided
    if (!llmConfig.apiKey.trim()) {
      setShowSettingsModal(true);
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const newHistory: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: query,
        timestamp: Date.now(),
      },
    ];

    setMessages(newHistory);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const responseText = await callBrowserLLM(
        query,
        newHistory,
        llmConfig,
        {
          scenarioName,
          params,
          metrics: results,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
          model: llmConfig.model,
        },
      ]);
    } catch (err: any) {
      console.error('LLM API Call Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ 调用大模型失败：${err.message || '网络连接超时或跨域被拦截'}\n\n请检查：\n1. 点击右上角小齿轮 ⚙️ 验证 API-Key 是否正确；\n2. 若使用 DeepSeek，请确认服务商是否支持浏览器端直接跨域调用，或可配置代理 Base URL。`,
          timestamp: Date.now(),
          model: llmConfig.model,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleClearChat = () => {
    const resetMsg: ChatMessage[] = [
      {
        id: 'reset',
        role: 'assistant',
        content: `对话历史已重置。您可以随时针对当前排队系统输入新的运筹仿真或 SimPy 编程问题。`,
        timestamp: Date.now(),
        model: llmConfig.model,
      },
    ];
    setMessages(resetMsg);
    saveChatHistory(resetMsg);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>模块 10</span>
            <span>·</span>
            <span>深度知识与智能诊断</span>
            <span>·</span>
            <span>四大核心知识切片与 AI 仿真导师</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            AI 智能诊断与离散仿真知识导引 (AI Diagnostics & Knowledge Deck)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSendMessage('请对当前排队系统的服务强度、瓶颈分布与 Little 守恒性进行综合健康体检。')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>一键健康度体检</span>
          </button>
        </div>
      </div>

      {/* Slices Segmented Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {slices.map((slice, idx) => {
          const isActive = activeSlice === idx;
          return (
            <button
              key={slice.id}
              onClick={() => setActiveSlice(idx)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/70'
              }`}
            >
              <div className="text-[10px] text-slate-400 font-mono mb-1">
                {slice.badge}
              </div>
              <div className="text-xs font-semibold truncate">{slice.title}</div>
            </button>
          );
        })}
      </div>

      {/* Active Slice Content Box */}
      <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {slices[activeSlice].title}
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {slices[activeSlice].summary}
          </p>
        </div>

        {/* Slice 1: Discrete vs Continuous */}
        {activeSlice === 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2 pr-4">对比维度</th>
                  <th className="py-2 px-4 text-emerald-800 bg-emerald-50/50">SimPy 离散事件仿真 (DES)</th>
                  <th className="py-2 pl-4 text-slate-700">传统连续仿真 (Continuous ODE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slices[0].content.comparison?.map((row, i) => (
                  <tr key={i} className="hover:bg-white/60">
                    <td className="py-2.5 pr-4 font-semibold text-slate-800">{row.aspect}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-emerald-900 bg-emerald-50/30">
                      {row.discrete}
                    </td>
                    <td className="py-2.5 pl-4 text-slate-600 font-mono text-[11px]">{row.continuous}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Slice 2: Process & Resource Interlock */}
        {activeSlice === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {slices[1].content.points?.map((pt, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-xs text-slate-900">{pt.name}</div>
                <div className="text-[11px] text-slate-600 leading-relaxed">{pt.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Slice 3: Traps */}
        {activeSlice === 2 && (
          <div className="space-y-2.5">
            {slices[2].content.traps?.map((trap, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="font-semibold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{trap.name}</span>
                </div>
                <div className="text-slate-600"><span className="font-medium text-slate-800">隐患机理：</span>{trap.problem}</div>
                <div className="text-emerald-700 text-[11px]"><span className="font-medium text-slate-800">防范对策：</span>{trap.solution}</div>
              </div>
            ))}
          </div>
        )}

        {/* Slice 4: Warnings & Pitfalls */}
        {activeSlice === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {slices[3].content.pitfalls?.map((pf, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="font-semibold text-amber-800 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{pf.name}</span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">{pf.detail}</div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-white rounded-lg border border-slate-200/60 text-xs text-slate-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>切片精要</strong>：{slices[activeSlice].content.takeaway}</span>
        </div>
      </div>

      {/* AI Simulation Diagnostics & Interactive Chat Dialogue Box */}
      <div className="p-5 bg-slate-900 rounded-xl text-slate-200 space-y-4 shadow-sm">
        {/* Top Bar with Model Status and Gear Settings Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">
              AI 离散事件仿真专属顾问
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {llmConfig.model}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* API Key Status Pill */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                llmConfig.apiKey.trim()
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
              }`}
            >
              {llmConfig.apiKey.trim() ? '已配置 Key' : '未输入 Key'}
            </span>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              title="清空聊天记录"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Gear Settings Icon Button (Required by user) */}
            <button
              onClick={() => {
                setInputApiKey(llmConfig.apiKey);
                setSelectedModel(llmConfig.model);
                setInputBaseUrl(llmConfig.baseUrl || '');
                setShowSettingsModal(true);
              }}
              title="大模型参数与API-Key设置"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-300" />
              <span>设置模型</span>
            </button>
          </div>
        </div>

        {/* Notice if Key is missing */}
        {!llmConfig.apiKey.trim() && (
          <div className="p-3 bg-amber-950/70 border border-amber-800/80 rounded-lg flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                本项目为 GitHub 静态部署，大模型由浏览器直接请求。请先配置您的 API-Key 方可发起问答。
              </span>
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-[11px] whitespace-nowrap ml-2"
            >
              立即配置 Key
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-slate-400 self-center mr-1">快捷提问：</span>
          {[
            '评估当前排队系统瓶颈与利用率 ρ',
            '如何避免 SimPy 死锁与挂起？',
            '解释 M/M/c 理论解与当前仿真误差',
            '如何用 Welch 移动平均法剔除预热期？',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Conversation Dialogue Area (Required by user) */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 h-80 overflow-y-auto space-y-4 shadow-inner">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed space-y-1.5 ${
                    isUser
                      ? 'bg-slate-800 text-white rounded-tr-xs border border-slate-700'
                      : msg.isError
                      ? 'bg-rose-950/60 text-rose-200 border border-rose-800 rounded-tl-xs'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 pb-1 border-b border-white/5">
                    <span className="font-mono">
                      {isUser ? '您 (提问者)' : `顾问 [${msg.model || llmConfig.model}]`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="复制回答内容"
                          className="hover:text-white"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.content}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-400 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                正在调用 {llmConfig.model} 进行运筹推演与代码诊断...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={
              llmConfig.apiKey.trim()
                ? `以 ${llmConfig.model} 发起提问（如：如何编写 SimPy PriorityResource 抢占示例...）`
                : '请先点击右上角设置图标 ⚙️ 配置 API-Key 后方可提问'
            }
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-hidden focus:border-slate-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>思考中...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>发送提问</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Settings Modal Dialog (Required by user: 1. 手工输入API-Key 2. 选择两个大模型 3. 确认大模型) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">
                  大模型配置与密钥设置 (LLM Settings)
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              本项目部署在 GitHub 静态页面，所有大模型调用均由您的浏览器客户端直接向官方 API 发起。必须输入有效的 API-Key 才能调用。
            </p>

            {/* 1. 手工输入 API-Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. 手工输入 API-Key (必填)</span>
                </label>
                {inputApiKey && (
                  <button
                    onClick={handleClearKey}
                    className="text-[11px] text-slate-400 hover:text-rose-400"
                  >
                    清空密钥
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKeyPassword ? 'text' : 'password'}
                  placeholder="例如：AIzaSy... (Gemini) 或 sk-... (DeepSeek)"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyPassword(!showKeyPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  {showKeyPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                🔒 密钥仅存放在您本机的浏览器 LocalStorage 中，不会上传到任何中间服务器。
              </div>
            </div>

            {/* 2. 选择两个大模型 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>2. 选择大模型 (2选1)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Model 1: gemini 3 flash */}
                <div
                  onClick={() => setSelectedModel('gemini 3 flash')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedModel === 'gemini 3 flash'
                      ? 'bg-amber-950/40 border-amber-400 text-white shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">
                      gemini 3 flash
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        selectedModel === 'gemini 3 flash'
                          ? 'bg-amber-400 ring-4 ring-amber-400/20'
                          : 'bg-slate-700'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Google 最新闪电级推理模型，极速响应，原生支持浏览器直接 CORS 调用。
                  </div>
                </div>

                {/* Model 2: deepseek-v4-pro */}
                <div
                  onClick={() => setSelectedModel('deepseek-v4-pro')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedModel === 'deepseek-v4-pro'
                      ? 'bg-blue-950/40 border-blue-400 text-white shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">
                      deepseek-v4-pro
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        selectedModel === 'deepseek-v4-pro'
                          ? 'bg-blue-400 ring-4 ring-blue-400/20'
                          : 'bg-slate-700'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    深度推理专业模型，擅长排队论积分方程推导、SimPy 协程与死锁排查。
                  </div>
                </div>
              </div>

              {/* Custom API Base URL for DeepSeek or proxies */}
              {selectedModel === 'deepseek-v4-pro' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-slate-400">
                    DeepSeek API 端点 Base URL (默认: https://api.deepseek.com)
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.deepseek.com"
                    value={inputBaseUrl}
                    onChange={(e) => setInputBaseUrl(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500">
                    如遇到浏览器端 CORS 跨域限制，可在此填写您的 Cloudflare 反向代理或第三方中转地址。
                  </p>
                </div>
              )}
            </div>

            {/* 3. 确认大模型 */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
              >
                {configSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>已确认并生效！</span>
                  </>
                ) : (
                  <span>确认大模型与保存设置</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
