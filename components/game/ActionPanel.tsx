export function ActionPanel({
  title,
  subtitle,
  tone,
  children
}: {
  title: string;
  subtitle: string;
  tone: "bank" | "player";
  children: React.ReactNode;
}) {
  return (
    <section className={`action-panel action-panel-${tone}`}>
      <div className="zone-heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
