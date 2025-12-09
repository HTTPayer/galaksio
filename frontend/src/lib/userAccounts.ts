/**
 * User Account helpers
 * Manages the relationship between authenticated users and their database records
 */

import { prisma } from "@/lib/prisma";
import { getCurrentUserExternalId } from "./auth";

/**
 * Get or create a UserAccount for the current authenticated user
 * This ensures every authenticated user has a corresponding record in the database
 * @returns UserAccount record for the current user
 * @throws {Error} If user is not authenticated
 */
export async function getOrCreateUserAccount() {
  const externalId = await getCurrentUserExternalId();

  let account = await prisma.userAccount.findUnique({
    where: { externalId },
  });

  if (!account) {
    account = await prisma.userAccount.create({
      data: {
        externalId,
        provider: "github",
      },
    });
  }

  return account;
}
