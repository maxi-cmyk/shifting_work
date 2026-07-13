import { formatDuration, type Gear, type Task } from '../domain';
import { Gearbox } from './Gearbox';
import { Icon } from './Icon';

export function FocusMode({
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
            {nextTask ? `Next: Gear ${nextTask.gear} · ${nextTask.title}` : 'Route complete'}
          </small>
          {nextTask ? 'Move to next gear' : 'Complete final task'}
        </span>
        <Icon name={nextTask ? 'next' : 'check'} />
      </button>
    </main>
  );
}
