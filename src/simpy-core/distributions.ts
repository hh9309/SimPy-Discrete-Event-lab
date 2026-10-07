/**
 * Reproducible Seeded PRNG and Probability Distributions for Discrete-Event Simulation
 */

export class RandomGenerator {
  private s: number;

  constructor(seed: number = 42) {
    this.s = Math.floor(seed) >>> 0;
    if (this.s === 0) this.s = 1;
  }

  /** Mulberry32 PRNG */
  public random(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Exponential Distribution (Poisson process inter-arrival or service time) with rate parameter lambda */
  public exponential(rate: number): number {
    if (rate <= 0) return 0.0001;
    const u = Math.max(1e-10, this.random());
    return -Math.log(u) / rate;
  }

  /** Normal (Gaussian) Distribution via Box-Muller transform */
  public normal(mean: number, stdDev: number): number {
    const u1 = Math.max(1e-10, this.random());
    const u2 = this.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const val = mean + z0 * stdDev;
    return Math.max(0.01, val); // Non-negative time
  }

  /** Uniform Distribution in [min, max] */
  public uniform(min: number, max: number): number {
    if (min >= max) return min;
    return min + this.random() * (max - min);
  }

  /** Deterministic / Constant */
  public constant(value: number): number {
    return Math.max(0.001, value);
  }

  /** Sample according to Distribution type */
  public sample(type: 'exponential' | 'normal' | 'uniform' | 'constant', meanOrRate: number, secondary?: number): number {
    switch (type) {
      case 'exponential':
        // meanOrRate is lambda (rate), mean = 1 / lambda
        return this.exponential(meanOrRate);
      case 'normal':
        // mean is 1/meanOrRate if given as rate, or meanOrRate directly
        const mean = meanOrRate > 0 ? 1 / meanOrRate : 1;
        const stdDev = secondary ?? mean * 0.25;
        return this.normal(mean, stdDev);
      case 'uniform':
        const center = meanOrRate > 0 ? 1 / meanOrRate : 1;
        const spread = secondary ?? center * 0.5;
        return this.uniform(Math.max(0.01, center - spread), center + spread);
      case 'constant':
      default:
        return meanOrRate > 0 ? 1 / meanOrRate : 1;
    }
  }
}

/**
 * Erlang-C Queueing Formula for M/M/c Analytical Solution
 * Computes theoretical Wq, Lq, P0, P_wait
 */
export function calculateQueueTheory(lambda: number, mu: number, c: number) {
  if (lambda <= 0 || mu <= 0 || c <= 0) return null;
  const a = lambda / mu; // offered load
  const rho = a / c; // utilization

  if (rho >= 1.0) {
    // Unstable queue, queue length grows unbounded towards infinity
    return {
      rho,
      isStable: false,
      P0: 0,
      Pw: 1,
      Lq: Infinity,
      Wq: Infinity,
      L: Infinity,
      W: Infinity,
    };
  }

  // Calculate P0 (probability of 0 entities in system)
  let sum = 0;
  for (let n = 0; n < c; n++) {
    sum += Math.pow(a, n) / factorial(n);
  }
  const termC = Math.pow(a, c) / (factorial(c) * (1 - rho));
  const P0 = 1 / (sum + termC);

  // Erlang C formula (probability that an arriving entity must wait)
  const Pw = termC * P0;

  // Average waiting time in queue Wq
  const Wq = (Pw / (c * mu * (1 - rho)));
  // Average queue length Lq (Little's Law)
  const Lq = lambda * Wq;
  // Average time in system W
  const W = Wq + 1 / mu;
  // Average number in system L
  const L = lambda * W;

  return {
    rho,
    isStable: true,
    P0,
    Pw,
    Lq,
    Wq,
    L,
    W,
  };
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}
