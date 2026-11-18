
from rest_framework import serializers
from .models import Application
from resumes.models import Resume


class ApplicationSerializer(serializers.ModelSerializer):
    applicant_username = serializers.CharField(
        source='applicant.username',
        read_only=True
    )

    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.EmailField(
        source='applicant.email',
        read_only=True
    )
    applicant_photo = serializers.SerializerMethodField()
    applicant_location = serializers.SerializerMethodField()
    applicant_bio = serializers.SerializerMethodField()
    applicant_skills = serializers.SerializerMethodField()
    applicant_education = serializers.SerializerMethodField()
    applicant_experience = serializers.SerializerMethodField()
    applicant_portfolio = serializers.SerializerMethodField()
    
    resume = serializers.PrimaryKeyRelatedField(
    queryset=Resume.objects.all(),
    required=True
    )

    job_title = serializers.CharField(
        source='job.title',
        read_only=True
    )

    company = serializers.CharField(
        source='job.company',
        read_only=True
    )

    recruiter_name = serializers.SerializerMethodField()
    recruiter_photo = serializers.SerializerMethodField()
    recruiter_company = serializers.SerializerMethodField()

    def validate_resume(self, value):
        request = self.context.get('request')

        if request and value.user_id != request.user.id:
            raise serializers.ValidationError(
                'You can only select your own resume.'
            )

        return value

    def get_applicant_name(self, obj):
        return (
            obj.applicant.get_full_name()
            or obj.applicant.username
        )

    def get_applicant_profile(self, obj):
        return getattr(obj.applicant, 'profile', None)

    def get_applicant_photo(self, obj):
        profile = self.get_applicant_profile(obj)

        if profile and profile.profile_photo:
            request = self.context.get('request')
            photo_url = profile.profile_photo.url

            if request:
                return request.build_absolute_uri(photo_url)

            return photo_url

        return None

    def get_applicant_location(self, obj):
        profile = self.get_applicant_profile(obj)
        return profile.location if profile else ''

    def get_applicant_bio(self, obj):
        profile = self.get_applicant_profile(obj)
        return profile.bio if profile else ''

    def get_applicant_skills(self, obj):
        profile = self.get_applicant_profile(obj)
        return profile.skills if profile else ''

    def get_applicant_education(self, obj):
        profile = self.get_applicant_profile(obj)
        return profile.education if profile else ''

    def get_applicant_experience(self, obj):
        profile = self.get_applicant_profile(obj)
        return profile.experience if profile else ''

    def get_applicant_portfolio(self, obj):
        profile = self.get_applicant_profile(obj)
        return profile.portfolio_url if profile else ''

    def get_recruiter_name(self, obj):
        recruiter = getattr(obj.job, 'recruiter', None)

        if recruiter:
            return recruiter.get_full_name() or recruiter.username

        return ''

    def get_recruiter_photo(self, obj):
        recruiter = getattr(obj.job, 'recruiter', None)

        if recruiter:
            profile = getattr(recruiter, 'profile', None)

            if profile and profile.profile_photo:
                request = self.context.get('request')
                photo_url = profile.profile_photo.url

                if request:
                    return request.build_absolute_uri(photo_url)

                return photo_url

        return None

    def get_recruiter_company(self, obj):
        recruiter = getattr(obj.job, 'recruiter', None)

        if recruiter:
            profile = getattr(recruiter, 'profile', None)

            if profile and profile.company_name:
                return profile.company_name

        return obj.job.company or ''

    class Meta:
        model = Application
        fields = [
            'id',
            'job',
            'resume',
            'job_title',
            'company',
            'applicant',
            'applicant_username',
            'applicant_name',
            'applicant_email',
            'applicant_photo',
            'applicant_location',
            'applicant_bio',
            'applicant_skills',
            'applicant_education',
            'applicant_experience',
            'applicant_portfolio',
            'recruiter_name',
            'recruiter_photo',
            'recruiter_company',
            'cover_letter',
            'status',
            'applied_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'applicant',
            'applied_at',
            'updated_at',
        ]
