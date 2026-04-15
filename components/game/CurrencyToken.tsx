export function CurrencyToken({
  label,
  value,
  tone
}: {
  label: string;
  value: string | number;
  tone: "ivory" | "brass" | "red";
}) {
  return (
    <div className={`currency-token currency-token-${tone}`}>
      <span className="currency-token-label">{label}</span>
      <strong className="currency-token-value">{value}</strong>
    </div>
  );
}
