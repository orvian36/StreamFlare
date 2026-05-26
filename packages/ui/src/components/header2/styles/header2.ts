import styled from 'styled-components';
import Link from 'next/link';

export const Background = styled.div`
    display: flex;
    flex-direction: column;
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

export const Logo = styled.img`
    height: 32px;
    width: 108px;
    margin-right: 40px;
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
