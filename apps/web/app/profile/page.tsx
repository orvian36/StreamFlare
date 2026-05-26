"use client";

import Link from "next/link";
import { Box, Button, Container, Divider, Typography } from "@mui/material";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export default function ProfileInfoPage() {
  const auth = useAuth();
  const maxProfiles = auth.max_profiles ?? 0;
  const numProfiles = auth.num_profiles ?? 0;
  const canCreate = numProfiles < maxProfiles;

  return (
    <Container maxWidth="sm" sx={{ mt: 6, color: "#fff" }}>
      <Typography variant="h4" gutterBottom>Profile Info</Typography>
      <Divider sx={{ my: 2, borderColor: "#333" }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 4 }}>
        <Typography>
          Max profiles allowed: <strong>{maxProfiles}</strong>
        </Typography>
        <Typography>
          Current profiles: <strong>{numProfiles}</strong>
        </Typography>
        <Typography color={canCreate ? "#4caf50" : "#e57373"}>
          {canCreate
            ? `You can create ${maxProfiles - numProfiles} more profile(s).`
            : "You have reached the maximum number of profiles for your plan."}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="contained" color="error" component={Link} href={ROUTES.PROFILES}>
          Go to Profiles
        </Button>
        {canCreate && (
          <Button variant="outlined" color="inherit" component={Link} href={ROUTES.CREATE_PROFILE}>
            Create Profile
          </Button>
        )}
        {!canCreate && (
          <Button variant="outlined" color="error" component={Link} href={ROUTES.DELETE_PROFILE}>
            Delete a Profile
          </Button>
        )}
      </Box>
    </Container>
  );
}
