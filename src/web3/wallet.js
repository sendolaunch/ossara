// Phantom wallet connect + $OSSA holding check. All client-side, read-only.
// No @solana/web3.js dependency — we talk to the RPC with plain fetch to keep
// the bundle light.

export function getPhantom() {
  if (typeof window === "undefined") return null;
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

// Returns { ok, address?, reason?, provider? }
export async function connectPhantom() {
  const p = getPhantom();
  if (!p) return { ok: false, reason: "not-installed" };
  try {
    const res = await p.connect();
    const address = (res?.publicKey ?? p.publicKey)?.toString();
    if (!address) return { ok: false, reason: "no-address" };
    return { ok: true, address, provider: p };
  } catch (e) {
    return { ok: false, reason: "rejected", error: e?.message };
  }
}

export async function disconnectPhantom() {
  const p = getPhantom();
  try {
    await p?.disconnect?.();
  } catch (_) {}
}

// Sum the wallet's balance of the configured mint. Returns
// { gated, balance, reason? }. If no mint is configured (token not live yet),
// gated is false so dev access still works.
export async function checkHolding(address, cfg) {
  if (!cfg.mint) return { gated: false, balance: 0, reason: "token-not-live" };
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [address, { mint: cfg.mint }, { encoding: "jsonParsed" }],
    };
    const r = await fetch(cfg.rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    let balance = 0;
    for (const acc of j?.result?.value ?? []) {
      balance += acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    }
    return { gated: balance < cfg.minHold, balance };
  } catch (e) {
    // network/RPC trouble shouldn't hard-lock the player out during dev
    return { gated: false, balance: 0, reason: "rpc-error", error: e?.message };
  }
}
