'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Profiles } from '@streamflare/ui';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import * as ROUTES from '../../constants/routes';

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
    if (!auth.email) {
      router.push(ROUTES.SIGN_IN);
      return;
    }
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => {
        const profileList = res.data.profile ?? [];
        setProfiles(profileList);
        auth.set_num_profiles(profileList.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [auth.email, router]);

  function selectProfile(profileId: string) {
    const idx = profiles.findIndex((p) => p.PROFILE_ID === profileId);
    if (idx >= 0) {
      auth.set_ptbd(idx);
      auth.set_profile(profileId);
    }
    router.push(ROUTES.BROWSE);
  }

  return (
    <>
      <Header bg={false}>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
          {profiles.length < (auth.max_profiles ?? 0) ? (
            <Header.ButtonLink to={ROUTES.CREATE_PROFILE}>Create Profile</Header.ButtonLink>
          ) : (
            <Header.ButtonLink
              to={ROUTES.SIGN_IN}
              onClick={() => {
                auth.logout();
              }}
            >
              Log Out
            </Header.ButtonLink>
          )}
        </Header.Frame>
      </Header>

      <Profiles>
        <Profiles.Title>Who&apos;s watching?</Profiles.Title>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', marginTop: '20px' }}>Loading...</div>
        ) : (
          <Profiles.List>
            {profiles.map((p, index) => (
              <Profiles.User key={p.PROFILE_ID} onClick={() => selectProfile(p.PROFILE_ID)}>
                <Profiles.Picture src={(index + 1).toString()} />
                <Profiles.Name>{p.PROFILE_ID}</Profiles.Name>
              </Profiles.User>
            ))}
          </Profiles.List>
        )}
      </Profiles>
    </>
  );
}
