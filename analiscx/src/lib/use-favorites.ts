import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "analiscx:favorites:v1";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function writeFavorites(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("analiscx:favorites:changed"));
  } catch {
    // ignore quota errors
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener("storage", sync);
    window.addEventListener("analiscx:favorites:changed", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("analiscx:favorites:changed", sync as EventListener);
    };
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => favorites.includes(symbol.toUpperCase()),
    [favorites],
  );

  const toggleFavorite = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    const current = readFavorites();
    const next = current.includes(sym)
      ? current.filter((s) => s !== sym)
      : [...current, sym];
    writeFavorites(next);
    setFavorites(next);
  }, []);

  const addFavorite = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    const current = readFavorites();
    if (current.includes(sym)) return;
    const next = [...current, sym];
    writeFavorites(next);
    setFavorites(next);
  }, []);

  const removeFavorite = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    const current = readFavorites();
    const next = current.filter((s) => s !== sym);
    writeFavorites(next);
    setFavorites(next);
  }, []);

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
