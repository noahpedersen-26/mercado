import type { GameState } from "@/lib/game/types";

export function GameLog({ state }: { state: GameState }) {
  const recentEntries = state.turnLog.slice(-4).reverse();

  return (
    <section className="board log-board compact-log-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Recent Actions</p>
          <h2>Play Feed</h2>
          <p className="board-subtitle">Compressed to the latest events so the main board stays on one screen.</p>
        </div>
      </div>

      <div className="compact-log-list">
        {recentEntries.map((entry) => (
          <article key={entry.id} className="compact-log-entry">
            <div className="play-log-meta">
              <span>R{entry.roundNumber}</span>
              <span>{entry.phase}</span>
              <span>{entry.actor}</span>
            </div>
            <p>{entry.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
