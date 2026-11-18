
from rest_framework import serializers
from .models import Job, SavedJob


class JobSerializer(serializers.ModelSerializer):
    recruiter_username = serializers.CharField(
        source='recruiter.username',
        read_only=True
    )

    recruiter_photo = serializers.SerializerMethodField()

    def get_recruiter_photo(self, obj):
        profile = getattr(obj.recruiter, 'profile', None)

        if profile and profile.profile_photo:
            request = self.context.get('request')
            photo_url = profile.profile_photo.url

            if request:
                return request.build_absolute_uri(photo_url)

            return photo_url

        return None

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = [
            'recruiter',
            'created_at',
            'updated_at',
        ]


class SavedJobSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)

    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'job_details', 'saved_at']
        read_only_fields = ['id', 'saved_at']
