import React from 'react';
import { Users, AlertTriangle, Download } from 'lucide-react';
import { ComparisonItem } from '../types';

interface DuplicateAnalysisProps {
  duplicateCases: ComparisonItem[];
  onDownloadDuplicates?: () => void;
}

const DuplicateAnalysis: React.FC<DuplicateAnalysisProps> = ({ 
  duplicateCases, 
  onDownloadDuplicates 
}) => {
  // 중복 건을 이름별로 그룹화
  const groupedDuplicates = React.useMemo(() => {
    const groups: { [key: string]: ComparisonItem[] } = {};
    
    duplicateCases.forEach(item => {
      const name = item.orderData?.이름 || item.coachingData?.이름 || '이름 없음';
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(item);
    });
    
    return groups;
  }, [duplicateCases]);

  // 고유한 중복 인원 수 계산
  const uniqueDuplicatePersons = Object.keys(groupedDuplicates).length;
  
  // 총 중복 건 수
  const totalDuplicateCases = duplicateCases.length;

  // 날짜 변환 함수
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

  // 숫자 포맷팅 함수
  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 헤더 */}
      <div className="bg-purple-50 border-b border-purple-200 rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-purple-900">
                중복 건 상세 분석
              </h3>
              <p className="text-sm text-purple-700">
                2번 이상 코칭을 진행했으나, 결제는 1건만 있는 경우
              </p>
            </div>
          </div>
          {onDownloadDuplicates && (
            <button
              onClick={onDownloadDuplicates}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              중복 건 다운로드
            </button>
          )}
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{uniqueDuplicatePersons}명</p>
                <p className="text-sm text-purple-700">중복 코칭 받은 인원</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{totalDuplicateCases}건</p>
                <p className="text-sm text-orange-700">총 중복 코칭 건수</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 리스트 - 테이블 형태 */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          중복 코칭 상세 내역
        </h4>
        
        {duplicateCases.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">중복 건이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    휴대폰번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    닉네임
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    옵션정보
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매액(원)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결제일시
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코치
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코칭진행일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    진행여부
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {duplicateCases.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.orderData?.이름 || item.coachingData?.이름 || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.orderData?.휴대폰번호 || item.coachingData?.번호 || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.orderData?.닉네임 || item.coachingData?.닉네임 || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {item.orderData?.옵션정보 || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.orderData?.['판매액(원)']).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(item.orderData?.결제일시)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.coachingData?.코치 || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(item.coachingData?.코칭진행일)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.orderData?.주문번호 || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.coachingData?.['진행여부 / 비고'] || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateAnalysis;
