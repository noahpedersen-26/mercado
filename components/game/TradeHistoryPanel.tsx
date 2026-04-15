import type { TradeRecord } from "@/lib/game/types";

export function TradeHistoryPanel({ trades }: { trades: TradeRecord[] }) {
  return (
    <section className="panel">
      <h2>Trade History</h2>
      {trades.length === 0 ? (
        <p className="label">No trades recorded this round yet.</p>
      ) : (
        <div className="table-list">
          {trades.map((trade) => (
            <div key={trade.id} className="table-card">
              <p className="value-strong">
                {trade.quantity} {trade.resourceId}
              </p>
              <p>
                Buyer {trade.buyerPlayerId} | Seller {trade.sellerPlayerId}
              </p>
              <p>
                Unit Price {trade.unitPriceNotes} Notes / {trade.unitPriceCoins} Coins
              </p>
              <p>
                Total {trade.totalNotes} Notes / {trade.totalCoins} Coins
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
