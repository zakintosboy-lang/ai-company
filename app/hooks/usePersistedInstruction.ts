import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ai_company_instruction";
const DEBOUNCE_MS = 500;

/**
 * 指示内容テキストをlocalStorageに自動保存・復元するフック。
 * - 入力停止後500msでデバウンス保存
 * - 初期マウント時にlocalStorageから復元
 * - clearInstruction()で手動リセット可能
 */
export function usePersistedInstruction() {
  const [instruction, setInstructionState] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSR対策：クライアントマウント後にlocalStorageから復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInstructionState(saved);
    } catch {
      // localStorage が使えない環境では無視
    }
    setHydrated(true);
  }, []);

  const setInstruction = useCallback((value: string) => {
    setInstructionState(value);

    // 既存タイマーをクリアしてデバウンス
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        if (value) {
          localStorage.setItem(STORAGE_KEY, value);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // 書き込み失敗は無視
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearInstruction = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setInstructionState("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 無視
    }
  }, []);

  // アンマウント時にタイマーを確実にクリア
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { instruction, setInstruction, clearInstruction, hydrated };
}
