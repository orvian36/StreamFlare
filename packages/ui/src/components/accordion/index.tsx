import React, { useState, useContext, createContext } from 'react';
import { Container, Frame, Inner, Title, Item, Header, Body } from './styles/accordion';

const ToggleContext = createContext<{ toggleShow: boolean; setToggleShow: React.Dispatch<React.SetStateAction<boolean>> } | null>(null);

export default function Accordion({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Container {...restProps}>
            <Inner>{children}</Inner>
        </Container>
    );
}

Accordion.Title = function AccordionTitle({ children, ...restProps }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <Title {...restProps}>{children}</Title>;
};

Accordion.Frame = function AccordionFrame({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    return <Frame {...restProps}>{children}</Frame>;
};

Accordion.Item = function AccordionItem({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    const [toggleShow, setToggleShow] = useState(false);
    return (
        <ToggleContext.Provider value={{ toggleShow, setToggleShow }}>
            <Item {...restProps}>{children}</Item>
        </ToggleContext.Provider>
    );
};

Accordion.Header = function AccordionHeader({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    const context = useContext(ToggleContext);
    if (!context) throw new Error("Accordion.Header must be used in Accordion.Item");
    const { toggleShow, setToggleShow } = context;
    return (
        <Header onClick={() => setToggleShow(!toggleShow)} {...restProps}>
            <span>{children}</span>
            <span className="sign" aria-hidden="true">
                {toggleShow ? '-' : '+'}
            </span>
        </Header>
    );
};

Accordion.Body = function AccordionBody({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    const context = useContext(ToggleContext);
    if (!context) throw new Error("Accordion.Body must be used in Accordion.Item");
    const { toggleShow } = context;
    return (
        <Body className={toggleShow ? 'open' : 'closed'} {...restProps}>
            {children}
        </Body>
    );
};
