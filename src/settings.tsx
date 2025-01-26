"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

import "./globals.css";

type SettingsProps = {
  onBack: () => void;
};

export function Settings({ onBack }: SettingsProps) {
  const [apiKey, setApiKey] = useState("");

  const handleSave = () => {
    alert("API key saved successfully!");
  };

  return (
    <div className="w-full h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-green-800">Settings</h1>

        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-green-800 text-lg font-semibold mb-2">
          Gemini API Key
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Enter your Gemini API key to enable advanced features. You can get
          your API key from the{" "}
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            Google AI Studio
          </a>
          .
        </p>
        <Input
          type="password"
          placeholder="Enter your Gemini API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mb-4"
        />
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Save API Key
        </Button>
      </div>
    </div>
  );
}
