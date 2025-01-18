'use client';

import { useState } from 'react';
import styles from '../style/signup.module.css';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password}),
        });

        const data = await response.json();

        if (response.ok) {
          setUsername('');
          setEmail('');
          setPassword('');

          router.push('/login')
        } else {
            setError(data.error);
        }
      } catch(err) {
        setError('An error occured. Please try again.');
      }
    };

    return (
        <main className={styles.container}>
          <h1 className={styles.title}>Sign Up</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <button type="submit" className={styles.button}>Register</button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
        </main>
    );
}