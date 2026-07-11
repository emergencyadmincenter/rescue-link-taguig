/**
 * Authentication is now managed securely via HttpOnly cookies by the backend.
 * The frontend no longer stores or manages JWT access tokens.
 * 
 * If frontend authentication state is needed in the future without hitting 
 * the backend, consider having the backend set an additional non-HttpOnly 
 * cookie (e.g. `is_authenticated=true`) or implementing a `/me` endpoint 
 * combined with a React Context provider.
 */

export function isAuthenticated(): boolean {
  // In a cookie-based system, true authentication status requires a network request.
  // This is a placeholder. If you need client-side routing protection, implement a /me endpoint.
  return true;
}
