
"use client";
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function MagneticButton({ children, className }: { children: React.ReactNode, className?: string }) {
    const magnetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const magnet = magnetRef.current;
        if (!magnet) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = magnet.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(magnet, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 1,
                ease: "power4.out"
            });
            gsap.to(magnet.children, {
                x: x * 0.1,
                y: y * 0.1,
                duration: 1,
                ease: "power4.out"
            });
        };

        const handleMouseLeave = () => {
            gsap.to(magnet, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
            gsap.to(magnet.children, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
        };

        magnet.addEventListener('mousemove', handleMouseMove);
        magnet.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            magnet.removeEventListener('mousemove', handleMouseMove);
            magnet.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={magnetRef} className={`magnet-target ${className}`} style={{ display: 'inline-block' }}>
            {children}
        </div>
    );
}
