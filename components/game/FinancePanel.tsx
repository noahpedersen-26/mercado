import type { Deposit, Loan } from "@/lib/game/types";

export function FinancePanel({
  loans,
  deposits
}: {
  loans: Loan[];
  deposits: Deposit[];
}) {
  return (
    <section className="panel">
      <h2>Loans And Deposits</h2>
      <div className="stack">
        <div>
          <h3>Loans</h3>
          <div className="table-list">
            {loans.map((loan) => (
              <div key={loan.id} className="table-card">
                <p className="value-strong">{loan.playerId}</p>
                <p>
                  Balance {loan.remainingBalance} / Principal {loan.principal}
                </p>
                <p>
                  Rate {loan.interestRate}% | Min Payment {loan.minimumPayment}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider">
          <h3>Deposits</h3>
          <div className="table-list">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="table-card">
                <p className="value-strong">{deposit.playerId}</p>
                <p>Amount {deposit.amount}</p>
                <p>
                  Rate {deposit.interestRate}% | Maturity {deposit.maturityRound ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
