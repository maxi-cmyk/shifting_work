import { useEffect, useRef, useState } from 'react';
import { FocusMode } from './components/FocusMode';
import { Gearbox } from './components/Gearbox';
import { HistoryView } from './components/HistoryView';
import { Icon } from './components/Icon';
import { SettingsView } from './components/SettingsView';
import { TaskForm } from './components/TaskForm';
import {
  elapsedSeconds,
  formatDuration,
  gearDetails,
  type AppState,
  type Gear,
  type Recommendation,
} from './domain';
import { useSession } from './hooks/useSession';
import { useSound } from './hooks/useSound';
import { useTasks } from './hooks/useTasks';
import { loadState, saveState } from './persistence';

type View = 'drive' | 'history' | 'settings';

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

  const sound = useSound(state.preferences.soundEnabled);

  useEffect(() => saveState(state), [state]);

  const selectedTask = state.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const editingTask = state.tasks.find((task) => task.id === editingTaskId) ?? null;

  const {
    saveTask,
    deleteTask,
    moveTask,
    queuedTasks,
    completedCount,
    driveUnlocked,
    nextSuggestedGear,
  } = useTasks({
    state,
    selectedTaskId,
    editingTaskId,
    setState,
    setSelectedTaskId,
    setEditingTaskId,
  });

  const {
    activeTask,
    handleShift,
    startSession,
    completeSession,
    abandonSession,
    advanceSession,
    nextQueuedTask,
  } = useSession({
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
  });

  const kbd = useRef({ handleShift, startSession, completeSession, state, activeTask });
  kbd.current = { handleShift, startSession, completeSession, state, activeTask };

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const { handleShift, startSession, completeSession, state, activeTask } = kbd.current;
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
  }, []);

  const currentElapsed = state.activeSession ? elapsedSeconds(state.activeSession, now) : 0;
  const targetSeconds = activeTask ? activeTask.targetMinutes * 60 : 0;
  const progress = targetSeconds ? Math.min(100, (currentElapsed / targetSeconds) * 100) : 0;

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
      <Sidebar view={view} onNavigate={setView} />

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
                onSave={saveTask}
                onCancelEdit={() => setEditingTaskId(null)}
              />
              <TaskQueue
                activeTask={activeTask}
                queuedTasks={queuedTasks}
                selectedTaskId={selectedTaskId}
                onSelect={setSelectedTaskId}
                onEdit={setEditingTaskId}
                onMove={moveTask}
                onDelete={deleteTask}
              />
            </section>

            <Cockpit
              activeTask={activeTask}
              activeSession={state.activeSession}
              selectedTask={selectedTask}
              leverGear={leverGear}
              currentElapsed={currentElapsed}
              targetSeconds={targetSeconds}
              progress={progress}
              driveUnlocked={driveUnlocked}
              taskCount={state.tasks.length}
              reducedMotion={state.preferences.reducedMotion}
              recommendation={recommendation}
              onShift={handleShift}
              onStart={startSession}
              onComplete={completeSession}
              onAbandon={abandonSession}
              onAcceptRecommendation={(gear) => {
                setLeverGear(gear);
                setRecommendation(null);
                if (gear > 0) sound.playGateEngage(gear);
                else sound.playNeutralClick();
              }}
            />
          </div>
        )}

        {view === 'history' && (
          <HistoryView
            history={state.history}
            onClear={() => {
              if (window.confirm('Clear all session history? This cannot be undone.'))
                setState((current) => ({ ...current, history: [] }));
            }}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            preferences={state.preferences}
            onChange={(preferences) => setState((current) => ({ ...current, preferences }))}
            onReplay={() =>
              setState((current) => ({
                ...current,
                preferences: { ...current.preferences, onboardingComplete: false },
              }))
            }
          />
        )}
      </main>

      {!state.preferences.onboardingComplete && (
        <Onboarding
          onboardingShifted={onboardingShifted}
          reducedMotion={state.preferences.reducedMotion}
          onShift={(gear) => {
            if (gear === 1) setOnboardingShifted(true);
          }}
          onComplete={() =>
            setState((current) => ({
              ...current,
              preferences: { ...current.preferences, onboardingComplete: true },
            }))
          }
        />
      )}
    </div>
  );
}

function Sidebar({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
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
        <button className={view === 'drive' ? 'is-active' : ''} onClick={() => onNavigate('drive')}>
          <Icon name="drive" />
          <span>Drive</span>
        </button>
        <button
          className={view === 'history' ? 'is-active' : ''}
          onClick={() => onNavigate('history')}
        >
          <Icon name="history" />
          <span>History</span>
        </button>
        <button
          className={view === 'settings' ? 'is-active' : ''}
          onClick={() => onNavigate('settings')}
        >
          <Icon name="settings" />
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}

function TaskQueue({
  activeTask,
  queuedTasks,
  selectedTaskId,
  onSelect,
  onEdit,
  onMove,
  onDelete,
}: {
  activeTask: ReturnType<typeof useSession>['activeTask'];
  queuedTasks: ReturnType<typeof useTasks>['queuedTasks'];
  selectedTaskId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="task-queue panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Route</span>
          <h2>Task queue</h2>
        </div>
      </div>
      {activeTask && (
        <div className="active-queue-item">
          <span>Active</span>
          <strong>{activeTask.title}</strong>
          <small>
            Gear {activeTask.gear} · {activeTask.targetMinutes} min
          </small>
        </div>
      )}
      {queuedTasks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__line" />
          <h3>Load three tasks.</h3>
          <p>Your first route begins in Gear 1 and advances automatically with each task.</p>
        </div>
      ) : (
        <ol className="task-list">
          {queuedTasks.map((task, index) => (
            <li key={task.id} className={selectedTaskId === task.id ? 'is-selected' : ''}>
              <button
                className="task-list__select"
                onClick={() => onSelect(task.id)}
                aria-pressed={selectedTaskId === task.id}
              >
                <span className="task-gear">Gear {task.gear}</span>
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {task.targetMinutes} min · {gearDetails[task.gear].label}
                  </small>
                </span>
              </button>
              <span className="task-list__actions">
                <button
                  onClick={() => onMove(task.id, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${task.title} up`}
                >
                  <Icon name="up" />
                </button>
                <button
                  onClick={() => onMove(task.id, 1)}
                  disabled={index === queuedTasks.length - 1}
                  aria-label={`Move ${task.title} down`}
                >
                  <Icon name="down" />
                </button>
                <button onClick={() => onEdit(task.id)} aria-label={`Edit ${task.title}`}>
                  <Icon name="edit" />
                </button>
                <button onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
                  <Icon name="trash" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Cockpit({
  activeTask,
  activeSession,
  selectedTask,
  leverGear,
  currentElapsed,
  targetSeconds,
  progress,
  driveUnlocked,
  taskCount,
  reducedMotion,
  recommendation,
  onShift,
  onStart,
  onComplete,
  onAbandon,
  onAcceptRecommendation,
}: {
  activeTask: ReturnType<typeof useSession>['activeTask'];
  activeSession: AppState['activeSession'];
  selectedTask: AppState['tasks'][number] | null;
  leverGear: Gear;
  currentElapsed: number;
  targetSeconds: number;
  progress: number;
  driveUnlocked: boolean;
  taskCount: number;
  reducedMotion: boolean;
  recommendation: Recommendation | null;
  onShift: (gear: Gear) => void;
  onStart: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  onAcceptRecommendation: (gear: Gear) => void;
}) {
  return (
    <section className="cockpit panel">
      <div className="cockpit__topline">
        <span>Focus transmission</span>
        <span className="serial">SW—06 / LOCAL</span>
      </div>
      <div className="session-readout">
        <span className="eyebrow">
          {activeTask
            ? activeSession?.isRunning
              ? 'Current task'
              : 'Paused in neutral'
            : selectedTask
              ? 'Ready to engage'
              : 'Awaiting task'}
        </span>
        <h2>{activeTask?.title ?? selectedTask?.title ?? 'Load your first task'}</h2>
        <p>
          {activeTask
            ? `Planned Gear ${activeTask.gear} · ${gearDetails[activeTask.gear].label}`
            : selectedTask
              ? `Planned Gear ${selectedTask.gear} · ${selectedTask.targetMinutes} minute target`
              : 'Add a task, choose it from the queue, then engage a gear.'}
        </p>
      </div>

      <div className="instrument-cluster">
        <div className="timer-block">
          <span className="timer-label">Elapsed</span>
          <strong
            className={currentElapsed > targetSeconds && targetSeconds > 0 ? 'is-overrun' : ''}
          >
            {formatDuration(currentElapsed)}
          </strong>
          <div className="progress-track">
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          <div className="timer-meta">
            <span>00:00</span>
            <span>
              Target {formatDuration(targetSeconds || (selectedTask?.targetMinutes ?? 0) * 60)}
            </span>
          </div>
        </div>
        <Gearbox gear={leverGear} onShift={onShift} reducedMotion={reducedMotion} />
      </div>

      <div className="drive-controls">
        {!activeSession ? (
          <button
            className="ignition-button"
            onClick={onStart}
            disabled={!selectedTask || leverGear === 0 || !driveUnlocked}
          >
            <span className="ignition-button__ring">
              <Icon name="drive" />
            </span>
            <span>
              <small>
                {!driveUnlocked
                  ? `${taskCount} of 3 tasks loaded`
                  : leverGear === 0
                    ? 'Engage a gear first'
                    : `Gear ${leverGear} selected`}
              </small>
              <strong>{driveUnlocked ? 'Start session' : 'Add three tasks'}</strong>
            </span>
          </button>
        ) : (
          <>
            <button className="button button--primary" onClick={onComplete}>
              <Icon name="check" />
              Complete task
            </button>
            <button
              className="button button--ghost"
              onClick={() => onShift(activeSession.isRunning ? 0 : (activeTask?.gear ?? 1))}
            >
              <Icon name="pause" />
              {activeSession.isRunning ? 'Pause (Space)' : 'Resume (Space)'}
            </button>
            <button className="text-button text-button--danger" onClick={onAbandon}>
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
          <button onClick={() => onAcceptRecommendation(recommendation.suggestedGear)}>
            {recommendation.suggestedGear === 0
              ? 'Take neutral'
              : `Prepare Gear ${recommendation.suggestedGear}`}
          </button>
        </aside>
      )}
    </section>
  );
}

function Onboarding({
  onboardingShifted,
  reducedMotion,
  onShift,
  onComplete,
}: {
  onboardingShifted: boolean;
  reducedMotion: boolean;
  onShift: (gear: Gear) => void;
  onComplete: () => void;
}) {
  return (
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
            This is a manual system. You choose the pace; Shiftwork only reads the road and offers
            advice.
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
            onShift={onShift}
            compact
            reducedMotion={reducedMotion}
            label="Onboarding gear selector"
          />
          <button
            className="button button--primary"
            disabled={!onboardingShifted}
            onClick={onComplete}
          >
            Enter cockpit
          </button>
        </div>
      </div>
    </div>
  );
}
