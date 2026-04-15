import type { Deposit } from "@/lib/game/types";

export function DepositToken({ deposit, compact = false }: { deposit: Deposit; compact?: boolean }) {
  return (
    <div className={`finance-token finance-token-deposit ${compact ? "finance-token-compact" : ""}`}>
      <p className="finance-token-title">Deposit</p>
      <p>{deposit.playerId}</p>
      <p>{deposit.amount} Notes</p>
      <p>{deposit.interestRate}% return</p>
    </div>
  );
}
