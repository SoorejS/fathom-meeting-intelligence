"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";

export type ThemePreference = "light" | "dark";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "relay-theme";
const THEME_CHANGE_EVENT = "relay:theme-change";

export function getSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "light" || val === "dark") {
      return val;
    }
  } catch {
    // Ignore localStorage access errors
  }
  return "dark";
}

export function applyThemeToDOM(pref: ThemePreference): EffectiveTheme {
  if (typeof document === "undefined") return "light";
  const effective: EffectiveTheme = pref;

  const root = document.documentElement;
  root.setAttribute("data-theme", effective);
  root.classList.remove("light", "dark");
  root.classList.add(effective);
  root.style.colorScheme = effective;

  return effective;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  let media: MediaQueryList | null = null;
  try {
    media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", callback);
  } catch {
    // Ignore matchMedia errors in headless environments
  }

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
    if (media) {
      media.removeEventListener("change", callback);
    }
  };
}

function getSnapshot(): ThemePreference {
  return getStoredTheme();
}

function getServerSnapshot(): ThemePreference {
  return "dark";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const effectiveTheme: EffectiveTheme = theme;

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable fallback
    }
    applyThemeToDOM(next);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: next } }),
      );
    }
  }, []);

  return {
    theme,
    effectiveTheme,
    setTheme,
    mounted: true,
  };
}
