
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={`container ${styles.navContainer}`}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.bracket}>&lt;</span>
                    ALVI
                    <span className={styles.bracket}>/&gt;</span>
                </Link>

                <div className={`${styles.menu} ${mobileMenuOpen ? styles.open : ''}`}>
                    <Link href="#home" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link href="#about" onClick={() => setMobileMenuOpen(false)}>About</Link>
                    <Link href="#projects" onClick={() => setMobileMenuOpen(false)}>Projects</Link>
                    <Link href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                    <Link href="/admin" className={styles.adminLink}>Admin</Link>
                </div>

                <div className={styles.hamburger} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
