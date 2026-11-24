/* src/routes/+page.server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import type { PageServerLoad } from "./$types";
import { listPublicProfiles } from "#lib/server/users.ts";

export const load: PageServerLoad = async () => {
  return { users: await listPublicProfiles() };
};
