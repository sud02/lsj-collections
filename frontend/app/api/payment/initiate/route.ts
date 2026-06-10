import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.lsjcollections.com/api";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const body = await req.json();

    if (!body.order_id || !body.amount) {
      return NextResponse.json(
        { message: "Missing order_id or amount" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${API_URL}/payment/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({
        order_id: body.order_id,
        amount: body.amount,
        mobile: body.mobile,
        env: process.env.NEXT_PUBLIC_PHONEPE_ENV || "UAT",
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || "Payment initiation failed" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Payment initiate error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
