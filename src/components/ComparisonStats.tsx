import React from 'react';
import { Users, DollarSign, Calendar, User, TrendingUp, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface ComparisonStatsProps {
  stats: {
    orderTotal: number;
    coachingTotal: number;
    coachingTotalWithoutCancelled: number;
    cancelledCount: number;
    matched: number;
    onlyInA: number;
    onlyInB: number;
    orderStats: {
      totalAmount: number;
      dateRange: string;
    };
    coachingStats: {
      uniqueCoaches: number;
      dateRange: string;
    };
  };
  coachingType: 'property' | 'investment';
}

const ComparisonStats: React.FC<ComparisonStatsProps> = ({ stats, coachingType }) => {
  const coachingTypeLabel = coachingType === 'property' ? '매물코칭' : '투자코칭';
  
  return (
    <div className="space-y-6">
      {/* 주문전체내역 통계 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">주문전체내역 통계</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">총 주문건수는</p>
                <p className="text-3xl font-bold text-black">{stats.orderTotal}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">주문 내역 총 건수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">총 판매액은</p>
                <p className="text-3xl font-bold text-black">₩{stats.orderStats.totalAmount.toLocaleString()}원 이에요</p>
                <p className="text-xs text-gray-500 mt-1">전체 판매 금액</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">결제 기간은</p>
                <p className="text-xl font-bold text-black">{stats.orderStats.dateRange}</p>
                <p className="text-xs text-gray-500 mt-1">결제일 기준 범위</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 코칭 DB 통계 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">{coachingTypeLabel} DB 통계</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">총 신청건수는</p>
                <p className="text-3xl font-bold text-black">{stats.coachingTotal}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">취소 포함 전체 신청 건수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">실제 신청건수</p>
                <p className="text-3xl font-bold text-black">{stats.coachingTotalWithoutCancelled}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">취소 제외한 실제 신청 건수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">취소건수</p>
                <p className="text-3xl font-bold text-black">{stats.cancelledCount}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">취소 및 환불 건수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">진행 코치 수는</p>
                <p className="text-3xl font-bold text-black">{stats.coachingStats.uniqueCoaches}명 이에요</p>
                <p className="text-xs text-gray-500 mt-1">활성 코치 수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">코칭 기간은</p>
                <p className="text-xl font-bold text-black">{stats.coachingStats.dateRange}</p>
                <p className="text-xs text-gray-500 mt-1">코칭진행일 기준 범위</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 매칭 분석 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">매칭 분석</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">주문내역과 {coachingTypeLabel} DB가 일치하는 항목은</p>
                <p className="text-3xl font-bold text-black">{stats.matched}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">완벽하게 매칭된 데이터</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">주문내역에는 있으나 {coachingTypeLabel}DB에 없는 건은</p>
                <p className="text-3xl font-bold text-black">{stats.onlyInA}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">결제했지만 코칭 신청 안함</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{coachingTypeLabel}DB에는 있으나 주문내역에 없는 건은</p>
                <p className="text-3xl font-bold text-black">{stats.onlyInB}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">코칭 신청했지만 결제 안함</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-gray-600" />
              <p className="text-lg font-semibold text-black">매칭율</p>
            </div>
            <p className="text-4xl font-bold text-black">
              {stats.orderTotal > 0 ? ((stats.matched / stats.orderTotal) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              전체 주문 대비 매칭된 비율이에요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonStats;
