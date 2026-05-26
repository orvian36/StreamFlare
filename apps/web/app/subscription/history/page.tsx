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

interface SubscriptionRecord {
  S_DATE: string;
  T_DATE: string;
  SUB_TYPE: string;
  TOTAL_BILL: number;
}

export default function SubscriptionHistoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) return;
    api
      .get<{ history: SubscriptionRecord[] }>(`/api/subscription/history/${auth.email}`)
      .then((res) => setHistory(res.data.history ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  return (
    <Container sx={{ mt: 4, color: "#fff" }} maxWidth="md">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button variant="text" color="inherit" onClick={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>
          ← Back
        </Button>
        <Typography variant="h4">Payment History</Typography>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : history.length === 0 ? (
        <Typography color="#aaa">No subscription history found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ background: "#222" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Start Date</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>End Date</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Plan Type</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Total Bill</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ color: "#ccc" }}>{row.S_DATE}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.T_DATE}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{row.SUB_TYPE}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>${row.TOTAL_BILL}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
