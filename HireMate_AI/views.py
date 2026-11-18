from django.http import HttpResponse


def home(request):
    return HttpResponse("HireMate AI is running!")
