// Token-gate config for the login screen.
//
// IMPORTANT: $OSSA does not exist yet. Until it launches on BAGS, leave `mint`
// empty — the gate will report "token not live" and the Dev Enter button lets
// you in. When the coin is live, paste its SPL mint address into `mint`, set
// `allowDevBypass: false`, and the hold-to-play gate goes live.
//
// This is READ-ONLY: we connect the wallet and read a token balance. No funds
// ever move here. (The risky money parts — payouts, trades — come later, §11.)

export const TOKEN_GATE = {
  mint: "", // <-- paste the $OSSA SPL token mint address here once it launches
  rpc: "https://api.mainnet-beta.solana.com", // swap for a Helius/QuickNode URL for reliability
  minHold: 1, // minimum $OSSA balance required to enter
  allowDevBypass: true, // KEEP true during development; set false at launch
};
