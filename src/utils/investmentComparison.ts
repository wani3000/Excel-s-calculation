import * as XLSX from 'xlsx';
import { InvestmentOrderData, InvestmentParticipantData, InvestmentMatchingResult } from '../types';

/**
 * 투자코칭 주문내역 파일을 읽어옵니다
 */
export const readInvestmentOrderFile = (file: File): Promise<InvestmentOrderData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트를 읽음
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 시트를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 모든 행을 로그로 출력하여 파일 구조 파악
        console.log('=== 투자코칭 주문내역 파일 전체 구조 ===');
        jsonData.slice(0, 10).forEach((row, index) => {
          console.log(`행 ${index}:`, (row as any[])?.slice(0, 5)); // 첫 5개 컬럼만 출력
        });
        console.log('================================');
        
        if (jsonData.length < 2) {
          reject(new Error('파일에 헤더와 데이터가 없습니다.'));
          return;
        }
        
        // 헤더 추출 (빈 헤더 제거)
        const rawHeaders = jsonData[0] as string[];
        const headers: string[] = [];
        const headerIndices: number[] = [];
        
        rawHeaders.forEach((header, index) => {
          if (header && String(header).trim() !== '' && String(header).trim() !== 'undefined') {
            headers.push(String(header).trim());
            headerIndices.push(index);
          }
        });
        
        console.log('헤더 정보:', { 
          rawHeaders: rawHeaders.length, 
          validHeaders: headers.length,
          headers,
          headerIndices
        });
        
        // 데이터 행들을 객체로 변환
        const orders: InvestmentOrderData[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;
          
          const order: any = {};
          
          // 유효한 헤더 컬럼만 처리 (빈 열 제외)
          headers.forEach((header, headerIndex) => {
            const columnIndex = headerIndices[headerIndex];
            const cellValue = row[columnIndex];
            
            // 셀 값이 유효한 경우만 추가
            if (cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
              order[header] = cellValue;
            }
          });
          
          // 디버깅: 모든 행 출력
          console.log(`투자코칭 주문내역 행 ${i} 데이터:`, {
            이름: order.이름,
            휴대폰번호: order.휴대폰번호,
            닉네임: order.닉네임
          });
          
          // 필수 필드 검증 (단순화)
          const hasName = order.이름 && String(order.이름).trim() !== '';
          const hasNickname = order.닉네임 && String(order.닉네임).trim() !== '';
          const hasPhone = order.휴대폰번호 && String(order.휴대폰번호).trim() !== '';
          
          // 최소 하나의 필드라도 있으면 유효한 데이터로 간주
          const hasAnyValidField = hasName || hasNickname || hasPhone;
          
          if (hasAnyValidField) {
            orders.push(order as InvestmentOrderData);
          }
        }
        
        console.log(`투자코칭 주문내역 파일 읽기 완료: ${orders.length}개 항목`);
        
        // 첫 번째 주문 데이터 샘플 출력
        if (orders.length > 0) {
          console.log('첫 번째 주문 샘플:', orders[0]);
        }
        
        resolve(orders);
      } catch (error) {
        reject(new Error(`파일 읽기 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 코칭현황 파일을 읽어옵니다 (참여자 정보)
 */
export const readCoachingStatusFile = (file: File): Promise<InvestmentParticipantData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트를 읽음
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 시트를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('코칭현황 파일 분석:', {
          sheetName,
          totalRows: jsonData.length,
          firstFewRows: jsonData.slice(0, 5)
        });
        
        if (jsonData.length < 2) {
          reject(new Error('파일에 충분한 데이터가 없습니다.'));
          return;
        }
        
        // 모든 행을 로그로 출력하여 파일 구조 파악
        console.log('=== 투자코칭 현황 파일 전체 구조 ===');
        jsonData.slice(0, 10).forEach((row, index) => {
          console.log(`행 ${index}:`, (row as any[])?.slice(0, 5)); // 첫 5개 컬럼만 출력
        });
        console.log('================================');

        // 헤더 찾기 - 첫 번째 행부터 시작
        let headerRowIndex = 0; // 첫 번째 행이 헤더라고 가정
        let headers: string[] = [];
        let headerIndices: number[] = [];
        let coachName = '';
        
        console.log('=== 헤더 찾기 시작 ===');
        
        // 첫 번째 행을 헤더로 사용
        const firstRow = jsonData[0] as any[];
        if (firstRow && firstRow.length > 0) {
          headers = firstRow.map(cell => String(cell || '').trim());
          console.log('첫 번째 행을 헤더로 사용:', headers);
          
          // 필요한 헤더 필드 확인
          const requiredFields = ['닉네임', '연락처', '성함'];
          const hasRequiredFields = requiredFields.every(field => 
            headers.some(header => header.includes(field))
          );
          
          if (hasRequiredFields) {
            console.log('✅ 필요한 헤더 필드가 모두 있음');
            headerRowIndex = 0;
          } else {
            console.log('❌ 필요한 헤더 필드가 없음, 다른 행 찾기');
            // 다른 행에서 헤더 찾기
            for (let i = 1; i < Math.min(jsonData.length, 5); i++) {
              const row = jsonData[i] as any[];
              if (row && row.length > 0) {
                const rowHeaders = row.map(cell => String(cell || '').trim());
                const hasRequired = requiredFields.every(field => 
                  rowHeaders.some(header => header.includes(field))
                );
                if (hasRequired) {
                  headers = rowHeaders;
                  headerRowIndex = i;
                  console.log(`헤더 발견! 행 ${i}:`, headers);
                  break;
                }
              }
            }
          }
        }
           
        console.log('첫 번째 행 확인:', { 
          firstRow: firstRow?.slice(0, 3), 
          firstRowText: String(firstRow[0]).trim(),
          coachName
        });

        // 헤더 찾기 시작점 설정 (첫 번째 행부터 시작)
        console.log(`헤더 검색 시작점: 행 ${headerRowIndex}`);

        for (let i = headerRowIndex; i < Math.min(headerRowIndex + 5, jsonData.length); i++) {
          const row = jsonData[i] as any[];
          if (row && row.length > 0) {
            // 빈 헤더 제거하고 유효한 헤더만 추출
            const validHeaders: string[] = [];
            const validIndices: number[] = [];
            
            row.forEach((cell: any, index: number) => {
              if (cell && String(cell).trim() !== '' && String(cell).trim() !== 'undefined') {
                validHeaders.push(String(cell).trim());
                validIndices.push(index);
              }
            });
            
            // 투자코칭 현황 파일의 A~H열 구조 확인 (코치, 상담일시, 요일, 시간, 닉네임, 연락처, 성함)
            const hasRequiredFields = validHeaders.some(header => 
              header === '코치' || header === '상담일시' || header === '요일' || header === '시간' ||
              header === '닉네임' || header === '연락처' || header === '성함' ||
              // 유연한 검색도 지원
              header.includes('성함') || header.includes('닉네임') || header.includes('연락처') ||
              header.includes('이름') || header.includes('전화번호') || header.includes('휴대폰') ||
              header.includes('상담일시') || header.includes('시간') ||
              header === '성함' || header === '닉네임' || header === '연락처' ||
              header === '이름' || header === '전화번호' || header === '휴대폰번호' ||
              header === '상담일시' || header === '시간'
            );
            
            console.log(`행 ${i} 헤더 검사:`, { 
              validHeaders, 
              hasRequiredFields
            });
            
            if (validHeaders.length > 2 && hasRequiredFields) {
              headers = validHeaders;
              headerIndices = validIndices;
              headerRowIndex = i;
              console.log(`헤더 발견! 행 ${i}:`, headers);
              break;
            }
          }
        }
        
        // 헤더를 찾지 못한 경우 대안 로직
        if (headers.length === 0) {
          console.warn('정확한 헤더를 찾을 수 없음. 첫 번째 행을 헤더로 사용합니다.');
          
          // 첫 번째 행을 헤더로 사용
          const fallbackRowIndex = 0;
          const fallbackRow = jsonData[fallbackRowIndex] as any[];
          
          if (fallbackRow && fallbackRow.length > 0) {
            headers = [];
            headerIndices = [];
            
            fallbackRow.forEach((cell: any, index: number) => {
              if (cell && String(cell).trim() !== '' && String(cell).trim() !== 'undefined') {
                headers.push(String(cell).trim());
                headerIndices.push(index);
              }
            });
            
            headerRowIndex = fallbackRowIndex;
            console.log('대안 헤더 사용:', { headers, headerIndices, headerRowIndex });
          }
          
          // 여전히 헤더를 찾을 수 없는 경우 에러
          if (headers.length === 0) {
            console.error('헤더를 찾을 수 없음. 파일 구조 확인 필요:', {
              totalRows: jsonData.length,
              firstFewRows: jsonData.slice(0, 5),
              coachName,
              headerRowIndex
            });
            reject(new Error('투자코칭 현황 파일에서 필요한 헤더를 찾을 수 없습니다.'));
            return;
          }
        }
        
        console.log('헤더 정보:', { 
          headerRowIndex, 
          headers, 
          headerIndices,
          totalColumns: (jsonData[headerRowIndex] as any[])?.length || 0,
          validColumns: headers.length
        });
        
        // 헤더 다음 행부터 데이터 시작
        const participants: InvestmentParticipantData[] = [];
        let currentCoach = ''; // 현재 코치 이름 추적
        
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;
          
          const participant: any = {};
          
          // 유효한 헤더 컬럼만 처리 (빈 열 제외)
          headers.forEach((header, headerIndex) => {
            const columnIndex = headerIndices[headerIndex];
            const cellValue = row[columnIndex];
            
            // 셀 값이 유효한 경우만 추가
            if (cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
              participant[header] = cellValue;
              
              // 코치 이름 업데이트 (셀 병합 처리)
              if (header.includes('코치') || columnIndex === 0) {
                currentCoach = String(cellValue).trim();
              }
            }
          });
          
          // 코치 정보 추가 (셀 병합된 코치 이름 전파)
          if (participant.코치) {
            currentCoach = participant.코치; // 새로운 코치 이름으로 업데이트
          } else if (currentCoach) {
            participant['코치'] = currentCoach; // 이전 코치 이름 유지
          }
          
          // 디버깅: 첫 번째 몇 개 행 출력
          if (participants.length < 3) {
            console.log(`참여자 행 ${i} 데이터:`, participant);
            console.log(`참여자 행 ${i} 원본:`, row);
          }
          
          // 닉네임 접두사 제거 함수
          const cleanNickname = (nickname: string): string => {
            if (!nickname) return '';
            
            // "일반투코(되는시", "내집코칭(되는시", "혜택투코(되는시" 등의 접두사 제거
            const patterns = [
              /^일반투코\(되는시\s*/,
              /^내집코칭\(되는시\s*/,
              /^혜택투코\(되는시\s*/,
              /^.*?\(되는시\s*/
            ];
            
            let cleaned = nickname.trim();
            for (const pattern of patterns) {
              cleaned = cleaned.replace(pattern, '').trim();
            }
            
            return cleaned;
          };
          
          // 닉네임 정리
          if (participant.닉네임) {
            participant.닉네임 = cleanNickname(String(participant.닉네임));
          }
          
          // 데이터 검증 및 오류 필터링
          const isCancelledOrInvalid = 
            String(participant.닉네임 || '').includes('취소') ||
            String(participant.성함 || '').match(/^010-\d{4}-\d{4}$/) || // 성함에 전화번호가 들어간 경우
            String(participant.연락처 || '').match(/^[가-힣]+$/) || // 연락처에 한글이 들어간 경우
            !participant.성함 || String(participant.성함).trim() === '';
          
          // 투자코칭 현황 파일의 필수 필드 검증
          const hasName = participant.성함 && String(participant.성함).trim() !== '';
          const hasNickname = participant.닉네임 && String(participant.닉네임).trim() !== '';
          const hasPhone = participant.연락처 && String(participant.연락처).trim() !== '';
          
          // 최소 하나의 필드라도 있으면 유효한 데이터로 간주
          const hasAnyValidField = hasName || hasNickname || hasPhone;
            
          // 디버깅: 모든 참여자의 필드 검증 결과 출력
          console.log(`참여자 ${participants.length + 1} 필드 검증:`, {
            hasName, hasNickname, hasPhone, hasAnyValidField, isCancelledOrInvalid,
            participant: {
              성함: participant.성함,
              이름: participant.이름,
              연락처: participant.연락처,
              휴대폰번호: participant.휴대폰번호,
              닉네임: participant.닉네임
            }
          });
          
          // 유효한 데이터이고 취소/오류 데이터가 아닌 경우만 추가
          if (hasAnyValidField && !isCancelledOrInvalid) {
            participants.push(participant as InvestmentParticipantData);
          } else if (isCancelledOrInvalid) {
            console.log(`🚫 잘못된 데이터 제외:`, participant);
          }
        }
        
        console.log(`코칭현황 파일 읽기 완료: ${participants.length}개 참여자`);
        
        // 첫 번째 참여자 데이터 샘플 출력
        if (participants.length > 0) {
          console.log('첫 번째 참여자 샘플:', participants[0]);
        }
        
        resolve(participants);
      } catch (error) {
        reject(new Error(`파일 읽기 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 우선순위 기반 매칭 함수
 * 1순위: 성함=이름, 2순위: 연락처=전화번호, 3순위: 닉네임
 */
export const findMatchingParticipant = (
  order: any,
  coachingSchedule: any[],
  debugMode: boolean = false
): any | null => {
  const orderName = String(order.이름 || '').trim();
  const orderPhone = String(order.휴대폰번호 || '').trim().replace(/[-\\s]/g, '');
  const orderNickname = String(order.닉네임 || '').trim();
  
  if (debugMode) {
    console.log('주문 매칭 시도 (디버그 모드):', {
      orderName, orderPhone, orderNickname,
      coachingScheduleLength: coachingSchedule.length
    });
  }
  
  // 1순위: 성함=이름 매칭
  if (orderName) {
    if (debugMode) {
      console.log('1순위 매칭 시도 (성함=이름):', { orderName });
    }
    const nameMatch = coachingSchedule.find(participant => {
      const participantName = participant.성함 ? String(participant.성함).trim() : '';
      if (debugMode) {
        console.log('비교 중:', { orderName, participantName, match: participantName === orderName });
      }
      return participantName && participantName === orderName;
    });
    if (nameMatch) {
      if (debugMode) {
        console.log('✅ 1순위 매칭 성공 (성함=이름):', { orderName, participant: nameMatch.성함 });
      }
      return nameMatch;
    } else if (debugMode) {
      console.log('❌ 1순위 매칭 실패 (성함=이름)');
    }
  }
  
  // 2순위: 연락처=전화번호 매칭
  if (orderPhone) {
    const phoneMatch = coachingSchedule.find(participant => {
      const participantPhone = String(participant.연락처 || '').trim().replace(/[-\\s]/g, '');
      return participantPhone && participantPhone === orderPhone;
    });
    if (phoneMatch) {
      console.log('✅ 2순위 매칭 성공 (연락처=전화번호):', { orderPhone, participant: phoneMatch.연락처 });
      return phoneMatch;
    }
  }
  
  // 3순위: 닉네임 매칭
  if (orderNickname) {
    const nicknameMatch = coachingSchedule.find(participant => 
      participant.닉네임 && String(participant.닉네임).trim() === orderNickname
    );
    if (nicknameMatch) {
      console.log('✅ 3순위 매칭 성공 (닉네임):', { orderNickname, participant: nicknameMatch.닉네임 });
      return nicknameMatch;
    }
  }
  
  console.log('❌ 매칭 실패:', { orderName, orderPhone, orderNickname });
  return null;
};

/**
 * 투자코칭 데이터를 비교하고 매칭합니다
 */
export const compareInvestmentData = (
  investmentOrders: InvestmentOrderData[],
  homeOrders: InvestmentOrderData[],
  coachingSchedule: InvestmentParticipantData[]
): InvestmentMatchingResult => {
  console.log('=== 투자코칭 데이터 비교 시작 ===');
  console.log(`투자코칭 주문: ${investmentOrders.length}개`);
  console.log(`내집마련코칭 주문: ${homeOrders.length}개`);
  console.log(`코칭 스케줄: ${coachingSchedule.length}개`);
  
  // 1. 두 주문내역 시트 병합 (이것이 실제 "참여자" = 결제한 사람들)
  const allOrders = [...investmentOrders, ...homeOrders];
  console.log(`총 참여자(결제자) 수: ${allOrders.length}개`);
  
  // 주문 샘플 출력 (처음 5개)
  if (allOrders.length > 0) {
    console.log('=== 주문 샘플 (처음 5개) ===');
    allOrders.slice(0, 5).forEach((order, index) => {
      console.log(`주문 ${index + 1}:`, {
        이름: order.이름,
        휴대폰번호: order.휴대폰번호,
        닉네임: order.닉네임,
        전체데이터: order
      });
    });
  } else {
    console.log('❌ 주문 데이터가 비어있음!');
  }
  
  // 코칭 스케줄 샘플 출력 (처음 5개)
  if (coachingSchedule.length > 0) {
    console.log('=== 코칭 스케줄 샘플 (처음 5개) ===');
    coachingSchedule.slice(0, 5).forEach((schedule, index) => {
      console.log(`코칭 스케줄 ${index + 1}:`, {
        성함: schedule.성함,
        연락처: schedule.연락처,
        닉네임: schedule.닉네임,
        코치: schedule.코치,
        상담일시: schedule.상담일시,
        전체데이터: schedule
      });
    });
  } else {
    console.log('❌ 코칭 스케줄이 비어있음!');
  }
  
  // 2. 우선순위 기반 매칭
  const matchedOrders: InvestmentOrderData[] = [];
  const unmatchedOrders: InvestmentOrderData[] = [];
  const usedCoachingKeys = new Set<string>();
  
  allOrders.forEach((order, index) => {
    if (index < 3) { // 처음 3개 주문만 상세 디버깅
      console.log(`\n--- 주문 ${index + 1} 매칭 시도 (상세) ---`);
    } else if (index === 3) {
      console.log(`\n--- 주문 4~${allOrders.length} 매칭 시도 (간단) ---`);
    }
    
    const matchedParticipant = findMatchingParticipant(order, coachingSchedule, index < 3);
    
    if (matchedParticipant) {
      // 매칭된 주문에 코치 정보와 상담일시 추가
      const enrichedOrder = {
        ...order,
        코치: matchedParticipant.코치 || '-',
        코칭진행일: matchedParticipant.상담일시 || matchedParticipant.시간 || '-',
        상담일시: matchedParticipant.상담일시 || '-',
        시간: matchedParticipant.시간 || '-'
      };
      matchedOrders.push(enrichedOrder);
      
      // 사용된 코칭 스케줄 추적
      const coachingKey = `${matchedParticipant.성함}_${matchedParticipant.연락처}_${matchedParticipant.닉네임}`;
      usedCoachingKeys.add(coachingKey);
      
      console.log(`✅ 매칭 성공 ${matchedOrders.length}:`, {
        주문: { 이름: order.이름, 휴대폰번호: order.휴대폰번호, 닉네임: order.닉네임 },
        코칭: { 성함: matchedParticipant.성함, 연락처: matchedParticipant.연락처, 닉네임: matchedParticipant.닉네임, 코치: matchedParticipant.코치 }
      });
    } else {
      unmatchedOrders.push(order);
      if (unmatchedOrders.length <= 3) {
        console.log(`❌ 매칭 실패 ${unmatchedOrders.length}:`, {
          이름: order.이름,
          휴대폰번호: order.휴대폰번호,
          닉네임: order.닉네임
        });
      }
    }
  });
  
  // 3. 매칭되지 않은 코칭 스케줄 찾기
  const unmatchedParticipants: InvestmentParticipantData[] = [];
  coachingSchedule.forEach(participant => {
    const coachingKey = `${participant.성함}_${participant.연락처}_${participant.닉네임}`;
    if (!usedCoachingKeys.has(coachingKey)) {
      unmatchedParticipants.push(participant);
    }
  });
  
  // 매칭 결과 요약
  console.log('\n=== 최종 매칭 결과 ===');
  console.log(`총 참여자(결제자): ${allOrders.length}개`);
  console.log(`매칭된 주문: ${matchedOrders.length}개`);
  console.log(`매칭되지 않은 주문: ${unmatchedOrders.length}개`);
  console.log(`매칭되지 않은 코칭 스케줄: ${unmatchedParticipants.length}개`);
  



  // 코치 수 계산
  const uniqueCoaches = new Set(matchedOrders.map(order => order.코치).filter(coach => coach && coach !== '-'));

  // 투자코칭과 내집마련코칭 주문 분리
  const investmentOrdersOnly = investmentOrders;
  const homeOrdersOnly = homeOrders;
  
  // 투자코칭 매칭된 주문
  const matchedInvestmentOrders = matchedOrders.filter(order => 
    investmentOrdersOnly.some(invOrder => invOrder.이름 === order.이름 && invOrder.휴대폰번호 === order.휴대폰번호)
  );
  
  // 내집마련코칭 매칭된 주문
  const matchedHomeOrders = matchedOrders.filter(order => 
    homeOrdersOnly.some(homeOrder => homeOrder.이름 === order.이름 && homeOrder.휴대폰번호 === order.휴대폰번호)
  );

  // 투자코칭 결제 기간
  const investmentOrderDates = investmentOrdersOnly
    .map(order => order.결제일시)
    .filter(date => date)
    .map(date => new Date(date))
    .filter(date => !isNaN(date.getTime()));

  // 내집마련코칭 결제 기간
  const homeOrderDates = homeOrdersOnly
    .map(order => order.결제일시)
    .filter(date => date)
    .map(date => new Date(date))
    .filter(date => !isNaN(date.getTime()));

  const investmentOrderDateRange = investmentOrderDates.length > 0 ? {
    min: new Date(Math.min(...investmentOrderDates.map(d => d.getTime()))),
    max: new Date(Math.max(...investmentOrderDates.map(d => d.getTime())))
  } : null;

  const homeOrderDateRange = homeOrderDates.length > 0 ? {
    min: new Date(Math.min(...homeOrderDates.map(d => d.getTime()))),
    max: new Date(Math.max(...homeOrderDates.map(d => d.getTime())))
  } : null;

  // 코치 목록 추출
  const coachNames = Array.from(uniqueCoaches).filter(name => name && name !== '-');
  const coachList = coachNames.join(', ');

  // 강사별 판매액 계산 (매칭된 주문만)
  const coachSales: { [coachName: string]: number } = {};
  matchedOrders.forEach(order => {
    const coachName = order.코치 || '미지정';
    const salesAmount = typeof order['판매액(원)'] === 'number' ? order['판매액(원)'] : 
                      parseFloat(String(order['판매액(원)'] || '0')) || 0;
    
    if (coachSales[coachName]) {
      coachSales[coachName] += salesAmount;
    } else {
      coachSales[coachName] = salesAmount;
    }
  });

  const result = {
    matchedOrders,
    unmatchedParticipants,
    unmatchedOrders,
    totalParticipants: coachingSchedule.length,
    totalOrders: allOrders.length,
    matchedCount: matchedOrders.length,
    stats: {
      total: allOrders.length,
      matched: matchedOrders.length,
      unmatchedOrders: unmatchedOrders.length,
      unmatchedParticipants: unmatchedParticipants.length,
      onlyInA: unmatchedOrders.length,
      onlyInB: unmatchedParticipants.length,
      
      // 투자코칭 DB 통계
      investmentStats: {
        orderTotal: investmentOrdersOnly.length,
        matched: matchedInvestmentOrders.length,
        totalAmount: investmentOrdersOnly.reduce((sum, order) => {
          const amount = typeof order['판매액(원)'] === 'number' ? order['판매액(원)'] : 
                        parseFloat(String(order['판매액(원)'] || '0')) || 0;
          return sum + amount;
        }, 0),
        dateRange: investmentOrderDateRange ? 
          `${investmentOrderDateRange.min.toLocaleDateString('ko-KR')} ~ ${investmentOrderDateRange.max.toLocaleDateString('ko-KR')}` : 
          '데이터 없음'
      },
      
      // 내집마련코칭 DB 통계
      homeStats: {
        orderTotal: homeOrdersOnly.length,
        matched: matchedHomeOrders.length,
        totalAmount: homeOrdersOnly.reduce((sum, order) => {
          const amount = typeof order['판매액(원)'] === 'number' ? order['판매액(원)'] : 
                        parseFloat(String(order['판매액(원)'] || '0')) || 0;
          return sum + amount;
        }, 0),
        dateRange: homeOrderDateRange ? 
          `${homeOrderDateRange.min.toLocaleDateString('ko-KR')} ~ ${homeOrderDateRange.max.toLocaleDateString('ko-KR')}` : 
          '데이터 없음'
      },
      
      // 코칭현황 통계
      coachingStats: {
        totalParticipants: coachingSchedule.length,
        validParticipants: coachingSchedule.filter(p => 
          !String(p.닉네임 || '').includes('취소') &&
          !String(p.성함 || '').match(/^010-\d{4}-\d{4}$/) &&
          !String(p.연락처 || '').match(/^[가-힣]+$/)
        ).length,
        cancelledCount: coachingSchedule.filter(p => 
          String(p.닉네임 || '').includes('취소') ||
          String(p.성함 || '').match(/^010-\d{4}-\d{4}$/) ||
          String(p.연락처 || '').match(/^[가-힣]+$/)
        ).length,
        uniqueCoaches: uniqueCoaches.size,
        coachList: coachList
      },
      matchingRate: allOrders.length > 0 ? Math.round((matchedOrders.length / allOrders.length) * 100) : 0,
      coachSales: coachSales
    }
  };
  
  console.log('투자코칭 데이터 비교 완료:', result);
  return result;
};

/**
 * 주문내역에만 있는 데이터를 Excel 파일로 다운로드합니다
 */
export const downloadUnmatchedOrders = (
  unmatchedOrders: InvestmentOrderData[],
  year: number,
  month: number
) => {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 주문내역에만 있는 데이터 시트 생성 (39개 컬럼 구조)
  const unmatchedSheetData = unmatchedOrders.map((order) => ({
    '전시상품명': order.전시상품명 || '-',
    '이름': order.이름 || '-',
    '휴대폰번호': order.휴대폰번호 || '-',
    '주문번호': order.주문번호 || '-',
    'ID': order.ID || '-',
    '닉네임': order.닉네임 || '-',
    '옵션정보': order.옵션정보 || '-',
    '판매액(원)': order['판매액(원)'] || 0,
    'PG 결제액(원)': order['PG 결제액(원)'] || 0,
    '인앱 결제액(원)': order['인앱 결제액(원)'] || 0,
    '포인트사용': order.포인트사용 || '-',
    '베네피아포인트': order.베네피아포인트 || '-',
    '상품권 사용': order['상품권 사용'] || '-',
    '쿠폰할인': order.쿠폰할인 || '-',
    '상태': order.상태 || '-',
    '결제일시': order.결제일시 || '-',
    '대기신청일': order.대기신청일 || '-',
    '결제수단': order.결제수단 || '-',
    '결제요청': order.결제요청 || '-',
    '결제플랫폼': order.결제플랫폼 || '-',
    '마케팅수신동의': order.마케팅수신동의 || '-',
    '예전아이디': order.예전아이디 || '-',
    '코치': '-', // 주문내역에만 있으므로 코치 정보 없음
    '코칭진행일': '-', // 주문내역에만 있으므로 코칭진행일 없음
    '코칭_신청일': '-',
    '코칭_만족도문자': '-',
    '코칭_지역': '-',
    '코칭_단지명': '-',
    '코칭_평형': '-',
    '코칭_매매가': '-',
    '코칭_전세가': '-',
    '코칭_투자금': '-',
    '코칭_O/X': '-',
    '코칭_상세': '-',
    '코칭_코칭완료여부': '-',
    '코칭_매수추천여부': '-',
    '코칭_중개추천여부': '-',
    '코칭_구글폼 번호': '-',
    '코칭_취소 및 환불': '-'
  }));

  const unmatchedSheet = XLSX.utils.json_to_sheet(unmatchedSheetData);
  
  // 컬럼 너비 설정 (투자코칭 결과와 동일)
  const columnWidths = [
    { wch: 20 }, // 전시상품명
    { wch: 12 }, // 이름
    { wch: 15 }, // 휴대폰번호
    { wch: 20 }, // 주문번호
    { wch: 15 }, // ID
    { wch: 15 }, // 닉네임
    { wch: 25 }, // 옵션정보
    { wch: 15 }, // 판매액(원)
    { wch: 15 }, // PG 결제액(원)
    { wch: 15 }, // 인앱 결제액(원)
    { wch: 15 }, // 포인트사용
    { wch: 15 }, // 베네피아포인트
    { wch: 15 }, // 상품권 사용
    { wch: 15 }, // 쿠폰할인
    { wch: 10 }, // 상태
    { wch: 20 }, // 결제일시
    { wch: 15 }, // 대기신청일
    { wch: 15 }, // 결제수단
    { wch: 15 }, // 결제요청
    { wch: 15 }, // 결제플랫폼
    { wch: 15 }, // 마케팅수신동의
    { wch: 15 }, // 예전아이디
    { wch: 12 }, // 코치
    { wch: 15 }, // 코칭진행일
    { wch: 15 }, // 코칭_신청일
    { wch: 15 }, // 코칭_만족도문자
    { wch: 15 }, // 코칭_지역
    { wch: 15 }, // 코칭_단지명
    { wch: 15 }, // 코칭_평형
    { wch: 15 }, // 코칭_매매가
    { wch: 15 }, // 코칭_전세가
    { wch: 15 }, // 코칭_투자금
    { wch: 10 }, // 코칭_O/X
    { wch: 15 }, // 코칭_상세
    { wch: 15 }, // 코칭_코칭완료여부
    { wch: 15 }, // 코칭_매수추천여부
    { wch: 15 }, // 코칭_중개추천여부
    { wch: 15 }, // 코칭_구글폼 번호
    { wch: 15 }  // 코칭_취소 및 환불
  ];
  unmatchedSheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, unmatchedSheet, '주문내역에만있는데이터');

  // 파일명 생성
  const fileName = `${year}년${month}월_투자코칭_주문내역에만있는데이터.xlsx`;
  
  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
};

/**
 * 코칭현황에만 있는 데이터를 Excel 파일로 다운로드합니다
 */
export const downloadUnmatchedParticipants = (
  unmatchedParticipants: InvestmentParticipantData[],
  year: number,
  month: number
) => {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 코칭현황에만 있는 데이터 시트 생성 (39개 컬럼 구조)
  const unmatchedSheetData = unmatchedParticipants.map((participant) => ({
    '전시상품명': '-', // 코칭현황에만 있으므로 주문 정보 없음
    '이름': participant.성함 || participant.이름 || '-',
    '휴대폰번호': participant.연락처 || participant.전화번호 || participant.휴대폰번호 || '-',
    '주문번호': '-',
    'ID': '-',
    '닉네임': participant.닉네임 || '-',
    '옵션정보': '-',
    '판매액(원)': 0,
    'PG 결제액(원)': 0,
    '인앱 결제액(원)': 0,
    '포인트사용': '-',
    '베네피아포인트': '-',
    '상품권 사용': '-',
    '쿠폰할인': '-',
    '상태': '-',
    '결제일시': '-',
    '대기신청일': '-',
    '결제수단': '-',
    '결제요청': '-',
    '결제플랫폼': '-',
    '마케팅수신동의': '-',
    '예전아이디': '-',
    '코치': participant.코치 || '-',
    '코칭진행일': participant.상담일시 || participant.시간 || '-',
    '코칭_신청일': '-',
    '코칭_만족도문자': '-',
    '코칭_지역': '-',
    '코칭_단지명': '-',
    '코칭_평형': '-',
    '코칭_매매가': '-',
    '코칭_전세가': '-',
    '코칭_투자금': '-',
    '코칭_O/X': '-',
    '코칭_상세': '-',
    '코칭_코칭완료여부': '-',
    '코칭_매수추천여부': '-',
    '코칭_중개추천여부': '-',
    '코칭_구글폼 번호': '-',
    '코칭_취소 및 환불': '-'
  }));

  const unmatchedSheet = XLSX.utils.json_to_sheet(unmatchedSheetData);
  
  // 컬럼 너비 설정 (투자코칭 결과와 동일)
  const columnWidths = [
    { wch: 20 }, // 전시상품명
    { wch: 12 }, // 이름
    { wch: 15 }, // 휴대폰번호
    { wch: 20 }, // 주문번호
    { wch: 15 }, // ID
    { wch: 15 }, // 닉네임
    { wch: 25 }, // 옵션정보
    { wch: 15 }, // 판매액(원)
    { wch: 15 }, // PG 결제액(원)
    { wch: 15 }, // 인앱 결제액(원)
    { wch: 15 }, // 포인트사용
    { wch: 15 }, // 베네피아포인트
    { wch: 15 }, // 상품권 사용
    { wch: 15 }, // 쿠폰할인
    { wch: 10 }, // 상태
    { wch: 20 }, // 결제일시
    { wch: 15 }, // 대기신청일
    { wch: 15 }, // 결제수단
    { wch: 15 }, // 결제요청
    { wch: 15 }, // 결제플랫폼
    { wch: 15 }, // 마케팅수신동의
    { wch: 15 }, // 예전아이디
    { wch: 12 }, // 코치
    { wch: 15 }, // 코칭진행일
    { wch: 15 }, // 코칭_신청일
    { wch: 15 }, // 코칭_만족도문자
    { wch: 15 }, // 코칭_지역
    { wch: 15 }, // 코칭_단지명
    { wch: 15 }, // 코칭_평형
    { wch: 15 }, // 코칭_매매가
    { wch: 15 }, // 코칭_전세가
    { wch: 15 }, // 코칭_투자금
    { wch: 10 }, // 코칭_O/X
    { wch: 15 }, // 코칭_상세
    { wch: 15 }, // 코칭_코칭완료여부
    { wch: 15 }, // 코칭_매수추천여부
    { wch: 15 }, // 코칭_중개추천여부
    { wch: 15 }, // 코칭_구글폼 번호
    { wch: 15 }  // 코칭_취소 및 환불
  ];
  unmatchedSheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, unmatchedSheet, '코칭현황에만있는데이터');

  // 파일명 생성
  const fileName = `${year}년${month}월_투자코칭_코칭현황에만있는데이터.xlsx`;
  
  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
};

/**
 * 투자코칭 결과를 Excel 파일로 다운로드합니다
 */
export const downloadInvestmentResult = (
  result: InvestmentMatchingResult,
  selectedYear: number,
  selectedMonth: number
) => {
  try {
    const yearMonth = `${selectedYear.toString().slice(-2)}${selectedMonth.toString().padStart(2, '0')}`;
    const filename = `${yearMonth}_투자코칭_결산.xlsx`;
    
    const workbook = XLSX.utils.book_new();
    
    // 매칭된 주문 데이터 시트 (매물코칭과 동일한 컬럼 순서)
    if (result.matchedOrders.length > 0) {
      const matchedSheetData = result.matchedOrders.map(order => ({
        전시상품명: order.전시상품명 || '-',
        이름: order.이름 || '-',
        휴대폰번호: order.휴대폰번호 || '-',
        주문번호: order.주문번호 || '-',
        ID: order.ID || '-',
        닉네임: order.닉네임 || '-',
        옵션정보: order.옵션정보 || '-',
        '판매액(원)': order['판매액(원)'] || 0,
        'PG 결제액(원)': order['PG 결제액(원)'] || 0,
        '인앱 결제액(원)': order['인앱 결제액(원)'] || 0,
        포인트사용: order.포인트사용 || 0,
        베네피아포인트: order.베네피아포인트 || 0,
        '상품권 사용': order['상품권 사용'] || 0,
        쿠폰할인: order.쿠폰할인 || 0,
        상태: order.상태 || '-',
        결제일시: order.결제일시 || '-',
        대기신청일: order.대기신청일 || '-',
        결제수단: order.결제수단 || '-',
        결제요청: order.결제요청 || '-',
        결제플랫폼: order.결제플랫폼 || '-',
        마케팅수신동의: order.마케팅수신동의 || '-',
        예전아이디: order.예전아이디 || '-',
        코치: order.코치 || '-', // 코치 정보
        코칭진행일: order.코칭진행일 || '-', // 코칭진행일 정보
        코칭_신청일: '-', // 투자코칭에서는 코칭_신청일 정보가 없음
        코칭_만족도문자: '-', // 투자코칭에서는 코칭_만족도문자 정보가 없음
        코칭_지역: '-', // 투자코칭에서는 코칭_지역 정보가 없음
        코칭_단지명: '-', // 투자코칭에서는 코칭_단지명 정보가 없음
        코칭_평형: '-', // 투자코칭에서는 코칭_평형 정보가 없음
        코칭_매매가: '-', // 투자코칭에서는 코칭_매매가 정보가 없음
        코칭_전세가: '-', // 투자코칭에서는 코칭_전세가 정보가 없음
        코칭_투자금: '-', // 투자코칭에서는 코칭_투자금 정보가 없음
        코칭_O_X: '-', // 투자코칭에서는 코칭_O/X 정보가 없음
        코칭_상세: '-', // 투자코칭에서는 코칭_상세 정보가 없음
        코칭_코칭완료여부: '-', // 투자코칭에서는 코칭_코칭완료여부 정보가 없음
        코칭_매수추천여부: '-', // 투자코칭에서는 코칭_매수추천여부 정보가 없음
        코칭_중개추천여부: '-', // 투자코칭에서는 코칭_중개추천여부 정보가 없음
        코칭_구글폼_번호: '-', // 투자코칭에서는 코칭_구글폼 번호 정보가 없음
        코칭_취소_및_환불: '-' // 투자코칭에서는 코칭_취소 및 환불 정보가 없음
      }));
      
      const matchedSheet = XLSX.utils.json_to_sheet(matchedSheetData);
      
      // 컬럼 너비 설정 (매물코칭과 동일)
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
        { wch: 15 }, // 코치
        { wch: 18 }, // 코칭진행일
        { wch: 18 }, // 코칭_신청일
        { wch: 15 }, // 코칭_만족도문자
        { wch: 15 }, // 코칭_지역
        { wch: 15 }, // 코칭_단지명
        { wch: 12 }, // 코칭_평형
        { wch: 12 }, // 코칭_매매가
        { wch: 12 }, // 코칭_전세가
        { wch: 12 }, // 코칭_투자금
        { wch: 12 }, // 코칭_O/X
        { wch: 20 }, // 코칭_상세
        { wch: 15 }, // 코칭_코칭완료여부
        { wch: 15 }, // 코칭_매수추천여부
        { wch: 15 }, // 코칭_중개추천여부
        { wch: 15 }, // 코칭_구글폼 번호
        { wch: 15 }  // 코칭_취소 및 환불
      ];
      matchedSheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, matchedSheet, '매칭된 주문');
    }
    
    // 매칭되지 않은 참여자 시트
    if (result.unmatchedParticipants.length > 0) {
      const unmatchedParticipantsSheet = XLSX.utils.json_to_sheet(result.unmatchedParticipants);
      XLSX.utils.book_append_sheet(workbook, unmatchedParticipantsSheet, '매칭되지 않은 참여자');
    }
    
    // 매칭되지 않은 주문 시트
    if (result.unmatchedOrders.length > 0) {
      const unmatchedOrdersSheet = XLSX.utils.json_to_sheet(result.unmatchedOrders);
      XLSX.utils.book_append_sheet(workbook, unmatchedOrdersSheet, '매칭되지 않은 주문');
    }
    
    // 파일 다운로드
    XLSX.writeFile(workbook, filename);
    
    console.log('투자코칭 결과 다운로드 완료:', filename);
  } catch (error) {
    console.error('다운로드 오류:', error);
    throw new Error(`다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};
