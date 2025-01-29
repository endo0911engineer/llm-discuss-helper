'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from '../style/createDiscussion.module.css';

export default function createDiscussionPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [discussionId, setDiscussionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !description) {
            alert('トピックタイトルと概要を入力してください。');
            return;
        }

        setLoading(true);

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
                <button className={styles.createButton} onClick={handleSubmit} disabled={loading}>
                    {loading ? "作成中..." : "作成する"}
                </button>
            </div>

            {discussionId && (
                <div className={styles.inviteLink}>
                    <p>ディスカッションが作成されました！</p>
                    <p>以のリンクを共有してください:</p>
                    <input 
                    type="text"
                    value={`${window.location.origin}/discussion/${discussionId}`}
                    readOnly
                    className={styles.linkInput}
                    />
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/discussion/${discussionId}`)}>
                    コピーする
                </button>
                </div>
            )}
        </div>
    )
}