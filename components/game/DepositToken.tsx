import type { DepositToken as DepositTokenType } from "@/lib/game/types";

export function DepositToken({ deposit, compact = false }: { deposit: DepositTokenType; compact?: boolean }) {
  return (
    <div className={`finance-token finance-token-deposit ${compact ? "finance-token-compact" : ""}`}>
      <p className="finance-token-title">Deposit Token</p>
      <p>{deposit.id}</p>
      <p>Return {deposit.returnAmount} Notes</p>
      <p>Matures R{deposit.maturesRound}</p>
    </div>
  );
}
