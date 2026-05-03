from api.v1.terms_documents.serializers.terms_list_serializer import TermsListSerializer
from rest_framework import serializers
from terms_documents.models import UserConsent


class UserConsentSerializer(serializers.ModelSerializer):
  terms_document = TermsListSerializer(read_only=True)

  class Meta:
    model = UserConsent
    fields = (
      "id",
      "terms_document",
      "is_agreed",
      "created_at",
    )
    read_only_fields = [
      "id",
      "terms_document",
      "created_at",
    ]

  def get_is_agreed(self, obj):
    return obj.is_agreed()


class UserConsentUpdateSerializer(serializers.Serializer):
  terms_document_id = serializers.IntegerField()
  is_agreed = serializers.BooleanField()

  def to_internal_value(self, data):
    return {
      "terms_document_id": data.get("termsDocumentId") or data.get("terms_document_id"),
      "is_agreed": data.get("isAgreed") or data.get("is_agreed"),
    }
