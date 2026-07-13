import { useEffect, useRef } from 'react';
import {
  createId,
  elapsedSeconds,
  getOutcome,
  getRecommendation,
  type AppState,
  type DriveGear,
  type Gear,
  type Recommendation,
  type SessionRecord,
  type Task,
} from '../domain';
import type { useSound } from './useSound';

interface UseSessionParams {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  selectedTask: Task | null;
  selectedTaskId: string | null;
  leverGear: Gear;
  setLeverGear: (gear: Gear) => void;
  setSelectedTaskId: (id: string | null) => void;
  setNow: React.Dispatch<React.SetStateAction<number>>;
  setRecommendation: React.Dispatch<React.SetStateAction<Recommendation | null>>;
  setOnboardingShifted: React.Dispatch<React.SetStateAction<boolean>>;
  sound: ReturnType<typeof useSound>;
}

export function useSession({
  state,
  setState,
  selectedTask,
  selectedTaskId,
  leverGear,
  setLeverGear,
  setSelectedTaskId,
  setNow,
  setRecommendation,
  setOnboardingShifted,
  sound,
}: UseSessionParams) {
  const stateRef = useRef(state);
  stateRef.current = state;

  const activeTask = state.activeSession
    ? (state.tasks.find((task) => task.id === state.activeSession?.taskId) ?? null)
    : null;

  const isFocusSessionActive = Boolean(state.activeSession);

  useEffect(() => {
    void window.shiftworkDesktop?.setFullscreen(isFocusSessionActive);
    return () => {
      if (isFocusSessionActive) void window.shiftworkDesktop?.setFullscreen(false);
    };
  }, [isFocusSessionActive]);

  useEffect(() => {
    if (!state.activeSession?.isRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [state.activeSession?.isRunning]);

  const patchState = (updater: (current: AppState) => AppState) =>
    setState((current) => updater(current));

  const moveSessionToTask = (nextTask: Task, nextGear: DriveGear = nextTask.gear) => {
    if (!state.activeSession || !activeTask || nextTask.id === activeTask.id) return;
    const elapsed = elapsedSeconds(state.activeSession);
    const targetSeconds = activeTask.targetMinutes * 60;
    const completedAt = new Date().toISOString();
    const record: SessionRecord = {
      id: createId('session'),
      taskTitle: activeTask.title,
      plannedGear: activeTask.gear,
      finalGear: state.activeSession.currentGear,
      targetSeconds,
      elapsedSeconds: elapsed,
      outcome: getOutcome(elapsed, targetSeconds),
      completedAt,
    };
    patchState((current) => {
      if (!current.activeSession) return current;
      return {
        ...current,
        tasks: current.tasks.map((task) => {
          if (task.id === activeTask.id) return { ...task, status: 'completed' };
          if (task.id === nextTask.id) return { ...task, status: 'active' };
          return task;
        }),
        activeSession: {
          taskId: nextTask.id,
          accumulatedSeconds: 0,
          lastStartedAt: completedAt,
          isRunning: true,
          currentGear: nextGear,
        },
        history: [record, ...current.history].slice(0, 50),
      };
    });
    setLeverGear(nextGear);
    sound.playGateEngage(nextGear);
    setSelectedTaskId(nextTask.id);
    setNow(Date.now());
    setRecommendation(null);
  };

  const handleShift = (nextGear: Gear) => {
    if (!state.preferences.onboardingComplete && nextGear === 1) setOnboardingShifted(true);
    if (state.activeSession && activeTask && nextGear !== 0 && nextGear !== activeTask.gear) {
      const taskInGear = state.tasks
        .filter((task) => task.status === 'queued' && task.gear === nextGear)
        .sort((a, b) => a.position - b.position)[0];
      if (taskInGear) {
        moveSessionToTask(taskInGear, nextGear);
        return;
      }
    }
    setLeverGear(nextGear);
    if (nextGear > 0) sound.playGateEngage(nextGear);
    else sound.playNeutralClick();
    if (!state.activeSession) return;
    const at = new Date().toISOString();
    patchState((current) => {
      if (!current.activeSession) return current;
      const elapsed = elapsedSeconds(current.activeSession);
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          accumulatedSeconds: elapsed,
          lastStartedAt: nextGear === 0 ? null : at,
          isRunning: nextGear !== 0,
          currentGear: nextGear,
        },
      };
    });
    setNow(Date.now());
  };

  const startSession = () => {
    if (!selectedTask || leverGear === 0 || state.activeSession || state.tasks.length < 3) return;
    const startedAt = new Date().toISOString();
    patchState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === selectedTask.id ? { ...task, status: 'active' } : task,
      ),
      activeSession: {
        taskId: selectedTask.id,
        accumulatedSeconds: 0,
        lastStartedAt: startedAt,
        isRunning: true,
        currentGear: leverGear,
      },
    }));
    setNow(Date.now());
    setRecommendation(null);
    sound.playSessionStart();
  };

  const finishSession = (abandoned: boolean) => {
    if (!state.activeSession || !activeTask) return;
    const elapsed = elapsedSeconds(state.activeSession);
    const targetSeconds = activeTask.targetMinutes * 60;
    const record: SessionRecord = {
      id: createId('session'),
      taskTitle: activeTask.title,
      plannedGear: activeTask.gear,
      finalGear: state.activeSession.currentGear,
      targetSeconds,
      elapsedSeconds: elapsed,
      outcome: abandoned ? 'abandoned' : getOutcome(elapsed, targetSeconds),
      completedAt: new Date().toISOString(),
    };
    if (!abandoned) {
      setRecommendation(getRecommendation(elapsed, targetSeconds, state.activeSession.currentGear));
      sound.playRecommendation();
    }
    sound.playSessionEnd();
    patchState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === activeTask.id ? { ...task, status: abandoned ? 'queued' : 'completed' } : task,
      ),
      activeSession: null,
      history: [record, ...current.history].slice(0, 50),
    }));
    setLeverGear(0);
    const next = state.tasks
      .filter((task) => task.status === 'queued' && task.id !== activeTask.id)
      .sort((a, b) => a.position - b.position)[0];
    setSelectedTaskId(abandoned ? activeTask.id : (next?.id ?? null));
  };

  const completeSession = () => finishSession(false);
  const abandonSession = () => {
    if (window.confirm('Return this task to the queue and end the current session?'))
      finishSession(true);
  };

  const nextQueuedTask =
    state.tasks
      .filter((task) => task.status === 'queued')
      .sort((a, b) => a.position - b.position)[0] ?? null;

  const advanceSession = () => {
    if (nextQueuedTask) moveSessionToTask(nextQueuedTask);
    else completeSession();
  };

  return {
    activeTask,
    handleShift,
    startSession,
    completeSession,
    abandonSession,
    advanceSession,
    nextQueuedTask,
  };
}
