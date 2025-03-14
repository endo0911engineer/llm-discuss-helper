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
    const [messages, setMessages] = useState<{ id: string | number, user: string; text: string; created_at: string; user_icon: string }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [discussion, setDiscussion] = useState<Dscussion | null>(null);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | number>(-1);

    // WebSocket接続の設定
    useEffect(() => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const chatSocket = new WebSocket(
        `${protocol}://127.0.0.1:8000/ws/chat/${id}/`
      );
      
      chatSocket.onopen = () => {
        console.log("Websocket connection established");

        // Websocket接続時に最初のメッセージでトークンを送信
        chatSocket.send(
          JSON.stringify({
            type: "authenticate",
            token: localStorage.getItem("access_token"),
          })
        );
      };

      chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      chatSocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "authentication_success") {
          console.log("Authentication successful!");
        } else if (data.type === "authentication_failed") {
          console.error("Authentication failed!");
          chatSocket.close();
        } else {
          setMessages((prev) => [
            ...prev,
            { 
              id: Date.now(), 
              user: data.user, 
              text: data.message, 
              created_at: new Date().toISOString(),
              user_icon: data.user_icon || "/default-icon.png" 
            },
          ]);
        }
      };

      chatSocket.onclose = (event) => {
        console.error(`Chat socket closed unexpectedly. Code: ${event.code}, Reason: ${event.reason}`);
        setTimeout(() => {
          window.location.reload(); // 再接続処理を入れる
        }, 3000);
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
      fetch(`http://127.0.0.1:8000/api/get_messages?topic_id=${id}`, {
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

        // WebSocket経由でメッセージを送信
        if (socket && socket.readyState === WebSocket.OPEN ) {
          socket.send(JSON.stringify({ message: newMessage, topic_id: id }));

          setNewMessage('');
        } else {
          console.error("WebSocket is not open. Message not sent.")
        }

        setLoading(false);
    }

    // 議論を要約するリクエスト
    const handleSummarizeDiscussion = async () => {
      setLoading(true);

      try {
        const res = await fetch(`http://localhost:8000/api/summary/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch summary");
        }

        const data = await res.json();
        setSummary(data.summary);
      } catch (error) {
        console.error('Error fetching summary:', error)
      }

      setLoading(false);
    }

    // メッセージを削除するリクエスト
    const handleDeleteMessage = async (msg_id: string | number) => {
      try {
        const res = await fetch(`http://localhost:8000/api/delete_message/${msg_id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
      });

      if (!res.ok) {
        throw new Error("Failed to delete message");
      }

      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== msg_id));

      } catch (error) {
        console.error('Error deleting message:', error)
      }
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
        <div className={styles.messageContainer}>
          {messages.map((msg) => (
            <div 
            key={msg.id} 
            className={`${styles.messageItem} ${msg.user === user ? styles.messageRight : styles.messageLeft}`}
            onMouseEnter={() => setHoveredMessageId(msg.id)}
            onMouseLeave={() => setHoveredMessageId(-1)}
            >
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
              {hoveredMessageId === msg.id && (
                <button
                className={styles.deleteButton}
                onClick={() => handleDeleteMessage(msg.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* メッセージ送信 */}
      <div className={styles.section}>
        <div className={styles.inputWrapper}>
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

      {/* 議論要約 */}
      <button 
      onClick={handleSummarizeDiscussion} 
      disabled={loading}
      className={styles.summaryButton}>
        {loading ? "Summarizing..." : "Summarize Discussion"}
      </button>

      {summary && (
        <div className={styles.summarySection}>
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
    );
}