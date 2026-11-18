
from rest_framework import serializers
from .models import InterviewSession, InterviewQuestion


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = [
            "id",
            "question_text",
            "answer_text",
            "score",
            "feedback",
            "order",
        ]
        read_only_fields = [
            "id",
            "question_text",
            "score",
            "feedback",
            "order",
        ]


class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewSession
        fields = [
            "id",
            "job_role",
            "experience_level",
            "interview_type",
            "status",
            "created_at",
            "completed_at",
            "questions",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
            "completed_at",
            "questions",
        ]
