import React from 'react';
import { Container, Row, Column, Link, Title, Text, Break } from './styles/footer';

export default function Footer({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
}

Footer.Row = function FooterRow({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Row {...restProps}>{children}</Row>;
};

Footer.Column = function FooterColumn({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Column {...restProps}>{children}</Column>;
};

Footer.Link = function FooterLink({ children, ...restProps }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return <Link {...restProps}>{children}</Link>;
};

Footer.Title = function FooterTitle({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Footer.Text = function FooterText({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

Footer.Break = function FooterBreak({ ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Break {...restProps} />;
};
