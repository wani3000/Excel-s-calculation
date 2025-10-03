# 📊 Excel 비교 서비스 (Excel Comparison Service)

> 주문 전체내역과 코칭 DB를 비교하여 통합 결과를 생성하는 웹 애플리케이션

## 🎯 주요 기능

### 1. 매물코칭 (Property Coaching)
- 주문 전체내역과 매물코칭 DB 비교
- 취소/환불 데이터 별도 관리
- 상세한 통계 및 분석 결과 제공
- 39개 컬럼 구조의 통합 Excel 다운로드

### 2. 투자코칭 (Investment Coaching)
- 투자코칭 주문내역 + 내집마련코칭 주문내역 병합
- 코칭현황과 우선순위 기반 매칭 (이름 > 연락처 > 닉네임)
- 개별 카테고리별 다운로드 지원
- 코치별 상세 통계 제공

### 3. 결과 파일 분석 (File Analyzer)
- 두 결과 Excel 파일 비교
- 이름 기준 차이점 분석
- 상세한 불일치 데이터 표시

### 4. 주문 대량 업로드 템플릿 (Bulk Upload Template)
- YYMM_매물코칭_결산.xlsx → 주문대량업로드템플릿 변환
- displayId, nickName, phoneNumber, merchantUid, saleConfirmationAt, memo 컬럼 구조

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Excel Processing**: SheetJS (xlsx)
- **Icons**: Lucide React
- **UI Components**: Radix UI

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/wani3000/Excel-s-calculation.git
cd Excel-s-calculation
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
│   ├── FileUpload.tsx           # 매물코칭 파일 업로드
│   ├── InvestmentFileUpload.tsx # 투자코칭 파일 업로드
│   ├── ComparisonTable.tsx      # 비교 결과 테이블
│   ├── InvestmentResultTable.tsx # 투자코칭 결과 테이블
│   ├── ComparisonStats.tsx      # 매물코칭 통계
│   ├── InvestmentStats.tsx      # 투자코칭 통계
│   ├── FileAnalyzer.tsx         # 파일 분석기
│   └── BulkUploadTemplate.tsx   # 대량 업로드 템플릿
├── utils/               # 유틸리티 함수
│   ├── comparison.ts            # 매물코칭 비교 로직
│   ├── investmentComparison.ts  # 투자코칭 비교 로직
│   └── excel.ts                 # Excel 처리 함수
├── types/               # TypeScript 타입 정의
│   └── index.ts
└── App.tsx             # 메인 애플리케이션
```

## 📊 데이터 처리 흐름

### 매물코칭
1. 주문 전체내역 파일 업로드
2. 매물코칭 DB 파일 업로드
3. 닉네임 + 이름 + 전화번호 기준 매칭
4. 취소/환불 데이터 필터링
5. 통합 결과 생성 및 다운로드

### 투자코칭
1. 투자코칭 주문내역 파일 업로드
2. 내집마련코칭 주문내역 파일 업로드
3. 코칭현황 파일 업로드
4. 우선순위 기반 매칭 (이름 > 연락처 > 닉네임)
5. 개별 카테고리별 결과 생성

## 🔧 주요 특징

- **완전한 프론트엔드 솔루션**: 서버 없이 브라우저에서 모든 처리
- **데이터 보안**: 파일이 서버로 전송되지 않음
- **실시간 처리**: 즉시 결과 확인 가능
- **유연한 파일 형식**: .xlsx, .xls 지원
- **상세한 통계**: 매칭률, 금액, 기간 등 다양한 지표
- **개별 다운로드**: 카테고리별 결과 파일 생성

## 📈 사용 사례

- **코치 정산**: 실제 코칭 참여자 기반 정산 계산
- **데이터 검증**: 주문 내역과 실제 참여자 데이터 일치성 확인
- **결과 분석**: 두 결과 파일 간 차이점 분석
- **대량 처리**: 주문 데이터를 시스템 업로드 형식으로 변환

## 🔒 보안 및 개인정보

- 모든 데이터 처리는 클라이언트(브라우저)에서만 수행
- 파일은 서버에 업로드되지 않음
- 로컬에서만 데이터 처리 및 결과 생성

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면 [Issues](https://github.com/wani3000/Excel-s-calculation/issues)를 통해 알려주세요.

---

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**