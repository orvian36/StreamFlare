import styled from 'styled-components';

export const SectionEl = styled.section`
  border-top: 1px solid var(--sf-line);
`;

export const Head = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--sf-space-4);
  padding: var(--sf-space-5) var(--sf-space-7) 0;
  @media (max-width: 740px) {
    padding: var(--sf-space-5) var(--sf-space-5) 0;
  }
`;

export const Num = styled.span`
  font-family: var(--sf-font-mono);
  color: var(--sf-accent);
  font-size: 13px;
  letter-spacing: 0.08em;
`;

export const Label = styled.span`
  font-family: var(--sf-font-mono);
  color: var(--sf-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 13px;
`;
