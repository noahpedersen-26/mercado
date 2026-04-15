import type { TurnLogEntry } from "@/lib/game/types";

export function TurnLogPanel({ entries }: { entries: TurnLogEntry[] }) {
  return (
    <section className="panel panel-wide">
      <h2>Turn Log</h2>
      <div className="log-list">
        {entries
          .slice()
          .reverse()
          .map((entry) => (
            <div key={entry.id} className="log-item">
              <p className="value-strong">
                Round {entry.roundNumber} | {entry.phase} | {entry.actor}
              </p>
              <p>{entry.message}</p>
            </div>
          ))}
      </div>
    </section>
  );
}
