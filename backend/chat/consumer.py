import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from django.contrib.auth import get_user_model
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"URL route kwargs: {self.scope['url_route']['kwargs']}")

        self.scope["user"] = AnonymousUser() # デフォルトは匿名ユーザー

        # クエリパラメータからtokenを取得
        query_string = self.scope["query_string"].decode()
        token_param = dict(q.split("=") for q in query_string.split("&") if "=" in q).get("token", None)

        # トークンの検証
        if token_param:
            try:
                access_token = AccessToken(token_param)
                user = await sync_to_async(User.objects.get)(id=access_token["user_id"])
                self.scope["user"] = user
            except Exception as e:
                print(f"Token validation error: {e}") # デバッグ用ログ
                await self.close()
                return 
        
        # 認証に成功した場合のみ接続を受け入れる
        if not self.scope["user"].is_authenticated:
            await self.close(code=4002)
            return

        await self.accept()

        # チャットルームの設定
        self.room_name = self.scope['url_route']['kwargs']['room_name'] # チャットルーム名
        self.room_group_name = f'chat_{self.room_name}' # チャットグループ名

        print(f"URL route kwargs: {self.scope['url_route']['kwargs']}")

        # グループに参加
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

    async def disconnect(self, close_code):
        # グループから切断
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    
    # 他のユーザーからメッセージを受け取って送信
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_text = text_data_json['message']

        user = await database_sync_to_async(User.objects.get)(id=self.scope["user"].id)

        # メッセージを保存
        message = await database_sync_to_async(Message.objects.create)(user=user, text=message_text)

        # グループ内の全員にメッセージを送信
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message.text,
                'user': user.username,
            }
        )
    
    # メッセージをWebsocketで送信
    async def chat_message(self, event):
        message = event['message']
        user = event['user']

        await self.send(text_data=json.dumps({
            'message': message,
            'user': user
        }))