'use client';

import { useEffect, useState } from "react";
import styles from '../../style/DiscussionPage.module.css';
import { useRouter } from "next/navigation";
import { use } from 'react';

export default function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [user, setUser] = useState(null);
    const [topic, setTopic] = useState('');
    const [messages, setMessages] = useState<{ id: number; user: string; text: string; created_at: string; user_icon: string }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // WebSocket接続の設定
    useEffect(() => {
      const chatSocket = new WebSocket(
        `ws://${window.location.host}/ws/chat/${id}/`
      );

      chatSocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), 
            user: data.user, 
            text: data.message, 
            created_at: new Date().toISOString(),
            user_icon: data.user_icon || "/default-icon.png" 
          }
        ]);
      };

      chatSocket.onclose = () => {
        console.error('Chat socket closed unexpectedly');
      };

      setSocket(chatSocket);

      // クリーンアップ
      return () => {
        chatSocket.close();
      };
    }, [id]);

    // 議論データをバックエンドから取得
    useEffect(() => {
        fetch('http://localhost:8000/api/messages/')
        .then((res) => res.json())
        .then((data) => {
            setMessages(data.messages || []);
            setSummary(data.summary || 'まだ結論はありません。');
        })
        .catch((error) => console.error('Eror fetching messages:', error));
    }, []);

    // ユーザー情報を取得
    useEffect(() => {
      fetch('/api/get_user_data/')
      .then((response) => response.json())
      .then((data) => setUser(data));
    }, []);

    // メッセージ一覧を取得
    useEffect(() => {
      fetch('/api/get_messages')
      .then((response) => response.json())
      .then((data) => setMessages(data));
    }, []);

    // メッセージ投稿
    const handleSendMessage = async () => {
        if(!newMessage) return;

        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/messages/post/', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ message: newMessage }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [
                    ...prev,
                    { id: data.message_id,
                      user: 'You', 
                      text: newMessage, 
                      created_at: new Date().toISOString(),
                      user_icon: data.user_icon || "/default-icon.png" 
                    },
                  ]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }

        // WebSocket経由でメッセージを送信
        if (socket && newMessage) {
          socket.send(JSON.stringify({ message: newMessage }));
        }

        setLoading(false);
    }

    // 議題の入力ハンドラー
    const handleTopicSubmit = () => {
        if (!topic) return;
        alert(`議題「${topic}」が設定されました！`);
    };

    return (
      <div className={styles.container}>
      <h1 className={styles.heading}>議論ページ</h1>

      {/* メッセージ表示 */}
      <div className={styles.section}>
        <h2>議論</h2>
        <div className={styles.messageList}>
          {messages.map((msg) => (
            <div key={msg.id} className={styles.messageItem}>
              <img
                src={msg.user_icon}
                alt={`${msg.user}のアイコン`}
                className={styles.messageIcon}
              />
              <div>
                <strong className={styles.messageUser}>{msg.user}</strong>: 
                <span className={styles.messageText}>{msg.text}</span>
                <br />
                <small className={styles.messageDate}>{new Date(msg.created_at).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* メッセージ送信 */}
      <div className={styles.section}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={3}
          placeholder="メッセージを入力してください"
          className={styles.textarea}
        ></textarea>
        <button
          onClick={handleSendMessage}
          disabled={loading}
          className={styles.button}
          style={{ backgroundColor: loading ? '#ccc' : undefined }}
        >
          {loading ? '送信中...' : '送信'}
        </button>
      </div>
    </div>
    );
}