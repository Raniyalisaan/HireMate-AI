
from django.urls import path
from .views import StartInterviewView,SubmitInterviewAnswerView, CompleteInterviewView

urlpatterns = [
    path("start/", 
         StartInterviewView.as_view(),
         name="start-interview"),
    path(
        "<int:session_id>/questions/<int:question_id>/answer/",
        SubmitInterviewAnswerView.as_view(),
        name="submit-interview-answer",
    ),
    path(
        "<int:session_id>/complete/",
        CompleteInterviewView.as_view(),
        name="complete-interview",
    ),
]
