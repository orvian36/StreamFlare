"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardActions, CardContent, Container, Grid, Typography, Alert } from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

interface Plan {
  SUB_TYPE: string;
  BILL: number;
  NUM_PROFILES: number;
}

export default function AddSubscriptionPage() {
  const auth = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ plans: Plan[] }>("/api/subscription/plans").then((r) => setPlans(r.data.plans));
  }, []);

  async function choose(planType: string) {
    if (!auth.email) {
      setError("Not signed in");
      return;
    }
    setSubmitting(planType);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    try {
      const { status } = await api.post(
        "/api/subscription/add",
        {
          EMAIL: auth.email,
          SUB_TYPE: planType,
          END_DATE: oneMonthFromNow.toISOString().slice(0, 10),
        },
        { validateStatus: () => true },
      );
      if (status === 201) {
        router.push(ROUTES.BROWSE);
      } else {
        setError("Failed to subscribe");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Container sx={{ mt: 4, color: "#fff" }} maxWidth="md">
      <Typography variant="h4">Choose your plan</Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {plans.map((p) => (
          <Grid item xs={12} md={4} key={p.SUB_TYPE}>
            <Card sx={{ background: "#222", color: "#fff" }}>
              <CardContent>
                <Typography variant="h5">{p.SUB_TYPE}</Typography>
                <Typography>${p.BILL}/month</Typography>
                <Typography>Up to {p.NUM_PROFILES} profiles</Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  disabled={submitting === p.SUB_TYPE}
                  onClick={() => choose(p.SUB_TYPE)}
                >
                  {submitting === p.SUB_TYPE ? "Subscribing..." : "Subscribe"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
