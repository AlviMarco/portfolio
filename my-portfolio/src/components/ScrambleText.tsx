
"use client";
import React, { useState, useEffect } from 'react';

const ScrambleText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
    const [displayText, setDisplayText] = useState('');
    const chars = '!<>-_\\/[]{}—=+*^?#________';

    useEffect(() => {
        let frame = 0;
        let queue: { from: string, to: string, start: number, end: number, char?: string }[] = [];

        const resolve = () => {
            let complete = 0;
            let output = '';
            for (let i = 0, n = queue.length; i < n; i++) {
                let { from, to, start, end, char } = queue[i];
                if (frame >= end) {
                    complete++;
                    output += to;
                } else if (frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = chars[Math.floor(Math.random() * chars.length)];
                        queue[i].char = char;
                    }
                    output += `<span class="scramble-char" style="opacity: 0.5;">${char}</span>`;
                } else {
                    output += from;
                }
            }
            setDisplayText(output);
            if (complete === queue.length) return;
            frame++;
            requestAnimationFrame(resolve);
        };

        const start = () => {
            queue = [];
            for (let i = 0; i < text.length; i++) {
                const from = '';
                const to = text[i];
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                queue.push({ from, to, start, end });
            }
            resolve();
        };

        const timeout = setTimeout(start, delay * 1000);
        return () => clearTimeout(timeout);
    }, [text, delay]);

    return <span dangerouslySetInnerHTML={{ __html: displayText }} />;
};

export default ScrambleText;
