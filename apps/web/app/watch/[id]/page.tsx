"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Container, Typography } from "@mui/material";
import { api } from "../../../lib/api-client";

interface GenreRow {
  NAME: string | null;
  TOTAL_VIEWS: number;
  TOTAL_VOTES: number;
}

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<GenreRow[]>(`/api/browse/genre?movie_id=${params.id}`)
      .then((res) => setGenres(res.data))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <Container sx={{ mt: 4, color: "#fff" }}>
      <Button onClick={() => router.back()} variant="text" color="inherit">
        ← Back
      </Button>
      <Typography variant="h4" sx={{ mt: 2 }}>Movie #{params.id}</Typography>
      {loading ? (
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography>Genres: {genres.map((g) => g.NAME).filter(Boolean).join(", ") || "—"}</Typography>
          <Typography>Views: {genres[0]?.TOTAL_VIEWS ?? 0}</Typography>
        </Box>
      )}
      <Box
        component="video"
        controls
        sx={{ width: "100%", mt: 3, background: "#000" }}
        src="/placeholder.mp4"
      />
    </Container>
  );
}
