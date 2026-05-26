import React from 'react';
import { Container, Title, List, User, Picture, Name } from './styles/profiles';

export default function Profiles({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
}

Profiles.Title = function ProfilesTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Profiles.List = function ProfilesList({ children, ...restProps }: React.HTMLAttributes<HTMLUListElement>) {
    return <List {...restProps}>{children}</List>;
};

Profiles.User = function ProfilesUser({ children, ...restProps }: React.HTMLAttributes<HTMLLIElement>) {
    return <User {...restProps}>{children}</User>;
};

Profiles.Picture = function ProfilesPicture({ src, ...restProps }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return <Picture src={src ? `/images/users/${src}.png` : '/images/misc/loading.gif'} {...restProps} />;
};

Profiles.Name = function ProfilesName({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Name {...restProps}>{children}</Name>;
};
