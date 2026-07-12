import { useEffect, useState, type FormEvent } from 'react';
import { gearDetails, type DriveGear, type Task } from '../domain';

interface TaskDraft {
  title: string;
  gear: DriveGear;
  targetMinutes: number;
}

interface TaskFormProps {
  editingTask?: Task | null;
  suggestedGear: DriveGear;
  onSave: (draft: TaskDraft) => void;
  onCancelEdit: () => void;
}

export function TaskForm({ editingTask, suggestedGear, onSave, onCancelEdit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [gear, setGear] = useState<DriveGear>(1);
  const [targetMinutes, setTargetMinutes] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setGear(editingTask.gear);
      setTargetMinutes(editingTask.targetMinutes);
    } else {
      setTitle('');
      setGear(suggestedGear);
      setTargetMinutes(gearDetails[suggestedGear].targetMinutes);
    }
    setError('');
  }, [editingTask, suggestedGear]);

  const changeGear = (nextGear: DriveGear) => {
    setGear(nextGear);
    if (!editingTask || targetMinutes === gearDetails[gear].targetMinutes) {
      setTargetMinutes(gearDetails[nextGear].targetMinutes);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Give this task a clear name before adding it to the drive.');
      return;
    }
    if (!Number.isFinite(targetMinutes) || targetMinutes < 1 || targetMinutes > 480) {
      setError('Choose a target between 1 minute and 8 hours.');
      return;
    }
    onSave({ title: cleanTitle, gear, targetMinutes });
    if (!editingTask) {
      setTitle('');
    }
    setError('');
  };

  return (
    <form className="task-form" onSubmit={submit} noValidate>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Load the drive</span>
          <h2>{editingTask ? 'Edit task' : 'Add a task'}</h2>
        </div>
        <span className="section-index">01</span>
      </div>

      <label className="field field--wide">
        <span>Task</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs forward motion?"
          aria-describedby={error ? 'task-error' : undefined}
          autoFocus={Boolean(editingTask)}
        />
      </label>

      <fieldset className="gear-choice">
        <legend>
          {editingTask ? 'Planned gear' : `Auto-selected next gear · G${suggestedGear}`}
        </legend>
        <div className="gear-choice__grid">
          {([1, 2, 3, 4, 5, 6] as DriveGear[]).map((value) => (
            <button
              type="button"
              key={value}
              className={gear === value ? 'is-selected' : ''}
              onClick={() => changeGear(value)}
              aria-pressed={gear === value}
            >
              <strong>{value}</strong>
              <span>{gearDetails[value].label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field field--time">
        <span>Target minutes</span>
        <input
          type="number"
          min="1"
          max="480"
          value={targetMinutes}
          onChange={(event) => setTargetMinutes(Number(event.target.value))}
        />
      </label>

      <p className="gear-intent">
        G{gear} · {gearDetails[gear].intent}
      </p>
      {error && (
        <p className="form-error" id="task-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        {editingTask && (
          <button type="button" className="button button--ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button--primary">
          {editingTask ? 'Save changes' : 'Add to queue'}
        </button>
      </div>
    </form>
  );
}
