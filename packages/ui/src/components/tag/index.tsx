import React from 'react';
import { StyledTag } from './styles/tag';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  framed?: boolean;
  accent?: boolean;
}

export default function Tag({ framed, accent, children, ...restProps }: TagProps) {
  return (
    <StyledTag $framed={framed} $accent={accent} {...restProps}>
      {children}
    </StyledTag>
  );
}
