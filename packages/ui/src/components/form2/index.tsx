import React from 'react';
import { Container, Base, Title, Text, TextSmall, LinkRoute, Input, Submit } from './styles/form2';

interface Form2LinkProps {
    to: string;
    children: React.ReactNode;
    [x: string]: any;
}

export default function Form2({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
}

Form2.Base = function Form2Base({ children, ...restProps }: React.FormHTMLAttributes<HTMLFormElement>) {
    return <Base {...restProps}>{children}</Base>;
};

Form2.Title = function Form2Title({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Form2.Text = function Form2Text({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

Form2.TextSmall = function Form2TextSmall({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <TextSmall {...restProps}>{children}</TextSmall>;
};

Form2.Link = function Form2Link({ to, children, ...restProps }: Form2LinkProps) {
    return <LinkRoute href={to} {...restProps}>{children}</LinkRoute>;
};

Form2.Input = function Form2Input({ ...restProps }: React.InputHTMLAttributes<HTMLInputElement>) {
    return <Input {...restProps} />;
};

Form2.Submit = function Form2Submit({ children, ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <Submit {...restProps}>{children}</Submit>;
};
