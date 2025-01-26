import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onSettingsClick: () => void;
};

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-green-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">GreenCart</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-green-700"
          onClick={onSettingsClick}
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}
