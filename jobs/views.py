

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Job, SavedJob
from .serializers import JobSerializer, SavedJobSerializer
from .permissions import IsRecruiter, IsJobSeeker


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer

    def get_queryset(self):
        user = self.request.user

        if (
            user.is_authenticated
            and getattr(user, 'role', None) == 'recruiter'
        ):
            queryset = Job.objects.filter(recruiter=user)
        else:
            queryset = Job.objects.filter(is_active=True)

        title = self.request.query_params.get('title')
        location = self.request.query_params.get('location')
        job_type = self.request.query_params.get('job_type')
        experience_level = self.request.query_params.get(
            'experience_level'
        )

        if title:
            queryset = queryset.filter(title__icontains=title)

        if location:
            queryset = queryset.filter(location__icontains=location)

        if job_type:
            queryset = queryset.filter(job_type=job_type)

        if experience_level:
            queryset = queryset.filter(
                experience_level=experience_level
            )

        return queryset.order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsRecruiter()]

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsRecruiter()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return Job.objects.filter(is_active=True)

        return Job.objects.filter(recruiter=self.request.user)


class JobStatusToggleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def patch(self, request, pk):
        try:
            job = Job.objects.get(
                pk=pk,
                recruiter=request.user
            )
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        job.is_active = not job.is_active
        job.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'id': job.id,
            'is_active': job.is_active,
            'message': (
                'Job activated successfully.'
                if job.is_active
                else 'Job deactivated successfully.'
            )
        })

class SavedJobListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedJobSerializer
    permission_classes = [IsJobSeeker]

    def get_queryset(self):
        return SavedJob.objects.filter(
            user=self.request.user
        ).select_related('job')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedJobDetailView(generics.DestroyAPIView):
    serializer_class = SavedJobSerializer
    permission_classes = [IsJobSeeker]

    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)
