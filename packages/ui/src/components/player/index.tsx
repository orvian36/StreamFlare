import React, { useState, useContext, createContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactPlayer from 'react-player';
import { Container, Overlay, Inner, Close, Button } from './styles/player';

export const PlayerContext = createContext<{ showPlayer: boolean; setShowPlayer: React.Dispatch<React.SetStateAction<boolean>> } | null>(null);

export default function Player({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    const [showPlayer, setShowPlayer] = useState(false);
    return (
        <PlayerContext.Provider value={{ showPlayer, setShowPlayer }}>
            <Container {...restProps}>{children}</Container>
        </PlayerContext.Provider>
    );
}

interface PlayerVideoProps {
    videoUrl: string | null;
    [x: string]: any;
}

Player.Video = function PlayerVideo({ videoUrl, ...restProps }: PlayerVideoProps) {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("Player.Video must be used inside Player");
    const { showPlayer, setShowPlayer } = context;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!showPlayer || !mounted) return null;

    return ReactDOM.createPortal(
        <Overlay onClick={() => setShowPlayer(false)} data-testid="player">
            <Inner onClick={(e) => e.stopPropagation()}>
                <ReactPlayer
                    controls
                    url={videoUrl ? videoUrl : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                    width="100%"
                    height="480px"
                />
                <Close onClick={() => setShowPlayer(false)} />
            </Inner>
        </Overlay>,
        document.body
    );
};

Player.Button = function PlayerButton({ ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("Player.Button must be used inside Player");
    const { setShowPlayer } = context;
    return (
        <Button onClick={() => setShowPlayer((show) => !show)} {...restProps}>
            Play
        </Button>
    );
};
