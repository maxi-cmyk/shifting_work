import { useEffect, useMemo, useState } from 'react';
import { Gearbox } from './components/Gearbox';
import { TaskForm } from './components/TaskForm';
import {
  createId,
  elapsedSeconds,
  formatDuration,
  gearDetails,
  getOutcome,
  getRecommendation,
  type AppState,
  type DriveGear,
  type Gear,
  type Recommendation,
  type SessionRecord,
  type Task,
} from './domain';
import { loadState, saveState } from './persistence';

type View = 'drive' | 'history' | 'settings';

function Icon({
  name,
}: {
  name:
    | 'drive'
    | 'history'
    | 'settings'
    | 'plus'
    | 'edit'
    | 'trash'
    | 'up'
    | 'down'
    | 'check'
    | 'pause'
    | 'next'
    | 'exit';
}) {
  const paths = {
    drive: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 4v6M5.1 16h13.8M7 9l5 3 5-3" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="m4 16-1 5 5-1L19 9l-4-4Z" />
        <path d="m13 7 4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
    up: <path d="m6 15 6-6 6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    pause: (
      <>
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    next: (
      <>
        <path d="M5 12h13M13 7l5 5-5 5" />
      </>
    ),
    exit: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
  };
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('drive');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    () => state.tasks.find((task) => task.status === 'queued')?.id ?? null,
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [leverGear, setLeverGear] = useState<Gear>(() => state.activeSession?.currentGear ?? 0);
  const [now, setNow] = useState(Date.now());
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [onboardingShifted, setOnboardingShifted] = useState(false);
  const isFocusSessionActive = Boolean(state.activeSession);

  useEffect(() => saveState(state), [state]);

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

  const activeTask = state.activeSession
    ? (state.tasks.find((task) => task.id === state.activeSession?.taskId) ?? null)
    : null;
  const selectedTask = state.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const editingTask = state.tasks.find((task) => task.id === editingTaskId) ?? null;
  const currentElapsed = state.activeSession ? elapsedSeconds(state.activeSession, now) : 0;
  const targetSeconds = activeTask ? activeTask.targetMinutes * 60 : 0;
  const progress = targetSeconds ? Math.min(100, (currentElapsed / targetSeconds) * 100) : 0;

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches('input, textarea, select, button') || target.isContentEditable)
      )
        return;
      if (/^[1-6]$/.test(event.key)) {
        event.preventDefault();
        handleShift(Number(event.key) as Gear);
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleShift(0);
      } else if (event.code === 'Space') {
        event.preventDefault();
        if (state.activeSession)
          handleShift(state.activeSession.isRunning ? 0 : (activeTask?.gear ?? 1));
        else startSession();
      } else if (event.key === 'Enter' && state.activeSession) {
        event.preventDefault();
        completeSession();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  });

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

  const moveSessionToTask = (nextTask: Task, nextGear: DriveGear = nextTask.gear) => {
    if (!state.activeSession || !activeTask || nextTask.id === activeTask.id) return;
    const elapsed = elapsedSeconds(state.activeSession);
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
  };

  const finish = (abandoned: boolean) => {
    if (!state.activeSession || !activeTask) return;
    const elapsed = elapsedSeconds(state.activeSession);
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
    if (!abandoned)
      setRecommendation(getRecommendation(elapsed, targetSeconds, state.activeSession.currentGear));
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

  const completeSession = () => finish(false);
  const abandonSession = () => {
    if (window.confirm('Return this task to the queue and end the current session?')) finish(true);
  };

  const nextQueuedTask =
    state.tasks
      .filter((task) => task.status === 'queued')
      .sort((a, b) => a.position - b.position)[0] ?? null;
  const advanceSession = () => {
    if (nextQueuedTask) moveSessionToTask(nextQueuedTask);
    else completeSession();
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
  const highestAssignedGear = state.tasks.reduce(
    (highest, task) => Math.max(highest, task.gear),
    0,
  );
  const nextSuggestedGear = Math.min(highestAssignedGear + 1, 6) as DriveGear;

  if (state.activeSession && activeTask) {
    return (
      <FocusMode
        task={activeTask}
        elapsed={currentElapsed}
        targetSeconds={targetSeconds}
        gear={leverGear}
        reducedMotion={state.preferences.reducedMotion}
        onShift={handleShift}
        onAdvance={advanceSession}
        onExit={abandonSession}
        nextTask={nextQueuedTask}
      />
    );
  }

  return (
    <div className={`app-shell ${state.preferences.reducedMotion ? 'reduce-motion' : ''}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand" aria-label="Shiftwork home">
          <span className="brand__mark">
            <i />
            <i />
            <i />
          </span>
          <span className="brand__word">
            Shift<span>work</span>
          </span>
        </div>
        <nav>
          <button className={view === 'drive' ? 'is-active' : ''} onClick={() => setView('drive')}>
            <Icon name="drive" />
            <span>Drive</span>
          </button>
          <button
            className={view === 'history' ? 'is-active' : ''}
            onClick={() => setView('history')}
          >
            <Icon name="history" />
            <span>History</span>
          </button>
          <button
            className={view === 'settings' ? 'is-active' : ''}
            onClick={() => setView('settings')}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar__status">
          <span className={`status-light ${state.activeSession?.isRunning ? 'is-live' : ''}`} />
          <div>
            <small>System</small>
            <strong>{state.activeSession?.isRunning ? 'In motion' : 'Ready'}</strong>
          </div>
        </div>
      </aside>

      <main id="main-content" className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Personal pace control</span>
            <h1>{view === 'drive' ? 'Today’s drive' : view}</h1>
          </div>
          <div className="day-meter">
            <span>{completedCount}</span>
            <div>
              <strong>Tasks complete</strong>
              <small>{queuedTasks.length} still in queue</small>
            </div>
          </div>
        </header>

        {view === 'drive' && (
          <div className="drive-layout">
            <section className="left-rail">
              <TaskForm
                editingTask={editingTask}
                suggestedGear={nextSuggestedGear}
                taskCount={state.tasks.length}
                onSave={saveTask}
                onCancelEdit={() => setEditingTaskId(null)}
              />
              <section className="task-queue panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Route</span>
                    <h2>Task queue</h2>
                  </div>
                  <span className="section-index">02</span>
                </div>
                {activeTask && (
                  <div className="active-queue-item">
                    <span>Active</span>
                    <strong>{activeTask.title}</strong>
                    <small>
                      G{activeTask.gear} · {activeTask.targetMinutes} min
                    </small>
                  </div>
                )}
                {queuedTasks.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state__line" />
                    <h3>Load three tasks.</h3>
                    <p>
                      Your first route begins in Gear 1 and advances automatically with each task.
                    </p>
                  </div>
                ) : (
                  <ol className="task-list">
                    {queuedTasks.map((task, index) => (
                      <li key={task.id} className={selectedTaskId === task.id ? 'is-selected' : ''}>
                        <button
                          className="task-list__select"
                          onClick={() => setSelectedTaskId(task.id)}
                          aria-pressed={selectedTaskId === task.id}
                        >
                          <span className="task-gear">G{task.gear}</span>
                          <span>
                            <strong>{task.title}</strong>
                            <small>
                              {task.targetMinutes} min · {gearDetails[task.gear].label}
                            </small>
                          </span>
                        </button>
                        <span className="task-list__actions">
                          <button
                            onClick={() => moveTask(task.id, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${task.title} up`}
                          >
                            <Icon name="up" />
                          </button>
                          <button
                            onClick={() => moveTask(task.id, 1)}
                            disabled={index === queuedTasks.length - 1}
                            aria-label={`Move ${task.title} down`}
                          >
                            <Icon name="down" />
                          </button>
                          <button
                            onClick={() => setEditingTaskId(task.id)}
                            aria-label={`Edit ${task.title}`}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                          >
                            <Icon name="trash" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </section>

            <section className="cockpit panel">
              <div className="cockpit__topline">
                <span>Focus transmission</span>
                <span className="serial">SW—06 / LOCAL</span>
              </div>
              <div className="session-readout">
                <span className="eyebrow">
                  {activeTask
                    ? state.activeSession?.isRunning
                      ? 'Current task'
                      : 'Paused in neutral'
                    : selectedTask
                      ? 'Ready to engage'
                      : 'Awaiting task'}
                </span>
                <h2>{activeTask?.title ?? selectedTask?.title ?? 'Load your first task'}</h2>
                <p>
                  {activeTask
                    ? `Planned G${activeTask.gear} · ${gearDetails[activeTask.gear].label}`
                    : selectedTask
                      ? `Planned G${selectedTask.gear} · ${selectedTask.targetMinutes} minute target`
                      : 'Add a task, choose it from the queue, then engage a gear.'}
                </p>
              </div>

              <div className="instrument-cluster">
                <div className="timer-block">
                  <span className="timer-label">Elapsed</span>
                  <strong
                    className={
                      currentElapsed > targetSeconds && targetSeconds > 0 ? 'is-overrun' : ''
                    }
                  >
                    {formatDuration(currentElapsed)}
                  </strong>
                  <div className="progress-track">
                    <span style={{ transform: `scaleX(${progress / 100})` }} />
                  </div>
                  <div className="timer-meta">
                    <span>00:00</span>
                    <span>
                      Target{' '}
                      {formatDuration(targetSeconds || (selectedTask?.targetMinutes ?? 0) * 60)}
                    </span>
                  </div>
                </div>
                <Gearbox
                  gear={leverGear}
                  onShift={handleShift}
                  reducedMotion={state.preferences.reducedMotion}
                />
              </div>

              <div className="drive-controls">
                {!state.activeSession ? (
                  <button
                    className="ignition-button"
                    onClick={startSession}
                    disabled={!selectedTask || leverGear === 0 || !driveUnlocked}
                  >
                    <span className="ignition-button__ring">
                      <Icon name="drive" />
                    </span>
                    <span>
                      <small>
                        {!driveUnlocked
                          ? `${state.tasks.length} of 3 tasks loaded`
                          : leverGear === 0
                            ? 'Engage a gear first'
                            : `Gear ${leverGear} selected`}
                      </small>
                      <strong>{driveUnlocked ? 'Start session' : 'Add three tasks'}</strong>
                    </span>
                  </button>
                ) : (
                  <>
                    <button className="button button--primary" onClick={completeSession}>
                      <Icon name="check" />
                      Complete task
                    </button>
                    <button
                      className="button button--ghost"
                      onClick={() =>
                        handleShift(state.activeSession?.isRunning ? 0 : (activeTask?.gear ?? 1))
                      }
                    >
                      <Icon name="pause" />
                      {state.activeSession.isRunning
                        ? 'Shift to neutral'
                        : 'Resume in planned gear'}
                    </button>
                    <button className="text-button text-button--danger" onClick={abandonSession}>
                      End session
                    </button>
                  </>
                )}
              </div>

              {recommendation && (
                <aside
                  className={`recommendation recommendation--${recommendation.outcome}`}
                  aria-live="polite"
                >
                  <div>
                    <span className="eyebrow">{recommendation.eyebrow}</span>
                    <h3>{recommendation.title}</h3>
                    <p>{recommendation.body}</p>
                  </div>
                  <button
                    onClick={() => {
                      setLeverGear(recommendation.suggestedGear);
                      setRecommendation(null);
                    }}
                  >
                    {recommendation.suggestedGear === 0
                      ? 'Take neutral'
                      : `Prepare G${recommendation.suggestedGear}`}
                  </button>
                </aside>
              )}
            </section>
          </div>
        )}

        {view === 'history' && <HistoryView history={state.history} />}
        {view === 'settings' && (
          <SettingsView
            preferences={state.preferences}
            onChange={(preferences) => patchState((current) => ({ ...current, preferences }))}
            onReplay={() =>
              patchState((current) => ({
                ...current,
                preferences: { ...current.preferences, onboardingComplete: false },
              }))
            }
          />
        )}
      </main>

      {!state.preferences.onboardingComplete && (
        <div
          className="onboarding-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <div className="onboarding-card">
            <div className="onboarding-copy">
              <span className="eyebrow">First drive</span>
              <h2 id="onboarding-title">Find first gear.</h2>
              <p>
                This is a manual system. You choose the pace; Shiftwork only reads the road and
                offers advice.
              </p>
              <ol>
                <li className={onboardingShifted ? 'is-done' : ''}>
                  <span>01</span>Move the lever into Gear 1.
                </li>
                <li>
                  <span>02</span>Load at least three tasks; each advances one gear.
                </li>
                <li>
                  <span>03</span>During focus, press <kbd>Enter</kbd> to complete or <kbd>N</kbd> to
                  pause.
                </li>
              </ol>
              <p className="keyboard-note">
                You can also press <kbd>1</kbd> now.
              </p>
            </div>
            <div className="onboarding-gear">
              <Gearbox
                gear={onboardingShifted ? 1 : 0}
                onShift={(gear) => {
                  if (gear === 1) setOnboardingShifted(true);
                }}
                compact
                reducedMotion={state.preferences.reducedMotion}
                label="Onboarding gear selector"
              />
              <button
                className="button button--primary"
                disabled={!onboardingShifted}
                onClick={() =>
                  patchState((current) => ({
                    ...current,
                    preferences: { ...current.preferences, onboardingComplete: true },
                  }))
                }
              >
                Enter cockpit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FocusMode({
  task,
  elapsed,
  targetSeconds,
  gear,
  reducedMotion,
  onShift,
  onAdvance,
  onExit,
  nextTask,
}: {
  task: Task;
  elapsed: number;
  targetSeconds: number;
  gear: Gear;
  reducedMotion: boolean;
  onShift: (gear: Gear) => void;
  onAdvance: () => void;
  onExit: () => void;
  nextTask: Task | null;
}) {
  return (
    <main
      className={`focus-mode ${reducedMotion ? 'reduce-motion' : ''}`}
      aria-label="Active focus session"
    >
      <button className="focus-mode__exit" onClick={onExit}>
        <Icon name="exit" />
        Exit focus
      </button>
      <h1 aria-live="polite">{task.title}</h1>
      <strong
        className={`focus-mode__timer ${elapsed > targetSeconds ? 'is-overrun' : ''}`}
        aria-label={`${formatDuration(elapsed)} elapsed`}
      >
        {formatDuration(elapsed)}
      </strong>
      <Gearbox
        gear={gear}
        onShift={onShift}
        immersive
        reducedMotion={reducedMotion}
        label="Fullscreen six-speed gear selector"
      />
      <button className="focus-mode__advance" onClick={onAdvance}>
        <span>
          <small>
            {nextTask ? `Next: G${nextTask.gear} · ${nextTask.title}` : 'Route complete'}
          </small>
          {nextTask ? 'Move to next gear' : 'Complete final task'}
        </span>
        <Icon name={nextTask ? 'next' : 'check'} />
      </button>
    </main>
  );
}

function HistoryView({ history }: { history: SessionRecord[] }) {
  return (
    <section className="page-panel panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Local logbook</span>
          <h2>Recent sessions</h2>
        </div>
        <span className="section-index">{String(history.length).padStart(2, '0')}</span>
      </div>
      {history.length === 0 ? (
        <div className="empty-state empty-state--large">
          <span className="empty-state__line" />
          <h3>No miles recorded.</h3>
          <p>Completed and abandoned sessions will appear here, stored only on this computer.</p>
        </div>
      ) : (
        <div className="history-table" role="table" aria-label="Session history">
          <div className="history-row history-row--header" role="row">
            <span>Task</span>
            <span>Plan</span>
            <span>Elapsed</span>
            <span>Result</span>
            <span>Date</span>
          </div>
          {history.map((record) => (
            <div className="history-row" role="row" key={record.id}>
              <strong>{record.taskTitle}</strong>
              <span>
                G{record.plannedGear} · {formatDuration(record.targetSeconds)}
              </span>
              <span>{formatDuration(record.elapsedSeconds)}</span>
              <span className={`outcome outcome--${record.outcome}`}>
                {record.outcome.replace('-', ' ')}
              </span>
              <time dateTime={record.completedAt}>
                {new Intl.DateTimeFormat(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(record.completedAt))}
              </time>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsView({
  preferences,
  onChange,
  onReplay,
}: {
  preferences: AppState['preferences'];
  onChange: (preferences: AppState['preferences']) => void;
  onReplay: () => void;
}) {
  return (
    <section className="page-panel panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Cockpit setup</span>
          <h2>Settings</h2>
        </div>
        <span className="section-index">03</span>
      </div>
      <div className="settings-list">
        <label>
          <span>
            <strong>Reduced motion</strong>
            <small>Minimize shifter and interface transitions.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(event) => onChange({ ...preferences, reducedMotion: event.target.checked })}
          />
        </label>
        <label>
          <span>
            <strong>Mechanical sound</strong>
            <small>Prepared for a later audio pass; disabled by default.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.soundEnabled}
            onChange={(event) => onChange({ ...preferences, soundEnabled: event.target.checked })}
          />
        </label>
        <div className="setting-action">
          <span>
            <strong>First-drive tutorial</strong>
            <small>Replay the interactive gear lesson.</small>
          </span>
          <button className="button button--ghost" onClick={onReplay}>
            Replay tutorial
          </button>
        </div>
      </div>
      <aside className="privacy-note">
        <span className="status-light is-live" />
        <div>
          <strong>Local by design</strong>
          <p>
            Tasks, preferences, and history stay in this app’s local browser storage. Shiftwork
            sends nothing to a server.
          </p>
        </div>
      </aside>
    </section>
  );
}
