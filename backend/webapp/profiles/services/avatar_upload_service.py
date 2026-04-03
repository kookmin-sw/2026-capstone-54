from common.exceptions import NotFoundException, ValidationException
from common.services import BaseService

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class AvatarUploadService(BaseService):
  """사용자 프로필 아바타 이미지를 업로드/교체한다."""

  required_value_kwargs = ["avatar"]

  def validate(self):
    if not hasattr(self.user, "profile"):
      raise NotFoundException()

    self.profile = self.user.profile
    avatar = self.kwargs["avatar"]

    if avatar.content_type not in ALLOWED_IMAGE_TYPES:
      raise ValidationException(field_errors={"avatar": ["JPEG, PNG, GIF, WebP 형식의 이미지만 업로드 가능합니다."]})

    if avatar.size > MAX_FILE_SIZE:
      raise ValidationException(field_errors={"avatar": ["파일 크기는 5MB 이하여야 합니다."]})

  def execute(self):
    avatar = self.kwargs["avatar"]

    if self.profile.avatar:
      self.profile.avatar.storage.delete(self.profile.avatar.name)

    self.profile.avatar = avatar
    self.profile.save(update_fields=["avatar"])
    return self.profile
