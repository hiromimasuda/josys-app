import { describe, expect, it } from "vitest";
import { detectForbiddenInput } from "@ops/domain";

describe("forbidden input detection (§5.4/§9.4 共有実装)", () => {
  it("flags password-like text", () => {
    expect(detectForbiddenInput("パスワードは abc123 です")).toBeTruthy();
    expect(detectForbiddenInput("password: hunter2")).toBeTruthy();
  });
  it("flags token/key-like text", () => {
    expect(detectForbiddenInput("api_key=XYZ")).toBeTruthy();
    expect(detectForbiddenInput("AKIAABCDEFGHIJKLMNOP")).toBeTruthy();
    expect(detectForbiddenInput("xoxb-123-abc")).toBeTruthy();
  });
  it("allows normal incident descriptions", () => {
    expect(detectForbiddenInput("会議室のWi-Fiがつながらない。3人に影響。")).toBeNull();
  });
});
