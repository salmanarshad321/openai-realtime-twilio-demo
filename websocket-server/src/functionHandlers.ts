import { FunctionHandler } from "./types";
import { forceDisconnect } from "./sessionManager";

const functions: FunctionHandler[] = [];

functions.push({
  schema: {
    name: "get_weather_from_coords",
    type: "function",
    description: "Get the current weather",
    parameters: {
      type: "object",
      properties: {
        latitude: {
          type: "number",
        },
        longitude: {
          type: "number",
        },
      },
      required: ["latitude", "longitude"],
    },
  },
  handler: async (args: { latitude: number; longitude: number }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
    );
    const data = await response.json();
    const currentTemp = data.current?.temperature_2m;
    return JSON.stringify({ temp: currentTemp });
  },
});

// Tool: disconnect_call
// Allows the model or frontend to request termination of the active call + model session.
functions.push({
  schema: {
    name: "disconnect_call",
    type: "function",
    description:
      "Immediately disconnect the active phone call and associated realtime model + log websocket sessions.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Optional human readable reason" },
      },
  required: [],
    },
  },
  handler: async (args: { reason?: string }) => {
    forceDisconnect();
    return JSON.stringify({ status: "disconnected", reason: args?.reason });
  },
});

// Tool: record_vehicle_experience
// Captures a user's rating and feedback about a purchased vehicle. Returned data will be
// echoed so the frontend can persist it to localStorage based on the function_call + output pair.
functions.push({
  schema: {
    name: "record_vehicle_experience",
    type: "function",
    description:
      "Record a customer's rating (1-5) and free-form feedback about a vehicle they purchased.",
    parameters: {
      type: "object",
      properties: {
        vehicle: { type: "string", description: "Vehicle model or identifier" },
        rating: { type: "number", description: "Integer rating 1-5" },
        feedback: { type: "string", description: "Customer feedback text" },
      },
      required: ["vehicle", "rating", "feedback"],
    },
  },
  handler: async (args: { vehicle: string; rating: number; feedback: string }) => {
    // Basic validation: clamp rating
    const rating = Math.min(5, Math.max(1, Math.round(args.rating)));
    return JSON.stringify({
      status: "received",
      vehicle: args.vehicle,
      rating,
      feedback: args.feedback,
      serverTimestamp: new Date().toISOString(),
    });
  },
});

export default functions;
