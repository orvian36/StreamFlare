"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container, List, ListItem, ListItemButton, ListItemText, Typography, Button, Divider } from "@mui/material";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.email) return;
    api
      .get<{ ed: { ED: string } | null }>(`/api/subscription/getenddate/${auth.email}`)
      .then((res) => setEndDate(res.data.ed?.ED ?? null))
      .catch(() => setEndDate(null));
  }, [auth.email]);

  const planLabel =
    auth.bill === 5
      ? "Basic Plan (up to 2 profiles)"
      : auth.bill === 8
      ? "Standard Plan (up to 4 profiles)"
      : auth.bill === 10
      ? "Premium Plan (up to 6 profiles)"
      : "Subscribe now";

  return (
    <Container sx={{ mt: 4, color: "#fff" }} maxWidth="sm">
      <Typography variant="h4">Account Settings</Typography>
      <Typography sx={{ mt: 2 }} color="#aaa">{auth.email}</Typography>
      <Divider sx={{ my: 2, borderColor: "#333" }} />
      <Typography variant="h6">Membership and billing</Typography>
      <Typography color="#aaa">{planLabel}</Typography>
      {endDate && <Typography color="#aaa">Renews {endDate}</Typography>}
      {auth.bill ? <Typography color="#aaa">Monthly ${auth.bill}</Typography> : null}

      <List sx={{ mt: 2 }}>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.UPDATE_SUBSCRIPTION}>
            <ListItemText primary="Change your plan" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.SUBSCRIPTION_HISTORY}>
            <ListItemText primary="Subscription history" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.CANCEL_SUBCRIPTION}>
            <ListItemText primary="Cancel membership" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 2, borderColor: "#333" }} />
      <Typography variant="h6">Settings</Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.MOVIE_HISTORY}>
            <ListItemText primary="Movie watch history" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.SHOW_HISTORY}>
            <ListItemText primary="Show watch history" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.UPDATE_PHONE}>
            <ListItemText primary="Update phone" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.UPDATE_PASSWORD}>
            <ListItemText primary="Update password" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={ROUTES.DELETE_PROFILE}>
            <ListItemText primary="Delete a profile" />
          </ListItemButton>
        </ListItem>
      </List>

      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        color="error"
        onClick={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}
      >
        Sign out
      </Button>
    </Container>
  );
}
