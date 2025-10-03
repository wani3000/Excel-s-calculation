import * as XLSX from 'xlsx';
import { OrderSearchResult } from '../types';

// 결산 파일에서 주문번호로 데이터 검색
export const searchOrdersByNumbers = async (
  file: File,
  orderNumbers: string[]
): Promise<{ results: OrderSearchResult[]; notFound: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('파일을 읽을 수 없습니다.'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          resolve({ results: [], notFound: orderNumbers });
          return;
        }

        // 헤더 행 찾기 (첫 번째 행이 헤더라고 가정)
        const headers = jsonData[0] as string[];
        console.log('결산 파일 헤더:', headers);

        // 필요한 컬럼 인덱스 찾기
        const headerMap = {
          전시상품명: headers.findIndex(h => h && h.includes('전시상품명')),
          이름: headers.findIndex(h => h && h.includes('이름')),
          휴대폰번호: headers.findIndex(h => h && (h.includes('휴대폰') || h.includes('번호'))),
          주문번호: headers.findIndex(h => h && h.includes('주문번호')),
          ID: headers.findIndex(h => h && h.includes('ID')),
          닉네임: headers.findIndex(h => h && h.includes('닉네임')),
          옵션정보: headers.findIndex(h => h && h.includes('옵션')),
          판매액: headers.findIndex(h => h && h.includes('판매액')),
          코치: headers.findIndex(h => h && h.includes('코치')),
          코칭진행일: headers.findIndex(h => h && (h.includes('코칭진행일') || h.includes('진행일')))
        };

        console.log('헤더 매핑:', headerMap);

        // 데이터 행들 처리 (헤더 제외)
        const results: OrderSearchResult[] = [];
        const foundOrderNumbers = new Set<string>();
        const dataRows = jsonData.slice(1) as any[][];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;

          const orderNumber = row[headerMap.주문번호];
          if (!orderNumber) continue;

          const orderNumberStr = String(orderNumber).trim();
          
          // 검색할 주문번호 목록에 포함되어 있는지 확인
          if (orderNumbers.includes(orderNumberStr)) {
            foundOrderNumbers.add(orderNumberStr);
            
            const result: OrderSearchResult = {
              전시상품명: row[headerMap.전시상품명] || '-',
              이름: row[headerMap.이름] || '-',
              휴대폰번호: row[headerMap.휴대폰번호] || '-',
              주문번호: orderNumberStr,
              ID: row[headerMap.ID] || '-',
              닉네임: row[headerMap.닉네임] || '-',
              옵션정보: row[headerMap.옵션정보] || '-',
              '판매액(원)': parseNumber(row[headerMap.판매액]) || 0,
              코치: row[headerMap.코치] || '-',
              코칭진행일: formatDate(row[headerMap.코칭진행일]) || '-'
            };

            results.push(result);
          }
        }

        // 찾지 못한 주문번호들
        const notFound = orderNumbers.filter(num => !foundOrderNumbers.has(num));

        console.log(`검색 완료: ${results.length}건 발견, ${notFound.length}건 미발견`);
        resolve({ results, notFound });

      } catch (error) {
        console.error('주문번호 검색 중 오류:', error);
        reject(new Error(`주문번호 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
    };

    reader.readAsBinaryString(file);
  });
};

// 숫자 파싱 함수
const parseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// 날짜 포맷팅 함수
const formatDate = (value: any): string => {
  if (!value) return '-';
  
  // Excel 숫자 날짜 형식 처리
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10).replace(/-/g, '.');
  }
  
  if (typeof value === 'string') {
    // YYYY-MM-DD HH:MM:SS 형식에서 날짜만 추출
    const dateOnlyMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch) {
      return dateOnlyMatch[1].replace(/-/g, '.');
    }
    // YYYY.MM.DD 형식 그대로 반환
    if (value.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
      return value;
    }
  }
  
  return String(value);
};
