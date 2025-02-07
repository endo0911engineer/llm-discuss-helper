from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from rest_framework import status
from django.contrib.auth.models import User
from chat.models import Topic
from .models import Profile
from .serializers import UserSerializer
from .serializers import ProfileSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
import json

class RegisterAPIView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=400)
        
        user = User.objects.create_user(username=username, password=password, email=email)
        return Response({'message': 'User registered successfully'})
    
class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]


    def get(self, request):
        print(f"Authenticated User: {request.user}")  # ユーザー情報を確認
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    
    def put(self, request):
        # QueryDictを普通の辞書形式に変換
        request_data = {key: value[0] if isinstance(value, list) else value for key, value in request.data.items()}
        print("Converted request_data:", request_data)

        # `profile` がない場合は新しく作成
        profile_data = {
            "bio": request.data.get("bio", None),
            "avatar": request.data.get("avatar", None),
        }
        print("Extracted profile_data:", profile_data)

        # ユーザー情報の更新（`profile` はここで直接渡す）
        serializer = UserSerializer(request.user, data={"profile": profile_data}, partial=True)
        if serializer.is_valid():
            serializer.save()
            print("Updated user profile:", serializer.data)
            return Response(serializer.data)
        
        print("Serializer errors:", serializer.errors)  # バリデーションエラーを出力
        return Response(serializer.errors, status=400)
    
    def patch(self, request):
        # リクエストデータを取得し、リスト形式を通常の値に変換
        request_data = {key: value[0] if isinstance(value, list) else value for key, value in request.data.items()}
        print("Converted request_data:", request_data)

        profile_data = {}
        
        if "bio" in request_data:
            profile_data["bio"] = request_data["bio"]
        if "avatar" in request_data:
            profile_data["avatar"] = request_data["avatar"]

        # `partial=True` を指定し、変更のあるデータのみ更新
        serializer = UserSerializer(request.user, data={"profile": profile_data}, partial=True)
        if serializer.is_valid():
            serializer.save()
            print("Updated user profile:", serializer.data)
            return Response(serializer.data)

        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=400)


class LoginAPIView(APIView):
    permission_classes = [AllowAny] 
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # ユーザー認証
        user = authenticate(username=username, password=password)
        if user is not None:
            # 認証成功した場合、トークンを発行
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            return Response({
                'access_token': access_token,
                'refresh_token': str(refresh)
            })
        else:
            # 認証失敗の場合
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        


@api_view(['POST'])
def invite_users(request):
    topic_id = request.data.get('topic_id')
    invited_user_ids = request.data.get('user_ids', [])

    if not topic_id or not invited_user_ids:
        return Response({'error': 'Topic ID and user IDs are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        topic = Topic.objects.get(id=topic_id)

        # 既に参加している場合除外
        existing_participants = topic.participants.values_list('id', flat=True)
        new_users = User.objects.filter(id__in=invited_user_ids).exclude(id__in=existing_participants)

        # 招待をユーザーを追加
        topic.participants.add(*new_users)

    except Topic.DoesNotExist:
        return Response({'error': 'Topic not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)