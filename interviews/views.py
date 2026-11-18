
import json
import os

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from google import genai

from .models import InterviewSession, InterviewQuestion
from .serializers import InterviewSessionSerializer

import random



class StartInterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != "job_seeker":
            return Response(
                {"error": "Mock interviews are available for job seekers only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        job_role = request.data.get("job_role", "").strip()
        experience_level = request.data.get("experience_level", "").strip()
        interview_type = request.data.get(
            "interview_type", "technical"
        ).strip()

        if not job_role or not experience_level:
            return Response(
                {"error": "Job role and experience level are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(job_role) > 150 or len(experience_level) > 50:
            return Response(
                {"error": "Job role or experience level is too long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if interview_type not in ["technical", "hr", "behavioral"]:
            return Response(
                {"error": "Choose technical, hr, or behavioral interview type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_sets = {
            "technical": [
                "What are the main responsibilities of a {} developer?",
                "Explain the important concepts and tools used in {}.",
                "Describe a technical problem you solved or would solve in {}.",
                "How do you test and debug your code?",
                "Explain a project you have worked on and your contribution.",
            ],
            "hr": [
                "Tell me about yourself.",
                "Why are you interested in the role of {}?",
                "What are your strengths and areas for improvement?",
                "Why should we hire you for this position?",
                "Where do you see yourself in five years?",
            ],
            "behavioral": [
                "Describe a difficult challenge and how you handled it.",
                "Tell me about a time you worked in a team.",
                "How do you handle feedback or criticism?",
                "Describe a mistake you made and what you learned.",
                "How do you manage deadlines and competing priorities?",
            ],
        }
        
        ai_mode = "fallback"

        api_key = os.getenv("GEMINI_API_KEY")

        if api_key:
            try:
                prompt = f"""
Generate exactly 5 distinct interview questions.

Job role: {job_role}
Experience level: {experience_level}
Interview type: {interview_type}

Requirements:
- Match questions to the role and experience level.
- Return only a valid JSON array containing 5 strings.
- Do not include markdown or explanations.
"""

                client = genai.Client(
                    api_key=api_key,
                    http_options={"timeout": 60000},
                )

                result = client.interactions.create(
                    model="gemini-3.6-flash",
                    input=prompt,
                )

                generated_questions = json.loads(
                    result.output_text
                )

                if (
                    isinstance(generated_questions, list)
                    and len(generated_questions) == 5
                    and all(
                        isinstance(q, str) and q.strip()
                        for q in generated_questions
                    )
                ):
                    questions = [
                        q.strip() for q in generated_questions
                    ]
                    ai_mode = "ai"
                else:
                    raise ValueError(
                        "Invalid AI question response."
                    )

            except Exception as exc:
                print(
                    "Mock interview using fallback questions:",
                    repr(exc),
                    flush=True,
                )

        if ai_mode == "fallback":
            questions = [
                question.format(job_role)
                for question in question_sets[interview_type]
            ]
            random.shuffle(questions)
            questions = questions[:5]


        session = InterviewSession.objects.create(
            user=request.user,
            job_role=job_role,
            experience_level=experience_level,
            interview_type=interview_type,
        )

        InterviewQuestion.objects.bulk_create([
            InterviewQuestion(
                session=session,
                question_text=question,
                order=index,
            )
            for index, question in enumerate(questions, start=1)
        ])

        session.refresh_from_db()

        response_data = InterviewSessionSerializer(session).data
        response_data["ai_mode"] = ai_mode

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )


class SubmitInterviewAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id, question_id):
        if getattr(request.user, "role", None) != "job_seeker":
            return Response(
                {"error": "Mock interviews are available for job seekers only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            session = InterviewSession.objects.get(
                id=session_id,
                user=request.user,
            )
        except InterviewSession.DoesNotExist:
            return Response(
                {"error": "Interview session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if session.status != "in_progress":
            return Response(
                {"error": "This interview has already been completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question = InterviewQuestion.objects.get(
                id=question_id,
                session=session,
            )
        except InterviewQuestion.DoesNotExist:
            return Response(
                {"error": "Question not found in this interview."},
                status=status.HTTP_404_NOT_FOUND,
            )

        answer = request.data.get("answer", "").strip()

        if not answer:
            return Response(
                {"error": "Please provide your answer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(answer) > 10000:
            return Response(
                {"error": "Answer must be 10,000 characters or fewer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

       
        # Try Gemini AI evaluation first.
        evaluation_mode = "fallback"
        score = 5
        feedback = (
            "Fallback evaluation: AI feedback is unavailable. "
            "Review your answer, explain your reasoning, and "
            "include a relevant example."
        )

        api_key = os.getenv("GEMINI_API_KEY")

        if api_key:
            try:
                prompt = f"""
You are a professional interview evaluator.

Job role: {session.job_role}
Experience level: {session.experience_level}
Interview type: {session.interview_type}

Interview question:
{question.question_text}

Candidate's answer:
{answer}

Evaluate the answer fairly based on relevance, correctness,
clarity, and completeness.

Return ONLY valid JSON in this exact format:
{{"score": 7, "feedback": "Your feedback here"}}

Rules:
- Score must be an integer from 1 to 10.
- Feedback must explain what was good and what to improve.
- Do not reward an answer only because it is long.
- Do not include markdown or extra text.
"""

                client = genai.Client(
                    api_key=api_key,
                    http_options={"timeout": 60000},
                )

                result = client.interactions.create(
                    model="gemini-3.6-flash",
                    input=prompt,
                )

                evaluation = json.loads(result.output_text)
                ai_score = evaluation.get("score")
                ai_feedback = evaluation.get("feedback")

                if (
                    isinstance(ai_score, int)
                    and not isinstance(ai_score, bool)
                    and 1 <= ai_score <= 10
                    and isinstance(ai_feedback, str)
                    and ai_feedback.strip()
                ):
                    score = ai_score
                    feedback = ai_feedback.strip()
                    evaluation_mode = "ai"
                else:
                    raise ValueError("Invalid AI evaluation response.")

            except Exception as exc:
                print(
                    "Mock interview using fallback evaluation:",
                    repr(exc),
                    flush=True,
                )

        if evaluation_mode == "fallback":
            word_count = len(answer.split())

            if word_count < 5:
                score = 2
                feedback = (
                    "Fallback evaluation: Your answer is very short. "
                    "Explain your approach and include an example."
                )
            elif word_count < 15:
                score = 5
                feedback = (
                    "Fallback evaluation: Add relevant details, "
                    "explain your reasoning, and include an example."
                )
            else:
                score = 7
                feedback = (
                    "Fallback evaluation: Your answer has some detail. "
                    "Improve its structure and include specific examples."
                )

        question.answer_text = answer
        question.score = score
        question.feedback = feedback.strip()
        question.save(
            update_fields=["answer_text", "score", "feedback"]
        )

        return Response({
            "question_id": question.id,
            "score": question.score,
            "feedback": question.feedback,
            "evaluation_mode": evaluation_mode,
        })

class CompleteInterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        if getattr(request.user, "role", None) != "job_seeker":
            return Response(
                {"error": "Mock interviews are available for job seekers only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            session = InterviewSession.objects.get(
                id=session_id,
                user=request.user,
            )
        except InterviewSession.DoesNotExist:
            return Response(
                {"error": "Interview session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if session.status == "completed":
            return Response(
                {"error": "This interview is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions = session.questions.all()
        total_questions = questions.count()
        answered_questions = questions.filter(
            score__isnull=False
        ).count()

        if total_questions == 0 or answered_questions != total_questions:
            return Response(
                {
                    "error": "Please answer all interview questions before completing.",
                    "total_questions": total_questions,
                    "answered_questions": answered_questions,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_score = sum(question.score for question in questions)
        max_score = total_questions * 10
        percentage = round((total_score / max_score) * 100, 2)

        session.status = "completed"
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at"])

        return Response({
            "message": "Mock interview completed successfully.",
            "session_id": session.id,
            "job_role": session.job_role,
            "total_questions": total_questions,
            "total_score": total_score,
            "maximum_score": max_score,
            "percentage": percentage,
            "questions": [
                {
                    "question_id": question.id,
                    "question": question.question_text,
                    "score": question.score,
                    "feedback": question.feedback,
                }
                for question in questions.order_by("order")
            ],
        })
    