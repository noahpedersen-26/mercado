import { RESOURCE_IDS } from "@/lib/game/constants";
import type { GameState, ResourceId } from "@/lib/game/types";

export function PriceTrack({
  state,
  priceAverages
}: {
  state: GameState;
  priceAverages: {
    notes: Partial<Record<ResourceId, number>>;
    coins: Partial<Record<ResourceId, number>>;
  };
}) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Price Track</h3>
        <p>Anchor prices and newly discovered table prices in both currencies.</p>
      </div>
      <div className="price-tile-row">
        {RESOURCE_IDS.map((resourceId) => {
          const resource = state.resources[resourceId];
          const definition = state.config.resourceDefinitions[resourceId];

          return (
            <article key={resourceId} className="price-tile">
              <p className="price-tile-title">{definition.name}</p>
              <p>Anchor {resource.anchorPriceNotes}N / {resource.anchorPriceCoins}B</p>
              <p>Seen {priceAverages.notes[resourceId] ?? "-"}N / {priceAverages.coins[resourceId] ?? "-"}B</p>
              <p>Supply {resource.availableSupply}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
