import Link from "next/link";

const items = [
  { href: "/home", label: "今日の情シス" },
  { href: "/events", label: "発生時アクション" },
  { href: "/cases", label: "ケース" },
  { href: "/operations", label: "業務43" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/ask", label: "AI相談" },
  { href: "/knowledge", label: "ナレッジ" },
  { href: "/approvals", label: "承認・例外" },
  { href: "/handover", label: "引継ぎ" },
  { href: "/admin", label: "管理" },
  { href: "/emergency", label: "緊急パック(オフライン対応)" },
];

export default function MenuPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">メニュー</h1>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="tap flex items-center rounded-lg border border-slate-200 bg-white p-3 font-medium hover:bg-blue-50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
