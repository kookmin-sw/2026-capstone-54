from resumes.enums import ResumeType

from .resume import Resume


class TextResumeManager(Resume.objects.__class__):

  def get_queryset(self):
    return super().get_queryset().filter(type=ResumeType.TEXT)


class TextResume(Resume):
  """type='text' 전용 프록시 모델."""

  objects = TextResumeManager()

  class Meta:
    proxy = True
    verbose_name = "Text Resume"
    verbose_name_plural = "Text Resumes"

  def save(self, *args, **kwargs):
    self.type = ResumeType.TEXT
    super().save(*args, **kwargs)
