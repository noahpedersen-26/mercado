import type { GameState } from "@/lib/game/types";

export function GameLog({ state }: { state: GameState }) {
  return (
    <section className="board log-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Play Log</p>
          <h2>Action Feed</h2>
        </div>
      </div>

      <div className="log-layout">
        <div className="action-panel action-panel-bank">
          <div className="zone-heading">
            <h3>Round Log</h3>
            <p>Manual playtesting record for rulings, trades, Notes creation, and settlement.</p>
          </div>
          <div className="play-log">
            {state.turnLog
              .slice()
              .reverse()
              .map((entry) => (
                <article key={entry.id} className="play-log-entry">
                  <div className="play-log-meta">
                    <span>R{entry.roundNumber}</span>
                    <span>{entry.phase}</span>
                    <span>{entry.actor}</span>
                  </div>
                  <p>{entry.message}</p>
                </article>
              ))}
          </div>
        </div>

        <div className="action-panel action-panel-bank">
          <div className="zone-heading">
            <h3>Trade Ledger</h3>
            <p>Notes and Bits trades recorded this round.</p>
          </div>
          <div className="play-log">
            {state.tradeLog.length === 0 ? (
              <article className="play-log-entry">
                <p>No trades recorded.</p>
              </article>
            ) : (
              state.tradeLog
                .slice()
                .reverse()
                .map((trade) => (
                  <article key={trade.id} className="play-log-entry">
                    <div className="play-log-meta">
                      <span>{trade.resourceId}</span>
                      <span>{trade.quantity} units</span>
                      <span>{trade.discoveredNotesPrice ? `${trade.discoveredNotesPrice} Notes/unit` : "no discovered price"}</span>
                    </div>
                    <p>
                      {trade.initiatorPlayerId} to {trade.otherPlayerId}: {trade.totalNotes} Notes and {trade.totalBits} Bits.
                    </p>
                  </article>
                ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
