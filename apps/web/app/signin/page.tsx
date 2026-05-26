"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, Container, Paper, TextField, Typography, Alert } from "@mui/material";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

interface LoginResponse {
  EMAIL: string;
  token: string;
}

interface MaxProfilesResponse {
  mp: { MAX_PROFILES: number };
}

interface NumProfilesResponse {
  C: { C: number };
}

interface SubIdResponse {
  sub_id: { SUB_ID: number } | null;
}

interface BillResponse {
  bill: { BILL: number };
}

export default function SignInPage() {
  const router = useRouter();
  const auth = useAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isInvalid = password === "" || emailAddress === "";

  async function handleSignin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data, status } = await api.post<LoginResponse>(
        "/api/users/login",
        { EMAIL: emailAddress, PASSWORD: password },
        { validateStatus: () => true },
      );

      if (status === 422) {
        setError("User does not exist. Please sign up instead");
        return;
      }
      if (status === 423) {
        setError("Incorrect Password");
        return;
      }
      if (status !== 201) {
        setError("Login failed");
        return;
      }

      auth.login(emailAddress, data.token);

      // Hydrate auth context with profile + subscription metadata, mirroring legacy flow.
      const mp = await api.get<MaxProfilesResponse>(`/api/users/maxprofiles/${emailAddress}`);
      auth.set_max_profiles(mp.data.mp.MAX_PROFILES);

      const np = await api.get<NumProfilesResponse>(`/api/users/numprofiles/${emailAddress}`);
      auth.set_num_profiles(np.data.C.C);

      const sub = await api.get<SubIdResponse>(`/api/subscription/subid/${emailAddress}`);
      if (sub.data.sub_id?.SUB_ID) {
        const subId = sub.data.sub_id.SUB_ID;
        auth.set_sub_id(subId);
        const bill = await api.get<BillResponse>(`/api/subscription/bill/${subId}`);
        auth.set_bill(bill.data.bill.BILL);
        router.push(ROUTES.BROWSE);
      } else {
        router.push(ROUTES.ADD_SUBSCRIPTION);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, background: "#141414", color: "#fff" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign In
        </Typography>
        {error && (
          <Alert severity="error" data-testid="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSignin} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email address"
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            variant="filled"
            fullWidth
            required
            InputProps={{ sx: { background: "#333", color: "#fff" } }}
            InputLabelProps={{ sx: { color: "#aaa" } }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            data-testid="sign-in"
            fullWidth
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </Box>
        <Typography sx={{ mt: 3, color: "#aaa" }}>
          New to StreamFlare?{" "}
          <Link href={ROUTES.SIGN_UP} style={{ color: "#fff", textDecoration: "underline" }}>
            Sign up now.
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
