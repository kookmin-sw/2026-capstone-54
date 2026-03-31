from rest_framework import serializers

from api.v1.terms_documents.serializers.terms_list_serializer import TermsListSerializer
from terms_documents.models import UserConsent


class UserConsentSerializer(serializers.ModelSerializer):
  terms_document = TermsListSerializer(read_only=True)

  class Meta:
    model = UserConsent
    fields = (
      "id",
      "terms_document",
      "agreed_at",
      "created_at",
    )
    read_only_fields = fields
