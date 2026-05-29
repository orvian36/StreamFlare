import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: var(--sf-space-10) var(--sf-space-7) var(--sf-space-9);
    border-bottom: 1px solid var(--sf-line);
    max-width: 1280px;
    @media (max-width: 740px) {
        padding: var(--sf-space-8) var(--sf-space-5);
    }
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(48px, 9vw, 140px);
    line-height: 0.92;
    letter-spacing: -0.03em;
    margin: var(--sf-space-4) 0 0;
    max-width: 16ch;
`;

export const SubTitle = styled.h2`
    font-family: var(--sf-font-mono);
    color: var(--sf-text-dim);
    font-size: clamp(14px, 1.6vw, 18px);
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: var(--sf-space-5) 0 0;
`;
