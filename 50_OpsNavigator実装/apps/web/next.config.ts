import type { NextConfig } from "next";

// 外部runtime通信0件の方針(IMPLEMENTATION_PLAN §2):
// - telemetryはscriptsのNEXT_TELEMETRY_DISABLED=1で無効化
// - 画像最適化(sharp/外部loader)不使用
// - 外部フォント・CDN・外部画像は使用しない(コード上も存在しない)
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ops/domain", "@ops/ai"],
  images: { unoptimized: true },
};

export default nextConfig;
