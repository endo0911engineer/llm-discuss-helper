'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from '../style/profile.module.css';

interface UserProfile{
  id: number,
  username: string,
  email: string,
  profile: {
    bio: string | null;
    avatar: string | null;
  }
}

interface Discussion {
  id: string,
  title: string,  
  description: string,  
  created_by: string,
  created_at: Date,
  participants: string[];
}

export default function ProfilePage () {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [bio, setBio] = useState<string>('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);

    const defaultProfile = { username: 'Guest', avatar: '/default-avatar.png', bio: '' };
    const profileData = userProfile || defaultProfile

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
            console.log(discussionData);
            setDiscussions(discussionData);
          } catch (error) {
            console.error('Error fetching discussions:', error);
          };
        }

        fetchProfile();
        fetchDiscussion();
    }, []);

    //ログアウト
    const handleLogout = () => {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  
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
              console.log(updatedData);
              alert('プロフィールが更新されました');
              setUserProfile(updatedData);
              setShowEditModal(false);
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


    // ディスカッションの削除
    const handleDelete = async (discussionId:string) => {
      if (window.confirm('このディスカッションを削除しますか？')) {
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/delete_topic/${discussionId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
          });

          if (response.ok) {
            alert('ディスカッションを削除しました');
            setDiscussions((prevDiscussions) => prevDiscussions.filter(d => d.id !== discussionId));
          } else {
            alert('削除に失敗しました。');
          }
        } catch(error) {
          console.log('削除エラー:', error);
          alert('削除中にエラーが発生しました');
        }
      }
    };

    return (
        <div className={styles.profileContainer}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            ログアウト
          </button>

          {/* プロフィール情報 */}
          <div className={styles.profileHeader}>
            <h2>{profileData.username}'s Profile</h2>
            {userProfile?.profile?.avatar ? (
              <img
              src={`http://127.0.0.1:8000${userProfile.profile.avatar}`}
              alt="User Avatar"
              className={styles.profileAvatar}
              />
            ) : (
            <p>No avatar available</p>
            )}
            <p>{userProfile?.profile?.bio || ""}</p>
            <button className={styles.editButton} onClick={() => setShowEditModal(true)}>
              プロフィールを編集
            </button>
          </div>

          {/* ディスカッション履歴 */}
          <div className={styles.discussionSection}>
            <h3>過去のディスカッション履歴</h3>
            {discussions.length > 0 ? (
              <ul className={styles.discussionList}>
                {discussions.map((discussion) => (
                  <li key={discussion.id} className={styles.discussionItem}>
                    <strong>トピック：</strong> {discussion.title}
                    <br />
                    <strong>概要：</strong> {discussion.description}
                    <br />
                    <strong>日時：</strong> {new Date(discussion.created_by).toLocaleString()}
                    <br />
                    <button 
                    className={styles.viewDiscussionButton}
                    onClick={() => router.push(`/discussion/${discussion.id}`)}>
                      ディスカッションに移動
                    </button>
                    <button 
                    className={styles.deleteDiscussionButton}
                    onClick={() => handleDelete(discussion.id)}
                    >
                      削除
                    </button>
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

          {/* 編集モーダル */}
          {showEditModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <h2>プロフィール編集</h2>
                <label htmlFor="avatar">アイコン画像をアップロード：</label>
                <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                />
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
                <button 
                  className={styles.cancelButton} 
                  onClick={() => setShowEditModal(false)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
    );
}