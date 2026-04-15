"""이력서 활성화/비활성화 서비스."""

from resumes.models import Resume


class ActivateResumeService:

  def __init__(self, resume: Resume):
    self.resume = resume

  def perform(self) -> Resume:
    if not self.resume.is_active:
      self.resume.is_active = True
      self.resume.save(update_fields=["is_active", "updated_at"])
    return self.resume


class DeactivateResumeService:

  def __init__(self, resume: Resume):
    self.resume = resume

  def perform(self) -> Resume:
    if self.resume.is_active:
      self.resume.is_active = False
      self.resume.save(update_fields=["is_active", "updated_at"])
    return self.resume
