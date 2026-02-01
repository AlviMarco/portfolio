"use client";
import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './About.module.css';
import RevealText from './RevealText';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from("." + styles.point, {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 75%",
                },
                y: 30,
                opacity: 0,
                stagger: 0.2,
                duration: 0.8
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section className={styles.section} id="mindset" ref={sectionRef}>
            <div className="container">
                <div className={styles.header}>
                    <span className={styles.label}>HOW I OPERATE</span>
                    <RevealText text="I Don't Just Write Code. I Protect Your Revenue." tag="h2" className={styles.title} />
                </div>
                <div className={styles.imageWrapper}>
                    <div className={styles.imgContainer}>
                        <img src="/assets/Alvi-Formal.png" alt="Alvi" className={styles.profileImg} />
                    </div>
                </div>
                <div className={styles.grid}>
                    <div className={styles.point}>
                        <div className={styles.number}>01</div>
                        <h3>Clarity First. Code Second.</h3>
                        <p>I don't write a single line of code until I understand exactly how it makes you money. If the feature doesn't serve the business, we don't build it.</p>
                    </div>

                    <div className={styles.point}>
                        <div className={styles.number}>02</div>
                        <h3>Boring is Good.</h3>
                        <p>You want "exciting" marketing, not "exciting" infrastructure. I build boring, predictable, bulletproof systems that let you sleep at night.</p>
                    </div>

                    <div className={styles.point}>
                        <div className={styles.number}>03</div>
                        <h3>Extreme Ownership.</h3>
                        <p>If I touch it, I own it. I don't blame the library, the browser, or the phase of the moon. If it breaks, I fix it.</p>
                    </div>

                    <div className={styles.point}>
                        <div className={styles.number}>04</div>
                        <h3>No Surprises.</h3>
                        <p>You get consistent, human-readable updates. You'll never have to wonder "what is he working on?" or "when will this be done?".</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
