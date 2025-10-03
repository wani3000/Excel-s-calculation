import React, { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, User, CreditCard, Calendar, MapPin } from 'lucide-react';
import { UnifiedMatchData } from '../types';

interface UnifiedMatchTableProps {
  data: UnifiedMatchData[];
  onDownload: () => void;
}

const UnifiedMatchTable: React.FC<UnifiedMatchTableProps> = ({ data, onDownload }) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      if (sortColumn === 'name') {
        aValue = a.이름;
        bValue = b.이름;
      } else if (sortColumn === 'nickname') {
        aValue = a.닉네임;
        bValue = b.닉네임;
      } else if (sortColumn === 'orderNumber') {
        aValue = a.주문번호 || '';
        bValue = b.주문번호 || '';
      } else if (sortColumn === 'coach') {
        aValue = a.코치 || '';
        bValue = b.코치 || '';
      } else if (sortColumn === 'amount') {
        aValue = a.결제금액 || '';
        bValue = b.결제금액 || '';
      } else if (sortColumn === 'paymentDate') {
        aValue = a.결제일 || '';
        bValue = b.결제일 || '';
      } else if (sortColumn === 'coachingDate') {
        aValue = a.코칭일정 || '';
        bValue = b.코칭일정 || '';
      }
      
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

  const toggleDetails = (key: string) => {
    setShowDetails(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">일치하는 데이터가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">이름과 닉네임이 일치하는 데이터가 없습니다.</p>
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
              <User className="w-5 h-5 mr-2 text-green-600" />
              매칭된 코칭 정보 ({data.length}건)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              결제 정보와 코칭 정보가 일치하는 데이터입니다.
            </p>
          </div>
          <button
            onClick={onDownload}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel 다운로드
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기본 정보
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100"
                onClick={() => handleSort('orderNumber')}
              >
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  주문번호
                  {getSortIcon('orderNumber')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100"
                onClick={() => handleSort('coach')}
              >
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  담당 코치
                  {getSortIcon('coach')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  결제금액
                  {getSortIcon('amount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100"
                onClick={() => handleSort('paymentDate')}
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  결제일
                  {getSortIcon('paymentDate')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100"
                onClick={() => handleSort('coachingDate')}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  코칭일정
                  {getSortIcon('coachingDate')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상세정보
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <React.Fragment key={`${item.key}-${index}`}>
                <tr className="hover:bg-green-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{item.이름}</div>
                      <div className="text-sm text-gray-500">@{item.닉네임}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        📱 {item.휴대폰번호 || item.번호 || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.주문번호 || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.코치 || '미지정'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.결제금액 ? `₩${Number(item.결제금액).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.결제일 || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.코칭일정 || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => toggleDetails(item.key)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showDetails[item.key] ? '접기' : '펼치기'}
                    </button>
                  </td>
                </tr>
                
                {/* 상세 정보 행 */}
                {showDetails[item.key] && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 주문 정보 */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <CreditCard className="w-4 h-4 mr-1" />
                            주문 정보
                          </h4>
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">주문번호:</span> {item.주문번호 || '-'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">결제금액:</span> {item.결제금액 || '-'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">결제일:</span> {item.결제일 || '-'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">신청일:</span> {item.신청일 || '-'}
                            </div>
                            {Object.entries(item.기타주문정보 || {}).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium text-gray-600">{key}:</span> {value || '-'}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* 코칭 정보 */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            코칭 정보
                          </h4>
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">담당 코치:</span> {item.코치 || '-'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">코칭일정:</span> {item.코칭일정 || '-'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-gray-600">신청일:</span> {item.신청일 || '-'}
                            </div>
                            {Object.entries(item.기타코칭정보 || {}).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium text-gray-600">{key}:</span> {value || '-'}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnifiedMatchTable;
