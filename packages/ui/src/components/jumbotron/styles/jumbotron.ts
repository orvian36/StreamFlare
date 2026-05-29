import styled from 'styled-components';

export const Container = styled.div``;

export const Item = styled.div`
    display: flex;
    border-bottom: 1px solid var(--sf-line);
    padding: var(--sf-space-9) var(--sf-space-7);
    color: var(--sf-text);
    @media (max-width: 740px) {
        padding: var(--sf-space-7) var(--sf-space-5);
    }
`;

export const Inner = styled.div<{ direction?: string }>`
    display: flex;
    align-items: center;
    gap: var(--sf-space-8);
    max-width: 1200px;
    width: 100%;
    margin: auto;
    flex-direction: ${({ direction }) => (direction === 'row-reverse' ? 'row-reverse' : 'row')};
    @media (max-width: 900px) {
        flex-direction: column;
        gap: var(--sf-space-6);
        align-items: flex-start;
    }
`;

export const Pane = styled.div`
    flex: 1 1 0;
    min-width: 0;
    &:first-child {
        flex: 1 1 55%;
    }
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(32px, 4.5vw, 64px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    margin: 0 0 var(--sf-space-3);
`;

export const SubTitle = styled.h2`
    font-family: var(--sf-font-body);
    font-weight: 400;
    color: var(--sf-text-dim);
    font-size: clamp(16px, 2vw, 20px);
    line-height: 1.5;
    margin: 0;
    max-width: 60ch;
`;

export const Image = styled.img`
    display: block;
    width: 100%;
    height: auto;
`;
