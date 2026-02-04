import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-nowpayments-sig") || "";

  // Forward to Django backend
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/webhooks/nowpayments/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Nowpayments-Sig": signature,
        },
        body,
      }
    );

    return NextResponse.json(
      { received: true },
      { status: response.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook forwarding failed" },
      { status: 500 }
    );
  }
}
