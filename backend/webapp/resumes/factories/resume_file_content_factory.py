import factory
from factory.django import DjangoModelFactory
from resumes.models import ResumeFileContent
from users.factories import UserFactory

from .file_resume_factory import FileResumeFactory


class ResumeFileContentFactory(DjangoModelFactory):

  class Meta:
    model = ResumeFileContent

  user = factory.SubFactory(UserFactory)
  resume = factory.SubFactory(FileResumeFactory, user=factory.SelfAttribute("..user"))
  original_filename = "resume.pdf"
  storage_path = "media/resumes/1/test.pdf"
  file_size_bytes = 1024
  mime_type = "application/pdf"
