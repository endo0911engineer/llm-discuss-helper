from django.urls import path
from . import views

urlpatterns = [
    path('summary/<str:topic_id>', views.summarize_messages, name='summarize_messages'),
    path('get_messages/', views.message_list, name='message_list'), 
    path('get_topics/', views.get_topics, name='get_topics'),
    path('topics/', views.create_topic, name='create_topic'),
    path('get_topic/<uuid:topic_id>/', views.get_topic, name='get_topic'),
    path('delete_topic/<str:topic_id>/', views.delete_topic, name='delete_topic'),
    path('delete_message/<str:msg_id>/', views.delete_message, name='delete_message'),
]