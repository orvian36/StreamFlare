import styled from 'styled-components';
import Link from 'next/link';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.75);
    border-radius: 5px;
    box-sizing: border-box;
    width: 100%;
    margin: auto;
    max-width: 650px;
    padding: 60px 68px 40px;
    margin-bottom: 100px;
`;

export const Base = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const Title = styled.h1`
    color: #fff;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 28px;
`;

export const Text = styled.p`
    color: #e50914;
    font-size: 20px;
    font-weight: bold;
    margin-top: 15px;
    border-bottom: 1px solid #737373;
    padding-bottom: 5px;
`;

export const TextSmall = styled.p`
    margin-top: 10px;
    font-size: 15px;
    line-height: normal;
    color: white;
`;

export const LinkRoute = styled(Link)`
    color: #0070f3;
    text-decoration: none;
    margin-top: 5px;
    font-size: 14px;
    &:hover {
        text-decoration: underline;
    }
`;

export const Input = styled.input`
    background: #333;
    border-radius: 4px;
    border: 0;
    color: white;
    height: 50px;
    line-height: 50px;
    padding: 5px 20px;
    margin-bottom: 20px;
    &:last-of-type {
        margin-bottom: 30px;
    }
`;

export const Submit = styled.button`
    background: #e50914;
    border-radius: 4px;
    font-size: 16px;
    font-weight: bold;
    margin: 24px 0 12px;
    padding: 16px;
    border: 0;
    color: white;
    cursor: pointer;
    &:disabled {
        opacity: 0.5;
    }
`;
