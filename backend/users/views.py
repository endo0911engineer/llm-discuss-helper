from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

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
        print(request.data)  # 受信したデータを出力
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        print(serializer.errors)  # バリデーションエラーを出力
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