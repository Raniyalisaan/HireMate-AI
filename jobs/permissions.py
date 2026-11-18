
from rest_framework.permissions import BasePermission


class IsRecruiter(BasePermission):
    """
    Allow job creation and management only for recruiters.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'recruiter'
        )


class IsJobSeeker(BasePermission):
    """
    Allow access only to authenticated job seekers.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'job_seeker'
        )
