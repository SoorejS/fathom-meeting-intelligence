"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/useTheme";

interface ThemeToggleProps {
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
  variant?: "segmented" | "menu" | "inline";
}

export function ThemeToggle({
  compact = false,
  showLabels = true,
  className = "",
}: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme();

  const options: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      className={`theme-switcher ${compact ? "compact" : ""} ${className}`}
      role="radiogroup"
      aria-label="Appearance theme preference"
    >
      {options.map(({ id, label, icon: Icon }) => {
        const isSelected = mounted ? theme === id : id === "dark";
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`theme-btn ${isSelected ? "active" : ""}`}
            onClick={() => setTheme(id)}
            title={`${label} appearance`}
            aria-label={`${label} theme mode`}
          >
            <Icon size={compact ? 13 : 14} />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
