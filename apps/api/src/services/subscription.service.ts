import { prisma } from "@streamflare/db";

function monthsBetween(later: Date, earlier: Date): number {
  // Replicates Oracle MONTHS_BETWEEN: returns fractional months.
  // The fractional part is days-past-anchor / 31.
  const yearDiff = later.getUTCFullYear() - earlier.getUTCFullYear();
  const monthDiff = later.getUTCMonth() - earlier.getUTCMonth();
  const dayDiff = later.getUTCDate() - earlier.getUTCDate();
  return yearDiff * 12 + monthDiff + dayDiff / 31;
}

function billUpTo(subscription: { startDate: Date; bill: number }, now = new Date()): number {
  const months = monthsBetween(now, subscription.startDate);
  return Math.round(months * subscription.bill * 100) / 100;
}

/**
 * Mark any RUNNING=1 subscription whose end_date has passed as terminated,
 * setting running=0, terminationDate=now, totalBill=months*bill.
 * This is the TypeScript port of the legacy CHECK_VALIDATION stored procedure.
 */
export async function checkValidation(email: string): Promise<void> {
  const now = new Date();
  const expired = await prisma.subscription.findMany({
    where: { email, running: 1, endDate: { lte: now } },
  });
  for (const sub of expired) {
    await prisma.subscription.update({
      where: { subId: sub.subId },
      data: {
        running: 0,
        terminationDate: now,
        totalBill: billUpTo(sub, now),
      },
    });
  }
}

/**
 * Terminate any currently-running subscription for this user,
 * computing its final totalBill. Used by addSubscription (replacing old plan)
 * and deleteSubscription.
 */
export async function terminateRunningSubscription(email: string): Promise<void> {
  const now = new Date();
  const active = await prisma.subscription.findFirst({ where: { email, running: 1 } });
  if (!active) return;
  await prisma.subscription.update({
    where: { subId: active.subId },
    data: {
      running: 0,
      terminationDate: now,
      totalBill: billUpTo(active, now),
    },
  });
}

export async function getPlanBill(subType: string): Promise<number> {
  const plan = await prisma.subscriptionType.findUnique({ where: { subType } });
  return plan?.bill ?? 0;
}

export async function getPlanProfileCount(subType: string): Promise<number> {
  const plan = await prisma.subscriptionType.findUnique({ where: { subType } });
  return plan?.numProfiles ?? 0;
}
