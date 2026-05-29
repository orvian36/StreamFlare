'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Form, Field } from '@streamflare/ui';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import * as ROUTES from '../../constants/routes';
import { FooterContainer } from '../../containers/footer';

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
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInvalid = password === '' || emailAddress === '';

  const handleSignin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data, status } = await api.post<LoginResponse>(
        '/api/users/login',
        { EMAIL: emailAddress, PASSWORD: password },
        { validateStatus: () => true }
      );

      if (status === 422) {
        setError('User does not exist. Please sign up instead');
        setSubmitting(false);
        return;
      }
      if (status === 423) {
        setError('Incorrect Password');
        setSubmitting(false);
        return;
      }
      if (status !== 201) {
        setError('Login failed');
        setSubmitting(false);
        return;
      }

      auth.login(emailAddress, data.token);

      const mp = await api.get<MaxProfilesResponse>(`/api/users/maxprofiles/${emailAddress}`);
      auth.set_max_profiles(mp.data.mp.MAX_PROFILES);

      const np = await api.get<NumProfilesResponse>(`/api/users/numprofiles/${emailAddress}`);
      auth.set_num_profiles(np.data.C.C);

      const sub = await api.get<SubIdResponse>(`/api/subscription/subid/${emailAddress}`);
      if (sub.data.sub_id?.SUB_ID) {
        const subId = sub.data.sub_id.SUB_ID;
        auth.set_sub_id(subId);
        const billResponse = await api.get<BillResponse>(`/api/subscription/bill/${subId}`);
        auth.set_bill(billResponse.data.bill.BILL);
        router.push(ROUTES.BROWSE);
      } else {
        router.push(ROUTES.ADD_SUBSCRIPTION);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
        </Header.Frame>

        <Form>
          <Form.Title>Sign In</Form.Title>
          {error && <Form.Error data-testid="error">{error}</Form.Error>}

          <Form.Base onSubmit={handleSignin} method="POST">
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Form.Submit disabled={isInvalid || submitting} type="submit" data-testid="sign-in">
              {submitting ? 'Signing in...' : 'Sign In'}
            </Form.Submit>
          </Form.Base>

          <Form.Text>
            New to StreamFlare? <Form.Link to={ROUTES.SIGN_UP}>Sign up now.</Form.Link>
          </Form.Text>
        </Form>
      </Header>
      <FooterContainer />
    </>
  );
}
