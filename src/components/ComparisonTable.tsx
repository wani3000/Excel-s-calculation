import React, { useState, useMemo } from 'react';
import { Download, AlertTriangle, UserX, FileSpreadsheet, XCircle } from 'lucide-react';
import { ComparisonItem, ComparisonStats, TocoNaeCoData } from '../types';
import { createTocoNaeCoData } from '../utils/comparison';
import TocoNaeCoTable from './TocoNaeCoTable';
import DuplicateAnalysis from './DuplicateAnalysis';

// 불일치 데이터 테이블 컴포넌트
const MismatchedDataTable: React.FC<{
  items: ComparisonItem[];
  stats: ComparisonStats;
  onDownload: () => void;
  onDownloadSettlement?: () => void;
  onDownloadSuspectedMatches?: () => void;
  coachingType?: 'property' | 'investment';
}> = ({ items, onDownload, onDownloadSettlement, onDownloadSuspectedMatches, coachingType }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'onlyInCoachingDB' | 'onlyInOrderHistory' | 'suspectedMatches'>('all');

  // 먼저 기본 필터링 (이름이 있는 행만)
  const baseValidOnlyInAItems = items.filter(item => 
    item.result === 'onlyInA' && 
    item.orderData?.이름 && 
    String(item.orderData.이름).trim() !== ''
  );
  
  const baseValidOnlyInBItems = items.filter(item => 
    item.result === 'onlyInB' && 
    item.coachingData?.이름 && 
    String(item.coachingData.이름).trim() !== '' &&
    // 취소/환불 데이터 제외
    (() => {
      const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
      return cancelRefundStatus !== '취소' && cancelRefundStatus !== '환불';
    })()
  );

  // 불일치 데이터 상세 분석
  const detailedMismatchAnalysis = useMemo(() => {
    // 3. 먼저 매물코칭DB와 주문내역이 같다고 추측되는 사람 찾기 (이름,닉네임,전화번호 중 하나라도 일치)
    const suspectedMatchKeys = new Set<string>();
    const suspectedMatchPairs: { orderItem: ComparisonItem, coachingItem: ComparisonItem, matchType: string }[] = [];
    const usedCoachingKeys = new Set<string>(); // 이미 매칭된 코칭 항목 추적
    
    baseValidOnlyInAItems.forEach(orderItem => {
      const order = orderItem.orderData!;
      const orderName = (order.이름 || '').trim();
      const orderPhone = (order.휴대폰번호 || '').trim();
      const orderNickname = (order.닉네임 || '').trim();
      
      let matchType = '';
      let matchKey = '';
      
      // 전화번호가 일치하는지 확인 (우선순위 1)
      if (orderPhone) {
        const phoneMatch = baseValidOnlyInBItems.find(coachingItem => {
          const coachingPhone = (coachingItem.coachingData?.번호 || '').trim();
          return coachingPhone && coachingPhone === orderPhone && !usedCoachingKeys.has(coachingItem.key);
        });
        if (phoneMatch) {
          matchType = '전화번호';
          matchKey = `phone_${orderPhone}`;
          if (!suspectedMatchKeys.has(matchKey)) {
            suspectedMatchKeys.add(matchKey);
            usedCoachingKeys.add(phoneMatch.key);
            suspectedMatchPairs.push({ orderItem, coachingItem: phoneMatch, matchType });
          }
          return;
        }
      }
      
      // 전화번호가 일치하지 않으면 닉네임 확인 (우선순위 2)
      if (orderNickname) {
        const nicknameMatch = baseValidOnlyInBItems.find(coachingItem => {
          const coachingNickname = (coachingItem.coachingData?.닉네임 || '').trim();
          return coachingNickname && coachingNickname === orderNickname && !usedCoachingKeys.has(coachingItem.key);
        });
        if (nicknameMatch) {
          matchType = '닉네임';
          matchKey = `nickname_${orderNickname}`;
          if (!suspectedMatchKeys.has(matchKey)) {
            suspectedMatchKeys.add(matchKey);
            usedCoachingKeys.add(nicknameMatch.key);
            suspectedMatchPairs.push({ orderItem, coachingItem: nicknameMatch, matchType });
          }
          return;
        }
      }
      
      // 전화번호, 닉네임이 일치하지 않으면 이름 확인 (우선순위 3)
      if (orderName) {
        const nameMatch = baseValidOnlyInBItems.find(coachingItem => {
          const coachingName = (coachingItem.coachingData?.이름 || '').trim();
          return coachingName && coachingName === orderName && !usedCoachingKeys.has(coachingItem.key);
        });
        if (nameMatch) {
          matchType = '이름';
          matchKey = `name_${orderName}`;
          if (!suspectedMatchKeys.has(matchKey)) {
            suspectedMatchKeys.add(matchKey);
            usedCoachingKeys.add(nameMatch.key);
            suspectedMatchPairs.push({ orderItem, coachingItem: nameMatch, matchType });
          }
        }
      }
    });
    
    const suspectedMatches = suspectedMatchPairs;

    // 추측 매칭된 항목들의 키 수집
    const suspectedOrderKeys = new Set(suspectedMatchPairs.map(pair => pair.orderItem.key));
    const suspectedCoachingKeys = new Set(suspectedMatchPairs.map(pair => pair.coachingItem.key));

    // 1. 추측 매칭을 제외한 매물코칭DB에만 있는 사람
    const validOnlyInBItems = baseValidOnlyInBItems.filter(item => 
      !suspectedCoachingKeys.has(item.key)
    );

    // 2. 추측 매칭을 제외한 주문내역에만 있는 사람  
    const validOnlyInAItems = baseValidOnlyInAItems.filter(item => 
      !suspectedOrderKeys.has(item.key)
    );

    // 4. 중복 건 찾기 (매물코칭 DB에는 2번 이상 있지만 주문내역에는 1건만 있는 경우)
    const duplicateItems = items.filter(item => item.result === 'duplicate');

    return {
      onlyInCoachingDB: validOnlyInBItems.length,
      onlyInOrderHistory: validOnlyInAItems.length,
      suspectedMatches: suspectedMatches.length,
      duplicates: duplicateItems.length,
      onlyInCoachingDBItems: validOnlyInBItems,
      onlyInOrderHistoryItems: validOnlyInAItems,
      suspectedMatchItems: suspectedMatchPairs,
      duplicateItems: duplicateItems
    };
  }, [baseValidOnlyInAItems, baseValidOnlyInBItems, items]);

  // 전체 불일치 데이터 (추측 매칭 제외, 중복 건 제외)
  const allMismatchedItems = [
    ...detailedMismatchAnalysis.onlyInCoachingDBItems, 
    ...detailedMismatchAnalysis.onlyInOrderHistoryItems
  ];

  // 선택된 카테고리에 따른 필터링된 데이터
  const filteredMismatchedItems = useMemo(() => {
    switch (selectedCategory) {
      case 'onlyInCoachingDB':
        return detailedMismatchAnalysis.onlyInCoachingDBItems;
      case 'onlyInOrderHistory':
        return detailedMismatchAnalysis.onlyInOrderHistoryItems;
      case 'suspectedMatches':
        // 매칭된 쌍을 개별 항목으로 변환
        const suspectedItems: ComparisonItem[] = [];
        detailedMismatchAnalysis.suspectedMatchItems.forEach((pair: any) => {
          suspectedItems.push(pair.orderItem);
          suspectedItems.push(pair.coachingItem);
        });
        return suspectedItems;
      case 'all':
      default:
        return allMismatchedItems;
    }
  }, [selectedCategory, detailedMismatchAnalysis, allMismatchedItems]);

  // 불일치 데이터를 그룹화 (휴대폰번호, 닉네임, 이름 기준)
  const groupedMismatchedItems = useMemo(() => {
    const groups: { [key: string]: ComparisonItem[] } = {};
    
    filteredMismatchedItems.forEach(item => {
      const order = item.orderData;
      const coaching = item.coachingData;
      
      // 각 항목에서 휴대폰번호, 닉네임, 이름 추출
      const phone = (order?.휴대폰번호 || coaching?.번호 || '').trim();
      const nickname = (order?.닉네임 || coaching?.닉네임 || '').trim();
      const name = (order?.이름 || coaching?.이름 || '').trim();
      
      // 그룹 키 결정 (우선순위: 휴대폰번호 > 닉네임 > 이름)
      let groupKey = '';
      
      if (phone) {
        // 휴대폰번호가 있으면 휴대폰번호로 그룹화
        groupKey = `phone_${phone}`;
      } else if (nickname) {
        // 휴대폰번호가 없고 닉네임이 있으면 닉네임으로 그룹화
        groupKey = `nickname_${nickname}`;
      } else if (name) {
        // 휴대폰번호와 닉네임이 없고 이름이 있으면 이름으로 그룹화
        groupKey = `name_${name}`;
      } else {
        // 식별 정보가 없는 경우
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
        // 주문내역 데이터가 있는 것을 먼저 정렬
        if (a.result === 'onlyInA' && b.result === 'onlyInB') return -1;
        if (a.result === 'onlyInB' && b.result === 'onlyInA') return 1;
        
        // 같은 타입 내에서는 이름 순으로 정렬
        const aName = (a.orderData?.이름 || a.coachingData?.이름 || '').trim();
        const bName = (b.orderData?.이름 || b.coachingData?.이름 || '').trim();
        return aName.localeCompare(bName);
      });
    });
    
    // 그룹 키로 정렬하여 일관된 순서 보장
    const sortedGroupKeys = Object.keys(groups).sort();
    const result = sortedGroupKeys.map(key => groups[key]);
    
    // 디버깅: 그룹화 정보 출력
    console.log('불일치 데이터 그룹화 결과:');
    sortedGroupKeys.forEach((key, index) => {
      console.log(`그룹 ${index + 1}: ${key} (${groups[key].length}개 항목)`);
      groups[key].forEach((item, itemIndex) => {
        const order = item.orderData;
        const coaching = item.coachingData;
        const phone = (order?.휴대폰번호 || coaching?.번호 || '').trim();
        const nickname = (order?.닉네임 || coaching?.닉네임 || '').trim();
        const name = (order?.이름 || coaching?.이름 || '').trim();
        console.log(`  - 항목 ${itemIndex + 1}: ${item.result}, 이름: ${name}, 닉네임: ${nickname}, 폰: ${phone}`);
      });
    });
    
    return result;
  }, [filteredMismatchedItems]);

  const coachingTypeLabel = coachingType === 'property' ? '매물코칭' : coachingType === 'investment' ? '투자코칭' : '코칭';

  // 빈 값 표시 함수
  const renderCellValue = (value: any, isEmpty: boolean = false) => {
    if (isEmpty || !value || String(value).trim() === '') {
      return <span className="text-gray-400">-</span>;
    }
    return <span className="text-gray-900">{value}</span>;
  };

  // 닉네임 표시 함수 (10자 제한)
  const renderNickname = (value: any, isEmpty: boolean = false) => {
    if (isEmpty || !value || String(value).trim() === '') {
      return <span className="text-gray-400">-</span>;
    }
    const nickname = String(value).trim();
    if (nickname.length > 10) {
      // 10자마다 줄바꿈 추가
      const chunks = [];
      for (let i = 0; i < nickname.length; i += 10) {
        chunks.push(nickname.slice(i, i + 10));
      }
      return (
        <span className="text-gray-900">
          {chunks.map((chunk, index) => (
            <span key={index}>
              {chunk}
              {index < chunks.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }
    return <span className="text-gray-900">{nickname}</span>;
  };

  // 날짜 변환 함수 (YYYY.MM.DD 형식)
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
      
      // YYYY.MM.DD 형식으로 변환
      return date.toISOString().slice(0, 10).replace(/-/g, '.');
    }
    
    // 문자열 날짜 처리
    const dateStr = String(value).trim();
    if (dateStr === '') return '';
    
    // 날짜 시간 형식인 경우 (YYYY-MM-DD HH:MM:SS) - 시간 제거
    if (dateStr.match(/^\d{4}[.-]\d{1,2}[.-]\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)) {
      const dateOnly = dateStr.split(' ')[0];
      return dateOnly.replace(/-/g, '.');
    }
    
    // 날짜만 있는 경우 (YYYY-MM-DD 또는 YYYY.MM.DD)
    if (dateStr.match(/^\d{4}[.-]\d{1,2}[.-]\d{1,2}$/)) {
      return dateStr.replace(/-/g, '.');
    }
    
    return dateStr;
  };

  // 날짜 표시 함수
  const renderDateValue = (value: any, isEmpty: boolean = false) => {
    if (isEmpty || !value || String(value).trim() === '') {
      return <span className="text-gray-400">-</span>;
    }
    const formattedDate = formatDateTime(value);
    return <span className="text-gray-900">{formattedDate}</span>;
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-black mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-gray-600" />
          불일치 데이터 상세 분석 ({allMismatchedItems.length}건)
        </h3>
        
        {/* 상세 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedCategory === 'all' 
              ? 'bg-gray-100 border-gray-400' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="flex items-center justify-between" onClick={() => setSelectedCategory('all')}>
              <div>
                <p className="text-sm font-medium text-gray-700">전체</p>
                <p className="text-2xl font-bold text-black">{allMismatchedItems.length}건</p>
                <p className="text-xs text-gray-600">모든 불일치 데이터</p>
              </div>
              <button
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-gray-700 text-white'
                    : 'bg-black text-white hover:bg-gray-700'
                }`}
              >
                상세보기
              </button>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedCategory === 'onlyInCoachingDB' 
              ? 'bg-gray-100 border-gray-400' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="flex items-center justify-between" onClick={() => setSelectedCategory('onlyInCoachingDB')}>
              <div>
                <p className="text-sm font-medium text-gray-700">매물코칭DB에만 있는 사람</p>
                <p className="text-2xl font-bold text-black">{detailedMismatchAnalysis.onlyInCoachingDB}건</p>
                <p className="text-xs text-gray-600">완전히 일치하지 않는</p>
              </div>
              <button
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedCategory === 'onlyInCoachingDB'
                    ? 'bg-gray-700 text-white'
                    : 'bg-black text-white hover:bg-gray-700'
                }`}
              >
                상세보기
              </button>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedCategory === 'onlyInOrderHistory' 
              ? 'bg-gray-100 border-gray-400' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="flex items-center justify-between" onClick={() => setSelectedCategory('onlyInOrderHistory')}>
              <div>
                <p className="text-sm font-medium text-gray-700">주문내역에만 있는 사람</p>
                <p className="text-2xl font-bold text-black">{detailedMismatchAnalysis.onlyInOrderHistory}건</p>
                <p className="text-xs text-gray-600">완전히 일치하지 않는</p>
              </div>
              <button
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedCategory === 'onlyInOrderHistory'
                    ? 'bg-gray-700 text-white'
                    : 'bg-black text-white hover:bg-gray-700'
                }`}
              >
                상세보기
              </button>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedCategory === 'suspectedMatches' 
              ? 'bg-gray-100 border-gray-400' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="flex items-center justify-between" onClick={() => setSelectedCategory('suspectedMatches')}>
              <div>
                <p className="text-sm font-medium text-gray-700">같다고 추측되는 사람</p>
                <p className="text-2xl font-bold text-black">{detailedMismatchAnalysis.suspectedMatches}명</p>
                <p className="text-xs text-gray-600">이름/닉네임/전화번호 일치</p>
              </div>
              <button
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedCategory === 'suspectedMatches'
                    ? 'bg-gray-700 text-white'
                    : 'bg-black text-white hover:bg-gray-700'
                }`}
              >
                상세보기
              </button>
            </div>
          </div>
        </div>
        
        {/* 기존 요약 정보 */}
        <p className="text-sm text-gray-600">
          결제했지만 {coachingTypeLabel} DB 없음: {detailedMismatchAnalysis.onlyInOrderHistory}건, 
          {coachingTypeLabel} 신청했지만 결제 없음: {detailedMismatchAnalysis.onlyInCoachingDB}건
        </p>
      </div>

      {/* 다운로드 버튼 */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={onDownload}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          {coachingType === 'property' ? '매물코칭 불일치 다운로드' : 
           coachingType === 'investment' ? '투자코칭 불일치 다운로드' : 
           '불일치 데이터 다운로드'}
        </button>
        {onDownloadSettlement && (
          <button
            onClick={onDownloadSettlement}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            결산 스타일로 다운로드
          </button>
        )}
      </div>

      {/* 선택된 카테고리 정보 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">
              현재 표시 중: {
                selectedCategory === 'all' && '전체 불일치 데이터'
                || selectedCategory === 'onlyInCoachingDB' && '매물코칭DB에만 있는 사람'
                || selectedCategory === 'onlyInOrderHistory' && '주문내역에만 있는 사람'
                || selectedCategory === 'suspectedMatches' && '같다고 추측되는 사람'
              } ({groupedMismatchedItems.length}건)
            </h4>
            
            {selectedCategory === 'suspectedMatches' && onDownloadSuspectedMatches && (
              <button
                onClick={onDownloadSuspectedMatches}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                동일인을 결산 스타일로 다운로드
              </button>
            )}
          </div>
        </div>

      {/* 그룹화된 테이블 */}
      {groupedMismatchedItems.length === 0 ? (
        <p className="text-gray-500 text-center py-8">선택된 카테고리에 데이터가 없습니다.</p>
      ) : selectedCategory === 'suspectedMatches' ? (
        /* 매칭된 쌍을 보여주는 특별한 테이블 */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1660px]">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[60px]">No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[100px]">매칭 기준</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">주문내역 이름</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">매물코칭 이름</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">주문내역 휴대폰번호</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">매물코칭 휴대폰번호</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">주문내역 닉네임</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">매물코칭 닉네임</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[180px]">옵션정보</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[100px]">판매액</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">결제일시</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[100px]">코치</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">코칭진행일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detailedMismatchAnalysis.suspectedMatchItems.map((pair: any, index: number) => (
                <React.Fragment key={index}>
                  {/* 매칭 정보 행 */}
                  <tr className="bg-yellow-50 border-b-2 border-yellow-200">
                    <td className="px-4 py-3 text-sm font-medium text-yellow-800 whitespace-nowrap" colSpan={13}>
                      🔗 {pair.matchType} 일치 - 매칭 쌍 {index + 1}
                    </td>
                  </tr>
                  {/* 주문내역 행 */}
                  <tr className="bg-blue-50 hover:bg-blue-100">
                    <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[60px] text-center font-medium text-gray-600">
                      {index * 2 + 1}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-blue-600 font-medium">주문내역</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.orderItem.orderData?.이름)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.orderItem.orderData?.휴대폰번호)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderNickname(pair.orderItem.orderData?.닉네임)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.orderItem.orderData?.옵션정보)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.orderItem.orderData?.['판매액(원)'])}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderDateValue(pair.orderItem.orderData?.결제일시)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                  </tr>
                  {/* 매물코칭DB 행 */}
                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[60px] text-center font-medium text-gray-600">
                      {index * 2 + 2}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-green-600 font-medium">매물코칭DB</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.coachingItem.coachingData?.이름)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.coachingItem.coachingData?.번호)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderNickname(pair.coachingItem.coachingData?.닉네임)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-400">-</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderCellValue(pair.coachingItem.coachingData?.코치)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderDateValue(pair.coachingItem.coachingData?.코칭진행일)}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 일반 불일치 데이터 테이블 */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1560px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[60px]">No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[80px]">구분</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">주문내역 이름</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">매물코칭 이름</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">주문내역 휴대폰번호</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">매물코칭 휴대폰번호</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">주문내역 닉네임</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[180px]">매물코칭 닉네임</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[180px]">옵션정보</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">판매액</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">결제일시</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">코치</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">코칭진행일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                let rowNumber = 1;
                return groupedMismatchedItems.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {group.map((item, itemIndex) => {
                      const currentRowNumber = rowNumber++;
                      return (
                        <tr 
                          key={`${groupIndex}-${itemIndex}`} 
                          className={`hover:bg-gray-50 ${
                            itemIndex === 0 ? 'border-t-4 border-blue-400 bg-blue-25' : ''
                          } ${
                            itemIndex === group.length - 1 ? 'border-b-2 border-gray-300' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[60px] text-center font-medium text-gray-600">
                            {currentRowNumber}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[80px]">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.result === 'onlyInA' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.result === 'onlyInA' ? '주문내역' : '매물코칭DB'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[120px]">
                        {renderCellValue(item.orderData?.이름, item.result === 'onlyInB')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[120px]">
                        {renderCellValue(item.coachingData?.이름, item.result === 'onlyInA')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[150px]">
                        {renderCellValue(item.orderData?.휴대폰번호, item.result === 'onlyInB')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[150px]">
                        {renderCellValue(item.coachingData?.번호, item.result === 'onlyInA')}
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[120px] max-w-[120px] break-words">
                        {renderNickname(item.orderData?.닉네임, item.result === 'onlyInB')}
                      </td>
                      <td className="px-4 py-3 text-sm min-w-[180px] max-w-[180px] break-words">
                        {renderNickname(item.coachingData?.닉네임, item.result === 'onlyInA')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[180px]">
                        {renderCellValue(item.orderData?.옵션정보, item.result === 'onlyInB')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[120px]">
                        {renderCellValue(item.orderData?.['판매액(원)'], item.result === 'onlyInB')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[150px]">
                        {renderDateValue(item.orderData?.결제일시, item.result === 'onlyInB')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[120px]">
                        {renderCellValue(item.coachingData?.코치, item.result === 'onlyInA')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap min-w-[150px]">
                        {renderDateValue(item.coachingData?.코칭진행일, item.result === 'onlyInA')}
                      </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface ComparisonTableProps {
  items: ComparisonItem[];
  onDownloadMatched: () => void;
  onDownloadMismatched: () => void;
  onDownloadSettlement?: () => void;
  onDownloadSuspectedMatches?: () => void;
  onDownloadDuplicates?: () => void;
  duplicateCases?: ComparisonItem[];
  coachingType?: 'property' | 'investment';
}

type TabType = 'tocoNaeCo' | 'mismatched' | 'cancelled' | 'duplicates';

const ComparisonTable: React.FC<ComparisonTableProps> = ({ items, onDownloadMatched, onDownloadMismatched, onDownloadSettlement, onDownloadSuspectedMatches, onDownloadDuplicates, duplicateCases = [], coachingType }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tocoNaeCo');
  // 필터 상태는 현재 사용하지 않음

  // 취소 및 환불 데이터 필터링
  const cancelledAndRefundedItems = useMemo(() => {
    return items.filter(item => {
      if (item.coachingData) {
        const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
        return cancelRefundStatus === '취소' || cancelRefundStatus === '환불';
      }
      return false;
    });
  }, [items]);

  // 취소 및 환불 데이터를 제외한 유효한 데이터만 계산
  const validItems = useMemo(() => {
    return items.filter(item => {
      // 취소 및 환불 데이터 제외
      if (item.coachingData) {
        const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
        if (cancelRefundStatus === '취소' || cancelRefundStatus === '환불') {
          return false;
        }
      }
      return true;
    });
  }, [items]);

  const stats: ComparisonStats = useMemo(() => {
    // 취소 및 환불 데이터를 제외한 유효한 데이터만 계산
    const validOnlyInA = validItems.filter(item => 
      item.result === 'onlyInA' && 
      item.orderData?.이름 && 
      String(item.orderData.이름).trim() !== ''
    ).length;
    
    const validOnlyInB = validItems.filter(item => 
      item.result === 'onlyInB' && 
      item.coachingData?.이름 && 
      String(item.coachingData.이름).trim() !== ''
    ).length;

    const validMatched = validItems.filter(item => 
      item.result === 'matched' && 
      item.orderData?.이름 && 
      String(item.orderData.이름).trim() !== '' &&
      item.coachingData?.이름 && 
      String(item.coachingData.이름).trim() !== ''
    ).length;

    // 취소 및 환불 건수 계산
    const cancelledCount = cancelledAndRefundedItems.length;
    
    // 전체 코칭 신청 건수 (취소 포함)
    const totalCoachingCount = validOnlyInB + validMatched + cancelledCount;
    
    // 취소 제외한 실제 코칭 신청 건수
    const coachingTotalWithoutCancelled = validOnlyInB + validMatched;

    return {
      total: validOnlyInA + validOnlyInB + validMatched,
      matched: validMatched,
      onlyInA: validOnlyInA,
      onlyInB: validOnlyInB,
      orderTotal: 0,
      coachingTotal: totalCoachingCount,
      coachingTotalWithoutCancelled: coachingTotalWithoutCancelled,
      cancelledCount: cancelledCount
    };
  }, [items]);
    
    // 매칭된 데이터만 필터링 (빈 행 제외, 취소 및 환불 데이터 제외)
    const validMatchedItems = useMemo(() => 
      validItems.filter(item => 
        item.result === 'matched' && 
        item.orderData?.이름 && 
        String(item.orderData.이름).trim() !== '' &&
        item.coachingData?.이름 && 
        String(item.coachingData.이름).trim() !== ''
      ), [validItems]
    );
    
    const tocoNaeCoData: TocoNaeCoData[] = useMemo(() => createTocoNaeCoData(validMatchedItems), [validMatchedItems]);

  // 필터링 기능은 현재 사용하지 않음

  // 정렬 기능은 현재 사용하지 않음

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">비교할 데이터가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">파일을 업로드하고 비교를 실행해주세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* 헤더 - 통계 및 탭 */}
      <div className="p-6 border-b border-gray-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">비교 결과</h2>
          <p className="text-sm text-gray-600 mt-1">
            총 {stats.total}건 (일치: {stats.matched}건, 누락: {stats.onlyInA}건, 결제안함: {stats.onlyInB}건)
          </p>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tocoNaeCo')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tocoNaeCo'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {coachingType === 'property' ? '[매물코칭 결산]' : coachingType === 'investment' ? '[투자코칭 결산]' : '[결산]'} ({stats.matched})
          </button>
          <button
            onClick={() => setActiveTab('mismatched')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mismatched'
                ? 'bg-white text-orange-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserX className="w-4 h-4 mr-2" />
            불일치 데이터 ({stats.onlyInA + stats.onlyInB})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cancelled'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <XCircle className="w-4 h-4 mr-2" />
            취소 및 환불 ({cancelledAndRefundedItems.length})
          </button>
          {duplicateCases.length > 0 && (
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'duplicates'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              중복 건 ({duplicateCases.length})
            </button>
          )}
        </div>
      </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === 'tocoNaeCo' ? (
            <TocoNaeCoTable
              data={tocoNaeCoData}
              onDownload={onDownloadMatched}
              coachingType={coachingType}
            />
          ) : activeTab === 'mismatched' ? (
            <MismatchedDataTable 
              items={validItems} 
              stats={stats}
              onDownload={onDownloadMismatched}
              onDownloadSettlement={onDownloadSettlement}
              onDownloadSuspectedMatches={onDownloadSuspectedMatches}
              coachingType={coachingType}
            />
          ) : activeTab === 'duplicates' ? (
            <DuplicateAnalysis 
              duplicateCases={duplicateCases}
              onDownloadDuplicates={onDownloadDuplicates}
            />
          ) : (
            /* 취소 및 환불 탭 */
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black flex items-center">
                    <XCircle className="w-5 h-5 mr-2 text-red-600" />
                    취소 및 환불 데이터 ({cancelledAndRefundedItems.length}건)
                  </h3>
                </div>
                
                {cancelledAndRefundedItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[60px]">No</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">이름</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[150px]">휴대폰번호</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">닉네임</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">취소 및 환불</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">코치</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[120px]">코칭진행일</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cancelledAndRefundedItems.map((item, index) => {
                          const coaching = item.coachingData;
                          if (!coaching) return null;
                          
                          return (
                            <tr key={`cancelled-${index}`} className="hover:bg-red-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{coaching.이름 || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{coaching.휴대폰번호 || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{coaching.닉네임 || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {coaching['취소 및 환불'] || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{coaching.코치 || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{coaching.코칭진행일 || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">취소 및 환불 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ComparisonTable;
