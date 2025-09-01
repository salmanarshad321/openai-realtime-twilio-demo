// PhoneNumberChecklist.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, Circle, Eye, EyeOff, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PhoneNumberChecklistProps = {
  selectedPhoneNumber: string;
  allConfigsReady: boolean;
  setAllConfigsReady: (ready: boolean) => void;
};

const PhoneNumberChecklist: React.FC<PhoneNumberChecklistProps> = ({
  selectedPhoneNumber,
  allConfigsReady,
  setAllConfigsReady,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [dialNumber, setDialNumber] = useState("");
  const [calling, setCalling] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const canCall = !!dialNumber && allConfigsReady && !calling;

  const startCall = async () => {
    if (!canCall) return;
    setCalling(true);
    setCallSid(null);
    setCallError(null);
    try {
      const res = await fetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: dialNumber.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCallSid(data.sid || null);
    } catch (e: any) {
      setCallError(e.message || "Failed to start call");
    } finally {
      setCalling(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Number</span>
          <div className="flex items-center">
            <span className="font-medium w-36">
              {isVisible ? selectedPhoneNumber || "None" : "••••••••••"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(!isVisible)}
              className="h-8 w-8"
            >
              {isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {allConfigsReady ? (
              <CheckCircle className="text-green-500 w-4 h-4" />
            ) : (
              <Circle className="text-gray-400 w-4 h-4" />
            )}
            <span className="text-sm text-gray-700">
              {allConfigsReady ? "Setup Ready" : "Setup Not Ready"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllConfigsReady(false)}
          >
            Checklist
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-500">Dial Destination</span>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="+15551234567"
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={startCall}
            disabled={!canCall}
            className="flex items-center gap-1"
          >
            {calling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            {calling ? "Calling..." : "Call"}
          </Button>
        </div>
        <div className="min-h-[18px] text-xs">
          {callSid && (
            <span className="text-green-600">Started call SID: {callSid}</span>
          )}
          {callError && (
            <span className="text-red-600">{callError}</span>
          )}
        </div>
        {!allConfigsReady && (
          <p className="text-[11px] text-gray-500">
            Complete setup before placing a call.
          </p>
        )}
      </div>
    </Card>
  );
};

export default PhoneNumberChecklist;
