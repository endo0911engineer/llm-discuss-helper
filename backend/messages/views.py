from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Message
from transformers import pipeline

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