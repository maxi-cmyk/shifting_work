import { initialState, type AppState, type DriveGear, type Gear, type SessionRecord, type Task } from './domain'

export const STORAGE_KEY = 'shiftwork.mvp.state.v1'

const validGear = (value: unknown): value is Gear =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6

const validDriveGear = (value: unknown): value is DriveGear => validGear(value) && value !== 0

function parseTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((candidate): candidate is Task => {
      if (!candidate || typeof candidate !== 'object') return false
      const task = candidate as Partial<Task>
      return (
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        validDriveGear(task.gear) &&
        typeof task.targetMinutes === 'number' &&
        task.targetMinutes >= 1 &&
        task.targetMinutes <= 480 &&
        ['queued', 'active', 'completed'].includes(task.status ?? '') &&
        typeof task.position === 'number' &&
        typeof task.createdAt === 'string'
      )
    })
    .sort((a, b) => a.position - b.position)
}

function parseHistory(value: unknown): SessionRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter((candidate): candidate is SessionRecord => {
    if (!candidate || typeof candidate !== 'object') return false
    const record = candidate as Partial<SessionRecord>
    return (
      typeof record.id === 'string' &&
      typeof record.taskTitle === 'string' &&
      validDriveGear(record.plannedGear) &&
      validGear(record.finalGear) &&
      typeof record.targetSeconds === 'number' &&
      typeof record.elapsedSeconds === 'number' &&
      ['early', 'on-target', 'overrun', 'abandoned'].includes(record.outcome ?? '') &&
      typeof record.completedAt === 'string'
    )
  })
}

export function loadState(storage: Pick<Storage, 'getItem'> = window.localStorage): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<AppState>
    const active = parsed.activeSession
    const validActive =
      active &&
      typeof active.taskId === 'string' &&
      typeof active.accumulatedSeconds === 'number' &&
      validGear(active.currentGear)
        ? {
            ...active,
            accumulatedSeconds:
              active.accumulatedSeconds +
              (active.isRunning && active.lastStartedAt
                ? Math.max(0, Math.floor((Date.now() - new Date(active.lastStartedAt).getTime()) / 1000))
                : 0),
            isRunning: false,
            lastStartedAt: null,
            currentGear: 0 as const,
          }
        : null

    return {
      tasks: parseTasks(parsed.tasks),
      history: parseHistory(parsed.history).slice(0, 50),
      activeSession: validActive,
      preferences: {
        onboardingComplete: Boolean(parsed.preferences?.onboardingComplete),
        soundEnabled: Boolean(parsed.preferences?.soundEnabled),
        reducedMotion: Boolean(parsed.preferences?.reducedMotion),
      },
    }
  } catch {
    return initialState
  }
}

export function saveState(state: AppState, storage: Pick<Storage, 'setItem'> = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state))
}
