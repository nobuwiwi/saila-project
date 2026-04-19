from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    can_add_card = serializers.SerializerMethodField()
    is_trial_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'display_name', 'avatar_url', 'trial_started_at', 'created_at', 'can_add_card', 'is_pro', 'is_trial_active', 'pro_cancel_at_period_end')
        read_only_fields = ('id', 'email', 'trial_started_at', 'created_at', 'can_add_card', 'is_pro', 'is_trial_active', 'pro_cancel_at_period_end')

    def get_can_add_card(self, obj):
        return obj.can_add_card()

    def get_is_trial_active(self, obj):
        return obj.is_trial_active()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'password', 'display_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            display_name=validated_data.get('display_name', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')
            
        data['user'] = user
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("現在のパスワードが間違っています。")
        return value

    def validate_new_password(self, value):
        old_password = self.initial_data.get('old_password')
        if old_password and old_password == value:
            raise serializers.ValidationError("新しいパスワードが現在のパスワードと同じです。")
        return value
