"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, Typography } from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

export default function CancelSubscriptionPage() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    if (!auth.email) { setError("Not signed in"); return; }
    setError("");
    setSubmitting(true);
    try {
      const { status } = await api.patch(
        "/api/subscription/delete",
        { EMAIL: auth.email },
        { validateStatus: () => true },
      );
      if (status === 201) {
        router.push(ROUTES.ADD_SUBSCRIPTION);
      } else if (status === 422) {
        setError("Invalid user info");
      } else {
        setError("Failed to cancel subscription");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, color: "#fff" }}>
      <Typography variant="h4" gutterBottom>Cancel Membership?</Typography>
      <Typography color="#aaa" sx={{ mb: 3 }}>
        Are you sure you want to cancel your StreamFlare membership? You will lose access at the end of your billing period.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="error"
          disabled={submitting}
          onClick={handleCancel}
          data-testid="cancel"
          fullWidth
        >
          {submitting ? "Cancelling..." : "Yes, Cancel"}
        </Button>
        <Button variant="outlined" color="inherit" component={Link} href={ROUTES.ACCOUNT_SETTINGS} fullWidth>
          Go back
        </Button>
      </Box>
    </Container>
  );
}
