import { describe, it, expect } from "vitest";
import {
  TRUSTED_ISSUERS,
  sign,
  issueCredential,
  verifyCredential,
} from "@/lib/math-core/decentralized-identity";

describe("sign", () => {
  it("matches a hand-worked example", () => {
    expect(sign("State DMV", "Alice", "over-21")).toBe(227);
  });

  it("changes completely if the claim changes by any amount", () => {
    expect(sign("State DMV", "Alice", "over-99")).toBe(216);
    expect(sign("State DMV", "Alice", "over-99")).not.toBe(sign("State DMV", "Alice", "over-21"));
  });

  it("changes completely if the issuer changes, holding subject/claim fixed", () => {
    expect(sign("Fake Issuer", "Alice", "over-21")).toBe(277);
    expect(sign("Fake Issuer", "Alice", "over-21")).not.toBe(sign("State DMV", "Alice", "over-21"));
  });
});

describe("issueCredential", () => {
  it("produces a credential whose signature matches sign() on its own fields", () => {
    const cred = issueCredential("State DMV", "Alice", "over-21");
    expect(cred.signature).toBe(sign("State DMV", "Alice", "over-21"));
  });
});

describe("verifyCredential", () => {
  it("is valid for an untampered credential from a trusted issuer", () => {
    const cred = issueCredential("State DMV", "Alice", "over-21");
    const result = verifyCredential(cred);
    expect(result.signatureValid).toBe(true);
    expect(result.issuerTrusted).toBe(true);
    expect(result.valid).toBe(true);
  });

  it("fails signature validity if the claim is tampered with after issuance", () => {
    const cred = issueCredential("State DMV", "Alice", "over-21");
    const tampered = { ...cred, claim: "over-99" };
    const result = verifyCredential(tampered);
    expect(result.signatureValid).toBe(false);
    expect(result.valid).toBe(false);
  });

  it("fails issuer trust for a credential from an issuer outside the registry, even if self-consistent", () => {
    const cred = issueCredential("Fake Issuer", "Alice", "over-21");
    const result = verifyCredential(cred);
    expect(result.signatureValid).toBe(true);
    expect(result.issuerTrusted).toBe(false);
    expect(result.valid).toBe(false);
  });

  it("respects a custom trusted-issuer list", () => {
    const cred = issueCredential("Guild of Notaries", "Bob", "member");
    expect(verifyCredential(cred).issuerTrusted).toBe(false);
    expect(verifyCredential(cred, ["Guild of Notaries"]).issuerTrusted).toBe(true);
  });

  it("the default trusted-issuer registry is the expected small fixed list", () => {
    expect(TRUSTED_ISSUERS).toEqual(["State DMV", "University Registrar"]);
  });
});
