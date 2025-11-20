import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onSettingsClick: () => void;
  hasApiKey: boolean;
}

export function TopBar({ onSettingsClick, hasApiKey }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight leading-tight" data-testid="text-app-title">
            Structured Data
          </h1>
          <h4 className="text-xs text-muted-foreground" data-testid="text-app-subtitle">
            powered by knowledge kit
          </h4>
        </div>
        {!hasApiKey && (
          <Badge variant="secondary" className="text-xs" data-testid="badge-api-status">
            API Key Required
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          data-testid="button-settings"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
