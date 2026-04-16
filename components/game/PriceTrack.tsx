import type { ResourceDefinition, ResourceId } from "@/lib/game/types";

export function PriceTrack({
  prices,
  definitions
}: {
  prices: Record<ResourceId, { anchor: number; discovered: number | null }>;
  definitions: Record<ResourceId, ResourceDefinition>;
}) {
  return (
    <section className="price-track-strip">
      <div className="zone-heading">
        <h3>Price Track</h3>
        <p>Direct Notes trades discover price. Otherwise, use anchor price.</p>
      </div>
      <div className="price-track-row">
        {(Object.entries(prices) as Array<[ResourceId, { anchor: number; discovered: number | null }]>).map(
          ([resourceId, price]) => (
            <article key={resourceId} className="price-track-tile">
              <p className="price-tile-title">{definitions[resourceId].name}</p>
              <strong>{price.discovered ?? price.anchor}</strong>
              <p>A {price.anchor}</p>
              <p>D {price.discovered ?? "-"}</p>
            </article>
          )
        )}
      </div>
    </section>
  );
}
