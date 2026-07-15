import type { AppState } from '../domain';

export function SettingsView({
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
    </section>
  );
}
