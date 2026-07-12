import { describe, expect, it, vi } from 'vitest';
import { initialState, type AppState } from './domain';
import { loadState, saveState, STORAGE_KEY } from './persistence';

describe('local persistence', () => {
  it('returns safe defaults for malformed JSON', () => {
    const storage = { getItem: vi.fn(() => '{bad') };
    expect(loadState(storage)).toEqual(initialState);
  });

  it('filters invalid task records', () => {
    const storage = {
      getItem: vi.fn(() =>
        JSON.stringify({
          tasks: [
            {
              id: 'bad',
              title: 'Impossible gear',
              gear: 9,
              targetMinutes: 10,
              status: 'queued',
              position: 0,
              createdAt: 'now',
            },
            {
              id: 'good',
              title: 'Valid task',
              gear: 2,
              targetMinutes: 20,
              status: 'queued',
              position: 1,
              createdAt: 'now',
            },
          ],
        }),
      ),
    };
    expect(loadState(storage).tasks.map((task) => task.id)).toEqual(['good']);
  });

  it('restores an active session safely paused in neutral', () => {
    const persisted: AppState = {
      ...initialState,
      activeSession: {
        taskId: 'task-1',
        accumulatedSeconds: 30,
        lastStartedAt: new Date(Date.now() - 5_000).toISOString(),
        isRunning: true,
        currentGear: 3,
      },
    };
    const storage = { getItem: vi.fn(() => JSON.stringify(persisted)) };
    const restored = loadState(storage);
    expect(restored.activeSession?.isRunning).toBe(false);
    expect(restored.activeSession?.currentGear).toBe(0);
    expect(restored.activeSession?.accumulatedSeconds).toBeGreaterThanOrEqual(34);
  });

  it('writes the versioned state key', () => {
    const storage = { setItem: vi.fn() };
    saveState(initialState, storage);
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });
});
