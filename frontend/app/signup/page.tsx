'use client';

import { useState } from 'react';
import styles from '../style/signup.module.css';
import { useRouter } from 'next/navigation';

interface Errors {
  username?: string;
  email?: string;
  password?: string;
  general?: string;
}

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const router = useRouter();


    const validateFields = () => {
      const newErrors: Errors = {};

      if (!username) {
        newErrors.username = 'Username is required.';
      } else if (username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters.';
      }

       // Emailのバリデーション
       if (!email) {
        newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email is invalid.';
      }

      // Passwordのバリデーション
      if (!password) {
        newErrors.password = 'Password is required.';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (validateFields()) {
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
            setErrors({ general: data.error || 'Registration failed. Please try again.' });
          }
        } catch(err) {
          setErrors({ general: 'An error occured. Please try again.'});
        }
      }
    };

    return (
        <main className={styles.container}>
          <div className={styles.formContainer}>
          <h1 className={styles.title}>Sign Up</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                required
              />
               {errors.username && <p className={styles.error}>{errors.username}</p>}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                required
              />
              {errors.email && <p className={styles.error}>{errors.email}</p>}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                required
              />
              {errors.email && <p className={styles.error}>{errors.email}</p>}
            </div>
            <button type="submit" className={styles.button}>Register</button>
          </form>
          </div>
        </main>
    );
}