import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink, Github, Linkedin, Mail, ArrowRight } from 'lucide-react';

/**
 * Kinetic Minimalism Design System
 * Color: Deep Charcoal (#0F1419) + Electric Cyan (#00D9FF) + Warm Cream (#F5F1E8)
 * Typography: Space Grotesk (display) + Inter (body)
 * Motion: Smooth, purposeful animations revealing complexity
 */

interface Project {
  title: string;
  description: string;
  tech: string[];
  impact: string;
}

interface Skill {
  category: string;
  items: string[];
}

interface Stat {
  number: string;
  label: string;
}

interface Point {
  icon: string;
  title: string;
  desc: string;
}

interface Card {
  icon: string;
  title: string;
  desc: string;
}

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const projects: Project[] = [
    {
      title: 'Invoice Generator That Prints Money',
      description: 'Manual invoicing eating 15+ hours/week. Founders losing $10K+ in delayed payments. Built automated system with role-based access and payment tracking.',
      tech: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      impact: 'Saved 15+ hrs/week',
    },
    {
      title: 'Smart Glasses for Visually Impaired',
      description: 'Visually impaired individuals struggle with real-time navigation and object detection. Engineered real-time computer vision solution with audio guidance.',
      tech: ['Python', 'Computer Vision', 'IoT', 'AI/ML'],
      impact: 'Real-time Navigation',
    },
    {
      title: 'Marco-CA Professional Platform',
      description: 'Business needed scalable content management with secure authentication and seamless UX. Built full-stack enterprise solution with modern architecture.',
      tech: ['Next.js', 'Tailwind', 'Supabase', 'TypeScript'],
      impact: 'Enterprise Solution',
    },
  ];

  const skills: Skill[] = [
    { category: 'Frontend', items: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Redis'] },
    { category: 'DevOps', items: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'GitHub Actions'] },
    { category: 'Tools', items: ['Git', 'Figma', 'Postman', 'VS Code', 'Webpack'] },
  ];

  const stats: Stat[] = [
    { number: '50+', label: 'Projects Delivered' },
    { number: '10+', label: 'Happy Clients' },
    { number: '99%', label: 'Problems Solved' },
  ];

  const points: Point[] = [
    {
      icon: '⚡',
      title: 'Your invoicing system takes weeks?',
      desc: 'I\'ll cut it to a single day with automated role-based systems.',
    },
    {
      icon: '👁️',
      title: 'Your visually impaired users can\'t navigate?',
      desc: 'I\'ll build smart solutions that guide them in real-time.',
    },
    {
      icon: '🔧',
      title: 'Your app crashes under load?',
      desc: 'I\'ll hunt down every bug until it purrs like a kitten.',
    },
  ];

  const promiseCards: Card[] = [
    { icon: '🎯', title: 'My Obsession', desc: 'Turning startup chaos into scalable systems' },
    { icon: '💪', title: 'My Promise', desc: 'If I can\'t solve it, I won\'t bill you' },
    { icon: '🚀', title: 'My Stack', desc: 'React, Node.js, Next.js + whatever it takes' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border' : 'bg-transparent'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            className="text-2xl font-bold"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <span className="text-accent-glow">&lt;</span>
            <span>ALVI</span>
            <span className="text-accent-glow">/&gt;</span>
          </motion.div>

          <div className="hidden md:flex gap-8">
            {['Home', 'About', 'Projects', 'Skills', 'Contact'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium hover:text-accent transition-colors relative group"
                whileHover={{ scale: 1.05 }}
              >
                {item}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-accent"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>

          <motion.a
            href="#contact"
            className="btn-primary text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Let's Talk 🚀
          </motion.a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl"
            animate={{ y: [0, 40, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ opacity: 0.1 }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl"
            animate={{ y: [0, -40, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            style={{ opacity: 0.05 }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="inline-block">
                <div className="flex items-center gap-2 text-accent text-sm font-semibold">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Available for Freelance & Startup Projects
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  I Turn Your
                  <br />
                  <span className="text-accent">"It's Impossible"</span>
                  <br />
                  Into
                  <br />
                  <motion.span
                    className="text-accent-glow"
                    animate={{ textShadow: ['0 0 10px rgba(0, 217, 255, 0.5)', '0 0 20px rgba(0, 217, 255, 0.8)', '0 0 10px rgba(0, 217, 255, 0.5)'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    'Holy Sh*t, It Works' 💡
                  </motion.span>
                </h1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Full-Stack Problem Solver | React Specialist | Startup Growth Partner
                </p>
              </motion.div>

              <motion.p variants={itemVariants} className="text-base text-muted-foreground max-w-lg leading-relaxed">
                I don't just write code. I solve the problems that keep founders awake at 3 AM. If I can't solve it, I don't stop until I do.
              </motion.p>

              <motion.div variants={itemVariants} className="flex gap-4 pt-4">
                <motion.a
                  href="#projects"
                  className="btn-primary flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  See My Solutions
                  <ArrowRight size={20} />
                </motion.a>
                <motion.a
                  href="#contact"
                  className="btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Let's Solve Your Problem
                </motion.a>
              </motion.div>

              {/* Stats */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                {stats.map((stat, idx) => (
                  <motion.div key={idx} whileHover={{ y: -5 }}>
                    <motion.p
                      className="text-2xl font-bold text-accent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 + idx * 0.2 }}
                    >
                      {stat.number}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-96 md:h-full"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img
                  src="/images/hero-abstract-1.png"
                  alt="Hero Background"
                  className="w-full h-full object-cover rounded-2xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="text-accent" size={24} />
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <motion.span
                className="text-accent text-sm font-semibold"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                WHO I AM
              </motion.span>
              <motion.h2
                className="text-4xl md:text-5xl font-bold mt-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                The Problem-Solver Who <span className="text-accent">Doesn't Quit</span>
              </motion.h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Most developers stop when it gets hard. <span className="text-accent font-semibold">I get started.</span>
                </p>

                <div className="space-y-6">
                  {points.map((point, idx) => (
                    <motion.div
                      key={idx}
                      className="flex gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <span className="text-2xl">{point.icon}</span>
                      <div>
                        <h4 className="font-semibold text-foreground">{point.title}</h4>
                        <p className="text-muted-foreground text-sm">{point.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <motion.img
                  src="/images/problem-solver-illustration.png"
                  alt="Problem Solver"
                  className="w-full rounded-2xl"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </motion.div>
            </div>

            {/* Promise Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {promiseCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  className="bg-card border border-border rounded-xl p-6 hover:border-accent transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -5, borderColor: '#00D9FF' }}
                  viewport={{ once: true }}
                >
                  <p className="text-3xl mb-3 hidden">{card.icon}</p>
                  <h4 className="font-bold text-foreground mb-2">{card.title}</h4>
                  <p className="text-muted-foreground text-sm">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <motion.span
                className="text-accent text-sm font-semibold"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                FEATURED WORK
              </motion.span>
              <motion.h2
                className="text-4xl md:text-5xl font-bold mt-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                Solutions That <span className="text-accent">Deliver Results</span>
              </motion.h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, idx) => (
                <motion.div
                  key={idx}
                  className="bg-card border border-border rounded-xl p-6 hover:border-accent transition-all group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 217, 255, 0.1)' }}
                  viewport={{ once: true }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-accent text-xs font-semibold mt-2">{project.impact}</p>
                  </div>

                  <p className="text-muted-foreground text-sm mb-4">{project.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, i) => (
                      <span key={i} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <motion.a
                    href={idx === 0 ? 'https://rococo-taffy-ae9834.netlify.app/' : idx === 1 ? 'https://drive.google.com/drive/folders/16MqbBBXxuWm3i9_VKzYX4Ac8WJ3uRwul' : 'https://marco-ca.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent text-sm font-semibold mt-4 group-hover:gap-3 transition-all"
                    whileHover={{ x: 5 }}
                  >
                    View Project <ExternalLink size={16} />
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <motion.span
                className="text-accent text-sm font-semibold"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                EXPERTISE
              </motion.span>
              <motion.h2
                className="text-4xl md:text-5xl font-bold mt-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                Skills That <span className="text-accent">Deliver Excellence</span>
              </motion.h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {skills.map((skillGroup, idx) => (
                <motion.div
                  key={idx}
                  className="bg-card border border-border rounded-xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ borderColor: '#00D9FF' }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-bold text-foreground mb-4 text-accent">{skillGroup.category}</h3>
                  <ul className="space-y-2">
                    {skillGroup.items.map((skill, i) => (
                      <motion.li
                        key={i}
                        className="text-muted-foreground text-sm flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 + i * 0.05 }}
                        viewport={{ once: true }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {skill}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: 'spring', damping: 25, stiffness: 100 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Turn Your <span className="text-accent">Impossible Into Reality?</span>
              </h2>
              <p className="text-muted-foreground text-lg mt-4">
                Let's discuss your project and find the perfect solution together.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.a
                href="mailto:as.alvi.md@gmail.com"
                className="btn-primary flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail size={20} />
                Send Me an Email
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/md-shihabul-islam-alvi-5547b328a/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Linkedin size={20} />
                Connect on LinkedIn
              </motion.a>
            </motion.div>

            <motion.div
              className="flex justify-center gap-6 pt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {[
                { icon: Github, link: 'https://github.com/shihabul3000', label: 'GitHub' },
                { icon: Linkedin, link: 'https://www.linkedin.com/in/md-shihabul-islam-alvi-5547b328a/', label: 'LinkedIn' },
                { icon: Mail, link: 'mailto:as.alvi.md@gmail.com', label: 'Email' },
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.link}
                  className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-all"
                  whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>© 2026 MD. Shihabul Islam Alvi. All rights reserved. Crafted with precision and passion.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
