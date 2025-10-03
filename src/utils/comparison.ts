import { OrderData, CoachingData, ComparisonItem, ComparisonResult, UnifiedMatchData, TocoNaeCoData } from '../types';

/**
 * 숫자 값을 파싱합니다
 */
const parseNumber = (value: any): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

/**
 * 비교 키를 생성합니다 (이름 기준)
 * 이름만으로 고유 키를 만듭니다
 */
export const makeKey = (name: string): string => {
  return name.trim();
};

/**
 * 주문 데이터에서 키를 생성합니다
 */
export const makeOrderKey = (orderData: OrderData): string => {
  return makeKey(orderData.이름);
};

/**
 * 코칭 데이터에서 키를 생성합니다
 */
export const makeCoachingKey = (coachingData: CoachingData): string => {
  return makeKey(coachingData.이름);
};

/**
 * 두 데이터셋을 비교하여 결과를 반환합니다
 */
export const compareData = (
  orderData: OrderData[],
  coachingData: CoachingData[]
): ComparisonItem[] => {
  const results: ComparisonItem[] = [];
  
  // 취소/환불 데이터를 제외한 코칭 데이터 필터링
  const validCoachingData = coachingData.filter(coaching => {
    const cancelRefundStatus = String(coaching['취소 및 환불'] || '').trim().toLowerCase();
    return cancelRefundStatus !== '취소' && cancelRefundStatus !== '환불';
  });
  
  // 코칭 데이터를 키로 매핑 (유효한 데이터만)
  const coachingMap = new Map<string, CoachingData>();
  validCoachingData.forEach(coaching => {
    const key = makeCoachingKey(coaching);
    if (!coachingMap.has(key)) {
      coachingMap.set(key, coaching);
    }
  });
  
  // 주문 데이터와 비교
  const usedCoachingKeys = new Set<string>();
  
  orderData.forEach(order => {
    const orderKey = makeOrderKey(order);
    const coaching = coachingMap.get(orderKey);
    
    if (coaching) {
      // 일치하는 경우
      results.push({
        key: orderKey,
        orderData: order,
        coachingData: coaching,
        result: 'matched'
      });
      usedCoachingKeys.add(orderKey);
    } else {
      // 주문에는 있지만 코칭 DB에는 없는 경우
      results.push({
        key: orderKey,
        orderData: order,
        result: 'onlyInA'
      });
    }
  });
  
  // 모든 코칭 데이터 처리 (취소/환불 포함)
  coachingData.forEach(coaching => {
    const coachingKey = makeCoachingKey(coaching);
    
    // 취소/환불 데이터인지 확인
    const cancelRefundStatus = String(coaching['취소 및 환불'] || '').trim().toLowerCase();
    const isCancelOrRefund = cancelRefundStatus === '취소' || cancelRefundStatus === '환불';
    
    if (isCancelOrRefund) {
      // 취소/환불 데이터는 모든 것을 포함 (중복 체크 없음)
      results.push({
        key: coachingKey,
        coachingData: coaching,
        result: 'onlyInB'
      });
    } else {
      // 일반 데이터는 키 기반 중복 체크
      if (!usedCoachingKeys.has(coachingKey)) {
        results.push({
          key: coachingKey,
          coachingData: coaching,
          result: 'onlyInB'
        });
      }
    }
  });
  
  return results;
};

/**
 * 일치하는 데이터를 통합합니다
 */
export const createUnifiedMatchData = (items: ComparisonItem[]): UnifiedMatchData[] => {
  const matchedItems = items.filter(item => item.result === 'matched');
  
  return matchedItems.map(item => {
    const order = item.orderData!;
    const coaching = item.coachingData!;
    
    // 기타 주문 정보 (주문번호, 결제금액, 결제일 등 제외한 나머지)
    const orderInfoKeys = Object.keys(order).filter(key => 
      !['주문번호', '닉네임', '이름', '휴대폰번호', '결제금액', '결제일'].includes(key)
    );
    const 기타주문정보: Record<string, any> = {};
    orderInfoKeys.forEach(key => {
      기타주문정보[key] = order[key];
    });
    
    // 기타 코칭 정보 (닉네임, 이름, 번호, 코치, 코칭일정, 신청일 제외한 나머지)
    const coachingInfoKeys = Object.keys(coaching).filter(key => 
      !['닉네임', '이름', '번호', '코치', '코칭일정', '신청일'].includes(key)
    );
    const 기타코칭정보: Record<string, any> = {};
    coachingInfoKeys.forEach(key => {
      기타코칭정보[key] = coaching[key];
    });
    
    return {
      key: item.key,
      이름: order.이름 || coaching.이름,
      닉네임: order.닉네임 || coaching.닉네임,
      휴대폰번호: order.휴대폰번호,
      번호: coaching.번호,
      주문번호: order.주문번호,
      결제금액: order.결제금액 || order.금액 || order.가격,
      결제일: order.결제일 || order.날짜 || order.주문일,
      코치: coaching.코치,
      코칭일정: coaching.코칭일정 || coaching.일정 || coaching.코칭날짜,
      신청일: coaching.신청일 || coaching.등록일,
      기타주문정보,
      기타코칭정보
    };
  });
};

/**
 * 비교 결과의 통계를 계산합니다
 */
export const calculateStats = (items: ComparisonItem[], orderData: OrderData[], coachingData: CoachingData[]) => {
  // 빈 행 필터링 (이름이 없는 행 제거)
  const validOrderData = orderData.filter(order => order.이름 && String(order.이름).trim() !== '');
  
  // 취소/환불 데이터를 제외한 코칭 데이터 필터링
  const validCoachingData = coachingData.filter(coaching => {
    // 이름이 있는지 확인
    const hasName = coaching.이름 && String(coaching.이름).trim() !== '';
    if (!hasName) return false;
    
    // 취소/환불 상태 확인
    const cancelRefundStatus = String(coaching['취소 및 환불'] || '').trim().toLowerCase();
    const isCancelOrRefund = cancelRefundStatus === '취소' || cancelRefundStatus === '환불';
    
    return !isCancelOrRefund;
  });
  // 주문 통계 계산
  const totalAmount = validOrderData.reduce((sum, order) => {
    const amount = parseNumber(order['판매액(원)']) || 0;
    return sum + amount;
  }, 0);

  // 날짜 변환 함수
  const formatDate = (value: any): string => {
    if (!value) return '';
    
    // Excel 숫자 날짜 형식 처리 (1900년 1월 1일 기준)
    if (typeof value === 'number') {
      // Excel의 날짜 시스템: 1900년 1월 1일 = 1
      // JavaScript Date: 1970년 1월 1일 = 0
      // Excel 1900년 1월 1일부터 1970년 1월 1일까지의 일수: 25569
      // Excel 1900년 2월 29일 버그 때문에 2일을 빼야 함
      const date = new Date((value - 25569) * 86400 * 1000);
      
      // 날짜 유효성 검사
      if (isNaN(date.getTime())) {
        return String(value); // 변환 실패 시 원본 반환
      }
      
      return date.toISOString().slice(0, 10).replace(/-/g, '.');
    }
    
    // 문자열 날짜 처리
    const dateStr = String(value).trim();
    if (dateStr === '') return '';
    
    // 이미 올바른 형식인 경우 (YYYY-MM-DD 또는 YYYY.MM.DD)
    if (dateStr.match(/^\d{4}[.-]\d{1,2}[.-]\d{1,2}$/)) {
      return dateStr.replace(/-/g, '.');
    }
    
    // 날짜 시간 형식인 경우 (YYYY-MM-DD HH:MM:SS)
    if (dateStr.match(/^\d{4}[.-]\d{1,2}[.-]\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)) {
      return dateStr.replace(/-/g, '.');
    }
    
    return dateStr;
  };

  const orderDates = validOrderData
    .map(order => order.결제일시)
    .filter(date => date && String(date).trim() !== '')
    .map(date => formatDate(date))
    .filter(date => date !== '')
    .sort();

  const orderDateRange = orderDates.length > 0 
    ? `${orderDates[0]} ~ ${orderDates[orderDates.length - 1]}`
    : '데이터 없음';

  // 코칭 통계 계산
  const uniqueCoaches = new Set(validCoachingData.map(coaching => coaching.코치).filter(coach => coach && String(coach).trim() !== '').map(coach => String(coach).trim()));
  
  const coachingDates = validCoachingData
    .map(coaching => coaching.코칭진행일)
    .filter(date => date && String(date).trim() !== '')
    .map(date => formatDate(date))
    .filter(date => date !== '')
    .sort();

  const coachingDateRange = coachingDates.length > 0 
    ? `${coachingDates[0]} ~ ${coachingDates[coachingDates.length - 1]}`
    : '데이터 없음';

  // 빈 행 제외한 불일치 데이터 계산 (취소/환불 데이터 제외)
  const validOnlyInA = items.filter(item => 
    item.result === 'onlyInA' && 
    item.orderData?.이름 && 
    String(item.orderData.이름).trim() !== ''
  ).length;
  
  const validOnlyInB = items.filter(item => 
    item.result === 'onlyInB' && 
    item.coachingData?.이름 && 
    String(item.coachingData.이름).trim() !== '' &&
    // 취소/환불 데이터 제외
    (() => {
      const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
      return cancelRefundStatus !== '취소' && cancelRefundStatus !== '환불';
    })()
  ).length;

  // 매칭된 데이터도 빈 행 제외 (취소/환불 데이터 제외)
  const validMatched = items.filter(item => 
    item.result === 'matched' && 
    item.orderData?.이름 && 
    String(item.orderData.이름).trim() !== '' &&
    item.coachingData?.이름 && 
    String(item.coachingData.이름).trim() !== '' &&
    // 취소/환불 데이터 제외
    (() => {
      const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
      return cancelRefundStatus !== '취소' && cancelRefundStatus !== '환불';
    })()
  ).length;

  // 취소 및 환불 데이터 계산
  const cancelledAndRefundedData = coachingData.filter(coaching => {
    const cancelRefundStatus = String(coaching['취소 및 환불'] || '').trim().toLowerCase();
    return cancelRefundStatus === '취소' || cancelRefundStatus === '환불';
  });

  const cancelledCount = cancelledAndRefundedData.length;
  
  // 전체 코칭 신청 건수 (취소 포함)
  const totalCoachingCount = validOnlyInB + validMatched + cancelledCount;
  
  // 취소 제외한 실제 코칭 신청 건수
  const coachingTotalWithoutCancelled = validOnlyInB + validMatched;

  const stats = {
    total: validOnlyInA + validOnlyInB + validMatched,
    matched: validMatched,
    onlyInA: validOnlyInA,
    onlyInB: validOnlyInB,
    orderTotal: validOrderData.length,
    coachingTotal: totalCoachingCount,
    coachingTotalWithoutCancelled: coachingTotalWithoutCancelled,
    cancelledCount: cancelledCount,
    orderStats: {
      totalAmount,
      dateRange: orderDateRange
    },
    coachingStats: {
      uniqueCoaches: uniqueCoaches.size,
      dateRange: coachingDateRange
    }
  };
  
  return stats;
};

/**
 * 결과 상태를 표시용 텍스트로 변환합니다
 */
export const getResultDisplayText = (result: ComparisonResult): string => {
  switch (result) {
    case 'matched':
      return '✅ 일치';
    case 'onlyInA':
      return '❌ 누락';
    case 'onlyInB':
      return '➕ 결제안함';
    default:
      return '알 수 없음';
  }
};

/**
 * 결과 상태를 표시용 색상으로 변환합니다
 */
export const getResultColor = (result: ComparisonResult): string => {
  switch (result) {
    case 'matched':
      return 'text-green-600 bg-green-50';
    case 'onlyInA':
      return 'text-red-600 bg-red-50';
    case 'onlyInB':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

/**
 * 투코내코 형식으로 데이터를 변환합니다
 */
export const createTocoNaeCoData = (items: ComparisonItem[]): TocoNaeCoData[] => {
  const matchedItems = items.filter(item => item.result === 'matched');
  
  return matchedItems.map(item => {
    const order = item.orderData!;
    const coaching = item.coachingData!;
    
    // 숫자 필드 정리 함수는 상단에 정의됨

    // 날짜 정리 함수
    const formatDateTime = (value: any): string => {
      if (!value) return '';
      
      // Excel 숫자 날짜 형식 처리
      if (typeof value === 'number') {
        // Excel의 날짜 시스템: 1900년 1월 1일 = 1
        // JavaScript Date: 1970년 1월 1일 = 0
        const date = new Date((value - 25569) * 86400 * 1000);
        
        // 날짜 유효성 검사
        if (isNaN(date.getTime())) {
          return String(value); // 변환 실패 시 원본 반환
        }
        
        return date.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
      return String(value);
    };

    return {
      // 결과시트 정확한 카테고리 순서
      전시상품명: order.전시상품명 || '투자코칭_25년 8월',
      이름: order.이름 || coaching.이름 || '',
      휴대폰번호: order.휴대폰번호 || coaching.번호 || '',
      주문번호: order.주문번호 || '',
      ID: order.ID || '',
      닉네임: order.닉네임 || coaching.닉네임 || '',
      옵션정보: order.옵션정보 || '월부멘토 1:1 투자코칭',
      '판매액(원)': parseNumber(order['판매액(원)']) || 0,
      'PG 결제액(원)': parseNumber(order['PG 결제액(원)']) || 0,
      '인앱 결제액(원)': parseNumber(order['인앱 결제액(원)']) || 0,
      포인트사용: parseNumber(order.포인트사용) || 0,
      베네피아포인트: parseNumber(order.베네피아포인트) || 0,
      '상품권 사용': parseNumber(order['상품권 사용']) || 0,
      쿠폰할인: parseNumber(order.쿠폰할인) || 0,
      상태: order.상태 || '결제완료',
      결제일시: formatDateTime(order.결제일시) || '',
      대기신청일: formatDateTime(order.대기신청일) || formatDateTime(coaching.코칭진행일) || '',
      결제수단: order.결제수단 || '',
      결제요청: order.결제요청 || '',
      결제플랫폼: order.결제플랫폼 || '',
      마케팅수신동의: order.마케팅수신동의 || 'Y',
      예전아이디: order.예전아이디 || '',
      코치: coaching.코치 || '',
      코칭진행일: formatDateTime(coaching.코칭진행일) || '',
      
      // 기타 정보들 (주문 데이터에서)
      ...Object.fromEntries(
        Object.entries(order).filter(([key]) => 
          !['주문번호', 'ID', '이름', '닉네임', '휴대폰번호', '전시상품명', '옵션정보', 
            '판매액(원)', 'PG 결제액(원)', '인앱 결제액(원)', '포인트사용', '베네피아포인트', 
            '상품권 사용', '쿠폰할인', '상태', '결제일시', '대기신청일', '결제수단', 
            '결제요청', '결제플랫폼', '마케팅수신동의', '예전아이디'].includes(key)
        )
      ),
      
      // 기타 정보들 (코칭 데이터에서)
      ...Object.fromEntries(
        Object.entries(coaching).filter(([key]) => 
          !['닉네임', '이름', '번호', '코칭진행일', '코치', '진행여부 / 비고', '월부학교', 
            '1순위(구, 관심지역)', '2순위', '중개문자발송여부', '중개서비스진행여부'].includes(key)
        ).map(([key, value]) => [`코칭_${key}`, value])
      )
    };
  });
};

/**
 * 매칭되지 않은 데이터만 추출합니다
 */
export const createUnmatchedData = (items: ComparisonItem[]): TocoNaeCoData[] => {
  const unmatchedItems = items.filter(item => 
    item.result !== 'matched' &&
    // 취소/환불 데이터 제외
    !(item.coachingData && (() => {
      const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
      return cancelRefundStatus === '취소' || cancelRefundStatus === '환불';
    })())
  );
  
  return unmatchedItems.map(item => {
    const order = item.orderData;
    const coaching = item.coachingData;
    
    // 날짜 정리 함수
    const formatDateTime = (value: any): string => {
      if (!value) return '';
      
      // Excel 숫자 날짜 형식 처리
      if (typeof value === 'number') {
        // Excel의 날짜 시스템: 1900년 1월 1일 = 1
        // JavaScript Date: 1970년 1월 1일 = 0
        const date = new Date((value - 25569) * 86400 * 1000);
        
        // 날짜 유효성 검사
        if (isNaN(date.getTime())) {
          return String(value); // 변환 실패 시 원본 반환
        }
        
        return date.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
      return String(value);
    };

      // 통합 형식과 동일한 구조로 변환
      return {
        전시상품명: order?.전시상품명 || (coaching ? '코칭신청' : '-'),
        이름: (order || coaching)?.이름 || '-',
        휴대폰번호: order?.휴대폰번호 || coaching?.번호 || '-',
        주문번호: order?.주문번호 || '-',
        ID: order?.ID || '-',
        닉네임: (order || coaching)?.닉네임 || '-',
        옵션정보: order?.옵션정보 || (coaching ? '코칭서비스' : '-'),
      '판매액(원)': parseNumber(order?.['판매액(원)']) || 0,
      'PG 결제액(원)': parseNumber(order?.['PG 결제액(원)']) || 0,
      '인앱 결제액(원)': parseNumber(order?.['인앱 결제액(원)']) || 0,
      포인트사용: parseNumber(order?.포인트사용) || 0,
      베네피아포인트: parseNumber(order?.베네피아포인트) || 0,
      '상품권 사용': parseNumber(order?.['상품권 사용']) || 0,
      쿠폰할인: parseNumber(order?.쿠폰할인) || 0,
        상태: item.result === 'onlyInA' ? '결제완료(코칭없음)' : '코칭신청(결제없음)',
        결제일시: formatDateTime(order?.결제일시) || '-',
        대기신청일: formatDateTime(order?.대기신청일) || formatDateTime(coaching?.코칭진행일) || '-',
        결제수단: order?.결제수단 || '-',
        결제요청: order?.결제요청 || '-',
        결제플랫폼: order?.결제플랫폼 || '-',
        마케팅수신동의: order?.마케팅수신동의 || 'Y',
        예전아이디: order?.예전아이디 || '-',
      코치: coaching?.코치 || '-',
      코칭진행일: formatDateTime(coaching?.코칭진행일) || '-',
      
      // 기타 정보들
      ...Object.fromEntries(
        Object.entries(order || {}).filter(([key]) => 
          !['주문번호', 'ID', '이름', '닉네임', '휴대폰번호', '전시상품명', '옵션정보', 
            '판매액(원)', 'PG 결제액(원)', '인앱 결제액(원)', '포인트사용', '베네피아포인트', 
            '상품권 사용', '쿠폰할인', '상태', '결제일시', '대기신청일', '결제수단', 
            '결제요청', '결제플랫폼', '마케팅수신동의', '예전아이디'].includes(key)
        )
      ),
      
      // 코칭 정보들
      ...Object.fromEntries(
        Object.entries(coaching || {}).filter(([key]) => 
          !['닉네임', '이름', '번호', '코칭진행일', '코치', '진행여부 / 비고', '월부학교', 
            '1순위(구, 관심지역)', '2순위', '중개문자발송여부', '중개서비스진행여부'].includes(key)
        ).map(([key, value]) => [`코칭_${key}`, value])
      )
    };
  });
};

/**
 * 분석된 파일 구조를 기반으로 동일한 카테고리 구조로 데이터를 변환합니다
 */
export const createMappedDataFromAnalysis = (
  items: ComparisonItem[],
  analysisResult: any
): any[] => {
  const matchedItems = items.filter(item => item.result === 'matched');
  
  if (!analysisResult?.mainSheet?.columns) {
    console.warn('분석 결과에서 메인 시트 컬럼을 찾을 수 없습니다.');
    return [];
  }

  const targetColumns = analysisResult.mainSheet.columns;
  
  return matchedItems.map(item => {
    const order = item.orderData!;
    const coaching = item.coachingData!;
    
    // 타겟 컬럼 구조에 맞게 데이터 매핑
    const mappedData: any = {};
    
    targetColumns.forEach((targetColumn: string) => {
      // 기본 매핑 규칙들
      if (targetColumn.includes('이름')) {
        mappedData[targetColumn] = order.이름 || coaching.이름 || '';
      } else if (targetColumn.includes('닉네임')) {
        mappedData[targetColumn] = order.닉네임 || coaching.닉네임 || '';
      } else if (targetColumn.includes('휴대폰') || targetColumn.includes('전화번호') || targetColumn.includes('번호')) {
        mappedData[targetColumn] = order.휴대폰번호 || coaching.번호 || '';
      } else if (targetColumn.includes('주문번호')) {
        mappedData[targetColumn] = order.주문번호 || '';
      } else if (targetColumn.includes('ID') || targetColumn.includes('이메일')) {
        mappedData[targetColumn] = order.ID || order.이메일 || coaching.ID || coaching.이메일 || '';
      } else if (targetColumn.includes('상품명') || targetColumn.includes('전시상품')) {
        mappedData[targetColumn] = order.상품명 || order.전시상품명 || '투자코칭_25년 8월';
      } else if (targetColumn.includes('옵션')) {
        mappedData[targetColumn] = order.옵션정보 || order.상품옵션 || coaching.옵션정보 || '월부멘토 1:1 투자코칭';
      } else if (targetColumn.includes('판매액') || targetColumn.includes('총금액')) {
        mappedData[targetColumn] = order.판매액 || order.상품가격 || order.총금액 || 0;
      } else if (targetColumn.includes('PG결제액') || targetColumn.includes('실제결제액') || targetColumn.includes('결제금액')) {
        mappedData[targetColumn] = order.PG결제액 || order.실제결제액 || order.결제금액 || 0;
      } else if (targetColumn.includes('인앱결제액')) {
        mappedData[targetColumn] = order.인앱결제액 || 0;
      } else if (targetColumn.includes('포인트')) {
        mappedData[targetColumn] = order.포인트사용 || order.포인트할인 || 0;
      } else if (targetColumn.includes('베네피아')) {
        mappedData[targetColumn] = order.베네피아포인트 || 0;
      } else if (targetColumn.includes('상품권')) {
        mappedData[targetColumn] = order.상품권사용 || order.상품권할인 || 0;
      } else if (targetColumn.includes('쿠폰') || targetColumn.includes('할인')) {
        mappedData[targetColumn] = order.쿠폰할인 || order.할인금액 || 0;
      } else if (targetColumn.includes('상태') || targetColumn.includes('결제상태')) {
        mappedData[targetColumn] = order.상태 || order.결제상태 || '결제완료';
      } else if (targetColumn.includes('결제일시') || targetColumn.includes('결제일')) {
        mappedData[targetColumn] = order.결제일시 || order.결제일 || order.주문일시 || '';
      } else if (targetColumn.includes('신청일') || targetColumn.includes('대기신청일')) {
        mappedData[targetColumn] = coaching.신청일 || coaching.등록일 || order.신청일 || '';
      } else if (targetColumn.includes('결제수단')) {
        mappedData[targetColumn] = order.결제수단 || order.카드사 || coaching.결제수단 || '';
      } else if (targetColumn.includes('결제요청')) {
        mappedData[targetColumn] = order.결제요청 || order.PG결제 || 'PG결제';
      } else if (targetColumn.includes('결제플랫폼') || targetColumn.includes('플랫폼')) {
        mappedData[targetColumn] = order.결제플랫폼 || order.플랫폼 || coaching.플랫폼 || '모바일 웹';
      } else if (targetColumn.includes('마케팅') || targetColumn.includes('수신동의')) {
        mappedData[targetColumn] = order.마케팅수신동의 || order.수신동의 || coaching.마케팅수신동의 || 'Y';
      } else if (targetColumn.includes('예전아이디') || targetColumn.includes('구아이디')) {
        mappedData[targetColumn] = order.예전아이디 || order.구아이디 || coaching.예전아이디 || '';
      } else if (targetColumn.includes('코치') || targetColumn.includes('담당코치')) {
        mappedData[targetColumn] = coaching.코치 || coaching.담당코치 || '';
      } else if (targetColumn.includes('코칭일정') || targetColumn.includes('일정')) {
        mappedData[targetColumn] = coaching.코칭일정 || coaching.일정 || coaching.코칭날짜 || '';
      } else {
        // 매핑되지 않은 컬럼은 빈 값으로 설정
        mappedData[targetColumn] = '';
      }
    });
    
    return mappedData;
  });
};
