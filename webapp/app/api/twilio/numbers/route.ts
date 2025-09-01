import getTwilioClient from "@/lib/twilio";

export async function GET() {
  const client = getTwilioClient();
  if (!client) {
    return Response.json(
      { error: "Twilio client not initialized" },
      { status: 500 }
    );
  }

  const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
    limit: 20,
  });
  return Response.json(incomingPhoneNumbers);
}

export async function POST(req: Request) {
  const client = getTwilioClient();
  if (!client) {
    return Response.json(
      { error: "Twilio client not initialized" },
      { status: 500 }
    );
  }

  const { phoneNumberSid, voiceUrl } = await req.json();
  const incomingPhoneNumber = await client
    .incomingPhoneNumbers(phoneNumberSid)
    .update({ voiceUrl });

  return Response.json(incomingPhoneNumber);
}
