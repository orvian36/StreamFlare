import styled, { css } from 'styled-components';

export const StyledButton = styled.button<{ $variant: 'accent' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sf-space-2);
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 14px;
  font-weight: 500;
  padding: var(--sf-space-3) var(--sf-space-5);
  border-radius: 0;
  cursor: pointer;
  transition: background var(--sf-dur-fast) var(--sf-ease),
    color var(--sf-dur-fast) var(--sf-ease),
    border-color var(--sf-dur-fast) var(--sf-ease);

  ${({ $variant }) =>
    $variant === 'accent'
      ? css`
          background: var(--sf-accent);
          color: var(--sf-accent-ink);
          border: 2px solid var(--sf-accent);
          &:hover:not(:disabled) {
            background: transparent;
            color: var(--sf-accent);
          }
        `
      : css`
          background: transparent;
          color: var(--sf-text);
          border: 2px solid var(--sf-text);
          &:hover:not(:disabled) {
            background: var(--sf-text);
            color: var(--sf-canvas);
          }
        `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
