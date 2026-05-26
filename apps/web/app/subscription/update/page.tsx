"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardActions, CardContent, Container, Grid, Typography } from "@mui/material";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

interface Plan {
  SUB_TYPE: string;
  BILL: number;
  NUM_PROFILES: number;
}

export default function UpdateSubscriptionPage() {
  const auth = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ plans: Plan[] }>("/api/subscription/plans").then((r) => setPlans(r.data.plans));
  }, []);

  async function choose(plan: Plan) {
    if (!auth.email) { setError("Not signed in"); return; }
    setSubmitting(plan.SUB_TYPE);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    try {
      const { status } = await api.post(
        "/api/subscription/update",
        {
          EMAIL: auth.email,
          SUB_TYPE: plan.SUB_TYPE,
          END_DATE: oneMonthFromNow.toISOString().slice(0, 10),
        },
        { validateStatus: () => true },
      );
      if (status === 201) {
        // Update auth context to reflect new plan
        auth.set_bill(plan.BILL);
        auth.set_max_profiles(plan.NUM_PROFILES);
        const np = auth.num_profiles ?? 0;
        if (np > plan.NUM_PROFILES) {
          auth.set_ptbd(np - plan.NUM_PROFILES);
          router.push(ROUTES.DELETE_PROFILE);
        } else {
          router.push(ROUTES.BROWSE);
        }
      } else if (status === 422) {
        setError("Invalid user info");
      } else {
        setError("Failed to update subscription");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Container sx={{ mt: 4, color: "#fff" }} maxWidth="md">
      <Typography variant="h4">Change your plan</Typography>
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
                  onClick={() => choose(p)}
                >
                  {submitting === p.SUB_TYPE ? "Updating..." : "Select Plan"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Button variant="text" color="inherit" onClick={() => router.back()}>← Back</Button>
      </Box>
    </Container>
  );
}
