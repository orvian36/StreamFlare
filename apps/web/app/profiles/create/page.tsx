"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

export default function CreateProfilePage() {
  const auth = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isInvalid = name === "" || dob === "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth.email) { setError("Not signed in"); return; }
    setError("");
    setSubmitting(true);
    try {
      const { status } = await api.post(
        "/api/profiles/add",
        { EMAIL: auth.email, PROFILE_ID: name, DOB: dob },
        { validateStatus: () => true },
      );
      if (status === 201) {
        router.push(ROUTES.BROWSE);
      } else if (status === 400) {
        setError("Invalid profile info");
      } else if (status === 423) {
        setError("Profile already exists");
      } else {
        setError("Failed to create profile");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, color: "#fff" }}>
      <Typography variant="h4" gutterBottom>Add Profile</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="filled"
          fullWidth
          required
          InputProps={{ sx: { background: "#333", color: "#fff" } }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        <TextField
          label="Date of Birth"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          variant="filled"
          fullWidth
          required
          InputProps={{ sx: { background: "#333", color: "#fff" } }}
          InputLabelProps={{ sx: { color: "#aaa" }, shrink: true }}
        />
        <Button
          type="submit"
          variant="contained"
          color="error"
          disabled={isInvalid || submitting}
          data-testid="create-profile"
          fullWidth
        >
          {submitting ? "Creating..." : "Add Profile"}
        </Button>
      </Box>
    </Container>
  );
}
