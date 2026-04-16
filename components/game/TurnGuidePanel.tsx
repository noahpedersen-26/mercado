import { selectCurrentBankBuyer, selectLifeCostIndex, selectLoanInterestDue } from "@/lib/game/selectors";
import type { GameState, PlayerId } from "@/lib/game/types";

function getPhasePrompt(state: GameState, localPlayerId: PlayerId) {
  const activePlayer = state.round.activePlayerId ? state.players[state.round.activePlayerId] : null;
  const localPlayer = state.players[localPlayerId];

  switch (state.round.phase) {
    case "policyVote":
      return {
        title: "Vote On Policy",
        detail: "Choose 0%, 10%, or 20%. The Policy Chair breaks ties.",
        actions: ["Cast votes", "Resolve the vote", "Begin player turns"]
      };
    case "playerTurns":
      if (!activePlayer) {
        return {
          title: "Prepare Player Turns",
          detail: "Resolve the policy vote to begin clockwise play.",
          actions: []
        };
      }

      if (state.round.activePlayerId === localPlayerId) {
        return state.round.activePlayerStage === "production"
          ? {
              title: "Your Production Step",
              detail: `${localPlayer.name} takes 2 production actions, plus 1 flex action only if last upkeep was fully satisfied.`,
              actions: ["Produce once", "Produce again", "Use flex if available", "Advance to market"]
            }
          : {
              title: "Your Market Step",
              detail: "Trade, take 1 loan, create 1 deposit, repay loans, buy at most 1 upgrade, then end turn.",
              actions: ["Trade", "Finance", "Buy one upgrade", "End turn"]
            };
      }

      return {
        title: `${activePlayer.name}'s Turn`,
        detail: "You only need a compact read on opponents while the table resolves their turn.",
        actions:
          state.round.activePlayerStage === "production"
            ? ["Resolve their production", "Advance to market"]
            : ["Resolve their trade/finance/upgrade actions", "End their turn"]
      };
    case "centralBank": {
      const currentBuyerId = selectCurrentBankBuyer(state);
      return {
        title: "Central Bank Turn",
        detail: currentBuyerId
          ? `Reveal demand, then buy from ${state.players[currentBuyerId].name} at discovered Notes price or anchor.`
          : "Reveal the demand card and buy starting left of the chair.",
        actions: ["Reveal demand", "Sell goods to bank in order", "Advance bank buyer"]
      };
    }
    case "settlement":
      return {
        title: "Settlement",
        detail: `Pay 2 Life Units each. Interest is ${selectLoanInterestDue(state.round.votedRate)} Notes per loan.`,
        actions: ["Pay life", "Pay loan interest", "Resolve arrears if needed"]
      };
    case "repricing":
      return {
        title: "Repricing / End Round",
        detail: `Life Cost Index is ${selectLifeCostIndex(state)}. Update anchors manually if needed, then rotate chair.`,
        actions: ["Review Notes created", "Adjust anchors", "End round"]
      };
    default:
      return {
        title: "Current Step",
        detail: "Follow the active phase.",
        actions: []
      };
  }
}

export function TurnGuidePanel({
  state,
  localPlayerId
}: {
  state: GameState;
  localPlayerId: PlayerId;
}) {
  const prompt = getPhasePrompt(state, localPlayerId);

  return (
    <section className="board guide-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Turn Guide</p>
          <h2>{prompt.title}</h2>
          <p className="board-subtitle">{prompt.detail}</p>
        </div>
      </div>

      <div className="guide-actions-list">
        {prompt.actions.map((action) => (
          <div key={action} className="guide-action">
            <span className="guide-action-dot" />
            <span>{action}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
