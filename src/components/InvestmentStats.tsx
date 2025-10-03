import React from 'react';
import { Users, DollarSign, Calendar, User, TrendingUp, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface InvestmentStatsProps {
  stats: {
    total: number;
    matched: number;
    unmatchedOrders: number;
    unmatchedParticipants: number;
    onlyInA: number;
    onlyInB: number;
    investmentStats: {
      orderTotal: number;
      matched: number;
      totalAmount: number;
      dateRange: string;
    };
    homeStats: {
      orderTotal: number;
      matched: number;
      totalAmount: number;
      dateRange: string;
    };
    coachingStats: {
      totalParticipants: number;
      validParticipants: number;
      cancelledCount: number;
      uniqueCoaches: number;
      coachList: string;
    };
    coachSales: {
      [coachName: string]: number;
    };
  };
}

const InvestmentStats: React.FC<InvestmentStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 투자코칭 DB 통계 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">투자코칭 DB 통계</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">투자코칭 주문건수는</p>
                <p className="text-3xl font-bold text-black">{stats.investmentStats.orderTotal}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">투자코칭 주문 내역 총 건수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">투자코칭 총 판매액은</p>
                <p className="text-3xl font-bold text-black">{formatCurrency(stats.investmentStats.totalAmount)} 이에요</p>
                <p className="text-xs text-gray-500 mt-1">투자코칭 전체 판매 금액</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">투자코칭 결제 기간은</p>
                <p className="text-xl font-bold text-black">{stats.investmentStats.dateRange}</p>
                <p className="text-xs text-gray-500 mt-1">결제일시 기준 범위</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 내집마련코칭 DB 통계 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">내집마련코칭 DB 통계</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">내집마련코칭 주문건수는</p>
                <p className="text-3xl font-bold text-black">{stats.homeStats.orderTotal}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">내집마련코칭 주문 내역 총 건수</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">내집마련코칭 총 판매액은</p>
                <p className="text-3xl font-bold text-black">{formatCurrency(stats.homeStats.totalAmount)} 이에요</p>
                <p className="text-xs text-gray-500 mt-1">내집마련코칭 전체 판매 금액</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">내집마련코칭 결제 기간은</p>
                <p className="text-xl font-bold text-black">{stats.homeStats.dateRange}</p>
                <p className="text-xs text-gray-500 mt-1">결제일시 기준 범위</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 코칭현황 통계 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">코칭현황 통계</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">총 참여자 수는</p>
                <p className="text-3xl font-bold text-black">{stats.coachingStats.totalParticipants}명 이에요</p>
                <p className="text-xs text-gray-500 mt-1">코칭현황 전체 참여자</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">유효한 참여자 수는</p>
                <p className="text-3xl font-bold text-black">{stats.coachingStats.validParticipants}명 이에요</p>
                <p className="text-xs text-gray-500 mt-1">취소/오류 제외한 참여자</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">취소/오류 건수는</p>
                <p className="text-3xl font-bold text-black">{stats.coachingStats.cancelledCount}건 이에요</p>
                <p className="text-xs text-gray-500 mt-1">취소 및 데이터 오류</p>
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
        </div>

        {/* 코치 목록 */}
        {stats.coachingStats.coachList && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-gray-600" />
              <p className="text-lg font-semibold text-black">진행 코치 목록</p>
            </div>
            <p className="text-gray-700 text-lg">{stats.coachingStats.coachList}</p>
          </div>
        )}
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
                <p className="text-sm font-medium text-gray-600 mb-1">주문내역과 코칭현황이 일치하는 항목은</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">주문내역에는 있으나 코칭현황에 없는 건은</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">코칭현황에는 있으나 주문내역에 없는 건은</p>
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
              {stats.total > 0 ? ((stats.matched / stats.total) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              전체 주문 대비 매칭된 비율이에요
            </p>
          </div>
        </div>

        {/* 강사별 판매액 */}
        {Object.keys(stats.coachSales).length > 0 && (
          <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <p className="text-lg font-semibold text-black">강사별 총 판매액 (매칭된 주문만)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.coachSales)
                .sort(([,a], [,b]) => b - a) // 판매액 높은 순으로 정렬
                .map(([coachName, salesAmount]) => (
                <div key={coachName} className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{coachName}</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(salesAmount)}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentStats;
