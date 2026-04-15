import type { ResourceDefinition, ResourceId } from "@/lib/game/types";

const RESOURCE_MARKS: Record<ResourceId, string> = {
  grain: "GR",
  wood: "LU",
  iron: "IR",
  energy: "FU"
};

export function ResourceTokenGroup({
  title,
  resources,
  definitions,
  tone
}: {
  title: string;
  resources: Record<ResourceId, number>;
  definitions: Record<ResourceId, ResourceDefinition>;
  tone: "player" | "supply" | "capacity";
}) {
  return (
    <div className="resource-group">
      <p className="resource-group-title">{title}</p>
      <div className="resource-token-grid">
        {(Object.entries(resources) as Array<[ResourceId, number]>).map(([resourceId, amount]) => (
          <div key={resourceId} className={`resource-token resource-token-${tone}`}>
            <div className="resource-token-mark">{RESOURCE_MARKS[resourceId]}</div>
            <div>
              <p className="resource-token-name">{definitions[resourceId].name}</p>
              <p className="resource-token-value">{amount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
