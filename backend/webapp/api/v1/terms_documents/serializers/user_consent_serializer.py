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


class UserConsentUpdateSerializer(serializers.Serializer):
  terms_document_id = serializers.IntegerField()
  is_agreed = serializers.BooleanField()

  def to_internal_value(self, data):
    terms_document_id = data.get("termsDocumentId")
    if terms_document_id is None:
      terms_document_id = data.get("terms_document_id")

    is_agreed = data.get("isAgreed")
    if is_agreed is None:
      is_agreed = data.get("is_agreed")

    return {
      "terms_document_id": terms_document_id,
      "is_agreed": is_agreed,
    }
