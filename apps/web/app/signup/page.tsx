"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CountryDropdown } from "react-country-region-selector";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

interface SignupResponse {
  EMAIL: string;
  token: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [creditCard, setCreditCard] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isInvalid =
    name === "" || email === "" || dob === "" || password === "" || creditCard === "" || phone === "";

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Password should be at least 8 characters long");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { data, status } = await api.post<SignupResponse>(
        "/api/users/signup",
        {
          NAME: name,
          EMAIL: email,
          DOB: dob,
          COUNTRY: country,
          CREDIT_CARD: creditCard,
          PASSWORD: password,
          PHONE: phone,
        },
        { validateStatus: () => true },
      );

      if (status === 422) {
        setError("Invalid user info");
        return;
      }
      if (status === 423) {
        setError("User already exists");
        return;
      }
      if (status !== 201) {
        setError("Signup failed");
        return;
      }

      auth.login(email, data.token);
      router.push(ROUTES.ADD_SUBSCRIPTION);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldSx = {
    InputProps: { sx: { background: "#333", color: "#fff" } },
    InputLabelProps: { sx: { color: "#aaa" } },
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, background: "#141414", color: "#fff" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign Up
        </Typography>
        {error && (
          <Alert severity="error" data-testid="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSignup} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} variant="filled" fullWidth required {...fieldSx} />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} variant="filled" fullWidth required {...fieldSx} />
          <TextField label="Password (min 8 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} variant="filled" fullWidth required {...fieldSx} />
          <TextField label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} variant="filled" fullWidth required InputLabelProps={{ shrink: true, sx: { color: "#aaa" } }} InputProps={{ sx: { background: "#333", color: "#fff" } }} />
          <TextField label="Credit Card No." value={creditCard} onChange={(e) => setCreditCard(e.target.value)} variant="filled" fullWidth required {...fieldSx} />
          <TextField label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} variant="filled" fullWidth required {...fieldSx} />
          <Box>
            <Typography sx={{ mb: 1, color: "#aaa" }}>Country</Typography>
            <div
              style={{
                background: "#333",
                color: "white",
                border: "1px solid #555",
                borderRadius: 4,
              }}
            >
              <CountryDropdown
                value={country}
                onChange={(val) => setCountry(val)}
                classes="country-dropdown-inner"
              />
            </div>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={isInvalid || submitting}
            data-testid="sign-up"
            fullWidth
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </Button>
        </Box>
        <Typography sx={{ mt: 3, color: "#aaa" }}>
          Already a user?{" "}
          <Link href={ROUTES.SIGN_IN} style={{ color: "#fff", textDecoration: "underline" }}>
            Sign in now
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
