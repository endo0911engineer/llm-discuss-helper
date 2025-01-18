'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from '../style/profile.module.css';
import { useDropzone } from "react-dropzone";

interface UserProfile{
    username: string,
    email: string,
    bio: string,
    avatar: string,
    images: string[];
}

export default function ProfilePage () {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [bio, setBio] = useState<string>('');
    const [avatar, setAvatar] = useState<File | null>(null);

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
                setUserProfile(profileData);
                setBio(profileData.bio || '');
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchProfile();
    }, []);


    // プロフィール更新
    const handleProfileUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('bio', bio);
            if(avatar) {
                formData.append('avatar', avatar);
            }

            const response = await fetch('http://127.0.0.1:8000/api/profile/', {
                method: 'PUT',
                body: formData,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.ok) {
              alert('プロフィールが更新されました');
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
        </div>
    );
}