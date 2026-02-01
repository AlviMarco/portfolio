
"use client";
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface RevealTextProps {
    text: string;
    tag?: React.ElementType;
    className?: string;
    delay?: number;
}

const RevealText: React.FC<RevealTextProps> = ({ text, tag: Tag = 'div', className, delay = 0 }) => {
    const containerRef = useRef<HTMLElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const container = containerRef.current;
        if (!container) return;

        const words = text.split(' ');
        container.innerHTML = words
            .map(word => `<span style="overflow: hidden; display: inline-block; vertical-align: top;"><span class="reveal-word" style="display: inline-block; transform: translateY(100%); opacity: 0;">${word}&nbsp;</span></span>`)
            .join(' ');

        const elements = container.querySelectorAll('.reveal-word');

        gsap.to(elements, {
            scrollTrigger: {
                trigger: container,
                start: "top 95%", // More sensitive for top-of-page
            },
            y: "0%",
            opacity: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: "power4.out",
            delay: delay
        });
    }, [text, delay, isMounted]);

    return (
        // @ts-ignore
        <Tag ref={containerRef} className={className} style={{ opacity: isMounted ? 1 : 0 }}>
            {!isMounted && text}
        </Tag>
    );
};

export default RevealText;
