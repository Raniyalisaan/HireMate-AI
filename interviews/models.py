from django.db import models

# Create your models here.

from django.conf import settings
from django.db import models


class InterviewSession(models.Model):
    INTERVIEW_TYPES = [
        ("technical", "Technical"),
        ("hr", "HR"),
        ("behavioral", "Behavioral"),
    ]

    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_sessions",
    )

    job_role = models.CharField(max_length=150)
    experience_level = models.CharField(max_length=50)
    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPES,
        default="technical",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="in_progress",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.job_role} - {self.user}"


class InterviewQuestion(models.Model):
    session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name="questions",
    )

    question_text = models.TextField()
    answer_text = models.TextField(blank=True, default="")
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, default="")

    order = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"Question {self.order} - {self.session.job_role}"
