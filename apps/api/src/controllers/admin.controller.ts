import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";

export async function overview(_req: Request, res: Response, _next: NextFunction) {
  try {
    const [users, profiles, movies, shows, subscriptions, rev] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.movie.count(),
      prisma.show.count(),
      prisma.subscription.count(),
      prisma.subscription.aggregate({ _sum: { totalBill: true } }),
    ]);

    const [mViews, sViews, mRated, sRated] = await Promise.all([
      prisma.movie.findMany({ orderBy: { totalViews: "desc" }, take: 8, select: { title: true, totalViews: true } }),
      prisma.show.findMany({ orderBy: { totalViews: "desc" }, take: 8, select: { title: true, totalViews: true } }),
      prisma.movie.findMany({ orderBy: { rating: "desc" }, take: 8, select: { title: true, rating: true } }),
      prisma.show.findMany({ orderBy: { rating: "desc" }, take: 8, select: { title: true, rating: true } }),
    ]);
    const trending = [...mViews, ...sViews]
      .map((t) => ({ title: t.title, views: t.totalViews }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
    const topRated = [...mRated, ...sRated]
      .map((t) => ({ title: t.title, rating: t.rating }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    const [mg, sg] = await Promise.all([
      prisma.movieGenre.groupBy({ by: ["genreId"], _count: { _all: true } }),
      prisma.showGenre.groupBy({ by: ["genreId"], _count: { _all: true } }),
    ]);
    const counts = new Map<number, number>();
    for (const g of mg) counts.set(g.genreId, (counts.get(g.genreId) ?? 0) + g._count._all);
    for (const g of sg) counts.set(g.genreId, (counts.get(g.genreId) ?? 0) + g._count._all);
    const genreRows = counts.size
      ? await prisma.genre.findMany({ where: { genreId: { in: [...counts.keys()] } }, select: { genreId: true, name: true } })
      : [];
    const genres = genreRows
      .map((gr) => ({ name: gr.name ?? "Unknown", count: counts.get(gr.genreId) ?? 0 }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({
      totals: { users, profiles, movies, shows, subscriptions },
      revenue: rev._sum.totalBill ?? 0,
      trending,
      topRated,
      genres,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}
