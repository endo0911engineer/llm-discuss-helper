'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from '../style/profile.module.css';

interface UserProfile{
    username: string,
    email: string,
    bio: string,
    avatar: string,
    images: string[];
}

interface Discussion {
  id: number;
  topic: string;
  summary: string;
  timestamp: string;
}



export default function ProfilePage () {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [bio, setBio] = useState<string>('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);

    useEffect(() => {
        //プロフィール情報取得
        const fetchProfile = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/profile/', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,   
                    },
                });

                const profileData = await response.json();
                console.log('Fetched Data:', profileData);
                setUserProfile(profileData);
                setBio(profileData.bio || '');
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        // ディスカッション履歴取得
        const fetchDiscussion = async () => {
          try {
            const response = await fetch('http://127.0.0.1:8000/api/get_topics/', {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              },
            });
            const discussionData = await response.json();
            setDiscussions(discussionData);
          } catch (error) {
            console.error('Error fetching discussions:', error);
          };
        }

        fetchProfile();
        fetchDiscussion();
      }, []);

    // プロフィール更新
    const handleProfileUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('bio', bio);
            if(avatar) {
                formData.append('avatar', avatar);
            }

            console.log('FormData:', formData.get('bio'), formData.get('avatar'))

            const response = await fetch('http://127.0.0.1:8000/api/profile/', {
                method: 'PUT',
                body: formData,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.ok) {
              const updatedData = await response.json();
              alert('プロフィールが更新されました');
              setUserProfile(updatedData);
              router.push('/profile');
            } else {
              console.error('Failed to update profile.');
            }
        } catch(error) {
            console.error('Error updating profile:', error);
        }
    };

    // アイコン画像を選択
    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setAvatar(file);
      }
    };

    return (
        <div className={styles.container}>
          {/* プロフィール情報 */}
          <div className={styles.profile}>
            {userProfile && (
              <>
                <h2>{userProfile.username}'s Profile</h2>
                <img
                  src={userProfile.avatar || '/default-avatar.png'}
                  alt="User Avatar"
                  className={styles.avatar}
                />
                <div>
                  <label htmlFor="avatar">アイコン画像をアップロード：</label>
                  <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  />
                </div>
                <textarea
                  className={styles.bioInput}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="自己紹介を入力してください..."
                />
                <button
                  className={styles.updateButton}
                  onClick={handleProfileUpdate}
                >
                  Update Profile
                </button>
              </>
            )}
          </div>
          <div className={styles.discussions}>
            <h3>過去のディスカッション履歴</h3>
            {discussions.length > 0 ? (
              <ul>
                {discussions.map((discussion) => (
                  <li>
                    <strong>トピック：</strong> {discussion.topic}
                    <br />
                    <strong>概要：</strong> {discussion.summary}
                    <br />
                    <strong>日時：</strong> {new Date(discussion.timestamp).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p>ディスカッション履歴がありません。</p>
            )}
            <button className={styles.newDiscussionButton} onClick={() => router.push('/create-discussion')}>
              新しいディスカッションを作る
            </button>
          </div>
        </div>
    );
}