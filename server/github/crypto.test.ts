import { describe, expect, it } from "vitest";
import { decryptGithubCredential, encryptGithubCredential } from "./crypto";

describe("GitHub credential encryption", () => {
  it("round-trips credentials without leaving plaintext in the stored payload", () => {
    const credential = "github-user-access-token";
    const encrypted = encryptGithubCredential(credential, "test-only-key");

    expect(encrypted).not.toContain(credential);
    expect(decryptGithubCredential(encrypted, "test-only-key")).toBe(credential);
  });
});
