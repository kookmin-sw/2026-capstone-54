# EC2 메타데이터 서비스 접근 설정

## 문제 상황

K3s Pod는 기본적으로 EC2 메타데이터 서비스(169.254.169.254)에 접근할 수 없습니다.
이로 인해 EC2 IAM Role 자격증명을 자동으로 가져올 수 없어 AWS SDK(boto3 등)가 작동하지 않습니다.

## 해결 방법

EC2 인스턴스에서 iptables 규칙을 추가하여 Pod 네트워크(10.42.0.0/16)에서 메타데이터 서비스로 접근을 허용합니다.

### 1. iptables 규칙 추가

EC2 인스턴스에 SSH 접속 후 다음 명령어 실행:

```bash
# Pod 네트워크에서 메타데이터 서비스로 접근 허용
sudo iptables -t nat -A PREROUTING -s 10.42.0.0/16 -d 169.254.169.254 -p tcp -m tcp --dport 80 -j ACCEPT
sudo iptables -A FORWARD -s 10.42.0.0/16 -d 169.254.169.254 -j ACCEPT

# 규칙 확인
sudo iptables -t nat -L PREROUTING -n -v
sudo iptables -L FORWARD -n -v
```

### 2. 영구 저장 (재부팅 후에도 유지)

```bash
# iptables-persistent 설치
sudo apt-get update
sudo apt-get install -y iptables-persistent

# 현재 규칙 저장
sudo netfilter-persistent save

# 또는 수동 저장
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### 3. 검증

Pod 내부에서 메타데이터 서비스 접근 테스트:

```bash
# 테스트 Pod 생성
kubectl run test-metadata --image=curlimages/curl --rm -it --restart=Never -- sh

# Pod 내부에서 실행
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/

# IAM Role 이름이 출력되면 성공
# 예: mefit-ec2-role

# 자격증명 확인
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/mefit-ec2-role

# AccessKeyId, SecretAccessKey, Token이 출력되면 성공
```

### 4. Python boto3 테스트

```bash
# Python 테스트 Pod 생성
kubectl run test-boto3 --image=python:3.12-slim --rm -it --restart=Never -- bash

# Pod 내부에서 실행
pip install boto3
python3 << 'EOF'
import boto3

# 자격증명 자동 감지 테스트
session = boto3.Session()
credentials = session.get_credentials()

if credentials:
    print("✅ AWS 자격증명 획득 성공!")
    print(f"Access Key: {credentials.access_key[:10]}...")
    
    # S3 클라이언트 테스트
    s3 = boto3.client('s3')
    print(f"✅ S3 클라이언트 생성 성공!")
else:
    print("❌ AWS 자격증명 획득 실패")
EOF
```

## 작동 원리

1. Pod가 169.254.169.254:80으로 요청을 보냅니다
2. iptables NAT 규칙이 이 요청을 허용합니다
3. K3s 네트워크가 요청을 EC2 호스트로 라우팅합니다
4. EC2 메타데이터 서비스가 IAM Role 자격증명을 반환합니다
5. boto3가 자격증명을 사용하여 AWS 서비스에 접근합니다

## 장점

- `hostNetwork: true` 불필요 (포트 충돌 없음)
- 여러 Pod 동시 실행 가능 (고가용성 확보)
- AWS 자격증명 Secret 관리 불필요
- EC2 IAM Role 권한 자동 사용

## 주의사항

1. **보안**: Pod 네트워크 전체가 메타데이터 서비스에 접근 가능합니다
   - 신뢰할 수 없는 컨테이너를 실행하지 마세요
   - NetworkPolicy로 추가 제한 가능

2. **EC2 IAM Role 권한**: 필요한 AWS 서비스 권한이 있는지 확인
   - S3: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
   - Lambda: `lambda:InvokeFunction`
   - SQS: `sqs:SendMessage`, `sqs:ReceiveMessage`

3. **재부팅 시**: iptables-persistent가 자동으로 규칙을 복원합니다

## 트러블슈팅

### 메타데이터 서비스 접근 실패

```bash
# iptables 규칙 확인
sudo iptables -t nat -L PREROUTING -n -v | grep 169.254.169.254
sudo iptables -L FORWARD -n -v | grep 169.254.169.254

# K3s 네트워크 확인
kubectl get nodes -o wide
kubectl get pods -o wide -A

# Pod CIDR 확인 (10.42.0.0/16이어야 함)
kubectl cluster-info dump | grep -i cidr
```

### boto3 자격증명 오류

```bash
# Pod 내부에서 디버깅
export AWS_EC2_METADATA_DISABLED=false
python3 -c "import boto3; print(boto3.Session().get_credentials())"

# 메타데이터 서비스 직접 확인
curl -v http://169.254.169.254/latest/meta-data/
```

## 대안 방법 (권장하지 않음)

1. **hostNetwork: true**: 포트 충돌로 replicas=1만 가능
2. **AWS 자격증명 Secret**: 보안 관리 복잡, 권한 요청 필요
3. **IRSA (EKS 전용)**: K3s에서는 사용 불가

## 참고 자료

- [AWS EC2 Instance Metadata Service](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html)
- [boto3 Credentials](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html)
- [K3s Networking](https://docs.k3s.io/networking)
