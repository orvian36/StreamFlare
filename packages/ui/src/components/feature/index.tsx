import React from 'react';
import { Container, Title, SubTitle } from './styles/feature';

export default function Feature({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
}

Feature.Title = function FeatureTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Feature.SubTitle = function FeatureSubTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <SubTitle {...restProps}>{children}</SubTitle>;
};
