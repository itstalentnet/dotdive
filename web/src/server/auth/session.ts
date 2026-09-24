import { cookies } from "next/headers";
import { getAccessContext, type AccessContext } from "@/server/access/index";

/**
 * Read session cookie and resolve AccessContext for the current request
 */
export async function getSessionContext(): Promise<AccessContext> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dd_session");

  if (!sessionCookie?.value) {
    return { email: null, roots: new Set(["public"]) };
  }

  try {
    // In M3 this can be verified with jose/jwt, for now parse JSON or email string
    let email: string | null = null;
    if (sessionCookie.value.startsWith("{")) {
      const data = JSON.parse(sessionCookie.value);
      email = data.email ?? null;
    } else {
      email = sessionCookie.value;
    }
    return getAccessContext(email);
  } catch {
    return { email: null, roots: new Set(["public"]) };
  }
}
