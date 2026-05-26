import React from 'react';
import { Container, Error, Base, Title, Text, TextSmall, LinkRoute, Input, Submit } from './styles/form';

interface FormLinkProps {
    to: string;
    children: React.ReactNode;
    [x: string]: any;
}

export default function Form({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
}

Form.Error = function FormError({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Error {...restProps}>{children}</Error>;
};

Form.Base = function FormBase({ children, ...restProps }: React.FormHTMLAttributes<HTMLFormElement>) {
    return <Base {...restProps}>{children}</Base>;
};

Form.Title = function FormTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Form.Text = function FormText({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

Form.TextSmall = function FormTextSmall({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <TextSmall {...restProps}>{children}</TextSmall>;
};

Form.Link = function FormLink({ to, children, ...restProps }: FormLinkProps) {
    return <LinkRoute href={to} {...restProps}>{children}</LinkRoute>;
};

Form.Input = function FormInput({ ...restProps }: React.InputHTMLAttributes<HTMLInputElement>) {
    return <Input {...restProps} />;
};

Form.Submit = function FormSubmit({ children, ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <Submit {...restProps}>{children}</Submit>;
};
