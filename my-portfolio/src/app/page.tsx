
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Problem from '@/components/Problem';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Capabilities from '@/components/Capabilities';
import Philosophy from '@/components/Philosophy';
import Contact from '@/components/Contact';
import styles from './page.module.css';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Problem />
      <About />
      <Projects />
      <Capabilities />
      <Philosophy />
      <Contact />

      <footer className={styles.footer}>
        <p>&copy; 2026 Alvi. All rights reserved.</p>
      </footer>
    </main>
  );
}
