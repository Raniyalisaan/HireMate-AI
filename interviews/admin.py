from django.contrib import admin
from .models import InterviewSession, InterviewQuestion


class InterviewQuestionInline(admin.TabularInline):
    model = InterviewQuestion
    extra = 0


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "job_role",
        "interview_type",
        "status",
        "created_at",
    )
    list_filter = ("interview_type", "status", "created_at")
    search_fields = ("job_role", "user__username")
    inlines = [InterviewQuestionInline]


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "order", "score")
    search_fields = ("question_text",)
