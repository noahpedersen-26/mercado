import type { Loan } from "@/lib/game/types";

export function LoanToken({ loan, compact = false }: { loan: Loan; compact?: boolean }) {
  return (
    <div className={`finance-token finance-token-loan ${compact ? "finance-token-compact" : ""}`}>
      <p className="finance-token-title">Loan</p>
      <p>{loan.playerId}</p>
      <p>{loan.remainingBalance} Notes</p>
      <p>{loan.interestRate}% rate</p>
    </div>
  );
}
