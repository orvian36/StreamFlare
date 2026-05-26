"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

interface ShowHistoryRecord {
  TITLE: string;
  PID: string;
  SEASON_NO: number | null;
  EPISODE_NO: number | null;
  RATING: number | null;
  WATCHED_UPTO: string | null;
  TIME: string | null;
}

export default function ShowHistoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<ShowHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) return;
    api
      .get<{ history: ShowHistoryRecord[] }>(`/api/users/getshowhistory/${auth.email}`)
      .then((res) => setHistory(res.data.history ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  return (
    <Container sx={{ mt: 4, color: "#fff" }} maxWidth="lg">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button variant="text" color="inherit" onClick={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>
          ← Back
        </Button>
        <Typography variant="h4">Show Watch History</Typography>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : history.length === 0 ? (
        <Typography color="#aaa">No show watch history found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ background: "#222" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Title</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Profile</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Season</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Episode</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Rating</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Watched Upto</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Date/Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ color: "#ccc" }}>{row.TITLE}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.PID}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.SEASON_NO ?? "—"}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.EPISODE_NO ?? "—"}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.RATING ?? "—"}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.WATCHED_UPTO ?? "—"}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.TIME ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
