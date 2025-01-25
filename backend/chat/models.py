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
    title = models.CharField(max_length=255)  
    description = models.TextField(blank=True, null=True)  
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    participants = models.ManyToManyField(User, related_name='participating_topics')  
    created_at = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return self.title