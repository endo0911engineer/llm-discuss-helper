import styles from './style/homepage.module.css';

export default function HomePage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>MySNS</h1>
        <nav className={styles.navbar}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#explore" className={styles.navLink}>Explore</a>
          <a href="#about" className={styles.navLink}>About</a>
        </nav>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>Discover and Share Moments</h2>
          <p className={styles.heroSubtitle}>Upload videos, images, and connect with a community that shares your interests.</p>
          <div className={styles.buttonGroup}>
            <a href="/signup" className={styles.primaryButton}>Get Started</a>
            <a href="/login" className={styles.secondaryButton}>Log In</a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 MySNS. All rights reserved.</p>
      </footer>
    </main>
  );
}