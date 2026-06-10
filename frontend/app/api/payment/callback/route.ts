import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.lsjcollections.com/api";

export async function POST(req: NextRequest) {
  try {
    const xVerify = req.headers.get("x-verify") || "";
    const rawBody = await req.text();

    const upstream = await fetch(`${API_URL}/payment/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-VERIFY": xVerify,
      },
      body: rawBody,
    });

    const data = await upstream.json().catch(() => ({ status: "unknown" }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("Payment callback error:", err);
    return NextResponse.json(
      { status: "failed", message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");
  if (orderId) {
    return NextResponse.redirect(new URL(`/order-success/${orderId}`, req.url));
  }
  return NextResponse.redirect(new URL("/account", req.url));
}
