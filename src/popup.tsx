import React from "react";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import "./popup.css";
import "./globals.css";

import { Header } from "@/components/header";
import { HistorySection } from "@/components/history-section";
import { ExportButton } from "@/components/export-button";

import { Settings } from "./settings";

const Popup = () => {
  const [showOptions, setShowOptions] = useState(false);

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
