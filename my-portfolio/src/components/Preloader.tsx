
"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Preloader() {
    const preloaderRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();

        tl.to(textRef.current, {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
        })
            .to(textRef.current, {
                opacity: 0,
                delay: 0.5,
                duration: 0.5
            })
            .to(preloaderRef.current, {
                height: 0,
                duration: 1,
                ease: "power4.inOut"
            });

    }, []);

    return (
        <div ref={preloaderRef} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: '#000',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <h1 ref={textRef} style={{
                color: 'white',
                fontSize: '5vw',
                opacity: 0,
                fontFamily: 'var(--font-space)'
            }}>
                ALVI PORTFOLIO ©2026
            </h1>
        </div>
    );
}
