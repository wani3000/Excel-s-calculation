import * as XLSX from 'xlsx';
import { OrderData, CoachingData, ComparisonItem } from '../types';
import { createTocoNaeCoData, createUnmatchedData, createMappedDataFromAnalysis } from './comparison';

/**
 * Excel 파일에서 시트 목록을 가져옵니다
 */
export const getSheetNames = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Excel 파일에서 주문 데이터를 읽어옵니다
 */
export const readOrderData = (file: File, sheetName: string): Promise<OrderData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const orderData: OrderData[] = rows.map((row) => {
          const item: any = {};
          headers.forEach((header, index) => {
            item[header] = row[index] || '';
          });
          return item as OrderData;
        });
        
        resolve(orderData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Excel 파일에서 코칭 데이터를 읽어옵니다
 */
export const readCoachingData = (file: File, sheetName: string): Promise<CoachingData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // 디버깅: 헤더 정보 출력
        console.log('코칭 파일 헤더:', headers);
        console.log('F열 헤더:', headers[5]); // F열은 5번째 (0-based)
        
        const coachingData: CoachingData[] = rows.map((row) => {
          const item: any = {};
          headers.forEach((header, index) => {
            item[header] = row[index] || '';
          });
          
          // F열의 날짜 데이터를 코칭진행일로 매핑
          if (headers[5] && row[5]) {
            const fColumnHeader = headers[5];
            const fColumnValue = row[5];
            
            // F열이 날짜 형식인지 확인하고 코칭진행일로 매핑
            if (typeof fColumnValue === 'number' || 
                (typeof fColumnValue === 'string' && 
                 (fColumnValue.match(/\d{4}[.-]\d{1,2}[.-]\d{1,2}/) || 
                  fColumnValue.match(/\d{1,2}[.-]\d{1,2}[.-]\d{4}/)))) {
              
              console.log(`F열 날짜 데이터 발견: ${fColumnHeader} = ${fColumnValue}`);
              item['코칭진행일'] = fColumnValue;
            }
          }
          
          return item as CoachingData;
        });
        
        resolve(coachingData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 통합 형식으로 비교 결과를 Excel 파일로 다운로드합니다
 */
export const downloadComparisonResult = (
  comparisonItems: any[],
  filename: string = `2509 데이터결산용 최최종.xlsx`,
  analysisResult?: any,
  coachingType?: 'property' | 'investment',
  downloadType: 'matched' | 'mismatched' = 'matched',
  selectedYear?: number,
  selectedMonth?: number
) => {
  try {
    // 연도/월 정보 생성 (YYMM 형식)
    const year = selectedYear || new Date().getFullYear();
    const month = selectedMonth || new Date().getMonth() + 1;
    const yearMonth = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}`;
    
    // 코칭 타입과 다운로드 타입에 따라 파일명 설정
    let finalFilename = filename;
    if (coachingType === 'property') {
      finalFilename = downloadType === 'mismatched' ? `${yearMonth}_매물코칭_결산_불일치.xlsx` : `${yearMonth}_매물코칭_결산.xlsx`;
    } else if (coachingType === 'investment') {
      finalFilename = downloadType === 'mismatched' ? `${yearMonth}_투자코칭_결산_불일치.xlsx` : `${yearMonth}_투자코칭_결산.xlsx`;
    }
    
    console.log('다운로드 시작:', { comparisonItems: comparisonItems.length, filename: finalFilename, hasAnalysis: !!analysisResult, coachingType, downloadType });
    
    let sheetData;
    
    if (downloadType === 'matched') {
      // 매칭된 데이터만 다운로드
      if (analysisResult?.mainSheet?.columns) {
        sheetData = createMappedDataFromAnalysis(comparisonItems, analysisResult);
        console.log('분석 기반 매칭 데이터 변환 완료:', { sheetData: sheetData.length });
      } else {
        sheetData = createTocoNaeCoData(comparisonItems);
        console.log('기본 통합 매칭 데이터 변환 완료:', { sheetData: sheetData.length });
      }
    } else {
      // 불일치 데이터만 다운로드
      sheetData = createUnmatchedData(comparisonItems);
      console.log('불일치 데이터 변환 완료:', { sheetData: sheetData.length });
    }

    const workbook = XLSX.utils.book_new();

    // 메인 시트
    if (sheetData.length > 0) {
      const mainSheet = XLSX.utils.json_to_sheet(sheetData);
    
      // 분석 결과가 있으면 해당 컬럼 순서 사용, 없으면 기본 순서 사용
      let finalSheet;
      let sheetName = '투코내코';
      
      if (analysisResult?.mainSheet?.columns && downloadType === 'matched') {
        // 분석된 컬럼 순서 그대로 사용 (매칭된 데이터만)
        finalSheet = mainSheet;
        sheetName = analysisResult.mainSheet.sheetName || '메인시트';
      } else {
        // 코칭 타입에 따라 시트 이름 설정
        if (coachingType === 'property') {
          sheetName = downloadType === 'mismatched' ? `${yearMonth}_매물코칭_결산_불일치` : `${yearMonth}_매물코칭_결산`;
        } else if (coachingType === 'investment') {
          sheetName = downloadType === 'mismatched' ? `${yearMonth}_투자코칭_결산_불일치` : `${yearMonth}_투자코칭_결산`;
        } else {
          sheetName = downloadType === 'mismatched' ? '불일치데이터' : '통합데이터';
        }
        
        // 정확한 결과시트 컬럼 순서 적용
        const columnOrder = [
          '전시상품명', '이름', '휴대폰번호', '주문번호', 'ID', '닉네임', '옵션정보',
          '판매액(원)', 'PG 결제액(원)', '인앱 결제액(원)', '포인트사용', '베네피아포인트', 
          '상품권 사용', '쿠폰할인', '상태', '결제일시', '대기신청일', '결제수단', 
          '결제요청', '결제플랫폼', '마케팅수신동의', '예전아이디'
        ];
        
        // 워크시트에서 모든 컬럼 가져오기
        const allColumns = XLSX.utils.sheet_to_json(mainSheet, { header: 1 })[0] as string[];
        
        // 정의된 순서대로 컬럼 재배치
        const orderedColumns = [
          ...columnOrder.filter(col => allColumns.includes(col)),
          ...allColumns.filter(col => !columnOrder.includes(col))
        ];
        
        // 재정렬된 데이터로 새 워크시트 생성
        const reorderedData = sheetData.map(row => {
          const orderedRow: any = {};
          orderedColumns.forEach(col => {
            orderedRow[col] = row[col];
          });
          return orderedRow;
        });
        
        finalSheet = XLSX.utils.json_to_sheet(reorderedData);
      }
    
      XLSX.utils.book_append_sheet(workbook, finalSheet, sheetName);
    }

  // 브라우저에서 파일 다운로드
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // 다운로드 링크 생성
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('파일 다운로드 완료:', finalFilename);
  } catch (error) {
    console.error('다운로드 중 오류 발생:', error);
    alert(`다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 결산 스타일로 불일치 데이터를 Excel 파일로 다운로드합니다 (그룹화된 형태)
 */
export const downloadSettlementMismatchedData = (
  comparisonItems: ComparisonItem[],
  coachingType?: 'property' | 'investment',
  selectedYear?: number,
  selectedMonth?: number
) => {
  try {
    // 연도/월 정보 생성 (YYMM 형식)
    const year = selectedYear || new Date().getFullYear();
    const month = selectedMonth || new Date().getMonth() + 1;
    const yearMonth = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}`;
    
    // 코칭 타입에 따라 파일명 설정
    let filename = '';
    if (coachingType === 'property') {
      filename = `${yearMonth}_매물코칭_결산_불일치_결산스타일.xlsx`;
    } else if (coachingType === 'investment') {
      filename = `${yearMonth}_투자코칭_결산_불일치_결산스타일.xlsx`;
    } else {
      filename = `${yearMonth}_데이터결산_불일치_결산스타일.xlsx`;
    }

    console.log('결산 스타일 다운로드 시작:', { comparisonItems: comparisonItems.length, filename });

    // 불일치 데이터만 필터링 (취소/환불 데이터 제외)
    const unmatchedItems = comparisonItems.filter(item => 
      item.result !== 'matched' &&
      // 취소/환불 데이터 제외
      !(item.coachingData && (() => {
        const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
        return cancelRefundStatus === '취소' || cancelRefundStatus === '환불';
      })())
    );
    
    // 빈 행 제외하고 필터링
    const validUnmatchedItems = unmatchedItems.filter(item => {
      if (item.result === 'onlyInA') {
        return item.orderData?.이름 && String(item.orderData.이름).trim() !== '';
      } else if (item.result === 'onlyInB') {
        return item.coachingData?.이름 && String(item.coachingData.이름).trim() !== '';
      }
      return false;
    });

    // 그룹화 로직 (웹 테이블과 동일)
    const groups: { [key: string]: ComparisonItem[] } = {};
    
    validUnmatchedItems.forEach(item => {
      const order = item.orderData;
      const coaching = item.coachingData;
      
      // 각 항목에서 휴대폰번호, 닉네임, 이름 추출
      const phone = (order?.휴대폰번호 || coaching?.번호 || '').trim();
      const nickname = (order?.닉네임 || coaching?.닉네임 || '').trim();
      const name = (order?.이름 || coaching?.이름 || '').trim();
      
      // 그룹 키 결정 (우선순위: 휴대폰번호 > 닉네임 > 이름)
      let groupKey = '';
      
      if (phone) {
        groupKey = `phone_${phone}`;
      } else if (nickname) {
        groupKey = `nickname_${nickname}`;
      } else if (name) {
        groupKey = `name_${name}`;
      } else {
        groupKey = `ungrouped_${Math.random()}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    // 각 그룹 내에서 정렬 (주문내역 먼저, 그 다음 매물코칭)
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        if (a.result === 'onlyInA' && b.result === 'onlyInB') return -1;
        if (a.result === 'onlyInB' && b.result === 'onlyInA') return 1;
        
        const aName = (a.orderData?.이름 || a.coachingData?.이름 || '').trim();
        const bName = (b.orderData?.이름 || b.coachingData?.이름 || '').trim();
        return aName.localeCompare(bName);
      });
    });

    // 그룹 키로 정렬하여 일관된 순서 보장
    const sortedGroupKeys = Object.keys(groups).sort();
    const groupedItems = sortedGroupKeys.map(key => groups[key]);

    // 엑셀 데이터 생성
    const workbook = XLSX.utils.book_new();
    
    // 각 그룹을 별도 시트로 생성하거나 하나의 시트에 그룹화된 형태로 생성
    const allRows: any[] = [];
    
    groupedItems.forEach((group) => {
      group.forEach((item) => {
        const order = item.orderData;
        const coaching = item.coachingData;
        
        // 날짜 포맷 함수
        const formatDateTime = (value: any): string => {
          if (!value) return '-';
          if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            if (isNaN(date.getTime())) return String(value);
            return date.toISOString().slice(0, 10).replace(/-/g, '.');
          }
          if (typeof value === 'string') return value;
          if (value instanceof Date) return value.toISOString().slice(0, 10).replace(/-/g, '.');
          return String(value);
        };


        // 매물코칭 결산과 동일한 구조로 데이터 생성
        const row = {
          전시상품명: order?.전시상품명 || (coaching ? '코칭신청' : '-'),
          이름: (order || coaching)?.이름 || '-',
          휴대폰번호: order?.휴대폰번호 || coaching?.번호 || '-',
          주문번호: order?.주문번호 || '-',
          ID: order?.ID || '-',
          닉네임: (order || coaching)?.닉네임 || '-',
          옵션정보: order?.옵션정보 || (coaching ? '코칭서비스' : '-'),
          '판매액(원)': order?.['판매액(원)'] || '-',
          'PG 결제액(원)': order?.['PG 결제액(원)'] || '-',
          '인앱 결제액(원)': order?.['인앱 결제액(원)'] || '-',
          포인트사용: order?.포인트사용 || '-',
          베네피아포인트: order?.베네피아포인트 || '-',
          '상품권 사용': order?.['상품권 사용'] || '-',
          쿠폰할인: order?.쿠폰할인 || '-',
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
          // 코칭 관련 추가 정보들
          '코칭_신청일': formatDateTime(coaching?.코칭진행일) || '-',
          '코칭_만족도문자': coaching?.['진행여부 / 비고'] || '-',
          '코칭_지역': coaching?.['1순위(구, 관심지역)'] || '-',
          '코칭_단지명': coaching?.['2순위'] || '-',
          '코칭_평형': '-',
          '코칭_매매가': '-',
          '코칭_전세가': '-',
          '코칭_투자금': '-',
          '코칭_O/X': '-',
          '코칭_상세': '-',
          '코칭_코칭완료여부': coaching?.['진행여부 / 비고'] || '-',
          '코칭_매수추천여부': '-',
          '코칭_중개추천여부': coaching?.중개서비스진행여부 || '-',
          '코칭_구글폼 번호': '-'
        };
        
        allRows.push(row);
      });
    });

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(allRows);
    
    // 컬럼 너비 설정 (매물코칭 결산과 동일한 구조)
    const columnWidths = [
      { wch: 20 }, // 전시상품명
      { wch: 15 }, // 이름
      { wch: 18 }, // 휴대폰번호
      { wch: 15 }, // 주문번호
      { wch: 10 }, // ID
      { wch: 15 }, // 닉네임
      { wch: 20 }, // 옵션정보
      { wch: 12 }, // 판매액(원)
      { wch: 12 }, // PG 결제액(원)
      { wch: 12 }, // 인앱 결제액(원)
      { wch: 12 }, // 포인트사용
      { wch: 12 }, // 베네피아포인트
      { wch: 12 }, // 상품권 사용
      { wch: 12 }, // 쿠폰할인
      { wch: 20 }, // 상태
      { wch: 18 }, // 결제일시
      { wch: 18 }, // 대기신청일
      { wch: 12 }, // 결제수단
      { wch: 12 }, // 결제요청
      { wch: 12 }, // 결제플랫폼
      { wch: 15 }, // 마케팅수신동의
      { wch: 12 }, // 예전아이디
      { wch: 12 }, // 코치
      { wch: 18 }, // 코칭진행일
      { wch: 18 }, // 코칭_신청일
      { wch: 15 }, // 코칭_만족도문자
      { wch: 15 }, // 코칭_지역
      { wch: 15 }, // 코칭_단지명
      { wch: 12 }, // 코칭_평형
      { wch: 12 }, // 코칭_매매가
      { wch: 12 }, // 코칭_전세가
      { wch: 12 }, // 코칭_투자금
      { wch: 10 }, // 코칭_O/X
      { wch: 15 }, // 코칭_상세
      { wch: 15 }, // 코칭_코칭완료여부
      { wch: 15 }, // 코칭_매수추천여부
      { wch: 15 }, // 코칭_중개추천여부
      { wch: 15 }  // 코칭_구글폼 번호
    ];
    worksheet['!cols'] = columnWidths;

    // 그룹별 구분을 위한 컬럼 추가 (색상 대신 텍스트로 구분)
    const groupColors = [
      '🔴', // 빨강 이모지
      '🔵', // 파랑 이모지  
      '🟢', // 초록 이모지
      '🟠', // 주황 이모지
      '🟣', // 보라 이모지
      '🟡', // 노랑 이모지
      '🔷', // 청록 이모지
      '🩷', // 분홍 이모지
    ];

    // 그룹별 색상 매핑
    let currentColorIndex = 0;
    const groupColorMap: { [key: string]: string } = {};

    // 각 그룹에 색상 할당 (2개 이상의 행이 있는 그룹만)
    groupedItems.forEach((group) => {
      if (group.length > 1) {
        const groupKey = `${group[0].orderData?.이름 || group[0].coachingData?.이름 || ''}_${group[0].orderData?.휴대폰번호 || group[0].coachingData?.번호 || ''}_${group[0].orderData?.닉네임 || group[0].coachingData?.닉네임 || ''}`;
        groupColorMap[groupKey] = groupColors[currentColorIndex % groupColors.length];
        currentColorIndex++;
      }
    });

    console.log('그룹별 색상 매핑:', groupColorMap);

    // 행별로 그룹 표시 추가
    let rowIndex = 2; // 헤더 다음 행부터 시작 (1-based, 헤더가 1행)
    
    groupedItems.forEach((group) => {
      if (group.length > 1) {
        // 2개 이상의 행이 있는 그룹에만 표시 추가
        const groupKey = `${group[0].orderData?.이름 || group[0].coachingData?.이름 || ''}_${group[0].orderData?.휴대폰번호 || group[0].coachingData?.번호 || ''}_${group[0].orderData?.닉네임 || group[0].coachingData?.닉네임 || ''}`;
        const groupIcon = groupColorMap[groupKey];
        
        if (groupIcon) {
          console.log(`그룹 ${groupKey}에 아이콘 ${groupIcon} 적용, 행 ${rowIndex}-${rowIndex + group.length - 1}`);
          
          // 그룹의 각 행에 아이콘 추가 (전시상품명 컬럼에)
          group.forEach(() => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 0 }); // A열 (전시상품명 컬럼)
            if (worksheet[cellRef]) {
              // 기존 전시상품명에 아이콘 추가
              const currentValue = worksheet[cellRef].v || '';
              worksheet[cellRef].v = `${groupIcon} ${currentValue}`;
            }
            rowIndex++;
          });
        } else {
          // 아이콘이 없는 그룹은 그냥 행 인덱스만 증가
          rowIndex += group.length;
        }
      } else {
        // 1개만 있는 그룹은 아이콘 없이 행 인덱스만 증가
        rowIndex += group.length;
      }
    });

    // 워크시트 범위 설정
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    // 시트 이름 설정
          let sheetName = '불일치데이터_결산스타일';
          if (coachingType === 'property') {
            sheetName = `${yearMonth}_매물코칭_불일치_결산스타일`;
          } else if (coachingType === 'investment') {
            sheetName = `${yearMonth}_투자코칭_불일치_결산스타일`;
          }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 파일 다운로드 (스타일 포함)
    const wbout = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true,
      bookSST: true
    });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('결산 스타일 파일 다운로드 완료:', filename);

    } catch (error) {
      console.error('결산 스타일 다운로드 중 오류 발생:', error);
      alert(`결산 스타일 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

/**
 * 동일인 추측 매칭 데이터를 결산 스타일로 Excel 파일로 다운로드합니다
 */
export const downloadSuspectedMatchesData = (
  suspectedMatchPairs: { orderItem: ComparisonItem, coachingItem: ComparisonItem, matchType: string }[],
  coachingType?: 'property' | 'investment',
  selectedYear?: number,
  selectedMonth?: number
) => {
  try {
    // 연도/월 정보 생성 (YYMM 형식)
    const year = selectedYear || new Date().getFullYear();
    const month = selectedMonth || new Date().getMonth() + 1;
    const yearMonth = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}`;
    
    // 코칭 타입에 따라 파일명 설정
    let filename = '';
    if (coachingType === 'property') {
      filename = `${yearMonth}_매물코칭_동일인추측_결산스타일.xlsx`;
    } else if (coachingType === 'investment') {
      filename = `${yearMonth}_투자코칭_동일인추측_결산스타일.xlsx`;
    } else {
      filename = `${yearMonth}_데이터_동일인추측_결산스타일.xlsx`;
    }

    console.log('동일인 추측 다운로드 시작:', { pairs: suspectedMatchPairs.length, filename });

    const workbook = XLSX.utils.book_new();
    const allRows: any[] = [];
    
    suspectedMatchPairs.forEach((pair) => {
      const order = pair.orderItem.orderData;
      const coaching = pair.coachingItem.coachingData;
      
      const formatDateTime = (value: any): string => {
        if (!value) return '-';
        if (typeof value === 'number') {
          const date = new Date((value - 25569) * 86400 * 1000);
          if (isNaN(date.getTime())) return String(value);
          return date.toISOString().slice(0, 10).replace(/-/g, '.');
        }
        if (typeof value === 'string') return value;
        if (value instanceof Date) return value.toISOString().slice(0, 10).replace(/-/g, '.');
        return String(value);
      };

      // 매칭된 쌍을 하나의 행으로 합쳐서 생성
      const row = {
        전시상품명: order?.전시상품명 || (coaching ? '코칭신청' : '-'),
        이름: order?.이름 || coaching?.이름 || '-',
        휴대폰번호: order?.휴대폰번호 || coaching?.번호 || '-',
        주문번호: order?.주문번호 || '-',
        ID: order?.ID || '-',
        닉네임: order?.닉네임 || coaching?.닉네임 || '-',
        옵션정보: order?.옵션정보 || (coaching ? '코칭서비스' : '-'),
        '판매액(원)': order?.['판매액(원)'] || '-',
        'PG 결제액(원)': order?.['PG 결제액(원)'] || '-',
        '인앱 결제액(원)': order?.['인앱 결제액(원)'] || '-',
        포인트사용: order?.포인트사용 || '-',
        베네피아포인트: order?.베네피아포인트 || '-',
        '상품권 사용': order?.['상품권 사용'] || '-',
        쿠폰할인: order?.쿠폰할인 || '-',
        상태: order ? '결제완료(코칭있음)' : '코칭신청(결제있음)',
        결제일시: formatDateTime(order?.결제일시) || '-',
        대기신청일: formatDateTime(order?.대기신청일) || formatDateTime(coaching?.코칭진행일) || '-',
        결제수단: order?.결제수단 || '-',
        결제요청: order?.결제요청 || '-',
        결제플랫폼: order?.결제플랫폼 || '-',
        마케팅수신동의: order?.마케팅수신동의 || 'Y',
        예전아이디: order?.예전아이디 || '-',
        코치: coaching?.코치 || '-',
        코칭진행일: formatDateTime(coaching?.코칭진행일) || '-',
        '코칭_신청일': formatDateTime(coaching?.코칭진행일) || '-',
        '코칭_만족도문자': coaching?.['진행여부 / 비고'] || '-',
        '코칭_지역': coaching?.['1순위(구, 관심지역)'] || '-',
        '코칭_단지명': coaching?.['2순위'] || '-',
        '코칭_평형': '-',
        '코칭_매매가': '-',
        '코칭_전세가': '-',
        '코칭_투자금': '-',
        '코칭_O/X': '-',
        '코칭_상세': '-',
        '코칭_코칭완료여부': coaching?.['진행여부 / 비고'] || '-',
        '코칭_매수추천여부': '-',
        '코칭_중개추천여부': coaching?.중개서비스진행여부 || '-',
        '코칭_구글폼 번호': '-'
      };
      allRows.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(allRows);
    
    const columnWidths = [
      { wch: 20 }, // 전시상품명
      { wch: 15 }, // 이름
      { wch: 18 }, // 휴대폰번호
      { wch: 15 }, // 주문번호
      { wch: 10 }, // ID
      { wch: 15 }, // 닉네임
      { wch: 20 }, // 옵션정보
      { wch: 12 }, // 판매액(원)
      { wch: 12 }, // PG 결제액(원)
      { wch: 12 }, // 인앱 결제액(원)
      { wch: 12 }, // 포인트사용
      { wch: 12 }, // 베네피아포인트
      { wch: 12 }, // 상품권 사용
      { wch: 12 }, // 쿠폰할인
      { wch: 20 }, // 상태
      { wch: 18 }, // 결제일시
      { wch: 18 }, // 대기신청일
      { wch: 12 }, // 결제수단
      { wch: 12 }, // 결제요청
      { wch: 12 }, // 결제플랫폼
      { wch: 15 }, // 마케팅수신동의
      { wch: 12 }, // 예전아이디
      { wch: 12 }, // 코치
      { wch: 18 }, // 코칭진행일
      { wch: 18 }, // 코칭_신청일
      { wch: 15 }, // 코칭_만족도문자
      { wch: 15 }, // 코칭_지역
      { wch: 15 }, // 코칭_단지명
      { wch: 12 }, // 코칭_평형
      { wch: 12 }, // 코칭_매매가
      { wch: 12 }, // 코칭_전세가
      { wch: 12 }, // 코칭_투자금
      { wch: 10 }, // 코칭_O/X
      { wch: 15 }, // 코칭_상세
      { wch: 15 }, // 코칭_코칭완료여부
      { wch: 15 }, // 코칭_매수추천여부
      { wch: 15 }, // 코칭_중개추천여부
      { wch: 15 }  // 코칭_구글폼 번호
    ];
    worksheet['!cols'] = columnWidths;

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    let sheetName = '동일인추측_결산스타일';
    if (coachingType === 'property') {
      sheetName = `${yearMonth}_매물코칭_동일인추측_결산스타일`;
    } else if (coachingType === 'investment') {
      sheetName = `${yearMonth}_투자코칭_동일인추측_결산스타일`;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const wbout = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true,
      bookSST: true
    });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('동일인 추측 다운로드 중 오류 발생:', error);
    alert(`동일인 추측 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 중복 건 데이터를 Excel 파일로 다운로드합니다
 */
export const downloadDuplicateCasesData = (
  duplicateItems: ComparisonItem[],
  coachingType?: 'property' | 'investment',
  selectedYear?: number,
  selectedMonth?: number
) => {
  try {
    // 연도/월 정보 생성 (YYMM 형식)
    const year = selectedYear || new Date().getFullYear();
    const month = selectedMonth || new Date().getMonth() + 1;
    const yearMonth = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}`;
    
    // 코칭 타입에 따라 파일명 설정
    let filename = '';
    if (coachingType === 'property') {
      filename = `${yearMonth}_매물코칭_중복건.xlsx`;
    } else if (coachingType === 'investment') {
      filename = `${yearMonth}_투자코칭_중복건.xlsx`;
    } else {
      filename = `${yearMonth}_데이터_중복건.xlsx`;
    }

    console.log('중복 건 다운로드 시작:', { items: duplicateItems.length, filename });

    const workbook = XLSX.utils.book_new();
    const allRows: any[] = [];
    
    duplicateItems.forEach((item) => {
      const order = item.orderData;
      const coaching = item.coachingData;
      
      const formatDateTime = (value: any): string => {
        if (!value) return '-';
        if (typeof value === 'number') {
          const date = new Date((value - 25569) * 86400 * 1000);
          if (isNaN(date.getTime())) return String(value);
          return date.toISOString().slice(0, 10).replace(/-/g, '.');
        }
        if (typeof value === 'string') return value;
        if (value instanceof Date) return value.toISOString().slice(0, 10).replace(/-/g, '.');
        return String(value);
      };

      const formatNumber = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const cleaned = value.replace(/[^\d.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const row = {
        전시상품명: order?.전시상품명 || '-',
        이름: (order || coaching)?.이름 || '-',
        휴대폰번호: order?.휴대폰번호 || coaching?.번호 || '-',
        주문번호: order?.주문번호 || '-',
        ID: order?.ID || '-',
        닉네임: (order || coaching)?.닉네임 || '-',
        옵션정보: order?.옵션정보 || (coaching ? '코칭서비스' : '-'),
        '판매액(원)': formatNumber(order?.['판매액(원)']),
        'PG 결제액(원)': formatNumber(order?.['PG 결제액(원)']),
        '인앱 결제액(원)': formatNumber(order?.['인앱 결제액(원)']),
        포인트사용: formatNumber(order?.포인트사용),
        베네피아포인트: formatNumber(order?.베네피아포인트),
        '상품권 사용': formatNumber(order?.['상품권 사용']),
        쿠폰할인: formatNumber(order?.쿠폰할인),
        상태: '중복 건',
        결제일시: formatDateTime(order?.결제일시) || '-',
        대기신청일: formatDateTime(order?.대기신청일) || formatDateTime(coaching?.코칭진행일) || '-',
        결제수단: order?.결제수단 || '-',
        결제요청: order?.결제요청 || '-',
        결제플랫폼: order?.결제플랫폼 || '-',
        마케팅수신동의: order?.마케팅수신동의 || 'Y',
        예전아이디: order?.예전아이디 || '-',
        코치: coaching?.코치 || '-',
        코칭진행일: formatDateTime(coaching?.코칭진행일) || '-',
        '진행여부 / 비고': coaching?.['진행여부 / 비고'] || '-',
        월부학교: coaching?.월부학교 || '-',
        '1순위(구, 관심지역)': coaching?.['1순위(구, 관심지역)'] || '-',
        '2순위': coaching?.['2순위'] || '-',
        중개문자발송여부: coaching?.중개문자발송여부 || '-',
        중개서비스진행여부: coaching?.중개서비스진행여부 || '-',
        '취소 및 환불': coaching?.['취소 및 환불'] || '-'
      };
      
      allRows.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(allRows);
    const sheetName = '중복 건 데이터';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const wbout = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true,
      bookSST: true
    });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('중복 건 다운로드 중 오류 발생:', error);
    alert(`중복 건 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};
