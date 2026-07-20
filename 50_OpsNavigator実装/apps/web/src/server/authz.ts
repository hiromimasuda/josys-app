// mock auth + サーバー側RBAC強制(03C)。
// 認証はDEMOヘッダー(x-demo-user)だが、認可判定はUI非表示に頼らず全APIで行う。
import { prisma, type DemoUser } from "@ops/db";
import { ApiError } from "./errors";

export type RoleId =
  | "employee"
  | "operator"
  | "approver"
  | "knowledge_editor"
  | "knowledge_approver"
  | "auditor"
  | "admin"
  | "service_account";

export async function resolveUser(req: Request): Promise<DemoUser> {
  const userId = req.headers.get("x-demo-user");
  if (!userId) throw new ApiError("UNAUTHENTICATED", 401, "DEMOユーザーが指定されていません。");
  const user = await prisma.demoUser.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("UNAUTHENTICATED", 401, "不明なDEMOユーザーです。");
  return user;
}

export function hasRole(user: DemoUser, ...roles: RoleId[]): boolean {
  return roles.some((r) => user.roles.includes(r));
}

export function requireRole(user: DemoUser, ...roles: RoleId[]): void {
  if (!hasRole(user, ...roles)) {
    throw new ApiError("FORBIDDEN", 403, "この操作を行う権限がありません。", {
      required_roles: roles,
    });
  }
}

// 機密レベル別の検索可能範囲(§3.3)。HIGHは本文検索対象にしない。
export function allowedConfidentiality(user: DemoUser): ("INTERNAL" | "RESTRICTED")[] {
  if (hasRole(user, "operator", "approver", "knowledge_editor", "knowledge_approver", "auditor", "admin")) {
    return ["INTERNAL", "RESTRICTED"];
  }
  return ["INTERNAL"];
}
