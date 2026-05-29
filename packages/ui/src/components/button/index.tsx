import React from 'react';
import { StyledButton } from './styles/button';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'ghost';
}

export default function Button({ variant = 'accent', children, ...restProps }: ButtonProps) {
  return (
    <StyledButton $variant={variant} {...restProps}>
      {children}
    </StyledButton>
  );
}
