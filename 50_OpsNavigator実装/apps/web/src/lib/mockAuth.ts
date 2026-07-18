"use client";
// mock auth (Gate 1): 実credentialなし。localStorageでDEMOユーザーを切替えるだけ。
// RBACのUI表示制御のみで、サーバー側強制はGate 2で実装する。
import { useEffect, useState } from "react";
import { seed, type MockUser } from "@ops/domain";

const STORAGE_KEY = "opsnav.mockUserId";
const DEFAULT_USER_ID = "USR-DEMO-002"; // DEMO_OPERATOR

export function useMockUser(): [MockUser, (id: string) => void] {
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && seed.mockUsers.some((u) => u.id === stored)) setUserId(stored);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setUserId(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const switchUser = (id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  };

  const user = seed.mockUsers.find((u) => u.id === userId) ?? seed.mockUsers[0]!;
  return [user, switchUser];
}

export function roleLabels(user: MockUser): string {
  return user.roleIds
    .map((rid) => seed.roles.find((r) => r.id === rid)?.label ?? rid)
    .join("・");
}
