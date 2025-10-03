import React, { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, User, CreditCard, Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { TocoNaeCoData } from '../types';

interface TocoNaeCoTableProps {
  data: TocoNaeCoData[];
  onDownload: () => void;
  coachingType?: 'property' | 'investment';
}

const TocoNaeCoTable: React.FC<TocoNaeCoTableProps> = ({ data, onDownload, coachingType }) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAllColumns, setShowAllColumns] = useState(false);

  // 주요 컬럼 정의 (웹 표시 순서)
  const primaryColumns = [
    '이름', '휴대폰번호', '닉네임', '옵션정보', '판매액(원)', '결제일시', '코치', '코칭진행일'
  ];

  // 표시할 컬럼 결정
  const displayColumns = useMemo(() => {
    if (data.length === 0) return [];
    
    const allColumns = Object.keys(data[0]);
    return showAllColumns ? allColumns : primaryColumns.filter(col => allColumns.includes(col));
  }, [data, showAllColumns]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];
      
      // 숫자 필드 처리
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // 문자열 처리
      aValue = String(aValue || '');
      bValue = String(bValue || '');
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const formatCurrency = (value: any): string => {
    if (typeof value === 'number') {
      return `₩${value.toLocaleString()}`;
    }
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return `₩${Number(value).toLocaleString()}`;
    }
    return value || '-';
  };

  const getColumnIcon = (column: string) => {
    switch (column) {
      case '이름':
      case '닉네임':
        return <User className="w-4 h-4" />;
      case '주문번호':
      case '판매액원':
      case 'PG결제액원':
        return <CreditCard className="w-4 h-4" />;
      case '결제일시':
      case '대기신청일':
      case '코칭신청일':
        return <Calendar className="w-4 h-4" />;
      case '코칭일정':
      case '담당코치':
      case '코치':
        return <MapPin className="w-4 h-4" />;
      case '코칭진행일':
        return <Calendar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">통합 데이터가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">매칭된 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              매칭 결과 ({data.length}건)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              결제 정보와 코칭 정보가 통합된 최종 데이터입니다.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAllColumns(!showAllColumns)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAllColumns 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showAllColumns ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showAllColumns ? '주요 컬럼만' : '전체 컬럼'}
            </button>
            <button
              onClick={() => {
                try {
                  console.log(`${coachingType === 'property' ? '매물코칭' : coachingType === 'investment' ? '투자코칭' : '투코내코'} 다운로드 버튼 클릭`);
                  onDownload();
                } catch (error) {
                  console.error('다운로드 버튼 오류:', error);
                  alert('다운로드 중 오류가 발생했습니다.');
                }
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {coachingType === 'property' ? '결산 스타일로 다운로드' : 
               coachingType === 'investment' ? '투자코칭 다운로드' : 
               '매칭 데이터 다운로드'}
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-blue-50">
            <tr>
              {displayColumns.map((column) => (
                <th 
                  key={column}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 whitespace-nowrap min-w-[120px]"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {getColumnIcon(column)}
                    <span className="ml-1">{column}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr key={`${item.주문번호 || item.이름}-${index}`} className="hover:bg-blue-50">
                {displayColumns.map((column) => {
                  const value = item[column];
                  
                  // 특별한 포맷팅이 필요한 컬럼들
                  if (['판매액원', 'PG결제액원', '인앱결제액원', '포인트사용', '베네피아포인트', '상품권사용', '쿠폰할인'].includes(column)) {
                    return (
                      <td key={column} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right min-w-[120px]">
                        {formatCurrency(value)}
                      </td>
                    );
                  }
                  
                  // 상태 컬럼
                  if (column === '상태') {
                    return (
                      <td key={column} className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {value || '결제완료'}
                        </span>
                      </td>
                    );
                  }
                  
                  // 담당코치 컬럼
                  if (column === '담당코치') {
                    return (
                      <td key={column} className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {value || '미지정'}
                        </span>
                      </td>
                    );
                  }
                  
                  // 코치 컬럼
                  if (column === '코치') {
                    return (
                      <td key={column} className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {value || '미지정'}
                        </span>
                      </td>
                    );
                  }
                  
                  // 기본 컬럼
                  return (
                    <td key={column} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">
                      {value || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 통계 정보 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            총 {data.length}건의 통합 데이터
          </div>
          <div className="flex items-center space-x-4">
            <span>총 판매액: {formatCurrency(data.reduce((sum, item) => sum + (Number(item['판매액(원)']) || 0), 0))}</span>
            <span>총 PG결제액: {formatCurrency(data.reduce((sum, item) => sum + (Number(item['PG 결제액(원)']) || 0), 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TocoNaeCoTable;
