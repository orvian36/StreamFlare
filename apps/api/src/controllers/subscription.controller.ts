import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import {
  checkValidation,
  terminateRunningSubscription,
  getPlanBill,
  getPlanProfileCount,
} from "../services/subscription.service.js";

function asStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function asInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function formatDateDDMMYYYY(d: Date | null): string | null {
  if (!d) return null;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}//${d.getUTCFullYear()}`;
}

function formatDateLong(d: Date | null): string | null {
  if (!d) return null;
  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  return `${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

export async function getSubscriptions(_req: Request, res: Response, _next: NextFunction) {
  try {
    const rows = await prisma.subscription.findMany();
    res.status(200).json({ users: rows.map(toSubRow) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

function toSubRow(s: {
  subId: number;
  subType: string;
  email: string;
  startDate: Date;
  endDate: Date;
  bill: number;
  totalBill: number;
  running: number | null;
  terminationDate: Date | null;
}) {
  return {
    SUB_ID: s.subId,
    SUB_TYPE: s.subType,
    EMAIL: s.email,
    START_DATE: s.startDate,
    END_DATE: s.endDate,
    BILL: s.bill,
    TOTAL_BILL: s.totalBill,
    RUNNING: s.running,
    TERMINATION_DATE: s.terminationDate,
  };
}

export async function addSubscription(req: Request, res: Response, _next: NextFunction) {
  const { SUB_TYPE, EMAIL, END_DATE } = req.body as {
    SUB_TYPE: string;
    EMAIL: string;
    END_DATE: string;
  };
  try {
    await terminateRunningSubscription(EMAIL);

    const bill = await getPlanBill(SUB_TYPE);
    const numProfiles = await getPlanProfileCount(SUB_TYPE);

    await prisma.$transaction([
      prisma.subscription.create({
        data: {
          subType: SUB_TYPE,
          email: EMAIL,
          endDate: new Date(END_DATE),
          terminationDate: new Date(END_DATE),
          running: 1,
          bill,
          totalBill: 0,
        },
      }),
      prisma.user.update({
        where: { email: EMAIL },
        data: { maxProfiles: numProfiles },
      }),
    ]);

    res.status(201).json({ message: "Successfully added subscription" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to add subscription to database" });
  }
}

export async function getSubId(req: Request, res: Response, _next: NextFunction) {
  const email = asStr(req.params.email);
  try {
    await checkValidation(email);
    const row = await prisma.subscription.findFirst({
      where: { email, running: 1 },
      select: { subId: true },
    });
    res.status(200).json({ sub_id: row ? { SUB_ID: row.subId } : null });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cannot get sub_id from database" });
  }
}

export async function getBill(req: Request, res: Response, _next: NextFunction) {
  const subId = asInt(req.params.sub_id);
  if (subId == null) return res.status(400).json({ message: "Invalid sub_id" });
  try {
    const row = await prisma.subscription.findUnique({
      where: { subId },
      select: { bill: true },
    });
    res.status(200).json({ bill: row ? { BILL: row.bill } : null });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cannot get bill from database" });
  }
}

export async function getHistory(req: Request, res: Response, _next: NextFunction) {
  const email = req.params.email;
  try {
    const rows = await prisma.subscription.findMany({
      where: { email, running: 0 },
      orderBy: { terminationDate: "asc" },
    });
    res.status(200).json({
      history: rows.map((s) => ({
        SUB_TYPE: s.subType,
        S_DATE: formatDateDDMMYYYY(s.startDate),
        T_DATE: formatDateDDMMYYYY(s.terminationDate),
        TOTAL_BILL: s.totalBill,
      })),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateSubscription(req: Request, res: Response, _next: NextFunction) {
  const { SUB_ID, SUB_TYPE, END_DATE } = req.body as {
    SUB_ID: number | string;
    SUB_TYPE: string;
    END_DATE: string;
  };
  const subId = asInt(SUB_ID);
  if (subId == null) return res.status(400).json({ message: "Invalid SUB_ID" });
  try {
    await prisma.subscription.update({
      where: { subId },
      data: { subType: SUB_TYPE, endDate: new Date(END_DATE) },
    });
    res.status(201).json({ message: "Successfully updated subscription" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to update subscription" });
  }
}

export async function deleteSubscription(req: Request, res: Response, _next: NextFunction) {
  const { EMAIL } = req.body as { EMAIL: string };
  try {
    await terminateRunningSubscription(EMAIL);
    await prisma.profile.deleteMany({ where: { email: EMAIL } });
    await prisma.user.update({ where: { email: EMAIL }, data: { maxProfiles: 0 } });
    res.status(201).json({ message: "Successfully deleted subscription" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to delete subscription" });
  }
}

export async function isValidSubscription(req: Request, res: Response, _next: NextFunction) {
  const subId = asInt(req.params.sub_id);
  if (subId == null) return res.status(400).json({ message: "Invalid sub_id" });
  try {
    // Legacy: VALID = 1 if no row exists with RUNNING=0 matching sub_id; 0 otherwise.
    // i.e., "valid" means the sub is still active (not yet terminated).
    const row = await prisma.subscription.findFirst({
      where: { subId, running: 0 },
    });
    res.status(200).json({ VALID: row ? 0 : 1 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getplans(_req: Request, res: Response, _next: NextFunction) {
  try {
    const plans = await prisma.subscriptionType.findMany();
    res.status(200).json({
      plans: plans.map((p) => ({
        SUB_TYPE: p.subType,
        BILL: p.bill,
        NUM_PROFILES: p.numProfiles,
      })),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getEndDate(req: Request, res: Response, _next: NextFunction) {
  const email = req.params.email;
  try {
    const row = await prisma.subscription.findFirst({
      where: { email, running: 1 },
      select: { endDate: true },
    });
    res.status(200).json({ ed: row ? { ED: formatDateLong(row.endDate) } : null });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}
