import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function deriveKey(keyMaterial: string): Buffer {
  if (!keyMaterial) throw new Error("A server-side encryption key is required");
  return createHash("sha256").update(keyMaterial).digest();
}

export function encryptGithubCredential(credential: string, keyMaterial = process.env.JWT_SECRET): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, deriveKey(keyMaterial ?? ""), iv);
  const ciphertext = Buffer.concat([cipher.update(credential, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map(part => part.toString("base64url")).join(".");
}

export function decryptGithubCredential(payload: string, keyMaterial = process.env.JWT_SECRET): string {
  const [ivText, authTagText, ciphertextText] = payload.split(".");
  if (!ivText || !authTagText || !ciphertextText) throw new Error("Invalid credential payload");
  const decipher = createDecipheriv(ALGORITHM, deriveKey(keyMaterial ?? ""), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
