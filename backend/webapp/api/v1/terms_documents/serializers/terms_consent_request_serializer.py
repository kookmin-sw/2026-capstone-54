from rest_framework import serializers


class TermsConsentRequestSerializer(serializers.Serializer):
  terms_document_ids = serializers.ListField(
    child=serializers.IntegerField(),
    required=True,
    allow_empty=False,
    write_only=True,
  )
