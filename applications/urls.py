from django.urls import path

from .views import (
    ApplicationListCreateView,
    ApplicationStatusUpdateView,
    RecruiterApplicationResumeView,
)

urlpatterns = [
    path(
        '',
        ApplicationListCreateView.as_view(),
        name='application-list-create',
    ),
    path(
        '<int:pk>/status/',
        ApplicationStatusUpdateView.as_view(),
        name='application-status-update',
    ),
    path(
        '<int:pk>/resume/',
        RecruiterApplicationResumeView.as_view(),
        name='recruiter-application-resume',
    ),
]