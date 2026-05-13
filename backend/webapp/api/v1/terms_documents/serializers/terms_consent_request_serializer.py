from rest_framework import serializers

from .user_consent_serializer import UserConsentUpdateSerializer


class TermsConsentRequestSerializer(serializers.Serializer):
  updates = UserConsentUpdateSerializer(many=True)
