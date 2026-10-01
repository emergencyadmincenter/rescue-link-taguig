-- Extend the policy categories without changing existing enforcement history.
ALTER TYPE "ShadowBanViolationCategory" ADD VALUE IF NOT EXISTS 'impersonation_identity_misuse';
ALTER TYPE "ShadowBanViolationCategory" ADD VALUE IF NOT EXISTS 'coordinated_system_abuse';