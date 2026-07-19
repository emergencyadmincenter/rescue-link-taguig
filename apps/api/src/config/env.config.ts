import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    secret,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
  };
});

export const throttlerConfig = registerAs('throttler', () => ({
  default: {
    ttl: parseInt(process.env.THROTTLE_DEFAULT_TTL ?? '60000', 10), // 1 minute default
    limit: parseInt(process.env.THROTTLE_DEFAULT_LIMIT ?? '100', 10), // 100 requests per minute
  },
  auth: {
    ttl: parseInt(process.env.THROTTLE_AUTH_TTL ?? '60000', 10), // 1 minute default
    limit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '5', 10), // 5 requests per minute for auth
  },
}));
