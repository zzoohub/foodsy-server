# Foodsy Server - Layered Architecture Boilerplate

Pure Node.js와 TypeScript로 구현된 Layered Architecture 패턴의 서버 애플리케이션입니다.

## 🏗️ 아키텍처 구조

```
src/
├── controllers/     # Presentation Layer - HTTP 요청/응답 처리
├── services/        # Business Logic Layer - 비즈니스 로직
├── repositories/    # Data Access Layer - 데이터 접근
├── models/          # Domain Models - 데이터 모델 정의
├── routes/          # Routing Layer - 도메인별 라우팅 로직
├── utils/           # Utilities - 공통 유틸리티 함수
└── index.ts         # Application Entry Point
```

### 레이어별 역할

1. **Controller Layer**: HTTP 요청을 받아 적절한 Service로 전달하고 응답을 반환
2. **Service Layer**: 비즈니스 로직을 처리하고 데이터 검증 수행
3. **Repository Layer**: 데이터 저장소와의 상호작용 담당
4. **Model Layer**: 도메인 객체와 DTO 정의
5. **Route Layer**: 도메인별 라우팅 로직 관리
