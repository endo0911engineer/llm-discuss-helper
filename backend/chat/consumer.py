import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from django.contrib.auth import get_user_model
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket接続開始")

        # ルーム名の取得
        self.room_name = self.scope["url_route"]["kwargs"].get("room_name")
        if not self.room_name:
            print("エラー: ルーム名が取得できませんでした")
            await self.close()
            return

        try:
            await self.accept()
            self.authenticated = False
            print(f"WebSocket接続成功: ルーム {self.room_name}")
        except Exception as e:
            print(f"WebSocketエラー: {e}")

    async def receive(self, text_data):
        print(f"受信データ: {text_data}")  # 受信データをログに出力

        try:
            data = json.loads(text_data)
            if data.get("type") == "ping":
                print("Ping received")  # デバッグ
                await self.send(json.dumps({"type": "pong"}))
            print(f"受信データ（after parsing）: {data}")  # 追加
        except json.JSONDecodeError:
            print("エラー: JSONのデコードに失敗")
            await self.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
            return

        # 認証処理
        if data.get("type") == "authenticate":
            token = data.get("token")
            print(f"認証トークン受信: {token}")  # 追加

            if token:
                user = await self.get_user_from_token(token)
                if user:
                    self.scope["user"] = user
                    self.authenticated = True
                    print(f"認証成功: {user.username}")
                    await self.send(json.dumps({"type": "authentication_success"}))
                    return
            
            print("認証失敗")
            await self.send(json.dumps({"type": "authentication_failed"}))
            await self.close()
            return
        
        print(f"認証済みか: {self.authenticated}")  # 追加
        # 認証されていない場合はメッセージを拒否
        if not self.authenticated:
            print("エラー: 認証されていないユーザーがメッセージを送信しようとしました")
            await self.send(json.dumps({"type": "authentication_failed"}))
            await self.close()
            return

        message_text = data.get("message", "").strip()
        print(f"受信メッセージ: {message_text}")  # 追加

        if not message_text:
            print("エラー: 空のメッセージが送信されました")
            return

        user = self.scope["user"]

        try:
            # メッセージを保存
            message = await sync_to_async(Message.objects.create)(user=user, text=message_text)
            print(f"メッセージ保存成功: {message.text} (from {user.username})")

            # グループ内の全員にメッセージを送信
            await self.channel_layer.group_send(
                f'chat_{self.room_name}',
                {
                    'type': 'chat_message',
                    'message': message.text,
                    'user': user.username,
                }
            )
        except Exception as e:
            print(f"メッセージ保存エラー: {e}")
            await self.send(json.dumps({"type": "error", "message": "Message save failed"}))

    async def chat_message(self, event):
        print(f"送信メッセージ: {event}")  # 送信するデータをログに出力
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'user': event['user'],
        }))

    async def disconnect(self, close_code):
        print(f"WebSocket切断: {close_code}")

        if not self.room_name:
            print("切断時にルーム名が取得できませんでした")
            return

        # グループから切断
        try:
            await self.channel_layer.group_discard(
                f'chat_{self.room_name}',
                self.channel_name
            )
            print(f"グループ `{self.room_name}` から切断")
        except Exception as e:
            print(f"disconnect エラー: {e}")

    @sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            return User.objects.get(id=access_token["user_id"])
        except Exception as e:
            print(f"認証エラー: {e}")
            return None