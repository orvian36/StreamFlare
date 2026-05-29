import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import request from "supertest";
import { prisma } from "@streamflare/db";
import { buildTestApp } from "./helpers/test-app.js";

const app = buildTestApp();
const testDbPath = resolve(process.cwd(), "test.db");

beforeAll(() => {
  if (existsSync(testDbPath)) rmSync(testDbPath);
  if (existsSync(`${testDbPath}-journal`)) rmSync(`${testDbPath}-journal`);
  // Apply migrations to the fresh test.db
  execSync("pnpm --filter @streamflare/db exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  if (existsSync(testDbPath)) rmSync(testDbPath);
  if (existsSync(`${testDbPath}-journal`)) rmSync(`${testDbPath}-journal`);
});

describe("subscription", () => {
  it("GET /api/subscription/plans returns three plans after seeding", async () => {
    // Seed the three plans inline (test DB is empty after migrate)
    await prisma.subscriptionType.createMany({
      data: [
        { subType: "BASIC", bill: 5, numProfiles: 2 },
        { subType: "STANDARD", bill: 8, numProfiles: 4 },
        { subType: "PREMIUM", bill: 10, numProfiles: 6 },
      ],
    });
    const res = await request(app).get("/api/subscription/plans");
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(3);
    expect(res.body.plans[0]).toMatchObject({ SUB_TYPE: expect.any(String), BILL: expect.any(Number) });
  });
});

describe("users", () => {
  it("GET /api/users returns an array", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it("POST /api/users/signup creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({
        NAME: "Test User",
        EMAIL: "test@example.com",
        DOB: "1990-01-01",
        COUNTRY: "BD",
        CREDIT_CARD: "0000-0000-0000-0000",
        PASSWORD: "supersecret",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.EMAIL).toBe("test@example.com");
  });

  it("POST /api/users/login succeeds with correct password", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ EMAIL: "test@example.com", PASSWORD: "supersecret" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /api/users/login fails with wrong password", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ EMAIL: "test@example.com", PASSWORD: "wrong" });
    expect(res.status).toBe(423);
  });
});

describe("profiles", () => {
  it("POST /api/profiles/add then GET /api/profiles/:email returns the profile", async () => {
    const add = await request(app)
      .post("/api/profiles/add")
      .send({ EMAIL: "test@example.com", PROFILE_ID: "kid", DOB: "2015-05-01" });
    expect(add.status).toBe(201);

    const get = await request(app).get("/api/profiles/test@example.com");
    expect(get.status).toBe(200);
    expect(get.body.profile.length).toBeGreaterThan(0);
    expect(get.body.profile[0].PROFILE_ID).toBe("kid");
  });
});

describe("browse", () => {
  it("GET /api/browse/genre?movie_id=... returns an array", async () => {
    // No movies seeded — but the endpoint should still 200 with empty array
    const res = await request(app).get("/api/browse/genre?movie_id=1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/browse/search with static search returns two sections", async () => {
    const res = await request(app)
      .post("/api/browse/search")
      .send({ ss: "static", key: ["batman"] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("GET /api/browse/movie/:id returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/browse/movie/999999");
    expect(res.status).toBe(404);
  });

  it("GET /api/browse/show/:id returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/browse/show/999999");
    expect(res.status).toBe(404);
  });
});
