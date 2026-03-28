from common.validators import BaseValidator, validation_method
from django.core.exceptions import ValidationError
from django.test import TestCase


# 테스트용 가상 모델
class MockModel:
  """테스트용 가상 모델"""

  def __init__(self, name="test", value=10):
    self.name = name
    self.value = value


# 테스트용 Validator 클래스들
class SimpleValidator(BaseValidator):
  """단순 검증 - decorator 사용"""

  @validation_method(priority=10)
  def validate_name(self):
    if not self.instance.name:
      raise ValidationError({"name": "이름은 필수입니다."})


class PriorityValidator(BaseValidator):
  """우선순위가 있는 검증"""

  execution_order = []  # 실행 순서 추적용

  @validation_method(priority=10)
  def validate_high_priority(self):
    self.execution_order.append("high")
    if self.instance.value < 0:
      raise ValidationError({"value": "값은 0 이상이어야 합니다."})

  @validation_method(priority=5)
  def validate_medium_priority(self):
    self.execution_order.append("medium")
    if self.instance.value > 100:
      raise ValidationError({"value": "값은 100 이하여야 합니다."})

  @validation_method(priority=1)
  def validate_low_priority(self):
    self.execution_order.append("low")
    if not self.instance.name:
      raise ValidationError({"name": "이름은 필수입니다."})


class SamePriorityValidator(BaseValidator):
  """같은 우선순위 검증"""

  execution_count = 0

  @validation_method(priority=5)
  def validate_first(self):
    SamePriorityValidator.execution_count += 1

  @validation_method(priority=5)
  def validate_second(self):
    SamePriorityValidator.execution_count += 1


class MixedValidator(BaseValidator):
  """decorator 있는 것과 없는 것 혼합"""

  execution_order = []

  @validation_method(priority=10)
  def validate_with_decorator(self):
    self.execution_order.append("decorated")

  def validate_without_decorator(self):
    # decorator 없으면 실행되지 않아야 함
    self.execution_order.append("not_decorated")


class MultipleErrorsValidator(BaseValidator):
  """여러 필드에서 에러 발생"""

  @validation_method(priority=10)
  def validate_name(self):
    if not self.instance.name:
      raise ValidationError({"name": "이름은 필수입니다."})

  @validation_method(priority=5)
  def validate_value(self):
    if self.instance.value < 0:
      raise ValidationError({"value": "값은 0 이상이어야 합니다."})


class BaseValidatorTest(TestCase):
  """BaseValidator 테스트"""

  def test_simple_validation_success(self):
    """단순 검증 성공"""
    model = MockModel(name="test")
    validator = SimpleValidator(model)

    # 에러 없이 통과해야 함
    validator.validate()

  def test_simple_validation_failure(self):
    """단순 검증 실패"""
    model = MockModel(name="")
    validator = SimpleValidator(model)

    with self.assertRaises(ValidationError) as context:
      validator.validate()

    self.assertIn("name", context.exception.message_dict)

  def test_priority_order_execution(self):
    """우선순위 순서대로 실행"""
    PriorityValidator.execution_order = []
    model = MockModel(name="test", value=50)
    validator = PriorityValidator(model)

    validator.validate()

    # 높은 priority가 먼저 실행되어야 함
    self.assertEqual(validator.execution_order, ["high", "medium", "low"])

  def test_same_priority_all_executed(self):
    """같은 우선순위도 모두 실행"""
    SamePriorityValidator.execution_count = 0
    model = MockModel()
    validator = SamePriorityValidator(model)

    validator.validate()

    # 두 메서드 모두 실행되어야 함
    self.assertEqual(SamePriorityValidator.execution_count, 2)

  def test_decorator_required_for_execution(self):
    """decorator가 없는 메서드는 실행되지 않음"""
    MixedValidator.execution_order = []
    model = MockModel()
    validator = MixedValidator(model)

    validator.validate()

    # decorator가 있는 메서드만 실행
    self.assertEqual(validator.execution_order, ["decorated"])
    self.assertNotIn("not_decorated", validator.execution_order)

  def test_multiple_errors_collected(self):
    """여러 필드의 에러가 모두 수집됨"""
    model = MockModel(name="", value=-5)
    validator = MultipleErrorsValidator(model)

    with self.assertRaises(ValidationError) as context:
      validator.validate()

    errors = context.exception.message_dict
    self.assertIn("name", errors)
    self.assertIn("value", errors)

  def test_high_priority_fails_stops_execution(self):
    """높은 우선순위에서 실패해도 낮은 우선순위도 실행됨 (모든 에러 수집)"""
    PriorityValidator.execution_order = []
    model = MockModel(name="", value=-5)  # 두 검증 모두 실패
    validator = PriorityValidator(model)

    with self.assertRaises(ValidationError):
      validator.validate()

    # 모든 검증이 실행되어야 함 (에러 수집 모드)
    self.assertEqual(validator.execution_order, ["high", "medium", "low"])

  def test_no_decorator_no_execution(self):
    """decorator가 하나도 없으면 아무것도 실행 안 됨"""

    class NoDecoratorValidator(BaseValidator):
      executed = False

      def validate_something(self):
        NoDecoratorValidator.executed = True

    model = MockModel()
    validator = NoDecoratorValidator(model)
    validator.validate()

    # 실행되지 않아야 함
    self.assertFalse(NoDecoratorValidator.executed)

  def test_priority_default_zero(self):
    """priority 기본값은 0"""

    class DefaultPriorityValidator(BaseValidator):
      execution_order = []

      @validation_method()  # priority 지정 안 함
      def validate_default(self):
        self.execution_order.append("default")

      @validation_method(priority=5)
      def validate_high(self):
        self.execution_order.append("high")

    model = MockModel()
    validator = DefaultPriorityValidator(model)
    validator.validate()

    # priority 5가 먼저, 기본값 0이 나중
    self.assertEqual(validator.execution_order, ["high", "default"])
