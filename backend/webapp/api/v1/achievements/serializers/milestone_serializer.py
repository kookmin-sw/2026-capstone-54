"""마일스톤 API 응답 직렬화."""

from achievements.models import Milestone, UserAchievement
from rest_framework import serializers


class MilestoneSerializer(serializers.ModelSerializer):
  """마일스톤 API 응답 직렬화."""

  days = serializers.SerializerMethodField()
  reward = serializers.SerializerMethodField()
  rewardIcon = serializers.SerializerMethodField()
  status = serializers.SerializerMethodField()
  daysRemaining = serializers.SerializerMethodField()

  class Meta:
    model = Milestone
    fields = ['id', 'days', 'name', 'description', 'reward', 'rewardIcon', 'status', 'daysRemaining']

  def get_days(self, obj):
    """condition_payload에서 days 추출."""
    rules = obj.condition_payload.get('rules', [])
    if rules:
      return rules[0].get('target', 0)
    return 0

  def get_reward(self, obj):
    """보상 정보를 사람이 읽을 수 있는 형식으로 변환."""
    payload = obj.reward_payload
    if payload.get('type') == 'ticket':
      amount = payload.get('amount', 0)
      return f"티켓 {amount}개"
    return ""

  def get_rewardIcon(self, obj):
    """보상 타입에 따른 아이콘 반환."""
    payload = obj.reward_payload
    if payload.get('type') == 'ticket':
      return "🎫"
    return ""

  def get_status(self, obj):
    """마일스톤 상태 계산."""
    request = self.context.get('request')
    if not request or not request.user or not request.user.is_authenticated:
      return 'locked'

    user = request.user

    # UserAchievement 확인
    has_achievement = UserAchievement.objects.filter(user=user, achievement=obj).exists()

    if has_achievement:
      return 'achieved'

    # 현재 streak 조회
    current_streak = self._get_current_streak(user)
    days = self.get_days(obj)

    if current_streak >= days:
      return 'achieved'
    else:
      return 'next'

  def get_daysRemaining(self, obj):
    """남은 일 수 계산."""
    status = self.get_status(obj)

    if status == 'achieved':
      return None

    if status == 'locked':
      return None

    request = self.context.get('request')
    if not request or not request.user or not request.user.is_authenticated:
      return None

    user = request.user
    current_streak = self._get_current_streak(user)
    days = self.get_days(obj)

    return max(0, days - current_streak)

  def _get_current_streak(self, user):
    """사용자의 현재 streak 조회."""
    if hasattr(user, 'profile') and hasattr(user.profile, 'current_streak'):
      return user.profile.current_streak
    return 0

  def to_representation(self, instance):
    """조건부 필드 포함."""
    data = super().to_representation(instance)
    status = data.get('status')

    # achieved 상태일 때 rewardIcon 제거
    if status == 'achieved':
      data.pop('rewardIcon', None)

    # locked 상태일 때 daysRemaining 제거
    if status == 'locked':
      data.pop('daysRemaining', None)

    return data
