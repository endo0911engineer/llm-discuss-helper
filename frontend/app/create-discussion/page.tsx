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
    const [followers, setFollowers] = useState([]);
    const [manualInviteId, setManualInviteId] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    useEffect(() => {
        const fetchFollowers = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/get-followers/");
                const data = await response.json();
                setFollowers(data.followers);
            } catch (error) {
                console.error("フォロワーの取得に失敗しました。", error);
            }
        };

        fetchFollowers();
    }, []);

    const handleInviteUsers = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/invite-users/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    users: selectedUsers,
                }),
            });
            if (response.ok) {
                alert("ユーザーを招待しました！");
                setSelectedUsers([]);
            } else {
                console.error("ユーザー招待に失敗しました：", await response.text());
            }
        } catch (error) {
            console.error("ユーザー招待エラー：", error);
        }
    };

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

                {/* フォロワーリスト */}
                <div className={styles.userList}>
                    {followers.map((user) => (
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

                {/* ユーザーIDの直接入力 */}
                <div className={styles.manualInvite}>
                    <h4>フォロワー以外のユーザーを招待</h4>
                    <input 
                    type="text"
                    placeholder="ユーザーIDを入力してください"
                    value={manualInviteId}
                    onChange={(e) => setManualInviteId(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            const userId = parseInt(manualInviteId, 10);
                            if(!isNaN(userId)) {
                                setSelectedUsers((prev) => [...prev, userId]);
                                setManualInvitedId('');
                            }
                        }}
                    >
                        招待を追加
                    </button>
                </div>
                <button onClick={handleInviteUsers} className={styles.inviteButton}>
                    選択したユーザーを招待する
                </button>
                <button className={styles.createButton} onClick={handleSubmit}>
                    作成する
                </button>
            </div>
        </div>
    )
}