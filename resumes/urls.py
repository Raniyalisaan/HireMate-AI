from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDeleteView,
    extract_resume_text,
    analyze_resume,
    match_jobs_to_resume,
)

urlpatterns = [
    path(
        '',
        ResumeListCreateView.as_view(),
        name='resume-list-create'
    ),
    path(
        'extract-text/',
        extract_resume_text,
        name='extract-resume-text'
    ),
    path(
        'analyze/',
        analyze_resume,
        name='analyze-resume'
    ),
    path(
    'match-jobs/',
    match_jobs_to_resume,
    name='match-jobs-to-resume'
),
    path(
    '<int:pk>/',
    ResumeDeleteView.as_view(),
    name='resume-delete'
),
]