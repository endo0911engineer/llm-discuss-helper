from django.db import models
from django.contrib.auth.models import User

class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "user_icon": self.user.profile.icon_url, 
            "text": self.text,
            "created_at": self.created_at.isoformat(),
        }


class Topic(models.Model):
    title = models.CharField(max_length=255)  # 議題のタイトル
    description = models.TextField(blank=True, null=True)  # 議題の詳細説明
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)  # 議題の作成者
    created_at = models.DateTimeField(auto_now_add=True)  # 作成日時

    def __str__(self):
        return self.title