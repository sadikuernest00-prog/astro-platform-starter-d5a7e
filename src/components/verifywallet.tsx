
import React, { useState } from "react";
import { BrowserProvider } from "ethers";

type Status = "idle" | "connecting" | "signing" | "verifying" | "success" | "error";

const VerifyWallet: React.FC = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);

  async function handleVerify() {
    setError(null);
    setStatus("connecting");

    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        throw new Error("No wallet detected. Install MetaMask or use a Web3 wallet.");
      }

      const provider = new BrowserProvider(eth);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet.");
      }

      const address = accounts[0] as string;
      setWalletAddress(address);

      const signer = await provider.getSigner();
      const nonce = crypto.randomUUID();
      const message = `Amicbridge Wallet Verification\n\nI confirm that I own this wallet.\n\nNonce: ${nonce}`;

      setStatus("signing");
      const signature = await signer.signMessage(message);

      setStatus("verifying");
      const res = await fetch("/api/verify-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, message, signature }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Verification failed on server.");
      }

      setStatus("success");
      setVerified(true);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setError(err.message || "Something went wrong.");
    }
  }

  const isBusy =
    status === "connecting" || status === "signing" || status === "verifying";

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "1.5rem",
        borderRadius: "1rem",
        border: "1px solid rgba(148,163,184,0.4)",
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Verify your wallet</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
        We&apos;ll ask your wallet to sign a harmless message to prove you own it.
        This does not cost gas and never reveals your private key or seed phrase.
      </p>

      {walletAddress && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            marginBottom: "0.8rem",
          }}
        >
          Connected wallet:{" "}
          <span style={{ color: "#e5e7eb" }}>{walletAddress}</span>
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={isBusy}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          padding: "0.55rem 1.4rem",
          borderRadius: "999px",
          border: "none",
          cursor: isBusy ? "default" : "pointer",
          background: verified ? "#16a34a" : "#22c55e",
          color: "#022c22",
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        {isBusy && "Working..."}
        {!isBusy && !verified && "Verify my wallet"}
        {!isBusy && verified && "Wallet verified ✔"}
      </button>

      {status === "success" && (
        <p
          style={{
            marginTop: "0.8rem",
            fontSize: "0.85rem",
            color: "#4ade80",
          }}
        >
          Your wallet has been verified and can now show the{" "}
          <strong>Verified Wallet</strong> badge on your profile.
        </p>
      )}

      {status === "error" && error && (
        <p
          style={{
            marginTop: "0.8rem",
            fontSize: "0.85rem",
            color: "#f97373",
          }}
        >
          Error: {error}
        </p>
      )}
    </div>
  );
};

export default VerifyWallet;
