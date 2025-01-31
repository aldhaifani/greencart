"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { getStorage, setStorage } from "./util";

import "./globals.css";
import "./options.css";

export function Options() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing API key on component mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        setLoading(true);
        const savedKey = await getStorage<string>("geminiApiKey");
        if (savedKey) {
          setApiKey(savedKey);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load API key");
      } finally {
        setLoading(false);
      }
    };
    loadApiKey();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate the API key by making a test request
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=" +
          apiKey.trim()
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Invalid API key");
      }

      await setStorage("geminiApiKey", apiKey.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Reset success message after 3 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-green-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold text-green-800 mb-6">
          GreenCart Settings
        </h1>

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
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              API key saved successfully!
            </div>
          )}
          <Input
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError(null); // Clear error when user starts typing
            }}
            className="mb-4"
            disabled={loading}
          />
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
