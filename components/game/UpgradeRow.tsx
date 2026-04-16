import type { UpgradeCard } from "@/lib/game/types";

export function UpgradeRow({ cards }: { cards: UpgradeCard[] }) {
  return (
    <section className="upgrade-market">
      <div className="zone-heading">
        <h3>Upgrade Market Row</h3>
        <p>Three face-up production cards. Buy at most one on your market step.</p>
      </div>
      <div className="upgrade-market-row">
        {cards.map((card) => (
          <article key={card.id} className="game-card upgrade-card board-card">
            <p className="game-card-kicker">Upgrade</p>
            <h3>{card.name}</h3>
            <p>{card.description}</p>
            <div className="cost-row">
              <span>{card.costNotes} Notes</span>
              <span>First matching production only</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
