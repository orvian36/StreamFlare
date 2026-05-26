import { Corpus } from "tiny-tfidf";
import { prisma } from "@streamflare/db";

type SimilarityType = "movie" | "show";

function cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (const [, w] of v1) mag1 += w * w;
  for (const [, w] of v2) mag2 += w * w;
  if (mag1 === 0 || mag2 === 0) return 0;
  for (const [term, w] of v1) {
    const w2 = v2.get(term);
    if (w2 != null) dot += w * w2;
  }
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

export async function computeBulkSimilarity(type: SimilarityType): Promise<number> {
  let rows: Array<{ id: number; description: string }>;

  if (type === "movie") {
    const movies = await prisma.movie.findMany({
      where: { description: { not: null } },
      select: { movieId: true, description: true },
    });
    rows = movies.map((m) => ({ id: m.movieId, description: m.description as string }));
  } else {
    const shows = await prisma.show.findMany({
      where: { description: { not: null } },
      select: { showId: true, description: true },
    });
    rows = shows.map((s) => ({ id: s.showId, description: s.description as string }));
  }

  if (rows.length < 2) return 0;

  const names = rows.map((r) => String(r.id));
  const texts = rows.map((r) => r.description);
  const corpus = new Corpus(names, texts);
  const vectors = new Map<string, Map<string, number>>();
  for (const name of names) {
    vectors.set(name, corpus.getDocumentVector(name));
  }

  let written = 0;
  const batchSize = 500;
  const batch: Array<{ id1: number; id2: number; score: number }> = [];

  for (let i = 0; i < rows.length; i++) {
    const rowI = rows[i];
    if (!rowI) continue;
    const vi = vectors.get(String(rowI.id));
    if (!vi) continue;
    for (let j = i + 1; j < rows.length; j++) {
      const rowJ = rows[j];
      if (!rowJ) continue;
      const vj = vectors.get(String(rowJ.id));
      if (!vj) continue;
      const score = cosineSimilarity(vi, vj);
      if (score <= 0.05) continue;
      batch.push({ id1: rowI.id, id2: rowJ.id, score });
      if (batch.length >= batchSize) {
        await flushBatch(type, batch);
        written += batch.length;
        batch.length = 0;
      }
    }
  }
  if (batch.length > 0) {
    await flushBatch(type, batch);
    written += batch.length;
  }

  return written;
}

async function flushBatch(
  type: SimilarityType,
  batch: Array<{ id1: number; id2: number; score: number }>,
) {
  if (type === "movie") {
    await prisma.$transaction(
      batch.map(({ id1, id2, score }) =>
        prisma.movieSimilarity.upsert({
          where: { movieId1_movieId2: { movieId1: id1, movieId2: id2 } },
          create: { movieId1: id1, movieId2: id2, score },
          update: { score },
        }),
      ),
    );
  } else {
    await prisma.$transaction(
      batch.map(({ id1, id2, score }) =>
        prisma.showSimilarity.upsert({
          where: { showId1_showId2: { showId1: id1, showId2: id2 } },
          create: { showId1: id1, showId2: id2, score },
          update: { score },
        }),
      ),
    );
  }
}
