from django.urls import path
from . import views

urlpatterns = [
    path('messages/', views.message_list, name='message_list'), 
    path('messages/post/', views.post_message, name='post_message'),  
    path('get_topics/', views.get_topics, name='get_topics'),
    path('topics/', views.create_topic, name='create_topic'),
    path('get_topic/<uuid:topic_id>/', views.get_topic, name='get_topic'),
]