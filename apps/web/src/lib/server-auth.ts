import { cookies } from 'next/headers';

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) return null;

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, "") + "/api";

    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const text = await res.text();
    if (!text.trim()) return null;

    const json = JSON.parse(text);
    return json.data?.user || null;
  } catch {
    return null;
  }

  return null;
}
