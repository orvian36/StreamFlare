'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Feature, OptForm, Jumbotron, Accordion } from '@streamflare/ui';
import * as ROUTES from '../constants/routes';
import { FooterContainer } from '../containers/footer';
import jumboData from '../fixtures/jumbo.json';
import faqsData from '../fixtures/faqs.json';

export default function HomePage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to signup with email prefilled in query param if desired, or just redirect
    router.push(`${ROUTES.SIGN_UP}?email=${encodeURIComponent(emailInput)}`);
  };

  return (
    <>
      <Header>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
          <Header.ButtonLink to={ROUTES.SIGN_IN}>Sign In</Header.ButtonLink>
        </Header.Frame>
        <Feature>
          <Feature.Title>Unlimited films, TV programmes and more.</Feature.Title>
          <Feature.SubTitle>Watch anywhere. Cancel anytime.</Feature.SubTitle>
          <OptForm onSubmit={handleGetStarted}>
            <OptForm.Input 
              placeholder="Email address" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <OptForm.Button type="submit">Try it now</OptForm.Button>
            <OptForm.Break />
            <OptForm.Text>
              Ready to watch? Enter your email to create or restart your membership.
            </OptForm.Text>
          </OptForm>
        </Feature>
      </Header>

      <Jumbotron.Container>
        {jumboData.map((item) => (
          <Jumbotron key={item.id} direction={item.direction}>
            <Jumbotron.Pane>
              <Jumbotron.Title>{item.title}</Jumbotron.Title>
              <Jumbotron.SubTitle>{item.subTitle}</Jumbotron.SubTitle>
            </Jumbotron.Pane>
            <Jumbotron.Pane>
              <Jumbotron.Image src={item.image} alt={item.alt} />
            </Jumbotron.Pane>
          </Jumbotron>
        ))}
      </Jumbotron.Container>

      <Accordion>
        <Accordion.Title>Frequently Asked Questions</Accordion.Title>
        <Accordion.Frame>
          {faqsData.map((item) => (
            <Accordion.Item key={item.id}>
              <Accordion.Header>{item.header}</Accordion.Header>
              <Accordion.Body>{item.body}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion.Frame>
        <OptForm onSubmit={handleGetStarted}>
          <OptForm.Input 
            placeholder="Email address" 
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <OptForm.Button type="submit">Try it now</OptForm.Button>
          <OptForm.Break />
          <OptForm.Text>
            Ready to watch? Enter your email to create or restart your membership.
          </OptForm.Text>
        </OptForm>
      </Accordion>

      <FooterContainer />
    </>
  );
}
