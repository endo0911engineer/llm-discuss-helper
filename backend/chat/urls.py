from django.urls import path
from . import views

urlpatterns = [
    path('messages/', views.message_list, name='message_list'), 
    path('messages/post/', views.post_message, name='post_message'),  
    path('topics', views.create_topic, name='create_topic'),
]