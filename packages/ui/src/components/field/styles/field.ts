import styled from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--sf-space-4);
`;

export const Label = styled.label`
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--sf-text-dim);
  margin-bottom: var(--sf-space-2);
`;

export const StyledInput = styled.input<{ $error?: boolean }>`
  background: var(--sf-surface-2);
  color: var(--sf-text);
  border: 1px solid ${({ $error }) => ($error ? 'var(--sf-danger)' : 'var(--sf-line)')};
  border-radius: 0;
  height: 52px;
  padding: 0 var(--sf-space-4);
  font-family: var(--sf-font-body);
  font-size: 16px;
  &::placeholder {
    color: var(--sf-text-dim);
  }
  &:focus-visible {
    border-color: var(--sf-accent);
    outline: none;
  }
`;

export const Helper = styled.p`
  font-family: var(--sf-font-mono);
  font-size: 12px;
  color: var(--sf-text-dim);
  margin: var(--sf-space-2) 0 0;
`;

export const ErrorText = styled.p`
  font-family: var(--sf-font-mono);
  font-size: 12px;
  color: var(--sf-danger);
  margin: var(--sf-space-2) 0 0;
`;
