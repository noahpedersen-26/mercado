import type { ResourceDefinition, ResourceId } from "@/lib/game/types";

export function PriceTrack({
  prices,
  definitions
}: {
  prices: Record<ResourceId, { anchor: number; discovered: number | null }>;
  definitions: Record<ResourceId, ResourceDefinition>;
}) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Notes Price Discovery</h3>
        <p>Direct good-for-Notes trades discover price. Otherwise, use anchor price.</p>
      </div>
      <div className="price-tile-row">
        {(Object.entries(prices) as Array<[ResourceId, { anchor: number; discovered: number | null }]>).map(
          ([resourceId, price]) => (
            <article key={resourceId} className="price-tile">
              <p className="price-tile-title">{definitions[resourceId].name}</p>
              <p>Anchor: {price.anchor} Notes</p>
              <p>Discovered: {price.discovered ?? "-"}</p>
            </article>
          )
        )}
      </div>
    </section>
  );
}
