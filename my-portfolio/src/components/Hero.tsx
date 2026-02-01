
"use client";
import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Hero.module.css';
import MagneticButton from './MagneticButton';
import RevealText from './RevealText';
import ScrambleText from './ScrambleText';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
    const component = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.from(`.${styles.badgeWrapper}`, {
                y: 20,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            })
                .from(`.${styles.subtitle}`, {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                }, "-=0.5")
                .from(".hero-btn", {
                    scale: 0,
                    opacity: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "back.out(1.7)"
                }, "-=0.5");

            // Parallax Scroll Effect
            gsap.to(`.${styles.background}`, {
                yPercent: 30,
                ease: "none",
                scrollTrigger: {
                    trigger: component.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });

        }, component);

        return () => ctx.revert();
    }, []);

    return (
        <section className={styles.hero} id="home" ref={component}>
            <div className={styles.background}>
                <div className={styles.gradientOrb}></div>
                <div className={styles.gridParams}></div>
            </div>

            <div className={`container ${styles.content}`}>
                <div className={styles.badgeWrapper}>
                    <div className={styles.pulse}></div>
                    <span><ScrambleText text="Limited Availability: Q1 2026" delay={1} /></span>
                </div>

                <h1 className={styles.title}>
                    <RevealText text="I Build Systems That" className={styles.line} tag="span" delay={0.2} />
                    <RevealText text="Let You Sleep" className={`${styles.line} gradient-text`} tag="span" delay={0.4} />
                    <RevealText text="At Night." className={styles.line} tag="span" delay={0.6} />
                </h1>

                <p className={styles.subtitle}>
                    You don't need another "coder". You need a partner who kills complexity, understands business, and delivers peace of mind.
                </p>

                <div className={styles.cta}>
                    <MagneticButton className="hero-btn">
                        <a href="#problem" className={styles.primaryBtn}>Let's Discuss Your Headache</a>
                    </MagneticButton>
                </div>
            </div>

            <div className={styles.scrollIndicator}>
                <span>Scroll</span>
                <div className={styles.lineTrace}></div>
            </div>
        </section>
    );
};

export default Hero;
