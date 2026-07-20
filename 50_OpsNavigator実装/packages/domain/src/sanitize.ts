// 禁止入力(§5.4 / §9.4)の簡易検知。クライアント注意喚起とサーバー拒否の両方で使う。
// 網羅的DLPではない。検知した場合は保存せず拒否する。
const SECRET_PATTERNS: [RegExp, string][] = [
  [/password|passwd|パスワード/i, "パスワードらしき記述"],
  [/api[_-]?key|token|トークン/i, "APIキー/Tokenらしき記述"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "秘密鍵"],
  [/AKIA[0-9A-Z]{16}/, "クラウド資格情報らしき文字列"],
  [/AIza[0-9A-Za-z_-]{20,}/, "クラウドAPIキーらしき文字列"],
  [/xox[baprs]-[0-9A-Za-z-]+/, "Slackトークンらしき文字列"],
  [/ghp_[0-9A-Za-z]{20,}/, "GitHubトークンらしき文字列"],
  [/(?:cookie|set-cookie)\s*[:=]/i, "Cookieらしき記述"],
];

export function detectForbiddenInput(text: string): string | null {
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return null;
}
