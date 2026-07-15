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
  const overrun = elapsed > targetSeconds;

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
      <div className="focus-mode__timer-group">
        <strong
          className={`focus-mode__timer ${overrun ? 'is-overrun' : ''}`}
          aria-label={`${formatDuration(elapsed)} elapsed`}
        >
          {formatDuration(elapsed)}
        </strong>
        <span className={`focus-mode__target ${overrun ? 'is-overrun' : ''}`}>
          / {formatDuration(targetSeconds)}
        </span>
      </div>
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
      <span className="focus-mode__hint">
        <kbd>1</kbd>–<kbd>6</kbd> shift &nbsp; <kbd>Space</kbd> pause &nbsp; <kbd>Enter</kbd>{' '}
        complete &nbsp; <kbd>N</kbd> neutral
      </span>
    </main>
  );
}
