
import type { APIRoute } from "astro";
import { verifyMessage } from "ethers";

/**
 * POST /api/verify-wallets
 * Body: { walletAddress: string, message: string, signature: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, message, signature } = body || {};

    if (!walletAddress || !message || !signature) {
      return new Response(
        JSON.stringify({
          error: "walletAddress, message and signature are required.",
        }),
        { status: 400 }
      );
    }

    let recovered: string;
    try {
      recovered = verifyMessage(message, signature);
    } catch (err) {
      console.error("Signature verification error:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature." }),
        { status: 400 }
      );
    }

    if (recovered.toLowerCase() !== String(walletAddress).toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Signature does not match wallet address." }),
        { status: 400 }
      );
    }

    console.log(`✅ Wallet verified: ${walletAddress}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
};
