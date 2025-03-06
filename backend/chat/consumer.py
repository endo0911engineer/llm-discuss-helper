import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async
from chat.models import Message, Topic
import uuid

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

        await self.accept()
        self.authenticated = False

        # チャットルームのグループに追加
        self.room_group_name = f"chat_{self.room_name}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        print(f"WebSocket接続成功: ルーム {self.room_name}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            print("エラー: JSONのデコードに失敗")
            await self.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
            return

        # 認証処理
        if data.get("type") == "authenticate":
            token = data.get("token")

            if token:
                user = await self.get_user_from_token(token)
                if user:
                    self.scope["user"] = user
                    self.authenticated = True
                    await self.send(json.dumps({"type": "authentication_success"}))
                    return
            
            await self.send(json.dumps({"type": "authentication_failed"}))
            await self.close()
            return
        
        if not self.authenticated:
            await self.send(json.dumps({"type": "authentication_failed"}))
            await self.close()
            return

        message_text = data.get("message", "").strip()
        topic_id = data.get("topic_id")
        if not message_text:
            return

        user = self.scope["user"]
        message = await sync_to_async(self.save_message)(user, message_text, topic_id)

        # グループ内の全員にメッセージを送信
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message.text,
                'user': user.username,
                'topic_id': topic_id,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'user': event['user'],
        }))

    async def disconnect(self, close_code):
        print(f"WebSocket切断: {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user = await sync_to_async(User.objects.get)(id=access_token["user_id"])
            return user
        except Exception as e:
            print(f"認証エラー: {e}")
            return None
        
    def save_message(self, user, text, topic_id):
        try:
            topic_uuid = uuid.UUID(topic_id)  # 文字列をUUID型に変換
            topic = Topic.objects.get(topic_id=topic_uuid)
        except ValueError:
            print(f"無効なUUID形式: {topic_id}")
            return None
        except Topic.DoesNotExist:
            print(f"指定されたトピックが見つかりません: {topic_id}")
            return None

        message = Message.objects.create(user=user, text=text, topic=topic)
        return message