import React from 'react';
import { Container, Input, Break, Button, Text } from './styles/opt-form';

export default function OptForm({ children, ...restProps }: React.FormHTMLAttributes<HTMLFormElement>) {
    return <Container {...restProps}>{children}</Container>;
}

OptForm.Input = function OptFormInput({ ...restProps }: React.InputHTMLAttributes<HTMLInputElement>) {
    return <Input {...restProps} />;
};

OptForm.Button = function OptFormButton({ children, ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <Button {...restProps}>
            {children}
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
        </Button>
    );
};

OptForm.Text = function OptFormText({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

OptForm.Break = function OptFormBreak({ ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Break {...restProps} />;
};
