import { env } from '@/lib/env';

/**
 * V1 sandbox auth: returns the seeded mock advisor UUID.
 * V2 path uses Supabase Auth via getAuthenticatedAdvisorId().
 */
export function getMockAdvisorId(): string {
  return env.MOCK_ADVISOR_ID;
}

export async function getAdvisorId(): Promise<string> {
  return getMockAdvisorId();
}

export async function getAuthenticatedAdvisorId(
  getUser: () => Promise<{ id: string } | null>
): Promise<string> {
  const user = await getUser();
  if (user?.id) return user.id;
  return getMockAdvisorId();
}
