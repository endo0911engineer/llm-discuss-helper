# Generated by Django 5.1.5 on 2025-01-29 12:55

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='topic',
            name='participants',
        ),
        migrations.AddField(
            model_name='topic',
            name='topic_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
