from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Message
from transformers import pipeline
from .models import Topic
from django.shortcuts import get_object_or_404
import uuid

# 要約用のパイプライン作成
summarizer = pipeline("summarization")

def summarize_text(text):
    summary = summarizer(text, max_length=150, min_length=50, do_sample=False)
    return summary[0]['summary_text']

@api_view(['GET'])
def message_list(request):
    messages = Message.objects.all().order_by('-created_at') # メッセージを新しい順に取得

    # メッセージのテキストをまとめて要約
    message_texts = "\n".join([msg.text for msg in messages])
    summary = summarize_text(message_texts) if message_texts else "まだメッセージはありません。"

    return Response({
                'summary': summary,
                'message': [
                    {
                        'id': msg.id,
                        'user': msg.user.username,
                        'text': msg.text,
                        'created_at': msg.created_at,
                    }
                    for msg in messages
                ]
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated]) 
def post_message(request):
    if request.method == 'POST':
        message_text = request.POST.get('message')

        if not message_text:
            return Response({'error': 'Message text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # メッセージを保存
        message = Message.objects.create(user=request.user, text=message_text)
        
        return Response({
            'message': 'Message created successfully!',
            'message_id': message.id
        }, status=status.HTTP_201_CREATED) 
    

@api_view(['GET'])
@permission_classes([IsAuthenticated]) 
def get_topics(request):
    user = request.user
    topics = Topic.objects.filter(participants=user).order_by('-created_at') # 自分が参加しているトピック
    
    # デバッグ出力
    print(f"User: {user.username}")
    print(f"Topics count: {topics.count()}")
    
    topics_data = [
        {
            'id': topic.topic_id,
            'title': topic.title,
            'description': topic.description,
            'created_by': topic.created_by.username,
            'created_at': topic.created_at.isoformat(),
        }
        for topic in topics
    ]
    return Response(topics_data, status=status.HTTP_200_OK)


# 特定の議論データのみを取得
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_topic(request, topic_id):
    user = request.user
    try:
        topic = Topic.objects.get(topic_id=topic_id, participants=user)
        topic_data = {
            'id': topic.topic_id,
            'title': topic.title,
            'description': topic.description,
            'created_by': topic.created_by.username,
            'created_at': topic.created_at.isoformat(),
        }
        return Response(topic_data, status=status.HTTP_200_OK)
    except Topic.DoesNotExist:
        return Response({"error": "Topic not found"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_topic(request):
    title = request.data.get('title')
    description = request.data.get('description')

    if not title or not description:
        return Response({'error': 'Title and description are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 一意のIDを作成
    topic_id = str(uuid.uuid4())
    # ログインユーザーを取得
    user = request.user

    try:
        # トピックを作成
        topic = Topic.objects.create(
            title=title,
            description=description,
            created_by=user,
            topic_id=topic_id
        )

        return Response({
            'message': 'Topic created successfully.', 
            'topic_id': topic.topic_id
            }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_topic(request, topic_id):
    topic = get_object_or_404(Topic, topic_id=topic_id)

    # ユーザーが作成者が確認
    if topic.created_by != request.user:
        return Response({'error': 'You do not have permission to delete this topic'}, status=status.HTTP_403_FORBIDDEN)
    
    topic.delete()
    return Response({'message': 'Topic deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)