"use client";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (online) return null;
  return (
    <p
      role="status"
      className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm font-semibold text-amber-900"
    >
      現在オフラインです。表示中の情報は最終同期時点のもので、古い可能性があります。
    </p>
  );
}
