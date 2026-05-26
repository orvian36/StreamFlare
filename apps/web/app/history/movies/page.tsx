'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Header } from '@streamflare/ui';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import * as ROUTES from '../../../constants/routes';
import { FooterContainer } from '../../../containers/footer';

interface MovieHistoryRecord {
  TITLE: string;
  PID: string;
  RATING: number | null;
  WATCHED_UPTO: string | null;
  TIME: string | null;
}

const HistoryContainer = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  color: white;
  min-height: 50vh;
`;

const PageTitle = styled.h1`
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: bold;
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid #555;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  &:hover {
    background: white;
    color: black;
    border-color: white;
  }
`;

const Card = styled.div`
  background: #181818;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #e50914;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const MovieTitle = styled.h2`
  color: #fff;
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 10px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 15px;
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const InfoBox = styled.div`
  font-size: 14px;
  color: #aaa;
`;

const Label = styled.div`
  font-weight: bold;
  color: #777;
  text-transform: uppercase;
  font-size: 11px;
  margin-bottom: 4px;
`;

const Value = styled.div`
  color: #ddd;
`;

export default function MovieHistoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<MovieHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) {
      router.push(ROUTES.SIGN_IN);
      return;
    }
    api
      .get<{ history: MovieHistoryRecord[] }>(`/api/users/getmoviehistory/${auth.email}`)
      .then((res) => setHistory(res.data.history ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [auth.email, router]);

  return (
    <>
      <Header bg={false}>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
          <Header.ButtonLink
            to={ROUTES.SIGN_IN}
            onClick={() => {
              auth.logout();
            }}
          >
            Sign Out
          </Header.ButtonLink>
        </Header.Frame>
      </Header>

      <HistoryContainer>
        <BackButton onClick={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>
          ← Back to Account Settings
        </BackButton>
        
        <PageTitle>Movie Watch History</PageTitle>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            No movie watch history found.
          </div>
        ) : (
          history.map((row, idx) => (
            <Card key={idx}>
              <MovieTitle>{row.TITLE}</MovieTitle>
              <Grid>
                <InfoBox>
                  <Label>Watched By</Label>
                  <Value>{row.PID}</Value>
                </InfoBox>
                <InfoBox>
                  <Label>Rating</Label>
                  <Value>{row.RATING !== null && row.RATING !== undefined ? `★ ${row.RATING.toFixed(1)}` : '—'}</Value>
                </InfoBox>
                <InfoBox>
                  <Label>Watched Upto</Label>
                  <Value>{row.WATCHED_UPTO ?? '—'}</Value>
                </InfoBox>
                <InfoBox>
                  <Label>Date / Time</Label>
                  <Value>{row.TIME ?? '—'}</Value>
                </InfoBox>
              </Grid>
            </Card>
          ))
        )}
      </HistoryContainer>

      <FooterContainer />
    </>
  );
}
