from django.db import IntegrityError
from django.test import TestCase
from profiles.factories import JobCategoryFactory, JobFactory
from profiles.models import Profile
from users.factories import UserFactory


class ProfileModelTest(TestCase):
  """Profile 모델 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.category = JobCategoryFactory(emoji="💻", name="IT/개발")
    self.job = JobFactory(name="백엔드 개발자", category=self.category)

  def test_profile_one_to_one_relationship_with_user(self):
    """Profile과 User의 일대일 관계 테스트"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    self.assertEqual(self.user.profile, profile)
    self.assertEqual(profile.user, self.user)

  def test_profile_duplicate_user_fails(self):
    """동일 User에 대한 중복 Profile 생성 실패 테스트"""
    Profile.objects.create(user=self.user, job_category=self.category)

    with self.assertRaises(IntegrityError):
      Profile.objects.create(user=self.user, job_category=self.category)

  def test_profile_soft_delete(self):
    """Profile 소프트 삭제 테스트"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    profile.delete()

    self.assertEqual(Profile.objects.count(), 0)
    self.assertEqual(Profile.all_objects.count(), 1)

  def test_profile_jobs_same_category_validation_success(self):
    """같은 카테고리의 jobs 추가 시 성공"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)

    job2 = JobFactory(name="프론트엔드 개발자", category=self.category)

    profile.jobs.add(self.job, job2)

    self.assertEqual(profile.jobs.count(), 2)
    self.assertIn(self.job, profile.jobs.all())
    self.assertIn(job2, profile.jobs.all())

  def test_profile_jobs_different_category_validation_fails(self):
    """다른 카테고리의 jobs 추가 시 실패"""
    from django.core.exceptions import ValidationError
    profile = Profile.objects.create(user=self.user, job_category=self.category)

    other_category = JobCategoryFactory(emoji="🎨", name="디자인")
    other_job = JobFactory(name="UI/UX 디자이너", category=other_category)

    with self.assertRaises(ValidationError) as context:
      profile.jobs.add(other_job)

    self.assertIn("직군에 속하지 않습니다", str(context.exception))

  def test_profile_jobs_mixed_categories_validation_fails(self):
    """같은 카테고리와 다른 카테고리 jobs 혼합 추가 시 실패"""
    from django.core.exceptions import ValidationError
    profile = Profile.objects.create(user=self.user, job_category=self.category)

    job2 = JobFactory(name="프론트엔드 개발자", category=self.category)

    other_category = JobCategoryFactory(emoji="🎨", name="디자인")
    other_job = JobFactory(name="UI/UX 디자이너", category=other_category)

    with self.assertRaises(ValidationError) as context:
      profile.jobs.add(self.job, job2, other_job)

    self.assertIn("UI/UX 디자이너", str(context.exception))
    self.assertIn("직군에 속하지 않습니다", str(context.exception))

  def test_profile_jobs_set_different_category_validation_fails(self):
    """set() 메서드로 다른 카테고리 jobs 설정 시 실패"""
    from django.core.exceptions import ValidationError
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    other_category = JobCategoryFactory(emoji="🎨", name="디자인")
    other_job = JobFactory(name="UI/UX 디자이너", category=other_category)

    with self.assertRaises(ValidationError):
      profile.jobs.set([other_job])

  def test_profile_validator_directly(self):
    """ProfileValidator를 직접 호출하여 검증"""
    from django.core.exceptions import ValidationError
    from profiles.validators import ProfileValidator

    profile = Profile.objects.create(user=self.user, job_category=self.category)

    job2 = JobFactory(name="프론트엔드 개발자", category=self.category)
    profile.jobs.add(self.job, job2)

    validator = ProfileValidator(profile)
    validator.validate()  # 에러 없어야 함

    other_category = JobCategoryFactory(emoji="🎨", name="디자인")
    other_job = JobFactory(name="UI/UX 디자이너", category=other_category)

    # Signal을 우회하여 직접 추가 (테스트용)
    Profile.jobs.through.objects.create(profile=profile, job=other_job)

    validator = ProfileValidator(profile)
    with self.assertRaises(ValidationError):
      validator.validate()

    self.assertIn("jobs", validator.errors)
