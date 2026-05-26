"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardActionArea, CardContent, Container, Grid, Typography } from "@mui/material";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

interface Profile {
  PROFILE_ID: string;
  DOB: string | null;
}

export default function ProfilesPage() {
  const auth = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) return;
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => setProfiles(res.data.profile ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  function selectProfile(profileId: string) {
    const idx = profiles.findIndex((p) => p.PROFILE_ID === profileId);
    if (idx >= 0) auth.set_ptbd(idx);
    router.push(ROUTES.BROWSE);
  }

  return (
    <Container sx={{ mt: 4, color: "#fff" }} maxWidth="md">
      <Typography variant="h4" align="center" sx={{ mb: 4 }}>
        Who&apos;s watching?
      </Typography>

      {loading && <Typography align="center">Loading...</Typography>}

      <Grid container spacing={3} justifyContent="center">
        {profiles.map((p) => (
          <Grid item key={p.PROFILE_ID} xs={6} sm={4} md={3}>
            <Card sx={{ background: "#333", color: "#fff", cursor: "pointer" }}>
              <CardActionArea onClick={() => selectProfile(p.PROFILE_ID)}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "#e50914",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 1,
                      fontSize: 32,
                      fontWeight: "bold",
                    }}
                  >
                    {p.PROFILE_ID.charAt(0).toUpperCase()}
                  </Box>
                  <Typography variant="body1">{p.PROFILE_ID}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button variant="outlined" color="inherit" component={Link} href={ROUTES.CREATE_PROFILE}>
          + Create Profile
        </Button>
      </Box>
    </Container>
  );
}
