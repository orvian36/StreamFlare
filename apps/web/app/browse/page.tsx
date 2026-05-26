"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

interface MovieRow {
  MOVIE_ID: number;
  TITLE: string;
  IMAGE_URL: string | null;
  DESCRIPTION: string | null;
  RATING: number;
  RELEASE_DATE: number | null;
}

interface ShowRow {
  SHOW_ID: number;
  TITLE: string;
  IMAGE_URL: string | null;
  DESCRIPTION: string | null;
  RATING: number;
}

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w300";

export default function BrowsePage() {
  const auth = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"movies" | "shows">("movies");
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ movies: MovieRow[] }>("/api/browse/movies/all"),
      api.get<{ shows: ShowRow[] }>("/api/browse/shows/all"),
    ])
      .then(([m, s]) => {
        setMovies(m.data.movies.slice(0, 60));
        setShows(s.data.shows.slice(0, 60));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <AppBar position="static" color="default" sx={{ background: "#141414", color: "#fff" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">StreamFlare</Typography>
          <Box>
            <Button color="inherit" component={Link} href={ROUTES.PROFILE_INFO}>Profile</Button>
            <Button color="inherit" component={Link} href={ROUTES.ACCOUNT_SETTINGS}>Account</Button>
            <Button color="inherit" onClick={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}>Sign out</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 3, color: "#fff" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="primary">
          <Tab value="movies" label="Movies" />
          <Tab value="shows" label="Shows" />
        </Tabs>

        {loading && <Typography sx={{ mt: 4 }}>Loading...</Typography>}

        {tab === "movies" && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {movies.map((m) => (
              <Grid key={m.MOVIE_ID} item xs={6} sm={4} md={3} lg={2}>
                <Card sx={{ background: "#222", color: "#fff" }}>
                  <CardActionArea component={Link} href={`/watch/${m.MOVIE_ID}`}>
                    {m.IMAGE_URL && <CardMedia component="img" image={`${TMDB_IMG_BASE}${m.IMAGE_URL}`} alt={m.TITLE} sx={{ height: 240, objectFit: "cover" }} />}
                    <CardContent>
                      <Typography variant="body2" noWrap>{m.TITLE}</Typography>
                      <Typography variant="caption" color="#aaa">★ {m.RATING.toFixed(1)}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === "shows" && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {shows.map((s) => (
              <Grid key={s.SHOW_ID} item xs={6} sm={4} md={3} lg={2}>
                <Card sx={{ background: "#222", color: "#fff" }}>
                  <CardContent>
                    {s.IMAGE_URL && <CardMedia component="img" image={`${TMDB_IMG_BASE}${s.IMAGE_URL}`} alt={s.TITLE} sx={{ height: 240, objectFit: "cover" }} />}
                    <Typography variant="body2" noWrap>{s.TITLE}</Typography>
                    <Typography variant="caption" color="#aaa">★ {s.RATING.toFixed(1)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
