import * as jose from "jose";

const secret = new TextEncoder().encode(
  process.env.SIWE_JWT_SECRET || "dev-secret"
);

export async function jwtSign(payload: object) {
  return await new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function jwtVerify(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
