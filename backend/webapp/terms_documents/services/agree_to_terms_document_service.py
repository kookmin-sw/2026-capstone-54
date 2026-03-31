from common.services import BaseService
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError
from terms_documents.models import TermsDocument, UserConsent


class AgreeToTermsDocumentService(BaseService):
  """사용자 약관 동의 서비스. 공개된 약관 목록에 대한 동의 이력을 일괄 생성하거나 갱신한다."""

  required_value_kwargs = ["terms_document_ids"]

  def execute(self):
    """약관 동의 생성/갱신을 일괄 처리하고 입력 순서대로 반환한다."""
    terms_document_ids = self.kwargs["terms_document_ids"]
    require_all_required_published = self.kwargs.get("require_all_required_published", False)
    unique_terms_document_ids = list(dict.fromkeys(terms_document_ids))
    now = timezone.now()
    published_terms_by_id = self._get_published_terms_by_id(unique_terms_document_ids)
    self._validate_terms_document_ids(unique_terms_document_ids, published_terms_by_id)
    self._validate_required_terms_agreed(
      terms_document_ids=unique_terms_document_ids,
      require_all_required_published=require_all_required_published,
    )

    consent_by_terms_id = self._get_consent_by_terms_id(unique_terms_document_ids)
    consents_to_create, consents_to_update = self._prepare_consents(
      unique_terms_document_ids=unique_terms_document_ids,
      published_terms_by_id=published_terms_by_id,
      consent_by_terms_id=consent_by_terms_id,
      now=now,
    )

    if consents_to_create:
      created_consents = UserConsent.objects.bulk_create(consents_to_create)
      for created_consent in created_consents:
        consent_by_terms_id[created_consent.terms_document_id] = created_consent

    if consents_to_update:
      UserConsent.objects.bulk_update(consents_to_update, ["agreed_at"])
      updated_consents = UserConsent.objects.filter(id__in=[consent.id for consent in consents_to_update])
      for updated_consent in updated_consents:
        consent_by_terms_id[updated_consent.terms_document_id] = updated_consent

    return [consent_by_terms_id[terms_document_id] for terms_document_id in terms_document_ids]

  def _get_published_terms_by_id(self, terms_document_ids):
    """요청된 ID 중 공개된 약관만 조회해 ID 기준 딕셔너리로 반환한다."""
    return TermsDocument.objects.published().filter(id__in=terms_document_ids).in_bulk()

  def _validate_terms_document_ids(self, terms_document_ids, published_terms_by_id):
    """요청된 약관 ID가 모두 공개 상태인지 검증한다."""
    for terms_document_id in terms_document_ids:
      if terms_document_id not in published_terms_by_id:
        raise NotFound(detail=f"ID {terms_document_id}에 해당하는 공개된 약관이 없습니다.")

  def _get_consent_by_terms_id(self, terms_document_ids):
    """사용자의 기존 동의 이력을 약관 ID 기준 딕셔너리로 반환한다."""
    existing_consents = UserConsent.objects.filter(
      user=self.user,
      terms_document_id__in=terms_document_ids,
    )
    return {consent.terms_document_id: consent for consent in existing_consents}

  def _validate_required_terms_agreed(self, terms_document_ids, require_all_required_published):
    """필수 공개 약관 전체 동의 여부를 검증한다."""
    if not require_all_required_published:
      return

    required_published_terms_ids = set(
      TermsDocument.objects.published().filter(is_required=True).values_list("id", flat=True)
    )
    missing_required_terms_ids = sorted(required_published_terms_ids - set(terms_document_ids))
    if missing_required_terms_ids:
      raise ValidationError(
        detail={"terms_document_ids": ("필수 공개 약관에 모두 동의해야 회원가입할 수 있습니다. "
                                       f"누락된 약관 ID: {missing_required_terms_ids}")}
      )

  def _prepare_consents(self, unique_terms_document_ids, published_terms_by_id, consent_by_terms_id, now):
    """기존 동의는 업데이트 대상으로, 없는 동의는 생성 대상으로 분리한다."""
    consents_to_create = []
    consents_to_update = []

    for terms_document_id in unique_terms_document_ids:
      existing_consent = consent_by_terms_id.get(terms_document_id)
      if existing_consent:
        existing_consent.agreed_at = now
        consents_to_update.append(existing_consent)
        continue

      consents_to_create.append(
        UserConsent(
          user=self.user,
          terms_document=published_terms_by_id[terms_document_id],
          agreed_at=now,
        )
      )

    return consents_to_create, consents_to_update
