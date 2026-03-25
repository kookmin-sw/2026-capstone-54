# Gmail SMTP 설정 가이드

Gmail을 통해 이메일을 발송하려면 **앱 비밀번호**가 필요합니다.
일반 Gmail 비밀번호로는 SMTP 인증이 불가합니다.

## 1. 2단계 인증 활성화

1. [Google 계정 보안](https://myaccount.google.com/security) 접속
2. "Google에 로그인하는 방법" > **2단계 인증** 클릭
3. 안내에 따라 2단계 인증을 활성화

## 2. 앱 비밀번호 생성

1. [앱 비밀번호 페이지](https://myaccount.google.com/apppasswords) 접속
   - 2단계 인증이 활성화되어 있어야 이 페이지에 접근 가능
2. 앱 이름에 `MeFit` 입력 후 **만들기** 클릭
3. 16자리 비밀번호가 표시됨 (예: `abcd efgh ijkl mnop`)
4. 이 비밀번호를 복사 (공백 제거 불필요, Django가 처리함)

## 3. .env 설정

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

| 키 | 값 | 설명 |
|---|---|---|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | 실제 SMTP 발송 |
| `EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP 서버 |
| `EMAIL_PORT` | `587` | TLS 포트 |
| `EMAIL_USE_TLS` | `True` | TLS 암호화 |
| `EMAIL_HOST_USER` | Gmail 주소 | SMTP 인증 계정 |
| `EMAIL_HOST_PASSWORD` | 앱 비밀번호 (16자리) | 2단계에서 생성한 값 |
| `DEFAULT_FROM_EMAIL` | 발신자 주소 | 수신자에게 표시되는 주소 |

## 개발 환경

개발 중에는 실제 이메일을 보내지 않고 콘솔에 출력할 수 있습니다.

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

이 설정이 `.env`의 기본값이므로, 별도 설정 없이 개발 가능합니다.
