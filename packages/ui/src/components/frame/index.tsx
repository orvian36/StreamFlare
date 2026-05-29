import React from 'react';
import { FrameEl } from './styles/frame';

export default function Frame({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
  return <FrameEl {...restProps}>{children}</FrameEl>;
}
