"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateApiKey } from "@/services/gemini-service";
import { ExternalLink } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const handleApiKeyValidation = async () => {
    setIsValidating(true);
    setError("");
    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          });
          setCurrentStage(4);
        } catch (storageErr) {
          console.error("Storage error:", storageErr);
          setError("Failed to save API key. Please try again.");
          return;
        }
      } else {
        setError("Invalid API key. Please check and try again.");
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError("Error validating API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome to GreenCart! 🌱</h2>
            <p className="text-gray-600">
              GreenCart helps you make environmentally conscious shopping
              decisions by estimating the CO₂ footprint of Amazon products. We
              analyze product details and provide real-time carbon impact
              estimates.
            </p>
            <Button className="w-full" onClick={() => setCurrentStage(2)}>
              Next
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Understanding CO₂ Impact 🌍</h2>
            <p className="text-gray-600">
              When you browse Amazon products, GreenCart calculates their
              estimated carbon footprint based on factors like materials,
              weight, and manufacturing processes. This helps you understand the
              environmental impact of your purchases and make greener choices.
            </p>
            <Button className="w-full" onClick={() => setCurrentStage(3)}>
              Next
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Setup Your API Key 🔑</h2>
            <p className="text-gray-600">
              GreenCart uses Google's Gemini AI to analyze products. You'll need
              to provide an API key to enable this feature. Don't worry, you can
              always update this later in the extension settings.
            </p>
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline block mb-4"
            >
              Get your API key from Google AI Studio →
            </a>
            <Input
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mb-2"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <Button
              className="w-full"
              onClick={handleApiKeyValidation}
              disabled={!apiKey || isValidating}
            >
              {isValidating ? "Validating..." : "Validate & Continue"}
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">You're All Set! 🎉</h2>
            <p className="text-gray-600">
              Thank you for choosing to shop more sustainably. GreenCart is now
              ready to help you make environmentally conscious shopping
              decisions.
            </p>
            Built with 💚, by{" "}
            <a
              href="https://www.linkedin.com/in/aldhaifani/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline flex items-center"
            >
              Tareq - LinkedIn <ExternalLink className="ml-1 h-4 w-4" />
            </a>
            <p></p>
            <Button className="w-full" onClick={onComplete}>
              Get Started
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-[780px] min-h-[580px] bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-xl w-full mx-4 relative shadow-lg">
        <div className="absolute top-4 right-4 flex space-x-2">
          <span className="text-sm text-gray-400">
            Step {currentStage} of 4
          </span>
        </div>
        {renderStage()}
      </div>
    </div>
  );
}
