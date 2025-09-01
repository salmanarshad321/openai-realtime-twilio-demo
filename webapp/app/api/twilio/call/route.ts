import getTwilioClient from "@/lib/twilio";

// POST /api/twilio/call
// Body: { to: "+1XXXXXXXXXX", url?: "https://your-ngrok-domain.ngrok-free.app/twiml" }
// Creates an outbound call using the configured FROM number and provided TO number.
export async function POST(req: Request) {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    return Response.json(
      { error: "Twilio client not initialized on server (missing creds)" },
      { status: 500 }
    );
  }

  const { to, url } = await req.json().catch(() => ({ to: undefined }));
  const from = process.env.TWILIO_CALL_FROM; // Must be a verified / purchased Twilio number
  const defaultAnswerUrl = process.env.TWILIO_ANSWER_URL; // e.g. https://<your-ngrok>/twiml

  if (!from) {
    return Response.json(
      { error: "Missing TWILIO_CALL_FROM env var on server" },
      { status: 500 }
    );
  }
  if (!to) {
    return Response.json({ error: "Missing 'to' in request body" }, { status: 400 });
  }

  // Basic E.164-ish sanity check (does not guarantee validity)
  if (!/^\+?[1-9]\d{7,15}$/.test(to)) {
    return Response.json(
      { error: "Destination number must be in E.164 format, e.g. +15551234567" },
      { status: 400 }
    );
  }

  const answerUrl = url || defaultAnswerUrl;
  if (!answerUrl) {
    return Response.json(
      { error: "No answer URL provided and TWILIO_ANSWER_URL not set" },
      { status: 400 }
    );
  }

  try {
    const call = await twilioClient.calls.create({
      to,
      from,
      url: answerUrl,
    });
    return Response.json({ sid: call.sid, status: call.status });
  } catch (err: any) {
    console.error("Failed to create outbound call", err);
    return Response.json(
      { error: err?.message || "Failed to create outbound call" },
      { status: 500 }
    );
  }
}
