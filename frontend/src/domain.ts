export type Gear = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DriveGear = Exclude<Gear, 0>;
export type TaskStatus = 'queued' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  gear: DriveGear;
  targetMinutes: number;
  status: TaskStatus;
  position: number;
  createdAt: string;
}

export interface ActiveSession {
  taskId: string;
  accumulatedSeconds: number;
  lastStartedAt: string | null;
  isRunning: boolean;
  currentGear: Gear;
}

export type SessionOutcome = 'early' | 'on-target' | 'overrun' | 'abandoned';

export interface SessionRecord {
  id: string;
  taskTitle: string;
  plannedGear: DriveGear;
  finalGear: Gear;
  targetSeconds: number;
  elapsedSeconds: number;
  outcome: SessionOutcome;
  completedAt: string;
}

export interface Preferences {
  onboardingComplete: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export interface AppState {
  tasks: Task[];
  activeSession: ActiveSession | null;
  history: SessionRecord[];
  preferences: Preferences;
}

export const gearDetails: Record<
  DriveGear,
  { label: string; targetMinutes: number; intent: string }
> = {
  1: { label: 'Ignition', targetMinutes: 10, intent: 'Start small. Remove inertia.' },
  2: { label: 'Roll', targetMinutes: 20, intent: 'Build easy, steady motion.' },
  3: { label: 'Cruise', targetMinutes: 30, intent: 'Settle into everyday focus.' },
  4: { label: 'Drive', targetMinutes: 45, intent: 'Protect a deeper work block.' },
  5: { label: 'Push', targetMinutes: 60, intent: 'Commit to demanding output.' },
  6: { label: 'Sprint', targetMinutes: 30, intent: 'A short, defined final effort.' },
};

export const initialState: AppState = {
  tasks: [],
  activeSession: null,
  history: [],
  preferences: {
    onboardingComplete: false,
    soundEnabled: false,
    reducedMotion: false,
  },
};

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function elapsedSeconds(session: ActiveSession, now = Date.now()): number {
  if (!session.isRunning || !session.lastStartedAt) return session.accumulatedSeconds;
  const liveSeconds = Math.max(
    0,
    Math.floor((now - new Date(session.lastStartedAt).getTime()) / 1000),
  );
  return session.accumulatedSeconds + liveSeconds;
}

export function formatDuration(totalSeconds: number): string {
  const absolute = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const seconds = absolute % 60;
  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getOutcome(elapsed: number, target: number): Exclude<SessionOutcome, 'abandoned'> {
  if (elapsed <= target * 0.8) return 'early';
  if (elapsed >= target * 1.2) return 'overrun';
  return 'on-target';
}

export interface Recommendation {
  outcome: Exclude<SessionOutcome, 'abandoned'>;
  eyebrow: string;
  title: string;
  body: string;
  suggestedGear: Gear;
}

export function getRecommendation(
  elapsed: number,
  target: number,
  finalGear: Gear,
): Recommendation {
  const outcome = getOutcome(elapsed, target);
  if (outcome === 'early') {
    return {
      outcome,
      eyebrow: 'Momentum available',
      title: finalGear < 6 ? 'Consider an upshift' : 'Hold sixth or recover',
      body: 'You finished with more than 20% in reserve. Raise the pace only if the next task needs it.',
      suggestedGear: finalGear < 6 ? ((finalGear + 1) as Gear) : 0,
    };
  }
  if (outcome === 'overrun') {
    return {
      outcome,
      eyebrow: 'Load exceeded target',
      title: 'Downshift or split the work',
      body: 'The task ran more than 20% over. Reduce intensity, take neutral, or make the next task smaller.',
      suggestedGear: finalGear > 1 ? ((finalGear - 1) as Gear) : 0,
    };
  }
  return {
    outcome,
    eyebrow: 'Pace matched',
    title: 'Hold this gear',
    body: 'You landed within the target window. Stay here unless the next task asks for a different pace.',
    suggestedGear: finalGear,
  };
}
