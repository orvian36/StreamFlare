"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

export default function UpdatePhonePage() {
  const auth = useAuth();
  const router = useRouter();
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.email) return;
    api
      .get<{ phone: { PHONE: string } }>(`/api/users/getphone/${auth.email}`)
      .then((res) => setCurrentPhone(res.data.phone?.PHONE ?? null))
      .catch(() => setCurrentPhone(null));
  }, [auth.email]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth.email) { setError("Not signed in"); return; }
    if (!newPhone) { setError("Enter a phone number"); return; }
    setError("");
    setSubmitting(true);
    try {
      const { status } = await api.patch(
        "/api/users/updatephone",
        { EMAIL: auth.email, Phone: newPhone },
        { validateStatus: () => true },
      );
      if (status === 201) {
        router.push(ROUTES.ACCOUNT_SETTINGS);
      } else if (status === 422) {
        setError("Invalid user info");
      } else {
        setError("Failed to update phone");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, color: "#fff" }}>
      <Typography variant="h4" gutterBottom>Update Phone</Typography>
      {currentPhone && (
        <Typography color="#aaa" sx={{ mb: 2 }}>
          Current number: {currentPhone}
        </Typography>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="New Phone Number"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          variant="filled"
          fullWidth
          required
          InputProps={{ sx: { background: "#333", color: "#fff" } }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        <Button
          type="submit"
          variant="contained"
          color="error"
          disabled={!newPhone || submitting}
          data-testid="update"
          fullWidth
        >
          {submitting ? "Updating..." : "Update"}
        </Button>
        <Button variant="text" color="inherit" onClick={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>
          Cancel
        </Button>
      </Box>
    </Container>
  );
}
