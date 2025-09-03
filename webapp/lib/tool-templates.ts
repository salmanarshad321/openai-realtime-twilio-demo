export const toolTemplates = [
  {
    name: "get_weather",
    type: "function",
    description: "Get the current weather",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string" },
      },
    },
  },
  {
    name: "ping_no_args",
    type: "function",
    description: "A simple ping tool with no arguments",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_nested_args",
    type: "function",
    description: "Fetch user profile by nested identifier",
    parameters: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            metadata: {
              type: "object",
              properties: {
                region: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  {
    name: "calculate_route_more_properties",
    type: "function",
    description: "Calculate travel route with multiple parameters",
    parameters: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        mode: { type: "string", enum: ["car", "bike", "walk"] },
        options: {
          type: "object",
          properties: {
            avoid_highways: { type: "boolean" },
            scenic_route: { type: "boolean" },
          },
        },
      },
    },
  },
  {
    name: "disconnect_call",
    type: "function",
    description: "Disconnect the active phone call and realtime session",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string" },
      },
    },
  },
  {
    name: "record_vehicle_experience",
    type: "function",
    description: "Record a vehicle purchase experience with rating and feedback",
    parameters: {
      type: "object",
      properties: {
        vehicle: { type: "string" },
        rating: { type: "number" },
        feedback: { type: "string" },
      },
      required: ["vehicle", "rating", "feedback"],
    },
  },
];
