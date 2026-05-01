from common.services import BaseService


class UpdateUserNameService(BaseService):
  """현재 로그인한 사용자의 name 필드를 수정한다."""

  required_value_kwargs = ["name"]

  def execute(self):
    self.user.name = self.kwargs["name"]
    self.user.save(update_fields=["name"])
    return self.user
