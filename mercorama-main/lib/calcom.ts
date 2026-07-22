// lib/calcom.ts
// Cal.com user provisioning for expert profiles.
// Creates a Cal.com user account when an expert is onboarded, giving them
// a public booking page at cal.mercorama.com/{username}.
//
// This mirrors the ClickMaple pattern: Cal.com is used purely as a
// white-label profile host. All actual booking logic is in Supabase.

const CAL_BASE_URL = process.env.CAL_API_URL ?? 'http://localhost:5555';
const CAL_API_KEY = process.env.CAL_API_KEY ?? '';
const CAL_TEAM_ID = parseInt(process.env.CAL_TEAM_ID ?? '1', 10);

interface CalUser {
  username: string;
  calUserId: number;
}

/**
 * Check if a Cal.com user already exists with this email.
 */
export async function getCalUserByEmail(email: string): Promise<CalUser | null> {
  if (!CAL_API_KEY) return null;

  try {
    const res = await fetch(`${CAL_BASE_URL}/api/v1/users?apiKey=${CAL_API_KEY}&email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const users = data.users ?? data.data ?? [];
    if (users.length === 0) return null;
    return { username: users[0].username, calUserId: users[0].id };
  } catch (err) {
    console.error('[mercorama] calcom getCalUserByEmail error:', err);
    return null;
  }
}

/**
 * Provision a new Cal.com user for an expert.
 * Creates the user account and adds them to the team.
 */
export async function provisionCalUser(
  email: string,
  name: string,
  slug: string,
): Promise<CalUser | null> {
  if (!CAL_API_KEY) {
    console.warn('[mercorama] CAL_API_KEY not set — skipping Cal.com provisioning');
    return null;
  }

  // Dedup check
  const existing = await getCalUserByEmail(email);
  if (existing) return existing;

  // Username: derived from slug, max 32 chars
  const username = slug.slice(0, 32);

  // Generate a random temp password (user won't use it — Cal.com is admin-managed)
  const tempPassword = `MRC_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    // 1. Create Cal.com user
    const createRes = await fetch(`${CAL_BASE_URL}/api/v1/users?apiKey=${CAL_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        username,
        name,
        password: tempPassword,
        timeZone: 'America/Toronto',
        locale: 'en',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('[mercorama] calcom create user error:', createRes.status, err);
      return null;
    }

    const userData = await createRes.json();
    const calUserId = userData.user?.id ?? userData.data?.id;
    if (!calUserId) {
      console.error('[mercorama] calcom create user: no ID in response');
      return null;
    }

    // 2. Add to team
    try {
      await fetch(`${CAL_BASE_URL}/api/v1/teams/${CAL_TEAM_ID}/membership?apiKey=${CAL_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: calUserId,
          role: 'MEMBER',
          accepted: true,
        }),
      });
    } catch (teamErr) {
      console.warn('[mercorama] calcom team membership failed (non-fatal):', teamErr);
    }

    console.log(`[mercorama] Cal.com user provisioned: ${username} (ID: ${calUserId})`);
    return { username, calUserId };
  } catch (err) {
    console.error('[mercorama] calcom provision error:', err);
    return null;
  }
}
