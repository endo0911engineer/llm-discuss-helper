from django.db import models

class Post(models.Model):
    image = models.ImageField(upload_to='uploads/')
    tags = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post {self.id} - Tags: {self.tags}"