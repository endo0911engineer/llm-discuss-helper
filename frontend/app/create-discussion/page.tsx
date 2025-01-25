'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from '../style/createDiscussion.module.css';

interface User {
    id: number;
    username: string;
}

export default function createDiscussionPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState<User []>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('https://127.0.0.1:8000/api/users/', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                const data: User[]= await response.json();
                setUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleSubmit = async () => {
        if (!title || !description) {
            alert('トピックタイトルと概要を入力してください。');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/topics/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    invalid_users: selectedUsers,
                }),
            });

            if (response.ok) {
                alert('ディスカッションが作成されました！');
                router.push('/profile');
            } else {
                console.error('Failed to create discussion');
            }
        } catch (error) {
            console.error('Error creatong discussion:', error);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.subtitle}>新しいディスカッションを作る</h2>
            <div className={styles.form}>
                <input
                type="text"
                placeholder="トピックタイトル"
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                />
                <textarea
                placeholder="トピック概要"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                />
                <h3>ユーザーを招待する</h3>
                <div className={styles.userList}>
                    {users.map((user) => (
                        <div key={user.id} className={styles.user}>
                            <label>
                              <input
                                type="checkbox"
                                value={user.id}
                                onChange={(e) => {
                                  const userId = parseInt(e.target.value, 10);
                                  setSelectedUsers((prev) =>
                                    e.target.checked
                                      ? [...prev, userId]
                                      : prev.filter((id) => id !== userId)
                                  );
                                }}
                              />
                              {user.username}
                            </label>
                        </div>
                    ))}
                </div>
                <button className={styles.createButton} onClick={handleSubmit}>
                    作成する
                </button>
            </div>
        </div>
    )
}