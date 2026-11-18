
from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    class Meta:
        model = Resume
        fields = [
            'id',
            'user',
            'username',
            'title',
            'resume_file',
            'uploaded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'uploaded_at',
            'updated_at',
        ]

    def validate_resume_file(self, value):
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError(
                'Only PDF files are allowed.'
            )

        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                'File size must be 5 MB or less.'
            )

        return value