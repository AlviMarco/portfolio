
"use client";
import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Problem.module.css';
import RevealText from './RevealText';

gsap.registerPlugin(ScrollTrigger);

const Problem = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from("." + styles.card, {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                stagger: 0.2,
                duration: 1,
                ease: "power2.out"
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section className={styles.section} id="problem" ref={sectionRef}>
            <div className="container">
                <div className={styles.header}>
                    <RevealText text="The 'Tech' That Keeps You Stuck" tag="h2" className={styles.title} />
                    <p className={styles.subtitle}>You know the feeling. You hired a developer, but you inherited a mess.</p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.icon}>🛑</div>
                        <h3>"It Works On My Machine"</h3>
                        <p>You don't care where it works. You care that it works for your customers, every single time.</p>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.icon}>📉</div>
                        <h3>Features That Break Business</h3>
                        <p>Beautiful code that destroys your conversion rate is useless. I build for profit, not GitHub stars.</p>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.icon}>👻</div>
                        <h3>The Ghosting Act</h3>
                        <p>Need an update? Silence. I communicate proactively, so you never have to chase me.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Problem;
