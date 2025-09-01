import "server-only";
// Lazily import twilio only when actually needed (avoids build-time issues in environments
// where the module might pull in optional deps).
let _client: any | null | undefined;

const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken } = process.env;

export function getTwilioClient() {
  if (_client !== undefined) return _client; // cached (could be null)
  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not set. Twilio client will be disabled.");
    _client = null;
    return _client;
  }
  // Dynamic require to delay evaluation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const twilio = require("twilio");
  _client = twilio(accountSid, authToken);
  return _client;
}

export default getTwilioClient;
