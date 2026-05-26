import React from 'react';
import { Container, Inner, Item, Pane, Title, SubTitle, Image } from './styles/jumbotron';

interface JumbotronProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: string;
}

export default function Jumbotron({ children, direction = 'row', ...restProps }: JumbotronProps) {
    return (
        <Item {...restProps}>
            <Inner direction={direction}>{children}</Inner>
        </Item>
    );
}

Jumbotron.Container = function JumbotronContainer({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
};

Jumbotron.Pane = function JumbotronPane({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Pane {...restProps}>{children}</Pane>;
};

Jumbotron.Title = function JumbotronTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Jumbotron.SubTitle = function JumbotronSubTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <SubTitle {...restProps}>{children}</SubTitle>;
};

Jumbotron.Image = function JumbotronImage({ ...restProps }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return <Image {...restProps} />;
};
