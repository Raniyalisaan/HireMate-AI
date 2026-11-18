
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Application
from .serializers import ApplicationSerializer
from .permissions import IsJobSeeker, IsRecruiter

from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.exceptions import NotFound

from resumes.models import Resume


class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'job_seeker':
            return Application.objects.filter(
                applicant=user
            ).select_related('job', 'applicant')

        if user.role == 'recruiter':
            return Application.objects.filter(
                job__recruiter=user
            ).select_related('job', 'applicant')

        return Application.objects.none()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsJobSeeker()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)


class ApplicationStatusUpdateView(generics.UpdateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsRecruiter]
    http_method_names = ['patch', 'options', 'head']

    def get_queryset(self):
        return Application.objects.filter(
            job__recruiter=self.request.user
        )

class RecruiterApplicationResumeView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def get(self, request, pk):
        # Only allow the recruiter who owns this job.
        application = get_object_or_404(
            Application.objects.select_related(
                'applicant', 'job'
            ).filter(job__recruiter=request.user),
            pk=pk
        )

        # Get the resume selected for this application.
        resume = application.resume

        if not resume:
            raise NotFound(
                'This candidate has not uploaded a resume.'
            )

        # Open the file through Django storage.
        resume.resume_file.open('rb')

        return FileResponse(
            resume.resume_file,
            as_attachment=False,
            filename=resume.resume_file.name.split('/')[-1],
            content_type='application/pdf'
        )
