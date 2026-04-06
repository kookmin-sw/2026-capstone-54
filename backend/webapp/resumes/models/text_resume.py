from resumes.enums import ResumeType

from .resume import Resume


class TextResumeManager(Resume.objects.__class__):

  def get_queryset(self):
    return super().get_queryset().filter(resume_type=ResumeType.TEXT)


class TextResume(Resume):
  """resume_type='text' 전용 프록시 모델."""

  objects = TextResumeManager()

  class Meta:
    proxy = True
    verbose_name = "Text Resume"
    verbose_name_plural = "Text Resumes"

  def save(self, *args, **kwargs):
    self.resume_type = ResumeType.TEXT
    super().save(*args, **kwargs)
