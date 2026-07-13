import { useMemo } from 'react';
import { createId, type AppState, type DriveGear, type Task } from '../domain';

interface UseTasksParams {
  state: AppState;
  selectedTaskId: string | null;
  editingTaskId: string | null;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setSelectedTaskId: (id: string | null) => void;
  setEditingTaskId: (id: string | null) => void;
}

export function useTasks({
  state,
  selectedTaskId,
  editingTaskId,
  setState,
  setSelectedTaskId,
  setEditingTaskId,
}: UseTasksParams) {
  const patchState = (updater: (current: AppState) => AppState) =>
    setState((current) => updater(current));

  const saveTask = (draft: { title: string; gear: DriveGear; targetMinutes: number }) => {
    if (editingTaskId) {
      patchState((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === editingTaskId ? { ...task, ...draft } : task,
        ),
      }));
      setEditingTaskId(null);
      return;
    }
    const task: Task = {
      id: createId('task'),
      ...draft,
      status: 'queued',
      position: state.tasks.length,
      createdAt: new Date().toISOString(),
    };
    patchState((current) => ({ ...current, tasks: [...current.tasks, task] }));
    setSelectedTaskId(task.id);
  };

  const deleteTask = (id: string) => {
    if (state.activeSession?.taskId === id) return;
    patchState((current) => ({
      ...current,
      tasks: current.tasks
        .filter((task) => task.id !== id)
        .map((task, position) => ({ ...task, position })),
    }));
    if (selectedTaskId === id) setSelectedTaskId(null);
    if (editingTaskId === id) setEditingTaskId(null);
  };

  const moveTask = (id: string, direction: -1 | 1) => {
    patchState((current) => {
      const queued = current.tasks
        .filter((task) => task.status === 'queued')
        .sort((a, b) => a.position - b.position);
      const index = queued.findIndex((task) => task.id === id);
      const swapIndex = index + direction;
      if (index < 0 || swapIndex < 0 || swapIndex >= queued.length) return current;
      [queued[index], queued[swapIndex]] = [queued[swapIndex], queued[index]];
      const positions = new Map(queued.map((task, position) => [task.id, position]));
      return {
        ...current,
        tasks: current.tasks.map((task) =>
          positions.has(task.id) ? { ...task, position: positions.get(task.id)! } : task,
        ),
      };
    });
  };

  const queuedTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.status === 'queued')
        .sort((a, b) => a.position - b.position),
    [state.tasks],
  );

  const completedCount = state.tasks.filter((task) => task.status === 'completed').length;
  const driveUnlocked = state.tasks.length >= 3;
  const lastTaskGear = state.tasks.length > 0 ? state.tasks[state.tasks.length - 1].gear : 0;
  const nextSuggestedGear = (lastTaskGear === 0 ? 1 : (lastTaskGear % 6) + 1) as DriveGear;

  return {
    saveTask,
    deleteTask,
    moveTask,
    queuedTasks,
    completedCount,
    driveUnlocked,
    nextSuggestedGear,
  };
}
