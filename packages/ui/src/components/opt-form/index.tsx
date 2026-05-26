import React from 'react';
import { Container, Input, Break, Button, Text } from './styles/opt-form';

export default function OptForm({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
}

OptForm.Input = function OptFormInput({ ...restProps }: React.InputHTMLAttributes<HTMLInputElement>) {
    return <Input {...restProps} />;
};

OptForm.Button = function OptFormButton({ children, ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <Button {...restProps}>
            {children}
            <img src="/images/icons/chevron-right.png" alt="Try Now" />
        </Button>
    );
};

OptForm.Text = function OptFormText({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

OptForm.Break = function OptFormBreak({ ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Break {...restProps} />;
};
