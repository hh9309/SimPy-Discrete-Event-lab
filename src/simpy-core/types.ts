export type DistributionType = 'exponential' | 'normal' | 'uniform' | 'constant';

export type ResourceKind = 'Resource' | 'PriorityResource' | 'PreemptiveResource';

export interface DistributionConfig {
  type: DistributionType;
  param1: number; // e.g., lambda for exp, mean for norm, min for uniform, value for const
  param2?: number; // stdDev for norm, max for uniform
}

export interface SimulationParams {
  lambda: number; // arrival rate (entities per unit time)
  mu: number; // service rate (services per unit time per server)
  servers: number; // number of parallel servers c
  arrivalDist: DistributionType;
  serviceDist: DistributionType;
  resourceType: ResourceKind;
  simDuration: number; // virtual time units, e.g., 100
  seed: number;
  // Specific scenario parameters
  vipRatio?: number; // for bank
  renegeTimeout?: number; // for call center
  failureRate?: number; // for factory machine breakdowns
  repairRate?: number; // for factory repair
  rawArrivalRate?: number; // for logistics
  conveyorTransitTime?: number;
  bufferCapacity?: number;
  machiningRate?: number;
  qcRate?: number;
}

export interface EntityTrace {
  id: string;
  name: string;
  category: 'normal' | 'vip' | 'critical' | 'urgent' | 'machine' | 'part';
  priority: number; // lower is higher priority
  arrivalTime: number;
  queueStartTime: number;
  serviceStartTime: number | null;
  serviceEndTime: number | null;
  totalWaitTime: number;
  serviceDuration: number;
  preemptedCount: number;
  preemptedTimeTotal: number;
  serverAssigned: number | null;
  status: 'waiting' | 'in_service' | 'preempted' | 'completed' | 'reneged';
}

export interface GanttInterval {
  serverId: number;
  entityId: string;
  entityName: string;
  category: string;
  startTime: number;
  endTime: number;
  isPreempted?: boolean;
}

export interface QueueLengthSample {
  time: number;
  queueLength: number;
  busyServers: number;
}

export interface EventLogEntry {
  id: number;
  time: number;
  type: 'arrival' | 'request' | 'start_service' | 'preempted' | 'resume_service' | 'release' | 'reneged' | 'buffer_overflow' | 'machine_fail' | 'machine_repaired';
  entityId: string;
  entityName: string;
  description: string;
  priority?: number;
  serverIndex?: number;
}

export interface SimulationResults {
  params: SimulationParams;
  duration: number;
  totalEntities: number;
  completedEntities: number;
  renegedEntities: number;
  avgWaitTime: number;
  maxWaitTime: number;
  p95WaitTime: number;
  avgQueueLength: number;
  maxQueueLength: number;
  avgServiceTime: number;
  systemThroughput: number; // completed per time unit
  observedUtilization: number; // rho_obs
  theoreticalRho: number; // rho = lambda / (c * mu)
  theoreticalWaitTime: number | null; // M/M/c Erlang-C
  theoreticalQueueLength: number | null;
  entities: EntityTrace[];
  ganttIntervals: GanttInterval[];
  queueTimeHistory: QueueLengthSample[];
  eventLogs: EventLogEntry[];
  // Logistics specific
  bufferLevels?: { time: number; level: number }[];
  starvationPeriods?: { start: number; end: number; station: string }[];
  blockingPeriods?: { start: number; end: number; station: string }[];
}

export interface MonteCarloSummary {
  replications: number;
  seeds: number[];
  avgWaitTimes: number[];
  avgQueueLengths: number[];
  utilizations: number[];
  throughputs: number[];
  meanWq: number;
  stdErrorWq: number;
  ci95LowWq: number;
  ci95HighWq: number;
  meanLq: number;
  stdErrorLq: number;
  ci95LowLq: number;
  ci95HighLq: number;
  meanRho: number;
  theoreticalWq: number | null;
}
