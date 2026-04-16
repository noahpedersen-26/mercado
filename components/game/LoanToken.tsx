import type { LoanToken as LoanTokenType } from "@/lib/game/types";

export function LoanToken({ loan, compact = false }: { loan: LoanTokenType; compact?: boolean }) {
  return (
    <div className={`finance-token finance-token-loan ${compact ? "finance-token-compact" : ""}`}>
      <p className="finance-token-title">Loan Token</p>
      <p>{loan.id}</p>
      <p>Principal 10 Notes</p>
      <p>Issued R{loan.issuedRound}</p>
    </div>
  );
}
