import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps a same-site path with its query string", () => {
    expect(safeRedirectPath("/dashboard?tab=drafts")).toBe("/dashboard?tab=drafts");
  });

  it("falls back when there is no target", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("", "/dashboard")).toBe("/dashboard");
  });

  it("refuses absolute URLs to other sites", () => {
    expect(safeRedirectPath("https://evil.example/login")).toBe("/");
  });

  it("refuses protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("/\\evil.example")).toBe("/");
  });

  it("refuses javascript: URLs", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });
});
