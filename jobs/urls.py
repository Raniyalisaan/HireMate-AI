
from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    JobStatusToggleView,
    SavedJobListCreateView,
    SavedJobDetailView,
)

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job-list-create'),

    path(
    '<int:pk>/toggle-status/',
    JobStatusToggleView.as_view(),
    name='job-status-toggle'
),

    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),

    path(
        'saved/',
        SavedJobListCreateView.as_view(),
        name='saved-job-list-create'
    ),
    path(
        'saved/<int:pk>/',
        SavedJobDetailView.as_view(),
        name='saved-job-detail'
    ),
]
