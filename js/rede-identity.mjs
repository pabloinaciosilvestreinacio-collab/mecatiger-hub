// UI convenience only. The database RLS is the authorization boundary.
// A temporary anonymous session must never be mistaken for an email-verified member.
export function isVerifiedMember(user) {
  return Boolean(user
    && typeof user.id === 'string' && user.id.length > 0
    && typeof user.email === 'string' && user.email.length > 0
    && Boolean(user.email_confirmed_at)
    && user.is_anonymous === false);
}
