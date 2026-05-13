from unittest.mock import MagicMock

from common.exceptions import PermissionDeniedException
from common.permissions import AllowAny, IsAuthenticated, IsEmailVerified, IsProfileCompleted
from django.test import TestCase
from rest_framework.test import APIRequestFactory


def make_request(is_authenticated=True, email_confirmed=False, profile_completed=False):
  factory = APIRequestFactory()
  request = factory.get("/")
  user = MagicMock()
  user.is_authenticated = is_authenticated
  user.is_email_confirmed = email_confirmed
  user.is_profile_completed = profile_completed
  request.user = user
  return request


class AllowAnyPermissionTests(TestCase):

  def test_allows_authenticated_user(self):
    """AllowAny는 인증된 사용자를 허용한다"""
    self.assertTrue(AllowAny().has_permission(make_request(is_authenticated=True), None))

  def test_allows_anonymous_user(self):
    """AllowAny는 미인증 사용자도 허용한다"""
    self.assertTrue(AllowAny().has_permission(make_request(is_authenticated=False), None))


class IsAuthenticatedPermissionTests(TestCase):

  def test_allows_authenticated_user(self):
    """IsAuthenticated는 인증된 사용자를 허용한다"""
    self.assertTrue(IsAuthenticated().has_permission(make_request(is_authenticated=True), None))

  def test_denies_anonymous_user(self):
    """IsAuthenticated는 미인증 사용자를 거부한다"""
    self.assertFalse(IsAuthenticated().has_permission(make_request(is_authenticated=False), None))


class IsEmailVerifiedPermissionTests(TestCase):

  def test_allows_authenticated_and_email_confirmed(self):
    """IsEmailVerified는 인증 + 이메일 인증된 사용자를 허용한다"""
    request = make_request(is_authenticated=True, email_confirmed=True)
    self.assertTrue(IsEmailVerified().has_permission(request, None))

  def test_denies_unauthenticated(self):
    """IsEmailVerified는 미인증 사용자를 거부한다"""
    request = make_request(is_authenticated=False)
    self.assertFalse(IsEmailVerified().has_permission(request, None))

  def test_raises_for_authenticated_but_unverified(self):
    """IsEmailVerified는 인증됐지만 이메일 미인증 사용자에게 PermissionDeniedException을 발생시킨다"""
    request = make_request(is_authenticated=True, email_confirmed=False)
    with self.assertRaises(PermissionDeniedException):
      IsEmailVerified().has_permission(request, None)


class IsProfileCompletedPermissionTests(TestCase):

  def test_allows_all_conditions_met(self):
    """IsProfileCompleted는 인증 + 이메일 인증 + 프로필 완료된 사용자를 허용한다"""
    request = make_request(is_authenticated=True, email_confirmed=True, profile_completed=True)
    self.assertTrue(IsProfileCompleted().has_permission(request, None))

  def test_denies_unauthenticated(self):
    """IsProfileCompleted는 미인증 사용자를 거부한다"""
    request = make_request(is_authenticated=False)
    self.assertFalse(IsProfileCompleted().has_permission(request, None))

  def test_raises_for_unverified_email(self):
    """IsProfileCompleted는 이메일 미인증 사용자에게 PermissionDeniedException을 발생시킨다"""
    request = make_request(is_authenticated=True, email_confirmed=False)
    with self.assertRaises(PermissionDeniedException):
      IsProfileCompleted().has_permission(request, None)

  def test_raises_for_incomplete_profile(self):
    """IsProfileCompleted는 프로필 미완료 사용자에게 PermissionDeniedException을 발생시킨다"""
    request = make_request(is_authenticated=True, email_confirmed=True, profile_completed=False)
    with self.assertRaises(PermissionDeniedException):
      IsProfileCompleted().has_permission(request, None)
