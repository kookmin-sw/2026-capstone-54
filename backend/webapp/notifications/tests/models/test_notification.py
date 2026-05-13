from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from notifications.models import Notification
from users.factories import UserFactory


class NotificationModelTests(TestCase):

  def setUp(self):
    self.user = UserFactory()

  def test_creates_without_notifiable(self):
    """notifiable 없이 알림을 생성할 수 있다."""
    notification = Notification.objects.create(
      user=self.user,
      message="테스트 메시지",
      category=Notification.Category.SYSTEM,
    )
    self.assertIsNotNone(notification.pk)
    self.assertIsNone(notification.notifiable_type)
    self.assertIsNone(notification.notifiable_id)

  def test_default_is_read_false(self):
    """is_read 기본값은 False다."""
    notification = Notification.objects.create(
      user=self.user,
      message="읽음 여부 기본값 테스트",
      category=Notification.Category.SYSTEM,
    )
    self.assertFalse(notification.is_read)

  def test_creates_with_notifiable(self):
    """notifiable로 User 객체를 연결하여 알림을 생성할 수 있다."""
    other_user = UserFactory()
    content_type = ContentType.objects.get_for_model(other_user)
    notification = Notification.objects.create(
      user=self.user,
      message="연결 알림",
      category=Notification.Category.SYSTEM,
      notifiable_type=content_type,
      notifiable_id=str(other_user.pk),
    )
    self.assertEqual(notification.notifiable_type, content_type)
    self.assertEqual(notification.notifiable_id, str(other_user.pk))
    self.assertEqual(notification.notifiable, other_user)

  def test_category_choices(self):
    """Category TextChoices 값들이 올바르게 정의되어 있다."""
    self.assertEqual(Notification.Category.INTERVIEW, "interview")
    self.assertEqual(Notification.Category.RESUME, "resume")
    self.assertEqual(Notification.Category.JD, "jd")
    self.assertEqual(Notification.Category.SYSTEM, "system")

  def test_str_representation(self):
    """__str__ 메서드가 카테고리와 메시지를 포함한 문자열을 반환한다."""
    notification = Notification.objects.create(
      user=self.user,
      message="문자열 표현 테스트",
      category=Notification.Category.SYSTEM,
    )
    result = str(notification)
    self.assertIn("system", result)
    self.assertIn("문자열 표현 테스트", result)

  def test_ordering_newest_first(self):
    """알림은 생성일 역순으로 정렬된다."""
    first = Notification.objects.create(
      user=self.user,
      message="첫 번째 알림",
      category=Notification.Category.SYSTEM,
    )
    second = Notification.objects.create(
      user=self.user,
      message="두 번째 알림",
      category=Notification.Category.SYSTEM,
    )
    qs = list(Notification.objects.filter(user=self.user))
    self.assertEqual(qs[0].pk, second.pk)
    self.assertEqual(qs[1].pk, first.pk)
