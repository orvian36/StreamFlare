import styled from 'styled-components';

export const Container = styled.div`
    border-bottom: 1px solid var(--sf-line);
    padding: var(--sf-space-9) var(--sf-space-7);
    @media (max-width: 740px) {
        padding: var(--sf-space-7) var(--sf-space-5);
    }
`;

export const Inner = styled.div`
    max-width: 900px;
    margin: auto;
`;

export const Frame = styled.div`
    margin-bottom: var(--sf-space-6);
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(32px, 5vw, 64px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    text-align: left;
    margin: 0 0 var(--sf-space-6);
`;

export const Item = styled.div`
    border: 1px solid var(--sf-line);
    border-bottom: 0;
    &:last-of-type {
        border-bottom: 1px solid var(--sf-line);
    }
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sf-space-4);
    cursor: pointer;
    user-select: none;
    font-family: var(--sf-font-body);
    font-weight: 500;
    color: var(--sf-text);
    font-size: clamp(16px, 2vw, 22px);
    padding: var(--sf-space-5);
    background: var(--sf-surface-1);
    transition: background var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        background: var(--sf-surface-2);
    }
    .sign {
        font-family: var(--sf-font-mono);
        font-size: 26px;
        line-height: 1;
        color: var(--sf-accent);
    }
`;

export const Body = styled.div`
    font-family: var(--sf-font-body);
    color: var(--sf-text-dim);
    font-size: clamp(15px, 1.6vw, 18px);
    line-height: 1.6;
    white-space: pre-wrap;
    background: var(--sf-canvas);
    overflow: hidden;
    &.open {
        max-height: 1200px;
        transition: max-height var(--sf-dur) var(--sf-ease);
        padding: var(--sf-space-5);
    }
    &.closed {
        max-height: 0;
        transition: max-height var(--sf-dur) var(--sf-ease);
    }
`;
