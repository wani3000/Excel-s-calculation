import React, { useState, useMemo } from 'react';
import { Download, AlertTriangle, UserX, FileSpreadsheet, XCircle, CheckCircle } from 'lucide-react';
import { InvestmentMatchingResult } from '../types';
import InvestmentStats from './InvestmentStats';

// 투자코칭 결과 테이블 컴포넌트
const InvestmentResultTable: React.FC<{
  result: InvestmentMatchingResult;
  onDownload: () => void;
  onDownloadUnmatchedOrders: () => void;
  onDownloadUnmatchedParticipants: () => void;
}> = ({ result, onDownload, onDownloadUnmatchedOrders, onDownloadUnmatchedParticipants }) => {
  const [activeTab, setActiveTab] = useState<'matched' | 'unmatchedOrders' | 'unmatchedParticipants'>('matched');

  // 매칭된 주문 데이터를 매물코칭과 동일한 구조로 변환
  const matchedItems = useMemo(() => {
    return result.matchedOrders.map(order => ({
      orderData: order,
      coachingData: {
        이름: order.이름,
        닉네임: order.닉네임,
        휴대폰번호: order.휴대폰번호,
        코치: order.코치,
        코칭진행일: order.코칭진행일,
        상담일시: order.상담일시,
        시간: order.시간
      },
      result: 'matched' as const
    }));
  }, [result.matchedOrders]);

  // 매칭되지 않은 주문 데이터
  const unmatchedOrderItems = useMemo(() => {
    return result.unmatchedOrders.map(order => ({
      orderData: order,
      coachingData: null,
      result: 'onlyInA' as const
    }));
  }, [result.unmatchedOrders]);

  // 매칭되지 않은 참여자 데이터
  const unmatchedParticipantItems = useMemo(() => {
    return result.unmatchedParticipants.map(participant => ({
      orderData: null,
      coachingData: {
        이름: participant.성함 || participant.이름,
        닉네임: participant.닉네임,
        휴대폰번호: participant.연락처 || participant.전화번호 || participant.휴대폰번호,
        코치: participant.코치,
        코칭진행일: participant.상담일시 || participant.시간,
        상담일시: participant.상담일시,
        시간: participant.시간
      },
      result: 'onlyInB' as const
    }));
  }, [result.unmatchedParticipants]);

  // 모든 불일치 데이터 합치기
  const allMismatchedItems = [...unmatchedOrderItems, ...unmatchedParticipantItems];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (value: any): string => {
    if (!value) return '-';
    
    // Excel 숫자 날짜 형식 처리
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (isNaN(date.getTime())) {
        return String(value);
      }
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* 투자코칭 전용 통계 컴포넌트 사용 */}
      <InvestmentStats stats={result.stats} />

      {/* 매칭 결과 테이블 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-black">투자코칭 비교 결과</h3>
          </div>
          
          <button
            onClick={onDownload}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>투자코칭 결과 다운로드</span>
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <nav className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('matched')}
              className={`flex items-center px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'matched'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              매칭된 주문 ({result.stats?.matched || 0})
            </button>
            
            <button
              onClick={() => setActiveTab('unmatchedOrders')}
              className={`flex items-center px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'unmatchedOrders'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              주문내역에만 있는 데이터 ({result.stats?.onlyInA || 0})
            </button>
            
            <button
              onClick={() => setActiveTab('unmatchedParticipants')}
              className={`flex items-center px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'unmatchedParticipants'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              코칭현황에만 있는 데이터 ({result.stats?.onlyInB || 0})
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="overflow-x-auto">
          {activeTab === 'matched' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-black">매칭된 주문 내역</h4>
                <span className="text-sm text-gray-500">{matchedItems.length}건</span>
              </div>
              
              {matchedItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">휴대폰번호</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">옵션정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매액(원)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제일시</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코치</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코칭진행일</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchedItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.이름 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.휴대폰번호 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.닉네임 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.옵션정보 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderData?.['판매액(원)'] ? formatCurrency(Number(item.orderData['판매액(원)'])) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderData?.결제일시 ? formatDateTime(item.orderData.결제일시) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.코치 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.코칭진행일 || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">매칭된 주문이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'unmatchedOrders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h4 className="text-lg font-semibold text-black">주문내역에만 있는 데이터</h4>
                  <span className="text-sm text-gray-500">{unmatchedOrderItems.length}건</span>
                </div>
                <button
                  onClick={onDownloadUnmatchedOrders}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>주문내역에만 있는 데이터 다운로드</span>
                </button>
              </div>
              
              {unmatchedOrderItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">휴대폰번호</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">옵션정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매액(원)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제일시</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unmatchedOrderItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.이름 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.휴대폰번호 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.닉네임 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderData?.옵션정보 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderData?.['판매액(원)'] ? formatCurrency(Number(item.orderData['판매액(원)'])) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderData?.결제일시 ? formatDateTime(item.orderData.결제일시) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">주문내역에만 있는 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'unmatchedParticipants' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h4 className="text-lg font-semibold text-black">코칭현황에만 있는 데이터</h4>
                  <span className="text-sm text-gray-500">{unmatchedParticipantItems.length}건</span>
                </div>
                <button
                  onClick={onDownloadUnmatchedParticipants}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>코칭현황에만 있는 데이터 다운로드</span>
                </button>
              </div>
              
              {unmatchedParticipantItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성함</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코치</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상담일시</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unmatchedParticipantItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.이름 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.휴대폰번호 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.닉네임 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.코치 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.상담일시 || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coachingData?.시간 || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">코칭현황에만 있는 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentResultTable;