import type { BankDemandCard as BankDemandCardType } from "@/lib/game/types";

export function BankDemandCard({ card }: { card: BankDemandCardType | null }) {
  if (!card) {
    return (
      <article className="game-card demand-card muted-card">
        <p className="game-card-kicker">Bank Demand</p>
        <h3>No Card Revealed</h3>
        <p>Reveal a demand card from the bank board to set this round's public pressure.</p>
      </article>
    );
  }

  return (
    <article className="game-card demand-card">
      <p className="game-card-kicker">Bank Demand</p>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <div className="demand-grid">
        {Object.entries(card.resourceDemand).map(([resourceId, amount]) => (
          <div key={resourceId} className="demand-chip">
            <span>{resourceId}</span>
            <strong>{amount}</strong>
          </div>
        ))}
      </div>
      <div className="cost-row">
        <span>{card.payoutMultiplier}x payout</span>
        <span>{card.policyBias ?? "neutral"} bias</span>
      </div>
    </article>
  );
}
