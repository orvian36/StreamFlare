import React from 'react';
import { LockBody, ReleaseBody, Spinner, Picture } from './styles/loading';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
    src: string;
}

export default function Loading({ src, ...restProps }: LoadingProps) {
    return (
        <Spinner {...restProps}>
            <LockBody />
            <Picture src={`/images/users/${src}.png`} data-testid="loading-picture" />
        </Spinner>
    );
}

Loading.ReleaseBody = function LoadingReleaseBody() {
    return <ReleaseBody />;
};
