// 테스트용 데이터 생성 스크립트
const XLSX = require('xlsx');

// 주문 전체내역 테스트 데이터
const orderData = [
  {
    '주문번호': 'ORD001',
    '닉네임': '홍길동',
    '이름': '홍길동',
    '휴대폰번호': '010-1234-5678',
    'ID': 'hong@test.com',
    '상품명': '투자코칭_25년 8월',
    '옵션정보': '월부멘토 1:1 투자코칭',
    '판매액': 50000,
    'PG결제액': 45000,
    '포인트사용': 5000,
    '상태': '결제완료',
    '결제일시': '2024-01-15 10:30:00',
    '결제수단': '카드',
    '결제플랫폼': '모바일 웹',
    '마케팅수신동의': 'Y'
  },
  {
    '주문번호': 'ORD002',
    '닉네임': '김철수',
    '이름': '김철수',
    '휴대폰번호': '010-2345-6789',
    'ID': 'kim@test.com',
    '상품명': '투자코칭_25년 8월',
    '옵션정보': '월부멘토 1:1 투자코칭',
    '판매액': 75000,
    'PG결제액': 70000,
    '포인트사용': 5000,
    '상태': '결제완료',
    '결제일시': '2024-01-16 14:20:00',
    '결제수단': '카카오페이',
    '결제플랫폼': 'PC 웹',
    '마케팅수신동의': 'Y'
  },
  {
    '주문번호': 'ORD003',
    '닉네임': '이영희',
    '이름': '이영희',
    '휴대폰번호': '010-3456-7890',
    'ID': 'lee@test.com',
    '상품명': '투자코칭_25년 8월',
    '옵션정보': '월부멘토 1:1 투자코칭',
    '판매액': 60000,
    'PG결제액': 60000,
    '상태': '결제완료',
    '결제일시': '2024-01-17 09:15:00',
    '결제수단': '카드',
    '결제플랫폼': '모바일 웹',
    '마케팅수신동의': 'N'
  }
];

// 매물코칭 DB 테스트 데이터
const coachingData = [
  {
    '닉네임': '홍길동',
    '이름': '홍길동',
    '번호': '010-1234-5678',
    'ID': 'hong@test.com',
    '코치': '김멘토',
    '코칭일정': '2024-01-20 15:00',
    '신청일': '2024-01-10 10:00:00',
    '상태': '등록완료'
  },
  {
    '닉네임': '김철수',
    '이름': '김철수',
    '번호': '010-2345-6789',
    'ID': 'kim@test.com',
    '코치': '박멘토',
    '코칭일정': '2024-01-21 16:00',
    '신청일': '2024-01-11 11:00:00',
    '상태': '등록완료'
  },
  {
    '닉네임': '박민수',
    '이름': '박민수',
    '번호': '010-4567-8901',
    'ID': 'park@test.com',
    '코치': '이멘토',
    '코칭일정': '2024-01-22 17:00',
    '신청일': '2024-01-12 12:00:00',
    '상태': '등록완료'
  }
];

// Excel 파일 생성
const orderWorkbook = XLSX.utils.book_new();
const orderSheet = XLSX.utils.json_to_sheet(orderData);
XLSX.utils.book_append_sheet(orderWorkbook, orderSheet, 'Sheet1');
XLSX.writeFile(orderWorkbook, 'test_orders.xlsx');

const coachingWorkbook = XLSX.utils.book_new();
const coachingSheet = XLSX.utils.json_to_sheet(coachingData);
XLSX.utils.book_append_sheet(coachingWorkbook, coachingSheet, 'Sheet1');
XLSX.writeFile(coachingWorkbook, 'test_coaching.xlsx');

console.log('테스트 파일 생성 완료: test_orders.xlsx, test_coaching.xlsx');


