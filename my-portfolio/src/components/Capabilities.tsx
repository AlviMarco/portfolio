
"use client";
import React from 'react';
import styles from './Capabilities.module.css';

const Capabilities = () => {
    return (
        <section className={styles.section} id="capabilities">
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>What I Actually Do</h2>
                    <p className={styles.subtitle}>I don't just "know React". I use tools to solve specific business problems.</p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.category}>Frontend Architecture</div>
                        <h3>Butter-Smooth Interactions</h3>
                        <p>I build interfaces that feel instant. No lag, no layout shifts, just a premium experience that builds trust with your customers.</p>
                        <div className={styles.tools}>React, Next.js, GSAP, Tailwind</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.category}>Backend Systems</div>
                        <h3>Bulletproof Scale</h3>
                        <p>Systems that handle users without crashing. Data that stays consistent. Security that isn't an afterthought.</p>
                        <div className={styles.tools}>Node.js, Supabase, PostgreSQL, Redis</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.category}>Product Strategy</div>
                        <h3>From Idea to Revenue</h3>
                        <p>I help you strip away features you don't need so we can launch faster. I spot technical bottlenecks before they kill your runway.</p>
                        <div className={styles.tools}>System Design, MVP Planning, Analytics</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Capabilities;
