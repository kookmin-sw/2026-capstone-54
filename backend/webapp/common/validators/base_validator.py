from functools import wraps

from django.core.exceptions import ValidationError


def validation_method(priority=0):
  """
    검증 메서드를 표시하고 우선순위를 지정하는 decorator

    Args:
        priority: 우선순위 (높을수록 먼저 실행, 기본값 0)

    사용 예시:
        @validation_method(priority=10)
        def validate_required_fields(self):
            ...

        @validation_method(priority=5)
        def validate_relationships(self):
            ...
    """

  def decorator(func):
    func._is_validation_method = True
    func._validation_priority = priority

    @wraps(func)
    def wrapper(*args, **kwargs):
      return func(*args, **kwargs)

    return wrapper

  return decorator


class BaseValidator:
  """
    Template Method Pattern을 활용한 Base Validator

    사용법:
        1. 이 클래스를 상속
        2. @validation_method(priority=N) decorator로 검증 메서드 정의
        3. validate() 호출 시 priority 순으로 자동 실행 (높은 숫자가 먼저)

    예시:
        class MyValidator(BaseValidator):
            @validation_method(priority=10)
            def validate_required_fields(self):
                ...

            @validation_method(priority=5)
            def validate_relationships(self):
                ...
    """

  def __init__(self, instance):
    """
        Args:
            instance: 검증할 모델 인스턴스
        """
    self.instance = instance
    self.errors = {}

  def validate(self):
    """
        priority 순으로 검증 메서드 실행 (높은 숫자가 먼저)

        Raises:
            ValidationError: 검증 실패 시
        """
    validation_methods = self._get_validation_methods()

    for method in validation_methods:
      self._execute_validation_method(method)

    if self.errors:
      raise ValidationError(self.errors)

  def _get_validation_methods(self):
    """decorator가 붙은 검증 메서드를 priority 순으로 반환"""
    methods = []

    for name in dir(self):
      attr = getattr(self, name)
      if callable(attr) and hasattr(attr, '_is_validation_method'):
        priority = getattr(attr, '_validation_priority', 0)
        methods.append((priority, attr))

    # priority 내림차순 정렬 (높은 숫자가 먼저)
    methods.sort(key=lambda x: x[0], reverse=True)

    return [method for _, method in methods]

  def _execute_validation_method(self, method):
    """개별 검증 메서드 실행 및 에러 수집"""
    try:
      method()
    except ValidationError as e:
      self._collect_errors(e)

  def _collect_errors(self, error):
    """ValidationError를 errors 딕셔너리에 수집"""
    if hasattr(error, 'message_dict'):
      self.errors.update(error.message_dict)
    elif hasattr(error, 'message'):
      self.errors.setdefault('__all__', []).append(error.message)
    else:
      self.errors.setdefault('__all__', []).append(str(error))
