import styled from 'styled-components';
import Link from 'next/link';

export const Background = styled.div<{ src?: string; dontShowOnSmallViewPort?: boolean }>`
    display: flex;
    flex-direction: column;
    background: url(${({ src }) => (src ? `/images/misc/${src}.jpg` : '/images/misc/home-bg.jpg')}) top left / cover no-repeat;
    @media (max-width: 1100px) {
        ${({ dontShowOnSmallViewPort }) => dontShowOnSmallViewPort && 'background: none;'}
    }
`;

export const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
    padding: 18px 56px;
    a {
        display: flex;
    }
    @media (max-width: 1000px) {
        padding: 18px 30px;
    }
`;

export const LinkRoute = styled(Link)`
    display: flex;
`;

export const Logo = styled.img`
    height: 32px;
    width: 108px;
    margin-right: 40px;
    @media (max-width: 1449px) {
        height: 45px;
        width: 150px;
    }
`;

export const ButtonLink = styled(Link)`
    display: block;
    background-color: #e50914;
    width: 84px;
    height: fit-content;
    color: white;
    border: 0;
    font-size: 15px;
    border-radius: 3px;
    padding: 8px 17px;
    cursor: pointer;
    text-decoration: none;
    box-sizing: border-box;
    &:hover {
        background-color: #f40612;
    }
`;

export const Group = styled.div`
    display: flex;
    align-items: center;
`;

export const TextLink = styled.p<{ active?: string }>`
    color: white;
    text-decoration: none;
    margin-right: 30px;
    font-weight: ${({ active }) => (active === 'true' ? '700' : 'normal')};
    cursor: pointer;
    &:hover {
        font-weight: bold;
    }
    &:last-of-type {
        margin-right: 0;
    }
`;

export const SearchInput = styled.input<{ active?: boolean }>`
    background-color: #333333b2;
    color: white;
    border: 1px solid white;
    transition: width 0.5s;
    height: 30px;
    font-size: 14px;
    margin-left: ${({ active }) => (active ? '10px' : '0')};
    padding: ${({ active }) => (active ? '0 10px' : '0')};
    opacity: ${({ active }) => (active ? '1' : '0')};
    width: ${({ active }) => (active ? '200px' : '0px')};
`;

export const Search = styled.div`
    display: flex;
    align-items: center;
    svg {
        color: white;
        cursor: pointer;
    }
    @media (max-width: 700px) {
        display: none;
    }
`;

export const Picture = styled.img`
    background: url(/images/users/2.png);
    background-size: contain;
    border: 0;
    width: 32px;
    height: 32px;
    cursor: pointer;
`;

export const Dropdown = styled.div`
    display: none;
    position: absolute;
    background-color: black;
    padding: 10px;
    width: 100px;
    top: 32px;
    right: 10px;
    ${Group} {
        margin-bottom: 10px;
        &:last-of-type {
            margin-bottom: 0;
        }
        ${TextLink} {
            cursor: pointer;
        }
        ${Picture} {
            cursor: default;
        }
    }
`;

export const Profile = styled.div`
    display: flex;
    align-items: center;
    margin-left: 20px;
    position: relative;
    button {
        cursor: pointer;
    }
    &:hover > ${Dropdown} {
        display: flex;
        flex-direction: column;
    }
`;

export const Feature = styled(Container)`
    padding: 150px 0 500px 56px;
    flex-direction: column;
    align-items: flex-start;
    width: 50%;
    @media (max-width: 1100px) {
        display: none;
    }
`;

export const FeatureCallOut = styled.h2`
    color: white;
    font-size: 50px;
    line-height: normal;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.45);
    margin: 0;
    margin-bottom: 20px;
`;

export const Text = styled.p`
    color: white;
    font-size: 22px;
    line-height: normal;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.45);
    margin: 0;
`;

export const PlayButton = styled.button`
    box-shadow: 0 0.6vw 1vw -0.4vw rgba(0, 0, 0, 0.35);
    background-color: #e6e6e6;
    color: #000;
    border-width: 0;
    padding: 10px 20px;
    border-radius: 5px;
    max-width: 130px;
    font-size: 20px;
    margin-top: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.5s ease;
    &:hover {
        background-color: #ff0a16;
        color: white;
    }
`;
