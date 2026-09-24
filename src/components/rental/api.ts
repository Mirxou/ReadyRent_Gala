// ─── Tiny typed fetch helpers (relative URLs only) ───────────────────

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // body was not JSON — fall through
  }
  return fallback;
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await readError(res, "فشل تحميل البيانات"));
  return (await res.json()) as T;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res, "فشل تنفيذ العملية"));
  return (await res.json()) as T;
}

/** POST without a request body (action endpoints like /return). */
export async function postAction<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(await readError(res, "فشل تنفيذ العملية"));
  return (await res.json()) as T;
}
