'use client';

import { useState } from 'react';
import styles from '../style/login.module.css';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password}),
        });

        const data = await response.json();
        console.log(data)

        if (response.ok) {

            // Save tokens in localStorage or cookies
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);

            // Redirect to profile or home page
            router.push('/profile')

        } else {
            setError(data.error);
        }
      } catch(err) {
        setError('An error occured. Please try again.');
      }
    };

    return (
        <main className={styles.container}>
          <div className={styles.formContainer}>
          <h1 className={styles.title}>Log In</h1>
          <form onSubmit={handleLogin} className={styles.form}>
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
            <button type="submit" className={styles.button}>LogIn</button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
          </div>
        </main>
    );
}