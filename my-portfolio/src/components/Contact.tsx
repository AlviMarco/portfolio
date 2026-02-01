
"use client";
import React from 'react';
import styles from './Contact.module.css';
import MagneticButton from './MagneticButton';

const Contact = () => {
    return (
        <section className={styles.section} id="contact">
            <div className={`container ${styles.container}`}>
                <h2 className={styles.title}>
                    No Forms. No Sales Pitch. <br />
                    <span className="gradient-text">Just A Conversation.</span>
                </h2>

                <p className={styles.subtitle}>
                    You might not need me. And that's okay. <br />
                    But if you're tired of guessing, let's just talk.
                </p>

                <div className={styles.actions}>
                    <MagneticButton className={styles.actionBtn}>
                        <a href="mailto:shihabul72@gmail.com" className={styles.emailBtn}>
                            shihabul72@gmail.com
                        </a>
                    </MagneticButton>

                    <p className={styles.or}>or</p>

                    <div className={styles.socials}>
                        <a href="#" className={styles.socialLink}>LinkedIn</a>
                        <a href="#" className={styles.socialLink}>GitHub</a>
                    </div>
                </div>

                <div className={styles.availability}>
                    <div className={styles.dot}></div>
                    <span>Currently booking for Q1 2026</span>
                </div>
            </div>
        </section>
    );
};

export default Contact;
