/**
 * SimPy Core Engine in TypeScript
 * Mirrors Python SimPy 4 discrete-event architecture:
 * - Priority Queue (Binary Min-Heap) of events
 * - Generator process suspension & resumption (yield event)
 * - Resource, PriorityResource, PreemptiveResource (with interrupt & resume)
 * - Container & FilterStore
 */

import {
  EntityTrace,
  EventLogEntry,
  GanttInterval,
  QueueLengthSample,
  ResourceKind,
} from './types';

export type EventCallback = (event: SimPyEvent) => void;

let globalEventId = 0;

export class SimPyEvent {
  public readonly id: number;
  public time: number = 0;
  public priority: number = 10;
  public ok: boolean = true;
  public defused: boolean = false;
  public triggered: boolean = false;
  public processed: boolean = false;
  public value: any = null;
  public callbacks: EventCallback[] = [];
  public env: SimPyEnvironment;

  constructor(env: SimPyEnvironment) {
    this.id = ++globalEventId;
    this.env = env;
  }

  public succeed(value?: any): SimPyEvent {
    if (this.triggered) return this;
    this.triggered = true;
    this.value = value;
    this.env.schedule(this, this.priority, 0);
    return this;
  }

  public fail(error?: any): SimPyEvent {
    if (this.triggered) return this;
    this.triggered = true;
    this.ok = false;
    this.value = error;
    this.env.schedule(this, this.priority, 0);
    return this;
  }
}

export class TimeoutEvent extends SimPyEvent {
  constructor(env: SimPyEnvironment, delay: number, value?: any) {
    super(env);
    this.triggered = true;
    this.value = value;
    this.env.schedule(this, 10, delay);
  }
}

export class RequestEvent extends SimPyEvent {
  public resource: SimPyResource;
  public entity: EntityTrace;
  public requestedPriority: number;
  public isPreemptive: boolean;

  constructor(resource: SimPyResource, entity: EntityTrace, priority: number = 10, isPreemptive: boolean = false) {
    super(resource.env);
    this.resource = resource;
    this.entity = entity;
    this.requestedPriority = priority;
    this.isPreemptive = isPreemptive;
  }
}

export class ReleaseEvent extends SimPyEvent {
  public resource: SimPyResource;
  public request: RequestEvent;

  constructor(resource: SimPyResource, request: RequestEvent) {
    super(resource.env);
    this.resource = resource;
    this.request = request;
    this.triggered = true;
    this.env.schedule(this, 0, 0);
  }
}

interface HeapItem {
  time: number;
  priority: number;
  id: number;
  event: SimPyEvent;
}

/** Binary Min-Heap Priority Queue */
export class PriorityQueue {
  private heap: HeapItem[] = [];

  public push(item: HeapItem) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): HeapItem | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  public peek(): HeapItem | undefined {
    return this.heap[0];
  }

  public get size(): number {
    return this.heap.length;
  }

  public get items(): HeapItem[] {
    return [...this.heap];
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(this.heap[index], this.heap[parent]) < 0) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[parent];
        this.heap[parent] = temp;
        index = parent;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number) {
    const len = this.heap.length;
    while (true) {
      const left = (index << 1) + 1;
      const right = left + 1;
      let smallest = index;

      if (left < len && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== index) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }

  private compare(a: HeapItem, b: HeapItem): number {
    if (a.time !== b.time) return a.time - b.time;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id - b.id;
  }
}

/** SimPy Virtual Environment */
export class SimPyEnvironment {
  public now: number = 0;
  private queue: PriorityQueue = new PriorityQueue();
  public logs: EventLogEntry[] = [];
  public queueSamples: QueueLengthSample[] = [];
  public ganttIntervals: GanttInterval[] = [];
  public entities: EntityTrace[] = [];
  private logIdCounter: number = 0;

  constructor(initialTime: number = 0) {
    this.now = initialTime;
  }

  public schedule(event: SimPyEvent, priority: number = 10, delay: number = 0) {
    event.time = this.now + delay;
    event.priority = priority;
    this.queue.push({
      time: event.time,
      priority,
      id: event.id,
      event,
    });
  }

  public peek(): number {
    const item = this.queue.peek();
    return item ? item.time : Infinity;
  }

  public get pendingEventsCount(): number {
    return this.queue.size;
  }

  public get pendingEvents(): HeapItem[] {
    return this.queue.items;
  }

  public timeout(delay: number, value?: any): TimeoutEvent {
    return new TimeoutEvent(this, delay, value);
  }

  public log(
    type: EventLogEntry['type'],
    entityId: string,
    entityName: string,
    description: string,
    priority?: number,
    serverIndex?: number
  ) {
    this.logs.push({
      id: ++this.logIdCounter,
      time: Number(this.now.toFixed(3)),
      type,
      entityId,
      entityName,
      description,
      priority,
      serverIndex,
    });
  }

  /** Advances simulation by 1 discrete event */
  public step(): boolean {
    const item = this.queue.pop();
    if (!item) return false;

    this.now = item.time;
    const event = item.event;
    event.processed = true;

    // Execute registered callbacks
    for (const cb of event.callbacks) {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in event callback:', err);
      }
    }

    return true;
  }

  /** Run simulation until specific time limit */
  public run(until: number = 100): void {
    while (this.queue.size > 0 && this.peek() <= until) {
      this.step();
    }
    if (this.queue.size > 0 && this.now < until) {
      this.now = until;
    }
  }

  /** Run process generator */
  public process(generator: Generator<SimPyEvent, any, any>): SimPyProcess {
    return new SimPyProcess(this, generator);
  }
}

export class SimPyProcess extends SimPyEvent {
  private generator: Generator<SimPyEvent, any, any>;
  public isAlive: boolean = true;

  constructor(env: SimPyEnvironment, generator: Generator<SimPyEvent, any, any>) {
    super(env);
    this.generator = generator;
    // Bootstrap initial step
    this.resume();
  }

  public resume(yieldedValue?: any) {
    if (!this.isAlive) return;

    try {
      const result = this.generator.next(yieldedValue);
      if (result.done) {
        this.isAlive = false;
        this.succeed(result.value);
      } else {
        const nextEvent = result.value;
        if (nextEvent instanceof SimPyEvent) {
          nextEvent.callbacks.push(() => {
            this.resume(nextEvent.value);
          });
        }
      }
    } catch (err) {
      this.isAlive = false;
      this.fail(err);
    }
  }

  public interrupt(cause?: any) {
    if (!this.isAlive) return;
    try {
      this.generator.throw(new Error(cause || 'SimPy Interruption'));
    } catch {
      // Handled in process
    }
  }
}

export interface ActiveSlot {
  serverIndex: number;
  req: RequestEvent;
  startTime: number;
  expectedDuration: number;
  remainingDuration: number;
  timeoutEvt?: TimeoutEvent;
}

/** SimPy Resource supporting FIFO, Priority, and Preemption */
export class SimPyResource {
  public env: SimPyEnvironment;
  public capacity: number;
  public kind: ResourceKind;
  public users: RequestEvent[] = [];
  public queue: RequestEvent[] = [];
  public slots: (ActiveSlot | null)[] = [];

  constructor(env: SimPyEnvironment, capacity: number = 1, kind: ResourceKind = 'Resource') {
    this.env = env;
    this.capacity = capacity;
    this.kind = kind;
    this.slots = new Array(capacity).fill(null);
  }

  public get count(): number {
    return this.users.length;
  }

  public get queueLength(): number {
    return this.queue.length;
  }

  public request(entity: EntityTrace, priority: number = 10): RequestEvent {
    const isPreemptive = this.kind === 'PreemptiveResource';
    const req = new RequestEvent(this, entity, priority, isPreemptive);

    entity.status = 'waiting';
    entity.queueStartTime = this.env.now;

    // Check if immediate capacity is available
    if (this.users.length < this.capacity) {
      this.assignServer(req);
    } else if (isPreemptive) {
      // Check if we can preempt a running lower-priority user
      // Lower number = higher priority
      let lowestPrioritySlot: ActiveSlot | null = null;
      let lowestPrioVal = -Infinity;

      for (const slot of this.slots) {
        if (slot && slot.req.requestedPriority > lowestPrioVal) {
          lowestPrioVal = slot.req.requestedPriority;
          lowestPrioritySlot = slot;
        }
      }

      if (lowestPrioritySlot && priority < lowestPrioritySlot.req.requestedPriority) {
        // Preemption triggers!
        this.preemptSlot(lowestPrioritySlot, req);
      } else {
        // Wait in queue sorted by priority
        this.queue.push(req);
        this.sortQueue();
      }
    } else {
      // Normal FIFO or Priority queueing
      this.queue.push(req);
      if (this.kind === 'PriorityResource') {
        this.sortQueue();
      }
    }

    return req;
  }

  public release(req: RequestEvent) {
    const userIdx = this.users.indexOf(req);
    if (userIdx !== -1) {
      this.users.splice(userIdx, 1);
    }

    // Free the slot
    for (let i = 0; i < this.capacity; i++) {
      if (this.slots[i]?.req === req) {
        this.slots[i] = null;
        break;
      }
    }

    // If there are waiting entities, admit the next
    if (this.queue.length > 0 && this.users.length < this.capacity) {
      const nextReq = this.queue.shift()!;
      this.assignServer(nextReq);
    }
  }

  private assignServer(req: RequestEvent) {
    this.users.push(req);
    // Find free slot
    let freeIndex = -1;
    for (let i = 0; i < this.capacity; i++) {
      if (!this.slots[i]) {
        freeIndex = i;
        break;
      }
    }
    if (freeIndex === -1) freeIndex = 0;

    req.entity.status = 'in_service';
    req.entity.serverAssigned = freeIndex;
    req.entity.serviceStartTime = this.env.now;
    req.entity.totalWaitTime += this.env.now - req.entity.queueStartTime;

    const slot: ActiveSlot = {
      serverIndex: freeIndex,
      req,
      startTime: this.env.now,
      expectedDuration: req.entity.serviceDuration,
      remainingDuration: req.entity.serviceDuration,
    };
    this.slots[freeIndex] = slot;

    this.env.log(
      'start_service',
      req.entity.id,
      req.entity.name,
      `开始在服务台 [${freeIndex + 1}] 接受服务`,
      req.requestedPriority,
      freeIndex
    );

    // Trigger the request event so caller's yield returns
    req.succeed();
  }

  private preemptSlot(slot: ActiveSlot, newReq: RequestEvent) {
    const victimReq = slot.req;
    const elapsed = this.env.now - slot.startTime;
    slot.remainingDuration = Math.max(0.1, slot.remainingDuration - elapsed);

    victimReq.entity.status = 'preempted';
    victimReq.entity.preemptedCount++;
    victimReq.entity.serviceDuration = slot.remainingDuration; // save remaining

    this.env.log(
      'preempted',
      victimReq.entity.id,
      victimReq.entity.name,
      `被高优先级实体 [${newReq.entity.name}] 抢占中断！剩余服务时长: ${slot.remainingDuration.toFixed(2)}`,
      victimReq.requestedPriority,
      slot.serverIndex
    );

    // Record partial Gantt slice for victim
    this.env.ganttIntervals.push({
      serverId: slot.serverIndex,
      entityId: victimReq.entity.id,
      entityName: victimReq.entity.name,
      category: victimReq.entity.category,
      startTime: slot.startTime,
      endTime: this.env.now,
      isPreempted: true,
    });

    // Remove victim from active users
    const uIdx = this.users.indexOf(victimReq);
    if (uIdx !== -1) this.users.splice(uIdx, 1);

    // Put victim back to the head of waiting queue (priority-sorted)
    victimReq.entity.queueStartTime = this.env.now;
    this.queue.unshift(victimReq);
    this.sortQueue();

    // Assign slot to new request
    slot.req = newReq;
    slot.startTime = this.env.now;
    slot.expectedDuration = newReq.entity.serviceDuration;
    slot.remainingDuration = newReq.entity.serviceDuration;

    this.users.push(newReq);
    newReq.entity.status = 'in_service';
    newReq.entity.serverAssigned = slot.serverIndex;
    newReq.entity.serviceStartTime = this.env.now;
    newReq.entity.totalWaitTime += this.env.now - newReq.entity.queueStartTime;

    this.env.log(
      'start_service',
      newReq.entity.id,
      newReq.entity.name,
      `抢占夺取服务台 [${slot.serverIndex + 1}] 优先服务`,
      newReq.requestedPriority,
      slot.serverIndex
    );

    newReq.succeed();
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      if (a.requestedPriority !== b.requestedPriority) {
        return a.requestedPriority - b.requestedPriority;
      }
      return a.id - b.id;
    });
  }
}

/** SimPy Container for continuous fluid / raw material buffer */
export class SimPyContainer {
  public env: SimPyEnvironment;
  public capacity: number;
  public level: number;

  constructor(env: SimPyEnvironment, capacity: number = 100, init: number = 0) {
    this.env = env;
    this.capacity = capacity;
    this.level = Math.min(capacity, Math.max(0, init));
  }

  public put(amount: number): boolean {
    if (this.level + amount > this.capacity) {
      return false; // overflow
    }
    this.level += amount;
    return true;
  }

  public get(amount: number): boolean {
    if (this.level < amount) {
      return false; // underflow
    }
    this.level -= amount;
    return true;
  }
}
