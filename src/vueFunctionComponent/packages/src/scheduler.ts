import { warn, nextTick } from "vue";

// 优先级常量
export const Priority = {
  SYNC: 1, // 同步执行
  USER_INPUT: 2, // 用户输入
  NORMAL: 3, // 普通更新
  TRANSITION: 4, // 过渡更新
  IDLE: 5, // 低优先级
};

interface Task {
  priority: number;
  callback: () => void;
  id: symbol;
  isSync: boolean; // 标记是否同步执行
}

// 按优先级分组的任务队列
const taskQueues = new Map<number, Task[]>([
  [Priority.SYNC, []],
  [Priority.USER_INPUT, []],
  [Priority.NORMAL, []],
  [Priority.TRANSITION, []],
  [Priority.IDLE, []],
]);

let isPerformingWork = false;
let currentTaskId: symbol | null = null;
let syncTaskQueue: Task[] = []; // 专门存放同步任务

// 调度器状态
const schedulerState = {
  currentPriority: Priority.NORMAL, // 默认普通优先级
  isExecutingTask: false,
};
/**
 * 获取当前正在执行的任务优先级
 */
export function getCurrentPriorityLane(): number {
  return schedulerState.currentPriority;
}

/**
 * 调度一个任务（真正的优先级调度）
 */
export function scheduleTask(
  callback: () => void,
  priority: number = Priority.NORMAL
) {
  const task: Task = {
    priority,
    callback,
    id: Symbol(),
    isSync: priority === Priority.SYNC, // 只有 SYNC 优先级是同步执行
  };

  // 如果是同步任务，直接放入 syncTaskQueue
  if (task.isSync) {
    callback()
    return;
  }

  // 否则放入对应优先级的队列
  taskQueues.get(priority)?.push(task);

  // 如果当前没有执行任务，则启动调度
  if (!isPerformingWork) {
    isPerformingWork = true;
    nextTick().then(flushWork);
  }
}

/**
 * 执行异步工作任务（按优先级顺序）
 */
async function flushWork() {
  // 按优先级顺序处理任务：USER_INPUT > NORMAL > TRANSITION > IDLE
  const priorities = [
    Priority.USER_INPUT,
    Priority.NORMAL,
    Priority.TRANSITION,
    Priority.IDLE,
  ];

  for (const priority of priorities) {
    const queue = taskQueues.get(priority);
    if (!queue || queue.length === 0) continue;

    // 执行当前优先级的所有任务
    while (queue.length > 0) {
      const task = queue[0];
      schedulerState.currentPriority = task.priority;
      schedulerState.isExecutingTask = true;
      currentTaskId = task.id;

      try {
        await task.callback(); // 异步执行（支持 async/await）
      } catch (error) {
        if (process.env.NODE_ENV !== "production") warn("Task failed:", error);
      }

      // 移除已执行的任务
      queue.shift();

      // 如果又有更高优先级的任务插入，则中断当前循环
      if (hasHigherPriorityTask(priority)) {
        break;
      }
    }
  }

  // 所有任务完成
  isPerformingWork = false;
  currentTaskId = null;

  // 如果还有剩余任务，继续调度
  if (hasPendingTasks()) {
    nextTick().then(flushWork);
  }
}

/**
 * 检查是否有更高优先级的任务
 */
function hasHigherPriorityTask(currentPriority: number): boolean {
  for (const [priority, queue] of taskQueues) {
    if (priority < currentPriority && queue.length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * 检查是否还有待处理任务
 */
function hasPendingTasks(): boolean {
  for (const queue of taskQueues.values()) {
    if (queue.length > 0) return true;
  }
  return false;
}

/**
 * 取消重复任务
 */
export function cancelDuplicateTask(callback: () => void, priority: number) {
  const queue = taskQueues.get(priority);
  if (queue) {
    const index = queue.findIndex((task) => task.callback === callback);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }
}
