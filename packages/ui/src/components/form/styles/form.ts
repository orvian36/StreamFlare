import styled from 'styled-components';
import Link from 'next/link';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 460px;
    margin: var(--sf-space-9) auto var(--sf-space-10);
    padding: var(--sf-space-8) var(--sf-space-7);
    background: var(--sf-surface-1);
    border: 1px solid var(--sf-line);
    box-sizing: border-box;
    @media (max-width: 520px) {
        padding: var(--sf-space-6) var(--sf-space-5);
    }
`;

export const Error = styled.div`
    display: flex;
    align-items: center;
    gap: var(--sf-space-2);
    background: transparent;
    border: 1px solid var(--sf-danger);
    color: var(--sf-text);
    font-family: var(--sf-font-mono);
    font-size: 13px;
    padding: var(--sf-space-3) var(--sf-space-4);
    margin-bottom: var(--sf-space-5);
    &::before {
        content: '!';
        color: var(--sf-danger);
        font-weight: 700;
    }
`;

export const Base = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: 40px;
    letter-spacing: -0.02em;
    line-height: 1;
    margin: 0 0 var(--sf-space-6);
`;

export const Text = styled.p`
    color: var(--sf-text-dim);
    font-family: var(--sf-font-mono);
    font-size: 13px;
    margin-top: var(--sf-space-5);
`;

export const TextSmall = styled.p`
    margin-top: var(--sf-space-3);
    font-size: 12px;
    line-height: 1.5;
    color: var(--sf-text-dim);
`;

export const LinkRoute = styled(Link)`
    color: var(--sf-accent);
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;

export const Input = styled.input`
    background: var(--sf-surface-2);
    color: var(--sf-text);
    border: 1px solid var(--sf-line);
    border-radius: 0;
    height: 52px;
    padding: 0 var(--sf-space-4);
    margin-bottom: var(--sf-space-4);
    font-family: var(--sf-font-body);
    font-size: 16px;
    &::placeholder {
        color: var(--sf-text-dim);
    }
    &:focus-visible {
        border-color: var(--sf-accent);
        outline: none;
    }
`;

export const Submit = styled.button`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    border-radius: 0;
    font-size: 15px;
    font-weight: 500;
    padding: 16px;
    margin: var(--sf-space-4) 0 var(--sf-space-2);
    cursor: pointer;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    &:hover:not(:disabled) {
        background: transparent;
        color: var(--sf-accent);
    }
    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;
