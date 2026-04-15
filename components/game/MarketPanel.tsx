import { RESOURCE_IDS } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/types";

export function MarketPanel({
  state,
  priceAverages
}: {
  state: GameState;
  priceAverages: {
    notes: Partial<Record<string, number>>;
    coins: Partial<Record<string, number>>;
  };
}) {
  return (
    <section className="panel">
      <h2>Market</h2>
      <div className="table-list">
        {RESOURCE_IDS.map((resourceId) => {
          const resource = state.resources[resourceId];
          return (
            <div key={resourceId} className="table-card">
              <p className="value-strong">{state.config.resourceDefinitions[resourceId].name}</p>
              <p>Anchor: {resource.anchorPriceNotes} Notes / {resource.anchorPriceCoins} Coins</p>
              <p>Avg Trade: {priceAverages.notes[resourceId] ?? "-"} Notes / {priceAverages.coins[resourceId] ?? "-"} Coins</p>
              <p>Supply: {resource.availableSupply}</p>
              <p>Produced: {resource.lastRoundProduced} | Demanded: {resource.lastRoundDemand}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
