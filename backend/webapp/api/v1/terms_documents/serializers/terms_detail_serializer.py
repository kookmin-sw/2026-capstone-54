from rest_framework import serializers

from terms_documents.models import TermsDocument


class TermsDetailSerializer(serializers.ModelSerializer):

  class Meta:
    model = TermsDocument
    fields = (
      "id",
      "terms_type",
      "version",
      "title",
      "content",
      "is_required",
      "effective_at",
      "created_at",
    )
