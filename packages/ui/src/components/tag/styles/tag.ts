import styled from 'styled-components';

export const StyledTag = styled.span<{ $framed?: boolean; $accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 12px;
  line-height: 1;
  color: ${({ $accent }) => ($accent ? 'var(--sf-accent)' : 'var(--sf-text-dim)')};
  ${({ $framed }) => $framed && `border: 1px solid var(--sf-line); padding: 6px 10px;`}
`;
