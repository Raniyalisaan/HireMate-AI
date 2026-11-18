from rest_framework import serializers
from .models import User, Profile


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'role',
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'job_seeker')
        )

        Profile.objects.create(user=user)

        return user


class ProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(
        source='user.role',
        read_only=True
    )

    class Meta:
        model = Profile
        fields = [
            'role',
            'phone',
            'location',
            'bio',
            'profile_photo',
            'skills',
            'education',
            'experience',
            'portfolio_url',
            'company_name',
            'company_website',
            'designation',
        ]


