import React from 'react';
import { Background, Container, Logo, ButtonLink } from './styles/header2';
import Link from 'next/link';

export default function Header2({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Background {...restProps}>{children}</Background>;
}

Header2.Frame = function Header2Frame({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
};

interface Header2LogoProps {
    to: string;
    src: string;
    alt?: string;
    [x: string]: any;
}

Header2.Logo = function Header2Logo({ to, src, alt, ...restProps }: Header2LogoProps) {
    return (
        <Link href={to} {...restProps}>
            <Logo src={src} alt={alt} />
        </Link>
    );
};

interface Header2ButtonLinkProps {
    to: string;
    children: React.ReactNode;
    [x: string]: any;
}

Header2.ButtonLink = function Header2ButtonLink({ to, children, ...restProps }: Header2ButtonLinkProps) {
    return <ButtonLink href={to} {...restProps}>{children}</ButtonLink>;
};
