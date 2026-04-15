import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "quickdocs_user_id";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function getAllUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export { COOKIE_NAME };
