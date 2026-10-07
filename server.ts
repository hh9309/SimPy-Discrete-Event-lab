import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// AI Diagnosis & Consultation endpoint
app.post('/api/ai/diagnose', async (req, res) => {
  const { scenario, params, metrics, question } = req.body;

  if (!aiClient) {
    // Return rich rule-based expert analysis if no API key configured
    const rho = params.lambda / (params.servers * params.mu);
    let diagnosis = `### 离散事件仿真系统诊断报告 (Rule-Based Analysis)\n\n`;
    diagnosis += `**当前场景**: ${scenario || '自定义排队系统'}\n`;
    diagnosis += `**服务强度 $\\rho$**: ${rho.toFixed(3)}\n\n`;

    if (rho >= 1.0) {
      diagnosis += `⚠️ **严重警报：系统超载发散 (Overload Instability)**\n`;
      diagnosis += `当前到达率 $\\lambda=${params.lambda}$ 超过了最大综合服务能力 $c\\mu = ${params.servers * params.mu}$。在离散事件仿真中，等待队列 $L_q(t)$ 将随仿真时间推移呈线性无界暴涨，不存在统计稳态。\n`;
      diagnosis += `**建议措施**：增加服务台数量至 $c \\ge ${Math.ceil(params.lambda / params.mu) + 1}$，或提升单窗口处理速率 $\\mu$。\n\n`;
    } else if (rho >= 0.85) {
      diagnosis += `⚡ **临界负荷警告 (High Congestion)**\n`;
      diagnosis += `当前处于高利用率区间（$\\rho=${(rho * 100).toFixed(1)}\\%$）。排队论的 Kingman 重负荷近似表明，随着 $\\rho \\to 1$，平均等待时间呈 $\\frac{1}{1-\\rho}$ 双曲线非线性激增。\n`;
      diagnosis += `**建议措施**：注意预热期（Warm-up Period）截断；引入多轮独立 Seed 蒙特卡洛重复试验，以消除极端离群值对均值的干扰。\n\n`;
    } else {
      diagnosis += `✅ **系统状态正常 (Sub-Critical Stable)**\n`;
      diagnosis += `当前系统处于健康稳态范围（利用率 ${(rho * 100).toFixed(1)}\\%），各指标具备良好的收敛特性。\n\n`;
    }

    if (question) {
      diagnosis += `**针对您的问题**：“${question}”\n`;
      diagnosis += `在 SimPy 离散仿真中，建议检查：\n1. 事件生成器是否正确执行了 \`yield env.timeout()\` 推进虚拟时间；\n2. 资源申请是否搭配上下文管理器 \`with res.request() as req: yield req\` 以确保析构时自动释放资源；\n3. 高优先级抢占时需捕获 \`simpy.Interrupt\` 异常以保留已服务时长。\n`;
    }

    return res.json({ text: diagnosis, mode: 'rule-based' });
  }

  try {
    const prompt = `你是一位专注于离散事件仿真（Discrete-Event Simulation, DES）与 SimPy 建模的资深运筹学科学家。
请针对以下仿真实验上下文与用户提问，给出深刻、严谨且切中要害的技术分析与建议。

【实验上下文】:
- 仿真场景: ${scenario || '通用排队系统'}
- 到达率 lambda: ${params?.lambda}
- 服务率 mu: ${params?.mu}
- 服务窗口数 c: ${params?.servers}
- 服务强度 rho: ${(params?.lambda / (params?.servers * params?.mu)).toFixed(4)}
- 观测平均等待时间 Wq: ${metrics?.avgWaitTime?.toFixed(2)}
- 观测平均队长 Lq: ${metrics?.avgQueueLength?.toFixed(2)}
- 观测吞吐量: ${metrics?.throughput?.toFixed(2)}
- 资源类型: ${params?.resourceType || 'Resource'}

【用户提问/请求】:
${question || '请对当前仿真系统的稳态收敛性、瓶颈环节与SimPy建模架构进行全面诊断评估。'}

请分层次从：
1. 系统动力学与排队论指标评价（利用率、Little's Law 符合度）
2. SimPy 离散建模关键实现点与陷阱预防（如事件堆压降、抢占中断恢复、死锁避免）
3. 优化与调优建议
展开分析，语言专业、淡雅、富于学术洞见。`;

    const callPromise = aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Request Timeout')), 2500)
    );

    const response: any = await Promise.race([callPromise, timeoutPromise]);
    res.json({ text: response.text, mode: 'gemini' });
  } catch (err: any) {
    console.warn('Gemini API call timed out or failed, falling back to rule engine:', err?.message);
    const rho = params.lambda / (params.servers * params.mu);
    let fallbackText = `### 离散事件仿真系统诊断报告 (Rule-Based Analysis)\n\n`;
    fallbackText += `**当前场景**: ${scenario || '排队系统'}\n`;
    fallbackText += `**服务强度 $\\rho$**: ${rho.toFixed(3)}\n\n`;
    if (rho >= 1.0) {
      fallbackText += `⚠️ **严重警报：系统超载发散 (Overload Instability)**\n到达率 $\\lambda=${params.lambda}$ 超过综合服务能力 $c\\mu = ${params.servers * params.mu}$。排队队长随时间线性发散，不存在理论稳态。\n**建议**：增加服务台数量至 $c \\ge ${Math.ceil(params.lambda / params.mu) + 1}$。\n\n`;
    } else if (rho >= 0.85) {
      fallbackText += `⚡ **临界负荷警告 (High Congestion)**\n当前处于高负荷区（$\\rho=${(rho * 100).toFixed(1)}\\%$）。排队论 Kingman 重负荷定理表明等待时间呈 $\\frac{1}{1-\\rho}$ 双曲线非线性激增。\n**建议**：剔除初始瞬态预热期（Warm-up Period）；开展多轮 Monte Carlo 独立试验。\n\n`;
    } else {
      fallbackText += `✅ **系统状态正常 (Sub-Critical Stable)**\n当前系统处于稳定区（利用率 ${(rho * 100).toFixed(1)}\\%），各项指标具备良好的稳态收敛性。\n\n`;
    }
    if (question) {
      fallbackText += `**针对您的问题**：“${question}”\n在 SimPy 中，建议核实生成器中的 \`yield env.timeout()\` 虚拟时钟推进与资源释放 \`server.release(req)\` 逻辑。\n`;
    }
    res.json({ text: fallbackText, mode: 'rule-based-fallback' });
  }
});

// Mount Vite middleware in development
const isDev = process.env.NODE_ENV !== 'production';

async function startServer() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
