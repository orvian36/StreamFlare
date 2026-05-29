'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CountryDropdown } from 'react-country-region-selector';
import styled from 'styled-components';
import { Header, Form, Field } from '@streamflare/ui';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import * as ROUTES from '../../constants/routes';
import { FooterContainer } from '../../containers/footer';

interface SignupResponse {
  EMAIL: string;
  token: string;
}

const FieldLabel = styled.label`
  display: block;
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--sf-text-dim);
  margin-bottom: var(--sf-space-2);
`;

const CountryBlock = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--sf-space-4);
  select {
    background: var(--sf-surface-2);
    color: var(--sf-text);
    height: 52px;
    border: 1px solid var(--sf-line);
    border-radius: 0;
    padding: 0 var(--sf-space-4);
    font-family: var(--sf-font-body);
    font-size: 16px;
    width: 100%;
    outline: none;
  }
  select:focus-visible {
    border-color: var(--sf-accent);
  }
`;

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [creditCard, setCreditCard] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInvalid =
    name === '' || email === '' || dob === '' || password === '' || creditCard === '' || phone === '';

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Password should be at least 8 characters long');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data, status } = await api.post<SignupResponse>(
        '/api/users/signup',
        {
          NAME: name,
          EMAIL: email,
          DOB: dob,
          COUNTRY: country,
          CREDIT_CARD: creditCard,
          PASSWORD: password,
          PHONE: phone,
        },
        { validateStatus: () => true }
      );

      if (status === 422) {
        setError('Invalid user info');
        setSubmitting(false);
        return;
      }
      if (status === 423) {
        setError('User already exists');
        setSubmitting(false);
        return;
      }
      if (status !== 201) {
        setError('Signup failed');
        setSubmitting(false);
        return;
      }

      auth.login(email, data.token);
      router.push(ROUTES.ADD_SUBSCRIPTION);
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

        <Form style={{ maxWidth: '600px' }}>
          <Form.Title>Sign Up</Form.Title>
          {error && <Form.Error data-testid="error">{error}</Form.Error>}

          <Form.Base onSubmit={handleSignup} method="POST">
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              helper="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Field
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <Field
              label="Credit Card No."
              inputMode="numeric"
              value={creditCard}
              onChange={(e) => setCreditCard(e.target.value)}
              required
            />
            <Field
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <CountryBlock>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <CountryDropdown value={country} onChange={(val) => setCountry(val)} />
            </CountryBlock>

            <Form.Submit disabled={isInvalid || submitting} type="submit" data-testid="sign-up">
              {submitting ? 'Creating account...' : 'Sign Up'}
            </Form.Submit>
          </Form.Base>

          <Form.Text>
            Already a user? <Form.Link to={ROUTES.SIGN_IN}>Sign in now</Form.Link>
          </Form.Text>
        </Form>
      </Header>
      <FooterContainer />
    </>
  );
}
