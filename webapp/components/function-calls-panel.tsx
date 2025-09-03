import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Item } from "@/components/types";

type FunctionCallsPanelProps = {
  items: Item[];
  ws?: WebSocket | null; // pass down ws from parent
};

const FunctionCallsPanel: React.FC<FunctionCallsPanelProps> = ({
  items,
  ws,
}) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<any[]>([]);

  React.useEffect(() => {
    function load() {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem("vehicle_experience_ratings");
        if (raw) setRatings(JSON.parse(raw));
      } catch (_) {
        // ignore
      }
    }
    load();
    const handler = () => load();
    window.addEventListener("vehicle-experience-updated", handler as any);
    return () => window.removeEventListener("vehicle-experience-updated", handler as any);
  }, []);

  // Filter function_call items
  const functionCalls = items.filter((it) => it.type === "function_call");

  // For each function_call, check for a corresponding function_call_output
  const functionCallsWithStatus = functionCalls.map((call) => {
    const outputs = items.filter(
      (it) => it.type === "function_call_output" && it.call_id === call.call_id
    );
    const outputItem = outputs[0];
    const completed = call.status === "completed" || !!outputItem;
    const response = outputItem ? outputItem.output : undefined;
    return {
      ...call,
      completed,
      response,
    };
  });

  const handleChange = (call_id: string, value: string) => {
    setResponses((prev) => ({ ...prev, [call_id]: value }));
  };

  const handleSubmit = (call: Item) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const call_id = call.call_id || "";
    ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify(responses[call_id] || ""),
        },
      })
    );
    // Ask the model to continue after providing the tool response
    ws.send(JSON.stringify({ type: "response.create" }));
  };

  return (
    <Card className="flex flex-col h-full relative">
      <CardHeader className="space-y-1.5 pb-0">
        <CardTitle className="text-base font-semibold">
          Function Calls
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="absolute top-2 right-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Ratings</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vehicle Experience Ratings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {ratings.length === 0 && (
                  <div className="text-sm text-muted-foreground">No ratings captured yet.</div>
                )}
                {ratings.map((r, idx) => (
                  <div key={idx} className="rounded-md border p-3 text-sm space-y-1">
                    <div className="font-medium">{r.vehicle}</div>
                    <div className="flex text-xs gap-2">
                      <span className="font-semibold">Rating:</span>
                      <span>{r.rating}</span>
                      <span className="font-semibold">Time:</span>
                      <span>{new Date(r.serverTimestamp || Date.now()).toLocaleString()}</span>
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap break-words">{r.feedback}</div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {functionCallsWithStatus.map((call) => (
              <div
                key={call.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{call.name}</h3>
                  <Badge variant={call.completed ? "default" : "secondary"}>
                    {call.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground font-mono break-all">
                  {JSON.stringify(call.params)}
                </div>

                {!call.completed ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter response"
                      value={responses[call.call_id || ""] || ""}
                      onChange={(e) =>
                        handleChange(call.call_id || "", e.target.value)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmit(call)}
                      disabled={!responses[call.call_id || ""]}
                      className="w-full"
                    >
                      Submit Response
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm rounded-md bg-muted p-3">
                    {JSON.stringify(JSON.parse(call.response || ""))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FunctionCallsPanel;
