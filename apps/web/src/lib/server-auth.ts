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
    
    if (res.ok) {
      const json = await res.json();
      return json.data?.user || null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
  
  return null;
}
