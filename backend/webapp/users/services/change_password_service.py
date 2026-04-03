from common.exceptions import ValidationException
from common.services import BaseService


class ChangePasswordService(BaseService):
  """현재 비밀번호를 확인한 후 새 비밀번호로 변경한다."""

  required_value_kwargs = ["old_password", "new_password"]

  def validate(self):
    old_password = self.kwargs["old_password"]
    new_password = self.kwargs["new_password"]

    if not self.user.check_password(old_password):
      raise ValidationException(field_errors={"old_password": ["현재 비밀번호가 올바르지 않습니다."]})

    if len(new_password) < 8:
      raise ValidationException(field_errors={"new_password": ["비밀번호는 8자 이상이어야 합니다."]})

    if old_password == new_password:
      raise ValidationException(field_errors={"new_password": ["현재 비밀번호와 다른 비밀번호를 입력해주세요."]})

  def execute(self):
    self.user.set_password(self.kwargs["new_password"])
    self.user.save(update_fields=["password"])
