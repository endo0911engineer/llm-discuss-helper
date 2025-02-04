from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['bio', 'avatar']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']
    
    def update(self, instance, validated_data):
        print(f"validated_data: {validated_data}")  # デバッグ用
        profile_data = validated_data.pop('profile', None)

        if profile_data:
            profile, created = Profile.objects.get_or_create(user=instance)
            profile_serializer = ProfileSerializer(profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                print("ProfileSerializer errors:", profile_serializer.errors)  # エラーのログ出力

        # ユーザー情報の更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance