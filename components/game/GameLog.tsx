import type { GameState } from "@/lib/game/types";

export function GameLog({ state }: { state: GameState }) {
  const recentEntries = state.turnLog.slice(-5).reverse();

  return (
    <section className="board log-board ticker-board">
      <div className="board-strip-header">
        <div>
          <p className="eyebrow">Recent Actions</p>
          <h2>Play Feed</h2>
        </div>
        <p className="board-subtitle">A small action rail instead of a debug panel.</p>
      </div>

      <div className="ticker-row">
        {recentEntries.map((entry) => (
          <article key={entry.id} className="ticker-card">
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
