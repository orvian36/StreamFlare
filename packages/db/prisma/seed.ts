import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SEED_DATA_DIR =
  process.env.SEED_DATA_DIR ?? resolve(__dirname, "../../../legacy/Table Backup");

type Row = Record<string, string>;

function readJson(path: string): Row[] {
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as { RECORDS?: Row[] };
  return parsed.RECORDS ?? [];
}

function findJson(name: string): string | null {
  if (!existsSync(SEED_DATA_DIR)) return null;
  const file = readdirSync(SEED_DATA_DIR).find(
    (f) => f.toLowerCase() === `${name.toLowerCase()}.json`,
  );
  return file ? join(SEED_DATA_DIR, file) : null;
}

// Parses "D/M/YYYY HH:MM:SS" → Date. Returns null on empty/invalid.
function parseDate(v: string | undefined | null): Date | null {
  if (!v || v.trim() === "") return null;
  const match = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
  if (!match) {
    // Fallback: try native parser (e.g. for ISO strings)
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const [, day, month, year, hh = "0", mm = "0", ss = "0"] = match;
  const d = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hh), Number(mm), Number(ss)),
  );
  return isNaN(d.getTime()) ? null : d;
}

function parseIntOr(v: string | undefined | null, def = 0): number {
  if (v == null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

function parseFloatOr(v: string | undefined | null, def = 0): number {
  if (v == null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function nullIfEmpty(v: string | undefined | null): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

async function seedSubscriptionTypes() {
  const plans = [
    { subType: "BASIC", bill: 5, numProfiles: 2 },
    { subType: "STANDARD", bill: 8, numProfiles: 4 },
    { subType: "PREMIUM", bill: 10, numProfiles: 6 },
  ];
  for (const p of plans) {
    await prisma.subscriptionType.upsert({
      where: { subType: p.subType },
      create: p,
      update: p,
    });
  }
  console.log(`  seeded subscription_type (${plans.length} plans)`);
}

async function seedUsers() {
  const path = findJson("USER_NETFLIX");
  if (!path) return console.log("  skip USER_NETFLIX (no JSON)");
  const rows = readJson(path);
  for (const r of rows) {
    const data = {
      email: r.EMAIL,
      name: r.NAME ?? "",
      dob: parseDate(r.DOB) ?? new Date("1970-01-01"),
      country: (r.COUNTRY ?? "").trim(),
      creditCard: r.CREDIT_CARD ?? "",
      password: r.PASSWORD ?? "",
      phone: nullIfEmpty(r.PHONE),
      joined: parseDate(r.JOINED) ?? new Date(),
      maxProfiles: parseIntOr(r.MAX_PROFILES),
    };
    await prisma.user.upsert({
      where: { email: data.email },
      create: data,
      update: data,
    });
  }
  console.log(`  seeded user_netflix (${rows.length} rows)`);
}

async function seedProfiles() {
  const path = findJson("PROFILE");
  if (!path) return console.log("  skip PROFILE (no JSON)");
  const rows = readJson(path);
  let count = 0;
  for (const r of rows) {
    if (!r.PROFILE_ID || !r.EMAIL) continue;
    const data = {
      profileId: r.PROFILE_ID,
      email: r.EMAIL,
      dob: parseDate(r.DOB) ?? new Date("1970-01-01"),
    };
    await prisma.profile.upsert({
      where: { email_profileId: { email: data.email, profileId: data.profileId } },
      create: data,
      update: data,
    });
    count++;
  }
  console.log(`  seeded profile (${count} rows)`);
}

async function seedGenres() {
  const path = findJson("GENRE");
  if (!path) return console.log("  skip GENRE (no JSON)");
  const rows = readJson(path);
  for (const r of rows) {
    const data = {
      genreId: parseIntOr(r.GENRE_ID),
      name: nullIfEmpty(r.NAME),
      contents: parseIntOr(r.CONTENTS),
    };
    await prisma.genre.upsert({
      where: { genreId: data.genreId },
      create: data,
      update: data,
    });
  }
  console.log(`  seeded genre (${rows.length} rows)`);
}

async function seedCelebs() {
  const path = findJson("CELEB");
  if (!path) return console.log("  skip CELEB (no JSON)");
  const rows = readJson(path);
  for (const r of rows) {
    const data = {
      celebId: parseIntOr(r.CELEB_ID),
      name: nullIfEmpty(r.NAME),
      contents: parseIntOr(r.CONTENTS),
    };
    await prisma.celeb.upsert({
      where: { celebId: data.celebId },
      create: data,
      update: data,
    });
  }
  console.log(`  seeded celeb (${rows.length} rows)`);
}

async function seedMovies() {
  const path = findJson("MOVIE");
  if (!path) return console.log("  skip MOVIE (no JSON)");
  const rows = readJson(path);
  for (const r of rows) {
    const data = {
      movieId: parseIntOr(r.MOVIE_ID),
      title: r.TITLE ?? "",
      country: nullIfEmpty(r.COUNTRY),
      rating: parseFloatOr(r.RATING),
      totalViews: parseIntOr(r.TOTAL_VIEWS),
      totalVotes: parseIntOr(r.TOTAL_VOTES),
      description: nullIfEmpty(r.DESCRIPTION),
      imageUrl: nullIfEmpty(r.IMAGE_URL),
      videoUrl: nullIfEmpty(r.VIDEO_URL),
      length: parseFloatOr(r.LENGTH),
      language: nullIfEmpty(r.LANGUAGE),
      price: parseFloatOr(r.PRICE),
      maturityRating: nullIfEmpty(r.MATURITY_RATING),
      releaseDate: parseDate(r.RELEASE_DATE) ?? new Date("1970-01-01"),
    };
    await prisma.movie.upsert({
      where: { movieId: data.movieId },
      create: data,
      update: data,
    });
  }
  console.log(`  seeded movie (${rows.length} rows)`);
}

async function seedShows() {
  const path = findJson("SHOW");
  if (!path) return console.log("  skip SHOW (no JSON)");
  const rows = readJson(path);
  for (const r of rows) {
    const data = {
      showId: parseIntOr(r.SHOW_ID),
      title: r.TITLE ?? "",
      startDate: parseDate(r.START_DATE),
      endDate: parseDate(r.END_DATE),
      country: nullIfEmpty(r.COUNTRY),
      rating: parseFloatOr(r.RATING),
      totalViews: parseIntOr(r.TOTAL_VIEWS),
      totalVotes: parseIntOr(r.TOTAL_VOTES),
      description: nullIfEmpty(r.DESCRIPTION),
      imageUrl: nullIfEmpty(r.IMAGE_URL),
      videoUrl: nullIfEmpty(r.VIDEO_URL),
      length: parseFloatOr(r.LENGTH),
      language: nullIfEmpty(r.LANGUAGE),
      seasons: parseIntOr(r.SEASONS),
      episodes: parseIntOr(r.EPISODES),
      price: parseFloatOr(r.PRICE),
      maturityRating: nullIfEmpty(r.MATURITY_RATING),
    };
    await prisma.show.upsert({
      where: { showId: data.showId },
      create: data,
      update: data,
    });
  }
  console.log(`  seeded show (${rows.length} rows)`);
}

async function seedEpisodes() {
  const path = findJson("EPISODE");
  if (!path) return console.log("  skip EPISODE (no JSON)");
  const rows = readJson(path);
  let count = 0;
  for (const r of rows) {
    const showId = parseIntOr(r.SHOW_ID);
    const seasonNo = parseIntOr(r.SEASON_NO);
    const episodeNo = parseIntOr(r.EPISODE_NO);
    if (!showId) continue;
    const data = {
      showId,
      seasonNo,
      episodeNo,
      title: nullIfEmpty(r.TITLE),
      description: nullIfEmpty(r.DESCRIPTION),
      length: r.LENGTH && r.LENGTH !== "" ? parseFloatOr(r.LENGTH) : null,
      imageUrl: nullIfEmpty(r.IMAGE_URL),
      videoUrl: nullIfEmpty(r.VIDEO_URL),
    };
    await prisma.episode.upsert({
      where: { seasonNo_episodeNo_showId: { seasonNo, episodeNo, showId } },
      create: data,
      update: data,
    });
    count++;
  }
  console.log(`  seeded episode (${count} rows)`);
}

async function seedMovieGenre() {
  const path = findJson("MOVIE_GENRE");
  if (!path) return console.log("  skip MOVIE_GENRE (no JSON)");
  const rows = readJson(path);
  let count = 0;
  for (const r of rows) {
    const movieId = parseIntOr(r.MOVIE_ID);
    const genreId = parseIntOr(r.GENRE_ID);
    if (!movieId || !genreId) continue;
    await prisma.movieGenre.upsert({
      where: { movieId_genreId: { movieId, genreId } },
      create: { movieId, genreId },
      update: {},
    });
    count++;
  }
  console.log(`  seeded movie_genre (${count} rows)`);
}

async function seedMovieCeleb() {
  const path = findJson("MOVIE_CELEB");
  if (!path) return console.log("  skip MOVIE_CELEB (no JSON)");
  const rows = readJson(path);
  let count = 0;
  for (const r of rows) {
    const movieId = parseIntOr(r.MOVIE_ID);
    const celebId = parseIntOr(r.CELEB_ID);
    if (!movieId || !celebId) continue;
    const role = nullIfEmpty(r.ROLE);
    await prisma.movieCeleb.upsert({
      where: { movieId_celebId: { movieId, celebId } },
      create: { movieId, celebId, role },
      update: { role },
    });
    count++;
  }
  console.log(`  seeded movie_celeb (${count} rows)`);
}

async function seedShowGenre() {
  const path = findJson("SHOW_GENRE");
  if (!path) return console.log("  skip SHOW_GENRE (no JSON)");
  const rows = readJson(path);
  let count = 0;
  for (const r of rows) {
    const showId = parseIntOr(r.SHOW_ID);
    const genreId = parseIntOr(r.GENRE_ID);
    if (!showId || !genreId) continue;
    await prisma.showGenre.upsert({
      where: { showId_genreId: { showId, genreId } },
      create: { showId, genreId },
      update: {},
    });
    count++;
  }
  console.log(`  seeded show_genre (${count} rows)`);
}

async function seedShowCeleb() {
  const path = findJson("SHOW_CELEB");
  if (!path) return console.log("  skip SHOW_CELEB (no JSON)");
  const rows = readJson(path);
  let count = 0;
  for (const r of rows) {
    const showId = parseIntOr(r.SHOW_ID);
    const celebId = parseIntOr(r.CELEB_ID);
    if (!showId || !celebId) continue;
    const role = nullIfEmpty(r.ROLE);
    await prisma.showCeleb.upsert({
      where: { showId_celebId: { showId, celebId } },
      create: { showId, celebId, role },
      update: { role },
    });
    count++;
  }
  console.log(`  seeded show_celeb (${count} rows)`);
}

async function main() {
  if (!existsSync(SEED_DATA_DIR)) {
    console.warn(`SEED_DATA_DIR not found: ${SEED_DATA_DIR} — seeding only subscription_type`);
    await seedSubscriptionTypes();
    return;
  }

  console.log(`Seeding from ${SEED_DATA_DIR}`);
  await seedSubscriptionTypes();
  await seedUsers();
  await seedProfiles();
  await seedGenres();
  await seedCelebs();
  await seedMovies();
  await seedShows();
  await seedEpisodes();
  await seedMovieGenre();
  await seedMovieCeleb();
  await seedShowGenre();
  await seedShowCeleb();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
