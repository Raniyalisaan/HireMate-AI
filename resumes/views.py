
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import BasePermission
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Resume
from .serializers import ResumeSerializer
from jobs.models import Job

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from pypdf import PdfReader

from rest_framework.exceptions import ValidationError

import os
import json

from google import genai
from rest_framework.exceptions import APIException

import time
from google.genai.errors import ServerError

class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'job_seeker'
        )

class ResumeListCreateView(generics.ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated,IsJobSeeker]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Resume.objects.filter(
            user=self.request.user
        ).order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ResumeDeleteView(generics.DestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated,IsJobSeeker]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.applications.exists():
            raise ValidationError({
                'error': (
                    'This resume is linked to a job application '
                    'and cannot be deleted.'
                )
            })

        file_field = instance.resume_file

        instance.delete()

        if file_field:
            file_field.delete(save=False)

@api_view(['POST'])
@permission_classes([IsAuthenticated,IsJobSeeker])
def extract_resume_text(request):
    resume_id = request.data.get('resume_id')

    if not resume_id:
        return Response(
            {'error': 'resume_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user
        )
    except Resume.DoesNotExist:
        return Response(
            {'error': 'Resume not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        reader = PdfReader(resume.resume_file.path)
        text = '\n'.join(
            page.extract_text() or ''
            for page in reader.pages
        ).strip()

        if not text:
            return Response(
                {
                    'error': (
                        'No readable text found. '
                        'This PDF may be scanned or image-based.'
                    )
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        return Response({
            'resume_id': resume.id,
            'title': resume.title,
            'extracted_text': text
        })

    except Exception:
        return Response(
            {'error': 'Could not read this PDF file.'},
            status=status.HTTP_400_BAD_REQUEST
        )

def analyze_resume_content(text):
    text_lower = text.lower()

    skill_keywords = [
        'python',
        'django',
        'django rest framework',
        'react',
        'javascript',
        'html',
        'css',
        'postgresql',
        'mysql',
        'git',
        'rest api',
        'machine learning',
        'data analysis',
    ]

    detected_skills = [
        skill for skill in skill_keywords
        if skill in text_lower
    ]

    has_education = 'education' in text_lower
    has_experience = 'experience' in text_lower
    has_projects = 'project' in text_lower
    has_email = '@' in text
    has_summary = any(
        section in text_lower
        for section in ['summary', 'profile', 'objective']
    )

    suggestions = []

    if not detected_skills:
        suggestions.append(
            'Add relevant technical skills to your resume.'
        )

    if not has_education:
        suggestions.append(
            'Add a clearly labelled Education section.'
        )

    if not has_experience:
        suggestions.append(
            'Add an Experience section, including internships '
            'or relevant experience where applicable.'
        )

    if not has_projects:
        suggestions.append(
            'Include relevant projects and explain your contribution.'
        )

    if not has_email:
        suggestions.append(
            'Include a professional email address in your resume.'
        )

    if not has_summary:
        suggestions.append(
            'Consider adding a short professional summary or objective.'
        )

    if not suggestions:
        suggestions.append(
            'Review formatting and include measurable achievements '
            'relevant to your target role.'
        )

    # Calculate a basic resume completeness score.
    score = 0

    score += 20 if detected_skills else 0
    score += 20 if has_education else 0
    score += 20 if has_experience else 0
    score += 20 if has_projects else 0
    score += 10 if has_email else 0
    score += 10 if has_summary else 0

    if score >= 80:
        score_label = 'Good Completeness'
    elif score >= 50:
        score_label = 'Needs Improvement'
    else:
        score_label = 'Needs More Details'

    return {
        'detected_skills': detected_skills,
        'suggestions': suggestions,
        'skill_count': len(detected_skills),
        'score': score,
        'score_label': score_label,
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def analyze_resume(request):
    resume_id = request.data.get('resume_id')

    if not resume_id:
        return Response(
            {'error': 'resume_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user
        )
    except Resume.DoesNotExist:
        return Response(
            {'error': 'Resume not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        reader = PdfReader(resume.resume_file.path)
        extracted_text = '\n'.join(
            page.extract_text() or ''
            for page in reader.pages
        ).strip()
    except Exception:
        return Response(
            {'error': 'Could not read this PDF file.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not extracted_text:
        return Response(
            {
                'error': (
                    'No readable text found in this PDF. '
                    'It may be scanned or image-based.'
                )
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        return Response(
            {'error': 'Gemini API key is not configured.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are a professional resume reviewer.

Analyze this resume and return JSON containing:
- summary: short overall assessment
- strengths: list of strengths
- weaknesses: list of weaknesses
- detected_skills: list of skills actually present
- suggestions: actionable improvements
- score: integer from 0 to 100

Do not invent qualifications or experience.
Be constructive and specific.
Return only valid JSON.

RESUME:
{extracted_text[:15000]}
"""

        response = None

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model='gemini-3.5-flash-lite',
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                        'temperature': 0.2,
                    },
                )
                break

            except ServerError as error:
                if getattr(error, 'code', None) != 503 or attempt == 2:
                    raise

                wait_seconds = 2 ** (attempt + 1)

                print(
                    f'Gemini is busy. Retrying in '
                    f'{wait_seconds} seconds...'
                )

                time.sleep(wait_seconds)

        if response is None:
            raise RuntimeError(
                'Gemini did not return a response.'
            )

        if not response.text:
            raise ValueError('Empty Gemini response.')

        analysis = json.loads(response.text)

        return Response({
            'resume_id': resume.id,
            'title': resume.title,
            'analysis': analysis,
            'ai_powered': True,
        })

    except Exception as error:
        import traceback

        print('AI resume analysis error:', repr(error))
        traceback.print_exc()

        return Response(
            {
                'error': (
                    'AI analysis failed. Check the Django '
                    'terminal for the error details.'
                )
            },
            status=status.HTTP_502_BAD_GATEWAY
        )


def calculate_job_match(resume_text, job):
    """
    Calculate a basic skill-based match between a resume and a job.
    """

    resume_text_lower = resume_text.lower()

    # Split the job's required skills into individual skills.
    required_skills = [
        skill.strip()
        for skill in job.required_skills.replace(';', ',').split(',')
        if skill.strip()
    ]

    matched_skills = []
    missing_skills = []

    for skill in required_skills:
        normalized_skill = skill.lower()

        if normalized_skill in resume_text_lower:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    if required_skills:
        match_percentage = round(
            len(matched_skills) / len(required_skills) * 100
        )
    else:
        match_percentage = 0

    return {
        'match_percentage': match_percentage,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'total_required_skills': len(required_skills),
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsJobSeeker])
def match_jobs_to_resume(request):
    resume_id = request.data.get('resume_id')

    if not resume_id:
        return Response(
            {'error': 'resume_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user
        )
    except Resume.DoesNotExist:
        return Response(
            {'error': 'Resume not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        reader = PdfReader(resume.resume_file.path)
        resume_text = '\n'.join(
            page.extract_text() or ''
            for page in reader.pages
        ).strip()
    except Exception:
        return Response(
            {'error': 'Could not read this PDF file.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not resume_text:
        return Response(
            {
                'error': (
                    'No readable text found in this PDF. '
                    'Please use a text-based PDF resume.'
                )
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    jobs = Job.objects.filter(is_active=True)

    results = []

    for job in jobs:
        match_data = calculate_job_match(resume_text, job)

        results.append({
            'job_id': job.id,
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'salary': str(job.salary) if job.salary is not None else None,
            'job_type': job.job_type,
            'experience_level': job.experience_level,
            'description': job.description,
            **match_data,
        })

    results.sort(
        key=lambda item: item['match_percentage'],
        reverse=True
    )

    return Response({
        'resume_id': resume.id,
        'resume_title': resume.title,
        'total_jobs': len(results),
        'matches': results,
    })
