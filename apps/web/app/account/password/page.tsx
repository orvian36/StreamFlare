"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

export default function UpdatePasswordPage() {
  const auth = useAuth();
  const router = useRouter();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassCon, setNewPassCon] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isInvalid = oldPass === "" || newPass === "" || newPassCon === "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth.email) { setError("Not signed in"); return; }
    setError("");
    setSubmitting(true);
    try {
      const { status } = await api.patch(
        "/api/users/updatepassword",
        {
          EMAIL: auth.email,
          OLD_PASS: oldPass,
          NEW_PASS: newPass,
          NEW_PASS_CON: newPassCon,
        },
        { validateStatus: () => true },
      );
      if (status === 201) {
        router.push(ROUTES.BROWSE);
      } else if (status === 422) {
        setError("Incorrect password");
      } else if (status === 423) {
        setError("New passwords don't match");
      } else {
        setError("Failed to update password");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, color: "#fff" }}>
      <Typography variant="h4" gutterBottom>Update Password</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Old Password"
          type="password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          variant="filled"
          fullWidth
          required
          InputProps={{ sx: { background: "#333", color: "#fff" } }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        <TextField
          label="New Password"
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          variant="filled"
          fullWidth
          required
          InputProps={{ sx: { background: "#333", color: "#fff" } }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={newPassCon}
          onChange={(e) => setNewPassCon(e.target.value)}
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
          disabled={isInvalid || submitting}
          data-testid="update-pw"
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
