// MetaMask wallet connection. Never request or store seed phrases/private keys.
const connectButtons = [document.getElementById("walletPanelConnect")].filter(Boolean);
const walletSignInButtons = [document.getElementById("walletConnect"), document.getElementById("walletSignIn")].filter(Boolean);
const authStatus = document.getElementById("authStatus");
const buttonText = document.getElementById("walletButtonText");
const status = document.getElementById("walletStatus");
const panelTitle = document.querySelector(".wallet-panel-copy strong");
const profileWallet = document.getElementById("profileWallet");
const profileWalletAddress = document.getElementById("profileWalletAddress");
const copyButton = document.getElementById("copyProfileWallet");
const shortAddress = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;
let connectedAddress = null;
let currentOwnerKey = null;
let signedInUser = null;
let guestMode = sessionStorage.getItem("pengu-guest") === "true";
const storageKey = () => currentOwnerKey ? `pengu-wallet:${currentOwnerKey}` : null;
function setOwner(user, guest = false) {
  signedInUser = user || null;
  currentOwnerKey = user?.uid ? `uid:${user.uid}` : (guest ? "guest:local" : null);
  guestMode = Boolean(guest);
  const key = storageKey();
  const saved = key ? localStorage.getItem(key) : null;
  // A previously linked wallet is shown only in the currently signed-in owner's profile.
  renderWallet(saved || null, false);
}
function renderWallet(address, persist = true) {
  connectedAddress = address || null;
  const key = storageKey();
  if (persist && key) {
    if (connectedAddress) localStorage.setItem(key, connectedAddress);
    else localStorage.removeItem(key);
  }
  if (buttonText) buttonText.textContent = address ? shortAddress(address) : "Sign in with MetaMask";
  // Keep the full address out of the shared wallet banner; show only a generic status there.
  if (status) status.textContent = address ? "Wallet linked to your profile on this browser." : "Connect MetaMask to link a wallet to your profile.";
  if (panelTitle) panelTitle.textContent = address ? "Wallet linked" : "Connect your wallet";
  connectButtons.forEach((button) => {
    if (button.id === "walletPanelConnect") button.textContent = address ? "Disconnect wallet" : "Connect MetaMask";
    else button.title = address ? "Disconnect wallet from this profile" : "Connect MetaMask wallet";
  });
  if (profileWallet) profileWallet.hidden = !address || !currentOwnerKey;
  if (profileWalletAddress) profileWalletAddress.textContent = address || "";
  window.dispatchEvent(new CustomEvent("pengu-wallet-changed", { detail: { connected: Boolean(address), linkedToProfile: Boolean(address && currentOwnerKey), address: address || null } }));
}
async function connectWallet() {
  if (!window.ethereum) {
    if (status) status.textContent = "MetaMask not found. Install the official MetaMask browser extension, then refresh this page.";
    window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
    return;
  }
  if (!currentOwnerKey) {
    if (status) status.textContent = "Please sign in with Google or continue as guest before linking a wallet to your profile.";
    document.getElementById("authScreen")?.removeAttribute("hidden");
    return;
  }
  connectButtons.forEach((button) => { button.disabled = true; });
  try {
    if (connectedAddress) { renderWallet(null); return; }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts[0]) throw new Error("No wallet account was selected.");
    renderWallet(accounts[0]);
  } catch (error) {
    console.error("MetaMask connection error:", error);
    if (status) status.textContent = error.code === 4001 ? "Connection request rejected in MetaMask." : `Could not connect wallet: ${error.message || "Unknown error"}`;
  } finally { connectButtons.forEach((button) => { button.disabled = false; }); }
}
connectButtons.forEach((button) => button.addEventListener("click", connectWallet));
copyButton?.addEventListener("click", async () => {
  if (!connectedAddress) return;
  try { await navigator.clipboard.writeText(connectedAddress); copyButton.textContent = "Copied!"; setTimeout(() => { copyButton.textContent = "Copy"; }, 1400); }
  catch { if (status) status.textContent = "Copy unavailable; select the address in your profile to copy it manually."; }
});
window.addEventListener("pengu-auth-changed", (event) => {
  const detail = event.detail || {};
  setOwner(detail.user || null, Boolean(detail.guest));
});
// Restore only the current account's locally saved wallet after Firebase has initialized.
if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", (accounts) => {
    if (!currentOwnerKey) return;
    const account = accounts && accounts[0] ? accounts[0] : null;
    renderWallet(account);
  });
  window.ethereum.on?.("chainChanged", () => { if (status && connectedAddress) status.textContent = "Wallet linked to your profile. Network changed in MetaMask."; });
}


// Wallet sign-in demo: asks the wallet to sign a one-time message to prove control.
// A production app must verify this signature on a server and issue a secure session.
async function signInWithWallet() {
  if (!window.ethereum) {
    if (authStatus) authStatus.textContent = "MetaMask is not detected. Install the official wallet extension and refresh.";
    window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
    return;
  }
  walletSignInButtons.forEach(button => { button.disabled = true; });
  if (authStatus) authStatus.textContent = "Connect MetaMask and approve the sign-in message…";
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts[0]) throw new Error("No wallet account was selected.");
    const address = accounts[0];
    const nonce = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const message = `Sign in to Pengu Playground\n\nWallet: ${address}\nNonce: ${nonce}\nPurpose: prove wallet ownership only; no transaction will be sent.`;
    await window.ethereum.request({ method: "personal_sign", params: [message, address] });
    // Store only a short-lived local UI session. This is not a server-verified authentication token.
    sessionStorage.setItem("pengu-wallet-signed-in", address);
    guestMode = false;
    window.dispatchEvent(new CustomEvent("pengu-wallet-signin", {
      detail: { address, displayName: `Wallet ${address.slice(0, 6)}…${address.slice(-4)}` }
    }));
    if (authStatus) {
      authStatus.textContent = "Wallet sign-in complete for this browser session. No transaction was sent.";
      authStatus.className = "auth-status success";
    }
  } catch (error) {
    console.error("MetaMask sign-in failed:", error);
    if (authStatus) {
      authStatus.textContent = error.code === 4001 ? "You rejected the wallet request or signature." : `Wallet sign-in failed: ${error.message || "Unknown error"}`;
      authStatus.className = "auth-status error";
    }
  } finally {
    walletSignInButtons.forEach(button => { button.disabled = false; });
  }
}
walletSignInButtons.forEach(button => button.addEventListener("click", signInWithWallet));
