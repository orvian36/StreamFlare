import React from 'react';
import { SectionEl, Head, Num, Label } from './styles/section';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  index?: string;
  label?: string;
}

export default function Section({ index, label, children, ...restProps }: SectionProps) {
  return (
    <SectionEl {...restProps}>
      {(index || label) && (
        <Head>
          {index && <Num>{index}</Num>}
          {label && <Label>{label}</Label>}
        </Head>
      )}
      {children}
    </SectionEl>
  );
}
