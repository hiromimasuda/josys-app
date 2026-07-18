"use client";
// Gate 1プロトタイプのローカル下書きケース。DBなし・localStorageのみ・DEMO_ONLY。
// 秘密情報らしき文字列は保存前にブロックする(§5.4 禁止入力)。

export interface LocalCase {
  id: string;
  eventTemplateId: string;
  occurredAt: string;
  impactTarget: string;
  impactScope: "SINGLE_USER" | "TEAM" | "MULTI_TEAM" | "COMPANY" | "EXTERNAL";
  ongoing: boolean;
  recentChange: boolean;
  securitySignal: boolean;
  summary: string;
  createdAt: string;
  demoOnly: true;
  local: true;
}

const STORAGE_KEY = "opsnav.localCases";

// 禁止入力の簡易検知(クライアント側の注意喚起。網羅ではない)
const SECRET_PATTERNS: [RegExp, string][] = [
  [/password|passwd|パスワード/i, "パスワードらしき記述"],
  [/api[_-]?key|token|トークン/i, "APIキー/Tokenらしき記述"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "秘密鍵"],
  [/AKIA[0-9A-Z]{16}/, "クラウド資格情報らしき文字列"],
  [/xox[baprs]-[0-9A-Za-z-]+/, "Slackトークンらしき文字列"],
  [/ghp_[0-9A-Za-z]{20,}/, "GitHubトークンらしき文字列"],
];

export function detectForbiddenInput(text: string): string | null {
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return null;
}

export function loadLocalCases(): LocalCase[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalCase[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalCase(c: Omit<LocalCase, "id" | "createdAt" | "demoOnly" | "local">): LocalCase {
  const all = loadLocalCases();
  const item: LocalCase = {
    ...c,
    id: `CASE-LOCAL-${String(all.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    demoOnly: true,
    local: true,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, item]));
  return item;
}
