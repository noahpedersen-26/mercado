import type { BankDemandCard as BankDemandCardType } from "@/lib/game/types";

export function BankDemandCard({ card }: { card: BankDemandCardType | null }) {
  return (
    <article className={`game-card demand-card ${card ? "" : "muted-card"}`}>
      <p className="game-card-kicker">Bank Demand Card</p>
      <h3>{card?.title ?? "Demand Not Revealed"}</h3>
      <p>{card?.description ?? "Reveal one demand card during the Central Bank Turn."}</p>
      <div className="demand-grid">
        {card
          ? Object.entries(card.demand).map(([resourceId, amount]) => (
              <div key={resourceId} className="demand-chip">
                <span>{resourceId}</span>
                <strong>{amount}</strong>
              </div>
            ))
          : null}
      </div>
    </article>
  );
}
