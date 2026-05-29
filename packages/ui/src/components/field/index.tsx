import React, { useId } from 'react';
import { Wrap, Label, StyledInput, Helper, ErrorText } from './styles/field';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export default function Field({ label, error, helper, id, ...restProps }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined;

  return (
    <Wrap>
      <Label htmlFor={fieldId}>{label}</Label>
      <StyledInput
        id={fieldId}
        $error={!!error}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...restProps}
      />
      {error ? (
        <ErrorText id={`${fieldId}-error`} role="alert">
          {error}
        </ErrorText>
      ) : helper ? (
        <Helper id={`${fieldId}-helper`}>{helper}</Helper>
      ) : null}
    </Wrap>
  );
}
