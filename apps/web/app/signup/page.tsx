'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CountryDropdown } from 'react-country-region-selector';
import styled from 'styled-components';
import { Header, Form } from '@streamflare/ui';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import * as ROUTES from '../../constants/routes';
import { FooterContainer } from '../../containers/footer';

interface SignupResponse {
  EMAIL: string;
  token: string;
}

const CountrySelectContainer = styled.div`
  select {
    background: #333;
    color: white;
    height: 50px;
    border-radius: 4px;
    border: 0;
    padding: 5px 20px;
    fontSize: 16px;
    width: 100%;
    outline: none;
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

        <Form style={{ maxWidth: '600px', minHeight: 'auto' }}>
          <Form.Title>Sign Up</Form.Title>
          {error && <Form.Error data-testid="error">{error}</Form.Error>}

          <Form.Base onSubmit={handleSignup} method="POST" style={{ maxWidth: '100%' }}>
            <Form.Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Form.Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Form.Input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
              <label htmlFor="dob" style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>Date of Birth</label>
              <Form.Input
                type="date"
                id="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                style={{ marginBottom: 0 }}
              />
            </div>

            <Form.Input
              placeholder="Credit Card No."
              value={creditCard}
              onChange={(e) => setCreditCard(e.target.value)}
              required
            />

            <Form.Input
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
              <label style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>Country</label>
              <CountrySelectContainer>
                <CountryDropdown
                  value={country}
                  onChange={(val) => setCountry(val)}
                />
              </CountrySelectContainer>
            </div>

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
