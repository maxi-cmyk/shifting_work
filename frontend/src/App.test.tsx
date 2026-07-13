import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('MVP task and gearbox flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.shiftworkDesktop = undefined;
  });

  it('requires the interactive first shift before entering the cockpit', async () => {
    const user = userEvent.setup();
    render(<App />);
    const enter = screen.getByRole('button', { name: /enter cockpit/i });
    expect(enter).toBeDisabled();
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /engage gear 1/i }),
    );
    expect(enter).toBeEnabled();
    await user.click(enter);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('requires three tasks, advances their gears, and enters fullscreen focus mode', async () => {
    const user = userEvent.setup();
    const setFullscreen = vi.fn().mockResolvedValue(undefined);
    window.shiftworkDesktop = { platform: 'test', setFullscreen };
    window.localStorage.setItem(
      'shiftwork.mvp.state.v1',
      JSON.stringify({
        tasks: [],
        history: [],
        activeSession: null,
        preferences: { onboardingComplete: true, soundEnabled: false, reducedMotion: false },
      }),
    );
    render(<App />);

    await user.type(screen.getByLabelText('Task'), 'Outline launch notes');
    await user.click(screen.getByRole('button', { name: /add to queue/i }));
    expect(screen.getByRole('button', { name: /1 of 3 tasks loaded/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add three tasks/i })).toBeDisabled();

    await user.type(screen.getByLabelText('Task'), 'Review research');
    await user.click(screen.getByRole('button', { name: /add to queue/i }));
    expect(screen.getByRole('button', { name: /2 of 3 tasks loaded/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Task'), 'Build interaction');
    await user.click(screen.getByRole('button', { name: /add to queue/i }));
    expect(screen.getByRole('button', { name: /engage a gear first/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gear 1Outline launch notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gear 2Review research/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gear 3Build interaction/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Gear 1Outline launch notes/i }));
    const start = screen.getByRole('button', { name: /start session/i });
    await user.click(screen.getByRole('button', { name: /engage gear 1/i }));
    expect(start).toBeEnabled();
    await user.click(start);

    expect(screen.getByRole('main', { name: /active focus session/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Outline launch notes' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Primary navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exit focus/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move to next gear/i })).toBeInTheDocument();
    await waitFor(() => expect(setFullscreen).toHaveBeenCalledWith(true));

    await user.click(screen.getByRole('button', { name: /engage gear 2/i }));
    expect(screen.getByRole('heading', { name: 'Review research' })).toBeInTheDocument();
    expect(screen.getByLabelText('00:00 elapsed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /move to next gear/i }));
    expect(screen.getByRole('heading', { name: 'Build interaction' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete final task/i })).toBeInTheDocument();
    expect(screen.getByLabelText('00:00 elapsed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete final task/i }));
    expect(screen.getByLabelText('Primary navigation')).toBeInTheDocument();
    await waitFor(() => expect(setFullscreen).toHaveBeenCalledWith(false));
  });

  it('exits focus mode and returns the active task to the queue', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.localStorage.setItem(
      'shiftwork.mvp.state.v1',
      JSON.stringify({
        tasks: [
          {
            id: 'one',
            title: 'Active task',
            gear: 1,
            targetMinutes: 10,
            status: 'active',
            position: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'two',
            title: 'Second task',
            gear: 2,
            targetMinutes: 20,
            status: 'queued',
            position: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'three',
            title: 'Third task',
            gear: 3,
            targetMinutes: 30,
            status: 'queued',
            position: 2,
            createdAt: new Date().toISOString(),
          },
        ],
        history: [],
        activeSession: {
          taskId: 'one',
          accumulatedSeconds: 0,
          lastStartedAt: new Date().toISOString(),
          isRunning: true,
          currentGear: 1,
        },
        preferences: { onboardingComplete: true, soundEnabled: false, reducedMotion: false },
      }),
    );

    render(<App />);
    await user.click(screen.getByRole('button', { name: /exit focus/i }));
    expect(screen.getByLabelText('Primary navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gear 1Active task/i })).toBeInTheDocument();
  });

  it('supports number-key shifting outside form controls', () => {
    window.localStorage.setItem(
      'shiftwork.mvp.state.v1',
      JSON.stringify({
        tasks: [],
        history: [],
        activeSession: null,
        preferences: { onboardingComplete: true, soundEnabled: false, reducedMotion: false },
      }),
    );
    render(<App />);
    fireEvent.keyDown(window, { key: '4' });
    expect(screen.getByText('Gear 4')).toBeInTheDocument();
  });
});
