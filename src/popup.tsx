import React from "react";
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import "./popup.css";
import "./globals.css";

import { Header } from "@/components/header";
import { HistorySection } from "@/components/history-section";
import { ExportButton } from "@/components/export-button";
import { Onboarding } from "@/components/onboarding";
import { getStorage, setStorage } from "./util";

import { Settings } from "./settings";

const Popup = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      const hasCompletedOnboarding = await getStorage<boolean>(
        "hasCompletedOnboarding"
      );
      setIsFirstTime(!hasCompletedOnboarding);
    };
    checkFirstTimeUser();
  }, []);

  const handleOnboardingComplete = async () => {
    await setStorage("hasCompletedOnboarding", true);
    setIsFirstTime(false);
  };

  if (isFirstTime) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <div className="w-[780px] min-h-[580px] bg-green-50">
        {showOptions ? (
          <Settings onBack={() => setShowOptions(false)} />
        ) : (
          <>
            <Header onSettingsClick={() => setShowOptions(true)} />
            <main className="container mx-auto px-4 py-8">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-green-800">
                  Dashboard
                </h2>
                <ExportButton />
              </div>
              <HistorySection />
            </main>
          </>
        )}
      </div>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
