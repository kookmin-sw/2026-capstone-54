from common.services import BaseService
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError
from terms_documents.models import TermsDocument, UserConsent


class AgreeToTermsDocumentService(BaseService):

  def execute(self):
    updates = self.kwargs.get("updates", [])
    require_ai_for_free_plan = self.kwargs.get("require_ai_for_free_plan", False)

    # updates가 비어있으면 빈 리스트 반환 (약관 동의 없음)
    if not updates:
      all_user_consents = UserConsent.objects.filter(user=self.user).select_related("terms_document")
      return list(all_user_consents)

    now = timezone.now()
    self._handle_updates(updates, now, require_ai_for_free_plan)

    all_user_consents = UserConsent.objects.filter(user=self.user).select_related("terms_document")
    return list(all_user_consents)

  def _handle_updates(self, updates, now, require_ai_for_free_plan):
    terms_doc_ids = [u["terms_document_id"] for u in updates]
    published_terms = self._get_published_terms_by_id(terms_doc_ids)
    self._validate_terms_document_ids(terms_doc_ids, published_terms)

    if require_ai_for_free_plan:
      self._validate_ai_consent(updates)

    existing_consents = UserConsent.objects.filter(
      user=self.user,
      terms_document_id__in=terms_doc_ids,
    )
    consent_by_id = {c.terms_document_id: c for c in existing_consents}

    to_create = []
    to_update = []

    for update in updates:
      terms_doc_id = update["terms_document_id"]
      is_agreed = update["is_agreed"]
      terms_doc = published_terms[terms_doc_id]

      existing = consent_by_id.get(terms_doc_id)
      if existing:
        if is_agreed:
          existing.agreed_at = now
          existing.disagreed_at = None
        else:
          existing.agreed_at = None
          existing.disagreed_at = now
        to_update.append(existing)
      else:
        to_create.append(
          UserConsent(
            user=self.user,
            terms_document=terms_doc,
            agreed_at=now if is_agreed else None,
            disagreed_at=now if not is_agreed else None,
          )
        )

    # atomic 트랜잭션으로 bulk 작업 수행
    with transaction.atomic():
      if to_create:
        UserConsent.objects.bulk_create(to_create)
      if to_update:
        UserConsent.objects.bulk_update(to_update, ["agreed_at", "disagreed_at"])

  def _get_published_terms_by_id(self, terms_document_ids):
    return TermsDocument.objects.published().filter(id__in=terms_document_ids).in_bulk()

  def _validate_terms_document_ids(self, terms_document_ids, published_terms_by_id):
    for terms_document_id in terms_document_ids:
      if terms_document_id not in published_terms_by_id:
        raise NotFound(detail=f"ID {terms_document_id}에 해당하는 공개된 약관이 없습니다.")

  def _validate_ai_consent(self, updates):
    from terms_documents.enums import TermsType
    try:
      ai_doc = TermsDocument.objects.published().get(terms_type=TermsType.AI_TRAINING_DATA)
    except TermsDocument.DoesNotExist:
      return

    from subscriptions.enums import PlanType
    from subscriptions.services.get_current_subscription_service import GetCurrentSubscriptionService

    try:
      subscription = GetCurrentSubscriptionService(user=self.user).perform()
      if subscription.plan_type != PlanType.FREE:
        return
    except Exception:
      pass

    for update in updates:
      if update["terms_document_id"] == ai_doc.id:
        if not update["is_agreed"]:
          raise ValidationError(detail=f"AI 이용약관에 동의해야 합니다. (ID: {ai_doc.id})")
