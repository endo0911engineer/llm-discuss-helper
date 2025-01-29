import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name'] # チャットルーム名
        self.room_group_name = f'chat_{self.room_name}' # チャットグループ名

        # グループに参加
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

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

        # メッセージを保存
        message = Message.objects.create(user=self.scope['user'], text=message_text)

        # グループ内の全員にメッセージを送信
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message.text,
                'user': self.scope['user'].username,
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