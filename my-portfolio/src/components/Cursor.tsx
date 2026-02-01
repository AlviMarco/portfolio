
"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './Cursor.module.css';

const Cursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        const follower = followerRef.current;

        const moveCursor = (e: MouseEvent) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: "power2.out"
            });
            gsap.to(follower, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.5,
                ease: "power2.out"
            });
        };

        const onHoverString = "a, button, .magnet-target, input, textarea";
        const links = document.querySelectorAll(onHoverString);

        const handleEnter = () => {
            gsap.to(cursor, { scale: 0, opacity: 0 });
            gsap.to(follower, {
                scale: 3,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderColor: "transparent"
            });
        };

        const handleLeave = () => {
            gsap.to(cursor, { scale: 1, opacity: 1 });
            gsap.to(follower, {
                scale: 1,
                backgroundColor: "transparent",
                borderColor: "rgba(255, 255, 255, 0.5)"
            });
        };

        links.forEach(link => {
            link.addEventListener('mouseenter', handleEnter);
            link.addEventListener('mouseleave', handleLeave);
        });

        window.addEventListener('mousemove', moveCursor);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            links.forEach(link => {
                link.removeEventListener('mouseenter', handleEnter);
                link.removeEventListener('mouseleave', handleLeave);
            });
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className={styles.cursor}></div>
            <div ref={followerRef} className={styles.follower}></div>
        </>
    );
};

export default Cursor;
