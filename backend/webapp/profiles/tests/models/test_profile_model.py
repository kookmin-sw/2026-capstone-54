from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from profiles.models import Job, JobCategory, Profile

User = get_user_model()


class ProfileModelTest(TestCase):
  """Profile 모델 테스트"""

  def setUp(self):
    self.user = User.objects.create_user(email="test@example.com", password="testpass123")
    self.category = JobCategory.objects.create(emoji="💻", name="IT/개발")
    self.job = Job.objects.create(name="백엔드 개발자", category=self.category)

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

    # 같은 카테고리의 job 추가
    job2 = Job.objects.create(name="프론트엔드 개발자", category=self.category)

    # 검증 통과해야 함
    profile.jobs.add(self.job, job2)

    self.assertEqual(profile.jobs.count(), 2)
    self.assertIn(self.job, profile.jobs.all())
    self.assertIn(job2, profile.jobs.all())

  def test_profile_jobs_different_category_validation_fails(self):
    """다른 카테고리의 jobs 추가 시 실패"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)

    # 다른 카테고리 생성
    other_category = JobCategory.objects.create(emoji="🎨", name="디자인")
    other_job = Job.objects.create(name="UI/UX 디자이너", category=other_category)

    # 다른 카테고리의 job 추가 시 ValidationError 발생
    from django.core.exceptions import ValidationError
    with self.assertRaises(ValidationError) as context:
      profile.jobs.add(other_job)

    self.assertIn("직군에 속하지 않습니다", str(context.exception))

  def test_profile_jobs_mixed_categories_validation_fails(self):
    """같은 카테고리와 다른 카테고리 jobs 혼합 추가 시 실패"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)

    # 같은 카테고리
    job2 = Job.objects.create(name="프론트엔드 개발자", category=self.category)

    # 다른 카테고리
    other_category = JobCategory.objects.create(emoji="🎨", name="디자인")
    other_job = Job.objects.create(name="UI/UX 디자이너", category=other_category)

    # 혼합 추가 시 ValidationError 발생
    from django.core.exceptions import ValidationError
    with self.assertRaises(ValidationError) as context:
      profile.jobs.add(self.job, job2, other_job)

    self.assertIn("UI/UX 디자이너", str(context.exception))
    self.assertIn("직군에 속하지 않습니다", str(context.exception))

  def test_profile_jobs_set_different_category_validation_fails(self):
    """set() 메서드로 다른 카테고리 jobs 설정 시 실패"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    # 다른 카테고리
    other_category = JobCategory.objects.create(emoji="🎨", name="디자인")
    other_job = Job.objects.create(name="UI/UX 디자이너", category=other_category)

    # set()으로 다른 카테고리 job 설정 시 ValidationError 발생
    from django.core.exceptions import ValidationError
    with self.assertRaises(ValidationError):
      profile.jobs.set([other_job])

  def test_profile_validator_directly(self):
    """ProfileValidator를 직접 호출하여 검증"""
    profile = Profile.objects.create(user=self.user, job_category=self.category)

    # 같은 카테고리 job 추가 (signal 없이)
    job2 = Job.objects.create(name="프론트엔드 개발자", category=self.category)
    profile.jobs.add(self.job, job2)

    # Validator 직접 호출 - 성공해야 함
    from profiles.validators import ProfileValidator
    validator = ProfileValidator(profile)
    validator.validate()  # 에러 없어야 함

    # 다른 카테고리 job 추가
    other_category = JobCategory.objects.create(emoji="🎨", name="디자인")
    other_job = Job.objects.create(name="UI/UX 디자이너", category=other_category)

    # Signal을 우회하여 직접 추가 (테스트용)
    Profile.jobs.through.objects.create(profile=profile, job=other_job)

    # Validator 직접 호출 - 실패해야 함
    from django.core.exceptions import ValidationError
    validator = ProfileValidator(profile)
    with self.assertRaises(ValidationError):
      validator.validate()

    self.assertIn("jobs", validator.errors)
