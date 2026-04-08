from resumes.enums import ResumeType

from .resume import Resume


class FileResumeManager(Resume.objects.__class__):

  def get_queryset(self):
    return super().get_queryset().filter(type=ResumeType.FILE)


class FileResume(Resume):
  """type='file' 전용 프록시 모델."""

  objects = FileResumeManager()

  class Meta:
    proxy = True
    verbose_name = "File Resume"
    verbose_name_plural = "File Resumes"

  def save(self, *args, **kwargs):
    self.type = ResumeType.FILE
    super().save(*args, **kwargs)
