import { auth } from "./server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentSession() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  return session;
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  return session;
}
