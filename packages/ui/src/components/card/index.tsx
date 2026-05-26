import React, { useState, useContext, createContext } from 'react';
import {
    Container, Group, Title, SubTitle, Text, Entities, Meta, Item, Image,
    Feature, FeatureTitle, FeatureText, FeatureClose, Content, Maturity
} from './styles/card';

const FeatureContext = createContext<{
    showFeature: boolean;
    setShowFeature: React.Dispatch<React.SetStateAction<boolean>>;
    itemFeature: any;
    setItemFeature: React.Dispatch<React.SetStateAction<any>>;
} | null>(null);

export default function Card({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    const [showFeature, setShowFeature] = useState(false);
    const [itemFeature, setItemFeature] = useState<any>({});
    return (
        <FeatureContext.Provider value={{ showFeature, setShowFeature, itemFeature, setItemFeature }}>
            <Container {...restProps}>{children}</Container>
        </FeatureContext.Provider>
    );
}

Card.Group = function CardGroup({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Group {...restProps}>{children}</Group>;
};

Card.Title = function CardTitle({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Card.SubTitle = function CardSubTitle({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <SubTitle {...restProps}>{children}</SubTitle>;
};

Card.Text = function CardText({ children, ...restProps }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <Text {...restProps}>{children}</Text>;
};

Card.Entities = function CardEntities({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Entities {...restProps}>{children}</Entities>;
};

Card.Meta = function CardMeta({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Meta {...restProps}>{children}</Meta>;
};

interface CardItemProps extends React.HTMLAttributes<HTMLDivElement> {
    item: any;
}

Card.Item = function CardItem({ item, children, ...restProps }: CardItemProps) {
    const context = useContext(FeatureContext);
    if (!context) throw new Error("Card.Item must be used inside Card");
    const { setShowFeature, setItemFeature } = context;
    return (
        <Item
            onClick={() => {
                setItemFeature(item);
                setShowFeature(true);
            }}
            {...restProps}
        >
            {children}
        </Item>
    );
};

Card.Image = function CardImage({ src, ...restProps }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return <Image src={src} {...restProps} />;
};

interface CardFeatureProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    category: string;
    [x: string]: any;
}

Card.Feature = function CardFeature({ children, category, ...restProps }: CardFeatureProps) {
    const context = useContext(FeatureContext);
    if (!context) throw new Error("Card.Feature must be used inside Card");
    const { showFeature, setShowFeature, itemFeature } = context;

    if (!showFeature) return null;

    const bgUrl = `https://image.tmdb.org/t/p/original${itemFeature.IMAGE_URL}`;

    return (
        <Feature src={bgUrl} {...restProps}>
            <Content>
                <FeatureTitle>{itemFeature.TITLE}</FeatureTitle>
                <FeatureText fontStyle="normal">{itemFeature.DESCRIPTION}</FeatureText>
                <FeatureClose onClick={() => setShowFeature(false)}>
                    <img src="/images/icons/close.png" alt="Close" />
                </FeatureClose>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                    <Maturity rating={itemFeature.RATING}>{itemFeature.RATING.toFixed(1)}</Maturity>
                    <FeatureText fontStyle="bold">
                        {itemFeature.RELEASE_DATE ? new Date(itemFeature.RELEASE_DATE).getFullYear() : 'N/A'}
                    </FeatureText>
                </div>
                {children}
            </Content>
        </Feature>
    );
};
