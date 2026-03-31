from rest_framework import serializers
from terms_documents.models import TermsDocument


class TermsListSerializer(serializers.ModelSerializer):

  class Meta:
    model = TermsDocument
    fields = (
      "id",
      "terms_type",
      "version",
      "title",
      "is_required",
      "effective_at",
      "created_at",
    )
