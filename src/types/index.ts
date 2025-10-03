// 주문전체내역 데이터 타입 정의
export interface OrderData {
  주문번호: string;
  ID: string;
  이름: string;
  닉네임: string;
  휴대폰번호: string;
  전시상품명: string;
  옵션정보: string;
  '판매액(원)': string | number;
  'PG 결제액(원)': string | number;
  '인앱 결제액(원)': string | number;
  포인트사용: string | number;
  베네피아포인트: string | number;
  '상품권 사용': string | number;
  쿠폰할인: string | number;
  상태: string;
  결제일시: string;
  대기신청일: string;
  결제수단: string;
  결제요청: string;
  결제플랫폼: string;
  마케팅수신동의: string;
  예전아이디: string;
  [key: string]: any; // 기타 컬럼들
}

// 매물코칭DB 데이터 타입 정의
export interface CoachingData {
  닉네임: string;
  이름: string;
  번호: string;
  코칭진행일: string;
  코치: string;
  '진행여부 / 비고': string;
  월부학교: string;
  '1순위(구, 관심지역)': string;
  '2순위': string;
  중개문자발송여부: string;
  중개서비스진행여부: string;
  [key: string]: any; // 기타 컬럼들
}

// 투자코칭 탭용 새로운 타입들
export interface InvestmentOrderData extends OrderData {
  // 투자코칭 주문내역과 내집마련코칭 주문내역 모두 동일한 구조
}

export interface InvestmentParticipantData {
  닉네임: string;
  성함?: string; // 투자코칭 현황 파일에서 사용
  이름?: string; // 주문내역에서 사용
  연락처?: string; // 투자코칭 현황 파일에서 사용
  전화번호?: string; // 일반적인 전화번호 컬럼
  휴대폰번호?: string; // 주문내역에서 사용
  코치?: string; // 코치 이름
  상담일시?: string; // 상담일시
  시간?: string; // 시간
  [key: string]: any; // 기타 컬럼들
}

export interface InvestmentUploadState {
  investmentOrderFile: File | null;
  homeOrderFile: File | null;
  coachingStatusFile: File | null;
  selectedYear: number;
  selectedMonth: number;
}

export interface InvestmentMatchingResult {
  matchedOrders: InvestmentOrderData[];
  unmatchedParticipants: InvestmentParticipantData[];
  unmatchedOrders: InvestmentOrderData[];
  totalParticipants: number;
  totalOrders: number;
  matchedCount: number;
  stats: {
    total: number;
    matched: number;
    unmatchedOrders: number;
    unmatchedParticipants: number;
    onlyInA: number;
    onlyInB: number;
    investmentStats: {
      orderTotal: number;
      matched: number;
      totalAmount: number;
      dateRange: string;
    };
    homeStats: {
      orderTotal: number;
      matched: number;
      totalAmount: number;
      dateRange: string;
    };
    coachingStats: {
      totalParticipants: number;
      validParticipants: number;
      cancelledCount: number;
      uniqueCoaches: number;
      coachList: string;
    };
    coachSales: {
      [coachName: string]: number;
    };
    matchingRate: number;
  };
}

// 투자코칭DB 데이터 타입 정의 (매물코칭과 동일한 구조)
export interface InvestmentCoachingData {
  닉네임: string;
  이름: string;
  번호: string;
  코칭진행일: string;
  코치: string;
  '진행여부 / 비고': string;
  월부학교: string;
  '1순위(구, 관심지역)': string;
  '2순위': string;
  중개문자발송여부: string;
  중개서비스진행여부: string;
  [key: string]: any; // 기타 컬럼들
}

// 비교 결과 타입
export type ComparisonResult = 'matched' | 'onlyInA' | 'onlyInB' | 'duplicate';

export interface ComparisonItem {
  key: string;
  orderData?: OrderData;
  coachingData?: CoachingData;
  result: ComparisonResult;
}

// 통합된 매칭 데이터 (일치하는 경우)
export interface UnifiedMatchData {
  key: string;
  이름: string;
  닉네임: string;
  휴대폰번호?: string;
  번호?: string;
  주문번호?: string;
  결제금액?: string;
  결제일?: string;
  코치?: string;
  코칭일정?: string;
  신청일?: string;
  기타주문정보?: Record<string, any>;
  기타코칭정보?: Record<string, any>;
}

// 결과시트 최종 통합 데이터 구조 (정확한 카테고리 순서)
export interface TocoNaeCoData {
  전시상품명: string;
  이름: string;
  휴대폰번호: string;
  주문번호: string;
  ID: string;
  닉네임: string;
  옵션정보: string;
  '판매액(원)': string | number;
  'PG 결제액(원)': string | number;
  '인앱 결제액(원)': string | number;
  포인트사용: string | number;
  베네피아포인트: string | number;
  '상품권 사용': string | number;
  쿠폰할인: string | number;
  상태: string;
  결제일시: string;
  대기신청일: string;
  결제수단: string;
  결제요청: string;
  결제플랫폼: string;
  마케팅수신동의: string;
  예전아이디: string;
  코치: string;
  코칭진행일: string;
  // 기타 정보들
  [key: string]: any;
}

// 파일 업로드 상태
export interface FileUploadState {
  orderFile: File | null;
  coachingFile: File | null;
  orderSheets: string[];
  coachingSheets: string[];
  selectedOrderSheet: string;
  selectedCoachingSheet: string;
  selectedYear: number;
  selectedMonth: number;
}

// 코칭 타입
export type CoachingType = 'property' | 'investment';

// 탭 타입
export type MainTabType = 'property' | 'investment' | 'analyze' | 'bulkUpload';

// 비교 결과 통계
export interface ComparisonStats {
  total: number;
  matched: number;
  onlyInA: number;
  onlyInB: number;
  orderTotal: number;
  coachingTotal: number;
  coachingTotalWithoutCancelled: number;
  cancelledCount: number;
}

// 필터 옵션
export type FilterOption = 'all' | 'matched' | 'onlyInA' | 'onlyInB';

// 파일 분석 결과
export interface FileAnalysisResult {
  fileName: string;
  sheets: {
    sheetName: string;
    columns: string[];
    rowCount: number;
    sampleData: any[];
  }[];
  mainSheet?: {
    sheetName: string;
    columns: string[];
    rowCount: number;
    sampleData: any[];
  };
}
