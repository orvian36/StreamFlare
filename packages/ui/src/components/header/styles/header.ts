import styled, { css } from 'styled-components';
import Link from 'next/link';

export const Background = styled.div<{ src?: string; dontShowOnSmallViewPort?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--sf-canvas);
    border-bottom: 1px solid var(--sf-line);
    isolation: isolate;
    ${({ src }) =>
        src &&
        css`
            &::before {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                background: url(/images/misc/${src}.jpg) center / cover no-repeat;
                filter: grayscale(1) contrast(1.05) brightness(0.45);
            }
            &::after {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                background: linear-gradient(180deg, oklch(0.17 0.012 265 / 0.35) 0%, var(--sf-canvas) 92%);
            }
        `}
    @media (max-width: 1100px) {
        ${({ dontShowOnSmallViewPort }) =>
            dontShowOnSmallViewPort &&
            css`
                &::before,
                &::after {
                    display: none;
                }
            `}
    }
`;

export const Container = styled.div`
    position: sticky;
    top: 0;
    z-index: var(--sf-z-header);
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 72px;
    padding: 0 var(--sf-space-7);
    background: var(--sf-canvas);
    border-bottom: 1px solid var(--sf-line);
    a {
        display: flex;
        align-items: center;
    }
    @media (max-width: 1000px) {
        padding: 0 var(--sf-space-5);
    }
`;

export const LinkRoute = styled(Link)`
    display: flex;
    text-decoration: none;
`;

export const Wordmark = styled.span`
    font-family: var(--sf-font-display);
    font-weight: 800;
    font-size: 22px;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    color: var(--sf-text);
    white-space: nowrap;
`;

export const ButtonLink = styled(Link)`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 13px;
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    padding: 10px 18px;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        background: transparent;
        color: var(--sf-accent);
    }
`;

export const Group = styled.div`
    display: flex;
    align-items: center;
    gap: var(--sf-space-5);
`;

export const TextLink = styled.p<{ active?: string }>`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 13px;
    margin: 0;
    cursor: pointer;
    color: ${({ active }) => (active === 'true' ? 'var(--sf-accent)' : 'var(--sf-text)')};
    border-bottom: 2px solid ${({ active }) => (active === 'true' ? 'var(--sf-accent)' : 'transparent')};
    padding-bottom: 2px;
    transition: color var(--sf-dur-fast) var(--sf-ease), border-color var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        color: var(--sf-accent);
    }
`;

export const SearchInput = styled.input<{ active?: boolean }>`
    background: var(--sf-surface-1);
    color: var(--sf-text);
    border: 1px solid var(--sf-line);
    border-radius: 0;
    transition: width var(--sf-dur) var(--sf-ease), opacity var(--sf-dur) var(--sf-ease);
    height: 36px;
    font-family: var(--sf-font-mono);
    font-size: 13px;
    margin-left: ${({ active }) => (active ? 'var(--sf-space-2)' : '0')};
    padding: ${({ active }) => (active ? '0 var(--sf-space-3)' : '0')};
    opacity: ${({ active }) => (active ? '1' : '0')};
    width: ${({ active }) => (active ? '220px' : '0px')};
    &:focus-visible {
        border-color: var(--sf-accent);
        outline: none;
    }
`;

export const Search = styled.div`
    display: flex;
    align-items: center;
    button {
        background: transparent;
        border: 0;
        cursor: pointer;
        display: flex;
        color: var(--sf-text);
    }
    @media (max-width: 700px) {
        display: none;
    }
`;

export const Picture = styled.img`
    width: 36px;
    height: 36px;
    border: 1px solid var(--sf-line);
    object-fit: cover;
    cursor: pointer;
`;

export const Dropdown = styled.div`
    display: none;
    position: absolute;
    top: 48px;
    right: 0;
    background: var(--sf-surface-1);
    border: 1px solid var(--sf-line);
    padding: var(--sf-space-3);
    min-width: 180px;
    z-index: var(--sf-z-dropdown);
    ${Group} {
        gap: var(--sf-space-3);
        margin-bottom: var(--sf-space-3);
        &:last-of-type {
            margin-bottom: 0;
        }
    }
`;

export const Profile = styled.div`
    display: flex;
    align-items: center;
    position: relative;
    &:hover > ${Dropdown} {
        display: flex;
        flex-direction: column;
    }
`;

export const Feature = styled(Container)`
    position: static;
    top: auto;
    z-index: auto;
    flex-direction: column;
    align-items: flex-start;
    width: min(620px, 60%);
    height: auto;
    border-bottom: 0;
    background: transparent;
    padding: var(--sf-space-10) 0 220px var(--sf-space-7);
    @media (max-width: 1100px) {
        display: none;
    }
`;

export const FeatureCallOut = styled.h2`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(40px, 6vw, 72px);
    line-height: 0.95;
    letter-spacing: -0.02em;
    margin: 0 0 var(--sf-space-4);
`;

export const Text = styled.p`
    color: var(--sf-text-dim);
    font-size: 18px;
    line-height: 1.5;
    max-width: 60ch;
    margin: 0;
`;

export const PlayButton = styled.button`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    border-radius: 0;
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 500;
    margin-top: var(--sf-space-4);
    cursor: pointer;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        background: transparent;
        color: var(--sf-accent);
    }
`;
