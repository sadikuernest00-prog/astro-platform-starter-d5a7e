import type { APIRoute } from "astro";

const mockUsers: Record<string, {
  walletAddress: string;
  verifiedWallet: boolean;
  verifiedId: boolean;
  completedLoans: number;
  lateRepayments: number;
  defaults: number;
}> = {
  "0x1234...abcd": {
    walletAddress: "0x1234...abcd",
    verifiedWallet: true,
    verifiedId: false,
    completedLoans: 3,
    lateRepayments: 0,
    defaults: 0,
  },
};

function calculateTrustScore(user: {
  verifiedWallet: boolean;
  verifiedId: boolean;
  completedLoans: number;
  lateRepayments: number;
  defaults: number;
}) {
  let score = 0;

  if (user.verifiedWallet) score += 20;
  if (user.verifiedId) score += 20;

  if (user.completedLoans > 0) {
    score += 10;
    const extraLoans = Math.max(0, user.completedLoans - 1);
    score += Math.min(extraLoans * 5, 25);
  }

  if (user.lateRepayments === 0 && user.completedLoans >= 3) {
    score += 10;
  }

  score -= user.lateRepayments * 15;
  score -= user.defaults * 30;

  score = Math.max(0, Math.min(100, score));

  let level: "low" | "medium" | "high";
  if (score >= 70) level = "high";
  else if (score >= 40) level = "medium";
  else level = "low";

  return { score, level };
}

export const GET: APIRoute = async ({ url }) => {
  const wallet = url.searchParams.get("wallet");

  if (!wallet) {
    return new Response(
      JSON.stringify({ error: "wallet param is required" }),
      { status: 400 }
    );
  }

  const user = mockUsers[wallet];

  if (!user) {
    return new Response(
      JSON.stringify({
        wallet,
        score: 20,
        level: "low",
        reason: "No history found for this wallet.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const { score, level } = calculateTrustScore(user);

  return new Response(
    JSON.stringify({ wallet, score, level }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
