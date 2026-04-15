import type { TradeRecord, TurnLogEntry } from "@/lib/game/types";

export function GameLog({
  entries,
  trades
}: {
  entries: TurnLogEntry[];
  trades: TradeRecord[];
}) {
  return (
    <section className="board log-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Play Feed</p>
          <h2>Resolution Log</h2>
        </div>
      </div>

      <div className="log-layout">
        <div className="action-panel action-panel-bank">
          <div className="zone-heading">
            <h3>Action Feed</h3>
            <p>A visible record for manual playtesting and table arbitration.</p>
          </div>
          <div className="play-log">
            {entries
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
            <p>Recorded deals at the table this round.</p>
          </div>
          <div className="play-log">
            {trades.length === 0 ? (
              <article className="play-log-entry">
                <p>No trades recorded yet.</p>
              </article>
            ) : (
              trades.map((trade) => (
                <article key={trade.id} className="play-log-entry">
                  <div className="play-log-meta">
                    <span>{trade.resourceId}</span>
                    <span>{trade.quantity} units</span>
                    <span>{trade.buyerPlayerId} buys</span>
                  </div>
                  <p>
                    {trade.totalNotes} Notes and {trade.totalCoins} Bits exchanged with {trade.sellerPlayerId}.
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
