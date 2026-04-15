"""이력서 텍스트 템플릿 기본 시드 서비스.

profiles.Job 의 각 직업마다 최소 1개의 템플릿을 보장한다.
Job.name 을 기준으로 매칭되는 템플릿 본문을 선택하며, 없으면 일반 템플릿을 생성한다.
"""

from django.db import transaction
from profiles.models import Job
from resumes.models import ResumeTextContentTemplate

# Job.name 부분 문자열 → 템플릿 본문 매핑
TEMPLATE_CONTENT_BY_KEYWORD = {
  "프론트엔드": """## 자기소개
사용자 경험을 중요하게 생각하는 프론트엔드 개발자입니다.

## 기술 스택
- 언어: TypeScript, JavaScript
- 프레임워크: React, Next.js
- 스타일: Tailwind CSS, styled-components
- 상태 관리: Zustand, Redux Toolkit, React Query
- 도구: Vite, Webpack, Storybook

## 주요 프로젝트
### (프로젝트명) — (역할, 기간)
- (담당한 업무)
- (성과/지표)

## 경력
- (회사명) (기간) — (직책)
  - (주요 업무)
""",
  "백엔드": """## 자기소개
확장 가능한 서버를 설계하는 백엔드 개발자입니다.

## 기술 스택
- 언어: Python, Java, Go
- 프레임워크: Django, Spring Boot, FastAPI
- 데이터베이스: PostgreSQL, MySQL, Redis
- 인프라: AWS, Docker, Kubernetes
- 메시징: Kafka, RabbitMQ

## 주요 프로젝트
### (프로젝트명) — (역할, 기간)
- (API 설계/성능 개선 등)
- (처리량, 지연시간 등 지표)

## 경력
- (회사명) (기간) — (직책)
  - (주요 업무)
""",
  "풀스택": """## 자기소개
프론트/백을 오가며 빠르게 제품을 만드는 풀스택 개발자입니다.

## 기술 스택
- 프론트: React, TypeScript, Next.js
- 백엔드: Node.js, Django, FastAPI
- 데이터베이스: PostgreSQL, MongoDB
- 인프라: AWS, Vercel

## 주요 프로젝트
### (프로젝트명) — (역할, 기간)
- (프론트와 백엔드를 모두 구현한 경험)
""",
  "DevOps": """## 자기소개
안정적인 배포와 관측 가능한 인프라를 추구하는 DevOps 엔지니어입니다.

## 기술 스택
- IaC: Terraform, Ansible
- 컨테이너: Docker, Kubernetes, Helm
- CI/CD: GitHub Actions, ArgoCD, Jenkins
- 모니터링: Prometheus, Grafana, Datadog
- 클라우드: AWS, GCP

## 주요 경험
- (IaC로 관리한 인프라 규모)
- (배포 파이프라인 개선 사례)
""",
  "데이터 엔지니어": """## 자기소개
신뢰할 수 있는 데이터 파이프라인을 구축하는 데이터 엔지니어입니다.

## 기술 스택
- 언어: Python, SQL, Scala
- 처리: Airflow, Spark, dbt, Kafka
- 저장소: BigQuery, Snowflake, PostgreSQL
- 클라우드: AWS, GCP

## 주요 프로젝트
### (프로젝트명) — (역할, 기간)
- (데이터 파이프라인 설계/운영 경험)
""",
  "머신러닝": """## 자기소개
문제 정의부터 배포까지 책임지는 머신러닝 엔지니어입니다.

## 기술 스택
- ML: PyTorch, TensorFlow, scikit-learn
- MLOps: MLflow, Kubeflow, Weights & Biases
- 데이터: pandas, NumPy, Spark

## 주요 프로젝트
### (프로젝트명) — (모델/성과)
- (해결한 문제, 메트릭)
""",
  "디지털 마케터": """## 자기소개
데이터 기반으로 캠페인을 최적화하는 디지털 마케터입니다.

## 주요 역량
- 광고 운영: Google Ads, Meta Ads, Naver GFA
- 분석: GA4, Amplitude, Mixpanel, Looker Studio
- 콘텐츠 기획 및 카피라이팅

## 주요 프로젝트
### (캠페인명) — (기간)
- 목표: (KPI)
- 결과: (ROAS, CTR 등)
""",
  "퍼포먼스": """## 자기소개
효율과 수익을 동시에 개선하는 퍼포먼스 마케터입니다.

## 주요 역량
- 매체 운영: Google, Meta, TikTok, Kakao
- 전환 최적화, A/B 테스트, LTV 분석

## 주요 성과
- (채널/캠페인) ROAS (전→후)
- (퍼널) 전환율 개선 사례
""",
  "콘텐츠": """## 자기소개
브랜드 메시지를 명확하게 전달하는 콘텐츠 마케터입니다.

## 주요 역량
- 콘텐츠 기획/제작, SEO 글쓰기
- 소셜 채널 운영, 카피라이팅

## 주요 프로젝트
- (콘텐츠 시리즈명) — (조회수/구독 증가 등)
""",
  "브랜드": """## 자기소개
일관된 브랜드 경험을 설계하는 브랜드 마케터입니다.

## 주요 역량
- 브랜드 전략, 포지셔닝, 마케팅 캠페인 기획
- 크리에이티브 가이드라인 구축
""",
  "회계": """## 자기소개
정확한 재무 정보를 관리하는 회계 담당자입니다.

## 주요 역량
- 결산, 세무, 외감 대응
- ERP: SAP, Oracle, 더존
- 관리 회계 및 예산 수립

## 경력
- (회사명) (기간) — (담당)
""",
  "세무": """## 자기소개
세무 신고와 절세 전략을 설계하는 세무사입니다.

## 주요 역량
- 법인세, 부가세, 원천세 신고
- 절세 컨설팅, 세무조사 대응
""",
  "재무": """## 자기소개
자금 운용과 재무 전략을 담당하는 재무 담당자입니다.

## 주요 역량
- 자금 관리, 환리스크 헤지
- 재무 분석, 예산 편성
- 투자 검토
""",
  "영업": """## 자기소개
고객의 문제를 해결하는 영업 담당자입니다.

## 주요 역량
- 신규 고객 발굴, 기존 고객 관리
- 제안서 작성, 협상

## 주요 성과
- (년도) 매출 (달성률)
- (주요 고객사)
""",
  "CS": """## 자기소개
고객 만족을 최우선으로 하는 CS 매니저입니다.

## 주요 역량
- 응대 프로세스 설계, CRM 운영
- 불만 대응, 재방문/재구매 유도
""",
  "인사": """## 자기소개
구성원의 성장을 지원하는 인사 담당자입니다.

## 주요 역량
- 채용, 평가, 보상 설계
- 조직문화 기획, 온보딩 운영
""",
  "채용": """## 자기소개
좋은 인재를 발굴하고 연결하는 채용 담당자입니다.

## 주요 역량
- 리크루팅, 전형 운영
- 채용 브랜딩, 데이터 기반 소싱
""",
}

# Fallback: Job.name에 매칭되는 키워드가 없을 때 사용
DEFAULT_TEMPLATE_CONTENT = """## 자기소개
(한 줄 소개를 작성해주세요)

## 주요 경력
- (회사명) (기간) — (직책)
  - (담당 업무)

## 주요 성과
- (정량적 지표와 함께 작성)

## 보유 역량
- (직무 관련 역량)
"""


class SeedResumeTemplatesService:
  """모든 Job에 대해 최소 1개의 템플릿을 보장한다."""

  @classmethod
  @transaction.atomic
  def perform(cls) -> int:
    created = 0
    for job in Job.objects.all():
      if ResumeTextContentTemplate.objects.filter(job=job).exists():
        continue

      content = cls._find_content_for_job(job.name)
      ResumeTextContentTemplate.objects.create(
        job=job,
        title=job.name,
        content=content,
        display_order=0,
      )
      created += 1
    return created

  @staticmethod
  def _find_content_for_job(job_name: str) -> str:
    for keyword, content in TEMPLATE_CONTENT_BY_KEYWORD.items():
      if keyword in job_name:
        return content
    return DEFAULT_TEMPLATE_CONTENT
