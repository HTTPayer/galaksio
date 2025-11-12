export async function fetchWith402(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const res = await fetch(input, init);
  if (res.status !== 402) return res;

  // Expect a JSON invoice body { invoice: { … }, payUrl?: string }
  const body = await res.clone().json().catch(() => null);
  const relay = process.env.NEXT_PUBLIC_HTTPAYER_RELAY || "";
  const payUrl = body?.payUrl || `${relay}/pay`;

  const payRes = await fetch(payUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body?.invoice || body),
  });
  if (!payRes.ok) throw new Error("Payment failed");

  // replay the original request
  return await fetch(input, init);
}
