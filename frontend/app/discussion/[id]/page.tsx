'use client';

import { useEffect, useState } from "react";
import styles from '../../style/DiscussionPage.module.css';
import { use } from 'react';

interface Dscussion {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
}

export default function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState<{ id: number; user: string; text: string; created_at: string; user_icon: string }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [discussion, setDiscussion] = useState<Dscussion | null>(null);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // WebSocket接続の設定
    useEffect(() => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const chatSocket = new WebSocket(
        `${protocol}://127.0.0.1:8000/ws/chat/${id}/`
      );

      chatSocket.onopen = () => {
        console.log("Websocket connection established");
      };

      chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

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
        fetch(`http://localhost:8000/api/get_topic/${id}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch discussion");
          }
          return res.json();
        })
        .then((data) => {
            setDiscussion(data);
        })
        .catch((error) => {
          console.error('Eror fetching messages:', error);
        });
    }, [id]);

    // ユーザー情報を取得
    useEffect(() => {
      fetch('http://127.0.0.1:8000/api/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then((response) => response.json())
      .then((data) => setUser(data))
      .catch((error) => console.error('Error fetching user data:', error));
    }, []);

    // メッセージ一覧を取得
    useEffect(() => {
      fetch('http://127.0.0.1:8000/api/get_messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then((response) => response.json())
      .then((data) => setMessages(data))
      .catch((error) => console.error('Error fetching messages:', error));
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
        if (socket && socket.readyState === WebSocket.OPEN ) {
          socket.send(JSON.stringify({ message: newMessage }));
        } else {
          console.error("WebSocket is not open. Message not sent.")
        }

        setLoading(false);
    }

    return (
      <div className={styles.container}>
      <h1 className={styles.heading}>議論ページ</h1>

      {/* メッセージ表示 */}
      <div className={styles.section}>
        <h2>議論</h2>
        <div>
          {discussion ? (
            <>
            <h3>{discussion.title}</h3>
            <p>{discussion.description}</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
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