import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 1200px;
    margin: auto;
    padding: var(--sf-space-9) var(--sf-space-7);
    @media (max-width: 740px) {
        padding: var(--sf-space-7) var(--sf-space-5);
    }
`;

export const Title = styled.p`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 13px;
    color: var(--sf-text-dim);
    margin: 0 0 var(--sf-space-6);
    padding-bottom: var(--sf-space-5);
    border-bottom: 1px solid var(--sf-line-strong);
`;

export const Row = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--sf-space-6);
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--sf-space-3);
`;

export const Link = styled.a`
    font-family: var(--sf-font-mono);
    color: var(--sf-text-dim);
    font-size: 13px;
    text-decoration: none;
    width: fit-content;
    &:hover {
        color: var(--sf-accent);
    }
`;

export const Text = styled.p`
    font-family: var(--sf-font-mono);
    font-size: 13px;
    color: var(--sf-text-dim);
    margin: 0;
`;

export const Break = styled.div`
    flex-basis: 100%;
    height: 0;
`;
