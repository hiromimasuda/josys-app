"use client";
import { seed } from "@ops/domain";
import { roleLabels, useMockUser } from "@/lib/mockAuth";

export function RoleSwitcher() {
  const [user, switchUser] = useMockUser();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <span className="hidden sm:inline">DEMOユーザー</span>
      <select
        aria-label="DEMOユーザー切替(mock auth)"
        className="tap rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        value={user.id}
        onChange={(e) => switchUser(e.target.value)}
      >
        {seed.mockUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName}
          </option>
        ))}
      </select>
      <span className="hidden md:inline text-slate-500">{roleLabels(user)}</span>
    </label>
  );
}
