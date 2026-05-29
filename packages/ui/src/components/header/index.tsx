import React, { useState } from 'react';
import {
    Background, Container, LinkRoute, Wordmark, ButtonLink, Group, TextLink,
    Search, SearchInput, Picture, Dropdown, Profile, Feature, FeatureCallOut, Text, PlayButton
} from './styles/header';

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    bg?: boolean;
    src?: string;
    dontShowOnSmallViewPort?: boolean;
}

export default function Header({ bg = true, children, ...restProps }: HeaderProps) {
    return bg ? <Background {...restProps}>{children}</Background> : <>{children}</>;
}

Header.Frame = function HeaderFrame({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Container {...restProps}>{children}</Container>;
};

interface HeaderLogoProps {
    to: string;
    src: string;
    alt?: string;
    [x: string]: any;
}

Header.Logo = function HeaderLogo({ to, src, alt, ...restProps }: HeaderLogoProps) {
    return (
        <LinkRoute href={to} aria-label="StreamFlare home" {...restProps}>
            <Wordmark>STREAMFLARE</Wordmark>
        </LinkRoute>
    );
};

interface HeaderButtonLinkProps {
    to: string;
    children: React.ReactNode;
    [x: string]: any;
}

Header.ButtonLink = function HeaderButtonLink({ to, children, ...restProps }: HeaderButtonLinkProps) {
    return <ButtonLink href={to} {...restProps}>{children}</ButtonLink>;
};

Header.Group = function HeaderGroup({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Group {...restProps}>{children}</Group>;
};

interface HeaderTextLinkProps extends React.HTMLAttributes<HTMLParagraphElement> {
    active?: string;
}

Header.TextLink = function HeaderTextLink({ active = 'false', children, ...restProps }: HeaderTextLinkProps) {
    return <TextLink active={active} {...restProps}>{children}</TextLink>;
};

interface HeaderSearchProps {
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

Header.Search = function HeaderSearch({ searchTerm, setSearchTerm }: HeaderSearchProps) {
    const [searchActive, setSearchActive] = useState(false);
    return (
        <Search>
            <button style={{ background: 'transparent', border: 0 }} onClick={() => setSearchActive(!searchActive)}>
                <img src="/images/icons/search.png" alt="Search" style={{ width: '16px', filter: 'brightness(0) invert(1)' }} />
            </button>
            <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search films and series"
                active={searchActive}
            />
        </Search>
    );
};

Header.Picture = function HeaderPicture({ src, ...restProps }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return <Picture src={src ? `/images/users/${src}.png` : '/images/users/2.png'} {...restProps} />;
};

Header.Dropdown = function HeaderDropdown({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Dropdown {...restProps}>{children}</Dropdown>;
};

Header.Profile = function HeaderProfile({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Profile {...restProps}>{children}</Profile>;
};

Header.Feature = function HeaderFeature({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Feature {...restProps}>{children}</Feature>;
};

Header.FeatureCallOut = function HeaderFeatureCallOut({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <FeatureCallOut {...restProps}>{children}</FeatureCallOut>;
};

Header.Text = function HeaderText({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

Header.PlayButton = function HeaderPlayButton({ children, ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <PlayButton {...restProps}>{children}</PlayButton>;
};
