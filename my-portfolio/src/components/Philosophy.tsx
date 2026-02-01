
"use client";
import React from 'react';
import styles from './Philosophy.module.css';
import RevealText from './RevealText';

const Philosophy = () => {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.content}>
                    <RevealText text="The 'Expensive' Truth" tag="h2" className={styles.title} />
                    <div className={styles.grid}>
                        <div className={styles.item}>
                            <h3>I Am Not Cheap.</h3>
                            <p>I charge a premium because I solve problems in 2 days that take others 2 weeks. You aren't paying for my time; you're paying for my years of failing, learning, and perfecting.</p>
                        </div>
                        <div className={styles.item}>
                            <h3>I Don't Need Management.</h3>
                            <p>You have a business to run. I handle the tech. I don't need daily standups to tell you I'm working. You'll see the results.</p>
                        </div>
                        <div className={styles.item}>
                            <h3>Total Focus.</h3>
                            <p>I only take on 2 active projects at a time. When you hire me, you get my full attention. No outsourcing, no junior devs.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Philosophy;
