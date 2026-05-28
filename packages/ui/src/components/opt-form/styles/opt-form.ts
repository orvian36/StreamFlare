import styled from 'styled-components';

export const Container = styled.form`
    display: flex;
    flex-wrap: wrap;
    gap: var(--sf-space-3);
    margin-top: var(--sf-space-6);
    max-width: 720px;
    @media (max-width: 740px) {
        flex-direction: column;
    }
`;

export const Input = styled.input`
    flex: 1 1 320px;
    min-width: 0;
    background: var(--sf-surface-1);
    color: var(--sf-text);
    border: 1px solid var(--sf-line);
    border-radius: 0;
    padding: 0 var(--sf-space-4);
    height: 64px;
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

export const Break = styled.div`
    flex-basis: 100%;
    height: 0;
`;

export const Button = styled.button`
    display: inline-flex;
    align-items: center;
    gap: var(--sf-space-2);
    height: 64px;
    padding: 0 var(--sf-space-6);
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    border-radius: 0;
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    svg {
        width: 18px;
        height: 18px;
    }
    &:hover {
        background: transparent;
        color: var(--sf-accent);
    }
`;

export const Text = styled.p`
    flex-basis: 100%;
    color: var(--sf-text-dim);
    font-family: var(--sf-font-mono);
    font-size: 13px;
    letter-spacing: 0.02em;
    margin: var(--sf-space-3) 0 0;
`;
