from django.test import TestCase
from django.urls import reverse
from notifications.models import Notification
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


def _make_notification(user, message="알림", category=Notification.Category.SYSTEM, is_read=False):
  """테스트용 Notification 객체를 생성하는 헬퍼."""
  return Notification.objects.create(
    user=user,
    message=message,
    category=category,
    is_read=is_read,
  )


class NotificationListTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.other_user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("notification-list")

  def _results(self, data):
    """페이지네이션 여부와 무관하게 결과 목록을 반환한다."""
    return data.get("results", data) if isinstance(data, dict) else data

  def test_returns_only_own_notifications(self):
    """본인의 알림만 반환한다."""
    _make_notification(self.user, message="내 알림")
    _make_notification(self.other_user, message="다른 유저 알림")

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    messages = [n["message"] for n in self._results(response.data)]
    self.assertIn("내 알림", messages)
    self.assertNotIn("다른 유저 알림", messages)

  def test_returns_200_with_empty_list(self):
    """알림이 없으면 빈 결과를 반환한다."""
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(self._results(response.data)), 0)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NotificationReadTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.other_user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  def test_sets_is_read_true(self):
    """PATCH read 액션 호출 시 is_read가 True로 설정된다."""
    notification = _make_notification(self.user, is_read=False)
    url = reverse("notification-read", kwargs={"pk": notification.pk})

    response = self.client.patch(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    notification.refresh_from_db()
    self.assertTrue(notification.is_read)

  def test_returns_serialized_notification(self):
    """PATCH read 액션은 직렬화된 알림 데이터를 반환한다."""
    notification = _make_notification(self.user)
    url = reverse("notification-read", kwargs={"pk": notification.pk})

    response = self.client.patch(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["id"], notification.pk)
    self.assertTrue(response.data["is_read"])

  def test_returns_404_for_other_users_notification(self):
    """다른 사용자의 알림에 접근하면 404를 반환한다."""
    other_notification = _make_notification(self.other_user)
    url = reverse("notification-read", kwargs={"pk": other_notification.pk})

    response = self.client.patch(url)

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("notification-mark-all-read")

  def test_marks_all_unread_as_read(self):
    """PATCH mark-all-read 호출 시 모든 미읽음 알림이 읽음 처리된다."""
    _make_notification(self.user, message="알림1", is_read=False)
    _make_notification(self.user, message="알림2", is_read=False)
    _make_notification(self.user, message="알림3", is_read=True)

    response = self.client.patch(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["updated"], 2)
    self.assertEqual(Notification.objects.filter(user=self.user, is_read=False).count(), 0)

  def test_returns_zero_when_all_already_read(self):
    """모두 이미 읽음 상태면 updated=0을 반환한다."""
    _make_notification(self.user, is_read=True)

    response = self.client.patch(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["updated"], 0)

  def test_does_not_affect_other_users_notifications(self):
    """다른 사용자의 알림은 영향을 받지 않는다."""
    other_user = UserFactory()
    _make_notification(other_user, is_read=False)

    self.client.patch(self.url)

    self.assertTrue(Notification.objects.filter(user=other_user, is_read=False).exists())


class NotificationDestroyTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.other_user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  def test_deletes_own_notification(self):
    """DELETE 호출 시 본인의 알림이 삭제된다."""
    notification = _make_notification(self.user)
    url = reverse("notification-detail", kwargs={"pk": notification.pk})

    response = self.client.delete(url)

    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertFalse(Notification.objects.filter(pk=notification.pk).exists())

  def test_returns_404_for_other_users_notification(self):
    """다른 사용자의 알림을 삭제하려 하면 404를 반환한다."""
    other_notification = _make_notification(self.other_user)
    url = reverse("notification-detail", kwargs={"pk": other_notification.pk})

    response = self.client.delete(url)

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    self.assertTrue(Notification.objects.filter(pk=other_notification.pk).exists())


class NotificationClearTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("notification-clear")

  def test_deletes_all_own_notifications(self):
    """DELETE clear 호출 시 본인의 모든 알림이 삭제된다."""
    _make_notification(self.user, message="알림1")
    _make_notification(self.user, message="알림2")

    response = self.client.delete(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["deleted"], 2)
    self.assertFalse(Notification.objects.filter(user=self.user).exists())

  def test_does_not_delete_other_users_notifications(self):
    """다른 사용자의 알림은 삭제되지 않는다."""
    other_user = UserFactory()
    _make_notification(other_user)

    self.client.delete(self.url)

    self.assertTrue(Notification.objects.filter(user=other_user).exists())

  def test_returns_zero_when_no_notifications(self):
    """알림이 없을 때 deleted=0을 반환한다."""
    response = self.client.delete(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["deleted"], 0)
