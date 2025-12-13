import { NextResponse } from "next/server";

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Acceptable values: stallholder, organiser, visitor — fallback: unknown
    const validSources = ["stallholder", "organiser", "visitor"];
    const sourceValue = validSources.includes(source)
      ? source
      : "unknown";

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      return NextResponse.json(
        { error: "Subscription backend is not configured." },
        { status: 500 }
      );
    }

    const mcResponse = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: {
            SOURCE: sourceValue,
          },
        }),
      }
    );

    const mcJson = await mcResponse.json().catch(() => null);

    if (mcResponse.ok) {
      return NextResponse.json({ ok: true });
    }

    // Already subscribed → still OK
    if (
      mcResponse.status === 400 &&
      mcJson?.detail?.includes("is already a list member")
    ) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Failed to subscribe with Mailchimp." },
      { status: 500 }
    );
  } catch (err) {
    console.error("Subscribe route error:", err);
    return NextResponse.json(
      { error: "Unexpected error. Please try again later." },
      { status: 500 }
    );
  }
}