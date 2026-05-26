"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

interface Profile {
  PROFILE_ID: string;
}

export default function DeleteProfilePage() {
  const auth = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.email) return;
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => setProfiles(res.data.profile ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth.email || !selected) { setError("Select a profile to delete"); return; }
    setError("");
    setSubmitting(true);
    try {
      const { status } = await api.delete("/api/profiles/delete", {
        data: { EMAIL: auth.email, PROFILE_ID: selected },
        validateStatus: () => true,
      });
      if (status === 200 || status === 201) {
        router.push(ROUTES.BROWSE);
      } else if (status === 422) {
        setError("Invalid user info");
      } else {
        setError("Failed to delete profile");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, color: "#fff" }}>
      <Typography variant="h4" gutterBottom>Delete Profile</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl>
            <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
              {profiles.map((p) => (
                <FormControlLabel
                  key={p.PROFILE_ID}
                  value={p.PROFILE_ID}
                  control={<Radio sx={{ color: "#fff" }} />}
                  label={p.PROFILE_ID}
                  sx={{ color: "#fff" }}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={!selected || submitting}
            data-testid="delete"
            fullWidth
          >
            {submitting ? "Deleting..." : "Delete Profile"}
          </Button>
        </Box>
      )}
    </Container>
  );
}
