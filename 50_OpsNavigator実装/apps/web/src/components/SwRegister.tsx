"use client";
import { useEffect } from "react";

// Emergency Packオフライン対応(§13)のService Worker登録。外部通信なし。
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 登録失敗時もアプリは通常動作する(縮退)
      });
    }
  }, []);
  return null;
}
