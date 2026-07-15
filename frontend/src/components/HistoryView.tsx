import { formatDuration, type SessionRecord } from '../domain';

export function HistoryView({
  history,
  onClear,
}: {
  history: SessionRecord[];
  onClear: () => void;
}) {
  return (
    <section className="page-panel panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Local logbook</span>
          <h2>Recent sessions</h2>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="empty-state empty-state--large">
          <span className="empty-state__line" />
          <h3>No miles recorded.</h3>
          <p>Completed and abandoned sessions will appear here, stored only on this computer.</p>
        </div>
      ) : (
        <>
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
                  Gear {record.plannedGear} · {formatDuration(record.targetSeconds)}
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
          <div className="history-actions panel">
            <button className="text-button text-button--danger" onClick={onClear}>
              Clear history
            </button>
          </div>
        </>
      )}
    </section>
  );
}
