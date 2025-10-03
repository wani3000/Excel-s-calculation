import React, { useState } from 'react';
import { Play, AlertCircle, Loader2, FileText, Home, TrendingUp, Upload } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ComparisonTable from './components/ComparisonTable';
import FileAnalyzer from './components/FileAnalyzer';
import ComparisonStats from './components/ComparisonStats';
import BulkUploadTemplate from './components/BulkUploadTemplate';
import InvestmentFileUpload from './components/InvestmentFileUpload';
import InvestmentResultTable from './components/InvestmentResultTable';
import { FileUploadState, ComparisonItem, MainTabType, InvestmentUploadState, InvestmentMatchingResult } from './types';
import { readOrderData, readCoachingData, downloadComparisonResult, downloadSettlementMismatchedData, downloadSuspectedMatchesData, downloadDuplicateCasesData } from './utils/excel';
import { compareData, calculateStats, findDuplicateCases } from './utils/comparison';
import { readInvestmentOrderFile, readCoachingStatusFile, compareInvestmentData, downloadInvestmentResult, downloadUnmatchedOrders, downloadUnmatchedParticipants } from './utils/investmentComparison';

const App: React.FC = () => {
  // 각 탭별로 독립적인 상태 관리
  const [propertyUploadState, setPropertyUploadState] = useState<FileUploadState>({
    orderFile: null,
    coachingFile: null,
    orderSheets: [],
    coachingSheets: [],
    selectedOrderSheet: '',
    selectedCoachingSheet: '',
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1
  });

  const [investmentUploadState, setInvestmentUploadState] = useState<InvestmentUploadState>({
    investmentOrderFile: null,
    homeOrderFile: null,
    coachingStatusFile: null,
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1
  });

  const [propertyComparisonItems, setPropertyComparisonItems] = useState<ComparisonItem[]>([]);
  const [investmentMatchingResult, setInvestmentMatchingResult] = useState<InvestmentMatchingResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPropertyResults, setShowPropertyResults] = useState(false);
  const [showInvestmentResults, setShowInvestmentResults] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);
  const [fileAnalyzerData, setFileAnalyzerData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<MainTabType>('property');
  const [propertyComparisonStats, setPropertyComparisonStats] = useState<any>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(''), 5000); // 5초 후 에러 메시지 자동 제거
  };



  // 투자코칭 전용 핸들러 함수들
  const handleInvestmentFileUpload = (file: File | null, fileType: 'investmentOrder' | 'homeOrder' | 'coachingStatus') => {
    setInvestmentUploadState(prev => ({
      ...prev,
      [fileType === 'investmentOrder' ? 'investmentOrderFile' : 
       fileType === 'homeOrder' ? 'homeOrderFile' : 'coachingStatusFile']: file
    }));
  };

  const handleInvestmentDateChange = (year: number, month: number) => {
    setInvestmentUploadState(prev => ({
      ...prev,
      selectedYear: year,
      selectedMonth: month
    }));
  };

  const handleInvestmentCompare = async () => {
    console.log('🚀 투자코칭 비교 실행 시작!');
    console.log('투자코칭 업로드 상태:', {
      investmentOrderFile: !!investmentUploadState.investmentOrderFile,
      homeOrderFile: !!investmentUploadState.homeOrderFile,
      coachingStatusFile: !!investmentUploadState.coachingStatusFile
    });
    
    if (!investmentUploadState.investmentOrderFile || 
        !investmentUploadState.homeOrderFile || 
        !investmentUploadState.coachingStatusFile) {
      console.log('파일 업로드 누락으로 인한 오류');
      handleError('모든 파일을 업로드해주세요.');
      return;
    }

    console.log('파일 읽기 시작');
    setIsComparing(true);
    setError('');

    try {
      // 파일들을 병렬로 읽기
      const [investmentOrders, homeOrders, participants] = await Promise.all([
        readInvestmentOrderFile(investmentUploadState.investmentOrderFile),
        readInvestmentOrderFile(investmentUploadState.homeOrderFile),
        readCoachingStatusFile(investmentUploadState.coachingStatusFile)
      ]);

      // 데이터 비교 및 매칭
      const result = compareInvestmentData(investmentOrders, homeOrders, participants);
      setInvestmentMatchingResult(result);
      setShowInvestmentResults(true);

      console.log('투자코칭 비교 완료:', result);
    } catch (error) {
      console.error('투자코칭 비교 오류:', error);
      handleError(`투자코칭 비교 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      console.log('=== handleInvestmentCompare 함수 종료 ===');
      setIsComparing(false);
    }
  };

  const handleInvestmentDownload = () => {
    if (investmentMatchingResult) {
      try {
        downloadInvestmentResult(investmentMatchingResult, investmentUploadState.selectedYear, investmentUploadState.selectedMonth);
      } catch (error) {
        console.error('투자코칭 다운로드 오류:', error);
        handleError(`다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
  };

  const handleInvestmentUnmatchedOrdersDownload = () => {
    if (investmentMatchingResult) {
      try {
        downloadUnmatchedOrders(investmentMatchingResult.unmatchedOrders, investmentUploadState.selectedYear, investmentUploadState.selectedMonth);
      } catch (error) {
        console.error('주문내역에만 있는 데이터 다운로드 오류:', error);
        handleError(`다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
  };

  const handleInvestmentUnmatchedParticipantsDownload = () => {
    if (investmentMatchingResult) {
      try {
        downloadUnmatchedParticipants(investmentMatchingResult.unmatchedParticipants, investmentUploadState.selectedYear, investmentUploadState.selectedMonth);
      } catch (error) {
        console.error('코칭현황에만 있는 데이터 다운로드 오류:', error);
        handleError(`다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
  };

  const handleCompare = async () => {
    // 매물코칭 전용 비교 함수
    if (activeTab !== 'property') {
      handleError('매물코칭 탭에서만 사용할 수 있습니다.');
      return;
    }

    const currentUploadState = propertyUploadState;
    
    if (!currentUploadState.orderFile || !currentUploadState.coachingFile) {
      handleError('두 파일을 모두 업로드해주세요.');
      return;
    }

    if (!currentUploadState.selectedOrderSheet || !currentUploadState.selectedCoachingSheet) {
      handleError('시트를 선택해주세요.');
      return;
    }

    setIsComparing(true);
    setError('');
    setShowPropertyResults(false);

    try {
      // 두 파일에서 데이터 읽기
      const [orderData, coachingData] = await Promise.all([
        readOrderData(currentUploadState.orderFile, currentUploadState.selectedOrderSheet),
        readCoachingData(currentUploadState.coachingFile, currentUploadState.selectedCoachingSheet)
      ]);

      if (orderData.length === 0) {
        handleError('주문 파일에서 데이터를 읽을 수 없습니다. 시트가 비어있거나 형식이 올바르지 않습니다.');
        return;
      }

      if (coachingData.length === 0) {
        handleError('코칭 파일에서 데이터를 읽을 수 없습니다. 시트가 비어있거나 형식이 올바르지 않습니다.');
        return;
      }

      // 먼저 중복 건 찾기
      const duplicateCases = findDuplicateCases(orderData, coachingData);
      
      // 중복 건에서 사용되는 주문 데이터의 키 수집
      const duplicateOrderKeys = new Set(duplicateCases.map(item => item.orderData?.이름 || '').filter(name => name));
      
      // 데이터 비교
      const results = compareData(orderData, coachingData);
      
      // 중복 건에서 사용되는 주문 데이터를 onlyInA에서 제외
      const filteredResults = results.filter(result => {
        if (result.result === 'onlyInA' && result.orderData?.이름) {
          const orderName = String(result.orderData.이름).trim();
          return !duplicateOrderKeys.has(orderName);
        }
        return true;
      });
      
      // 중복 건을 결과에 추가
      const allResults = [...filteredResults, ...duplicateCases];
      
      const stats = calculateStats(allResults, orderData, coachingData);
      
      // 매물코칭 전용 상태 업데이트
      if (activeTab === 'property') {
        setPropertyComparisonItems(allResults);
        setPropertyComparisonStats(stats);
        setShowPropertyResults(true);
      }
      console.log('비교 완료:', results.length, '개 항목', stats);
    } catch (error) {
      handleError(`비교 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsComparing(false);
    }
  };

  const handleDownload = (downloadType: 'matched' | 'mismatched' = 'matched') => {
    // 매물코칭 전용 다운로드 함수
    if (activeTab !== 'property') {
      handleError('매물코칭 탭에서만 사용할 수 있습니다.');
      return;
    }

    const currentItems = propertyComparisonItems;
    const currentUploadState = propertyUploadState;
    
    console.log('App handleDownload 호출됨:', { 
      comparisonItems: currentItems.length, 
      hasAnalysis: !!fileAnalysis,
      downloadType
    });
    
    if (currentItems.length === 0) {
      handleError('다운로드할 데이터가 없습니다.');
      return;
    }

      // 다운로드할 데이터가 있는지 확인
      const hasData = downloadType === 'matched' 
        ? currentItems.some(item => item.result === 'matched')
        : currentItems.some(item => item.result !== 'matched');
        
      if (!hasData) {
        handleError(`${downloadType === 'matched' ? '매칭된' : '불일치'} 데이터가 없습니다.`);
        return;
      }

      try {
        console.log('downloadComparisonResult 호출 전');
        const coachingType = 'property';
        downloadComparisonResult(currentItems, undefined, fileAnalysis, coachingType, downloadType, currentUploadState.selectedYear, currentUploadState.selectedMonth);
        console.log('downloadComparisonResult 호출 후');
      } catch (error) {
        console.error('App handleDownload 오류:', error);
        handleError(`다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    };

  const handleSettlementDownload = () => {
    // 매물코칭 전용 다운로드 함수
    if (activeTab !== 'property') {
      handleError('매물코칭 탭에서만 사용할 수 있습니다.');
      return;
    }

    const currentItems = propertyComparisonItems;
    const currentUploadState = propertyUploadState;
    
    console.log('App handleSettlementDownload 호출됨:', { comparisonItems: currentItems.length });
    if (currentItems.length === 0) {
      handleError('다운로드할 데이터가 없습니다.');
      return;
    }
    
    // 불일치 데이터가 있는지 확인
    const hasMismatchedData = currentItems.some(item => item.result !== 'matched');
      
      if (!hasMismatchedData) {
        handleError('불일치 데이터가 없습니다.');
        return;
      }
      
      try {
        console.log('downloadSettlementMismatchedData 호출 전');
        const coachingType = 'property';
        downloadSettlementMismatchedData(currentItems, coachingType, currentUploadState.selectedYear, currentUploadState.selectedMonth);
        console.log('downloadSettlementMismatchedData 호출 후');
      } catch (error) {
        console.error('App handleSettlementDownload 오류:', error);
        handleError(`결산 스타일 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    };

  const handleSuspectedMatchesDownload = () => {
    // 매물코칭 전용 다운로드 함수
    if (activeTab !== 'property') {
      handleError('매물코칭 탭에서만 사용할 수 있습니다.');
      return;
    }

    const currentItems = propertyComparisonItems;
    const currentUploadState = propertyUploadState;
    
    if (currentItems.length === 0) {
      handleError('다운로드할 데이터가 없습니다.');
      return;
    }
      
      // 매칭된 쌍을 찾아서 다운로드
      try {
        console.log('downloadSuspectedMatchesData 호출 전');
        const coachingType = 'property';
        
        // 매칭된 쌍을 찾는 로직 (ComparisonTable의 로직과 동일)
        const validOnlyInAItems = currentItems.filter(item => 
          item.result === 'onlyInA' && 
          item.orderData?.이름 && 
          String(item.orderData.이름).trim() !== ''
        );
        const validOnlyInBItems = currentItems.filter(item => 
          item.result === 'onlyInB' && 
          item.coachingData?.이름 && 
          String(item.coachingData.이름).trim() !== '' &&
          // 취소/환불 데이터 제외
          (() => {
            const cancelRefundStatus = String(item.coachingData['취소 및 환불'] || '').trim().toLowerCase();
            return cancelRefundStatus !== '취소' && cancelRefundStatus !== '환불';
          })()
        );
        
        const suspectedMatchKeys = new Set<string>();
        const suspectedMatchPairs: { orderItem: any, coachingItem: any, matchType: string }[] = [];
        
        validOnlyInAItems.forEach(orderItem => {
          const order = orderItem.orderData!;
          const orderName = (order.이름 || '').trim();
          const orderPhone = (order.휴대폰번호 || '').trim();
          const orderNickname = (order.닉네임 || '').trim();
          
          let matchType = '';
          let matchKey = '';
          
          // 전화번호가 일치하는지 확인 (우선순위 1)
          if (orderPhone) {
            const phoneMatch = validOnlyInBItems.find(coachingItem => {
              const coachingPhone = (coachingItem.coachingData?.번호 || '').trim();
              return coachingPhone && coachingPhone === orderPhone;
            });
            if (phoneMatch) {
              matchType = '전화번호';
              matchKey = `phone_${orderPhone}`;
              if (!suspectedMatchKeys.has(matchKey)) {
                suspectedMatchKeys.add(matchKey);
                suspectedMatchPairs.push({ orderItem, coachingItem: phoneMatch, matchType });
              }
              return;
            }
          }
          
          // 전화번호가 일치하지 않으면 닉네임 확인 (우선순위 2)
          if (orderNickname) {
            const nicknameMatch = validOnlyInBItems.find(coachingItem => {
              const coachingNickname = (coachingItem.coachingData?.닉네임 || '').trim();
              return coachingNickname && coachingNickname === orderNickname;
            });
            if (nicknameMatch) {
              matchType = '닉네임';
              matchKey = `nickname_${orderNickname}`;
              if (!suspectedMatchKeys.has(matchKey)) {
                suspectedMatchKeys.add(matchKey);
                suspectedMatchPairs.push({ orderItem, coachingItem: nicknameMatch, matchType });
              }
              return;
            }
          }
          
          // 전화번호, 닉네임이 일치하지 않으면 이름 확인 (우선순위 3)
          if (orderName) {
            const nameMatch = validOnlyInBItems.find(coachingItem => {
              const coachingName = (coachingItem.coachingData?.이름 || '').trim();
              return coachingName && coachingName === orderName;
            });
            if (nameMatch) {
              matchType = '이름';
              matchKey = `name_${orderName}`;
              if (!suspectedMatchKeys.has(matchKey)) {
                suspectedMatchKeys.add(matchKey);
                suspectedMatchPairs.push({ orderItem, coachingItem: nameMatch, matchType });
              }
            }
          }
        });
        
        if (suspectedMatchPairs.length === 0) {
          handleError('동일인으로 추측되는 데이터가 없습니다.');
          return;
        }
        
        downloadSuspectedMatchesData(suspectedMatchPairs, coachingType, currentUploadState.selectedYear, currentUploadState.selectedMonth);
        console.log('downloadSuspectedMatchesData 호출 후');
      } catch (error) {
        console.error('App handleSuspectedMatchesDownload 오류:', error);
        handleError(`동일인 추측 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    };

  const handleDuplicateCasesDownload = () => {
    // 매물코칭 전용 다운로드 함수
    if (activeTab !== 'property') {
      handleError('매물코칭 탭에서만 사용할 수 있습니다.');
      return;
    }

    const currentItems = propertyComparisonItems;
    const currentUploadState = propertyUploadState;
    
    if (currentItems.length === 0) {
      handleError('다운로드할 데이터가 없습니다.');
      return;
    }
      
    // 중복 건이 있는지 확인
    const duplicateItems = currentItems.filter(item => item.result === 'duplicate');
      
    if (duplicateItems.length === 0) {
      handleError('중복 건 데이터가 없습니다.');
      return;
    }
      
    try {
      console.log('downloadDuplicateCasesData 호출 전');
      const coachingType = 'property';
      downloadDuplicateCasesData(duplicateItems, coachingType, currentUploadState.selectedYear, currentUploadState.selectedMonth);
      console.log('downloadDuplicateCasesData 호출 후');
    } catch (error) {
      console.error('App handleDuplicateCasesDownload 오류:', error);
      handleError(`중복 건 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    setFileAnalysis(analysis);
    console.log('파일 분석 완료:', analysis);
  };

  const canCompare = (() => {
    // 매물코칭 전용 비교 조건
    return propertyUploadState.orderFile && 
           propertyUploadState.coachingFile && 
           propertyUploadState.selectedOrderSheet && 
           propertyUploadState.selectedCoachingSheet;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gray-100 rounded-lg">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-black">
                  데이터 비교 서비스
                </h1>
                <p className="mt-2 text-gray-600 text-lg">
                  주문 전체내역과 코칭 DB를 비교하여 통합 결과를 생성해요
                </p>
              </div>
            </div>
            
            {/* 탭 네비게이션 */}
            <div className="mt-6 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('property')}
                className={`flex items-center px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  activeTab === 'property'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Home className="w-5 h-5 mr-2" />
                매물코칭
              </button>
              <button
                onClick={() => {
                  console.log('투자코칭 탭 클릭됨');
                  setActiveTab('investment');
                }}
                className={`flex items-center px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  activeTab === 'investment'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                투자코칭
              </button>
              <button
                onClick={() => setActiveTab('analyze')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'analyze'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                결과 파일 분석
              </button>
              <button
                onClick={() => setActiveTab('bulkUpload')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'bulkUpload'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                주문대량업로드템플릿
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">오류</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 매물코칭 탭 */}
        {activeTab === 'property' && (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">🏠 매물코칭</h2>
              <p className="text-blue-700">
                주문 전체내역과 매물코칭 DB를 비교하여 매물 관련 통합 결과를 생성합니다.
              </p>
            </div>

            {/* 파일 업로드 섹션 */}
            <section className="mb-8">
              <FileUpload
                uploadState={propertyUploadState}
                onUploadStateChange={setPropertyUploadState}
                onError={handleError}
                coachingType="property"
              />
            </section>

            {/* 비교 실행 버튼 */}
            <section className="mb-8">
              <div className="flex justify-center">
                <button
                  onClick={handleCompare}
                  disabled={!canCompare || isComparing}
                  className={`flex items-center px-12 py-4 rounded-lg font-bold text-xl transition-all duration-300 ${
                    canCompare && !isComparing
                      ? 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      비교 중...
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 mr-3" />
                      매물코칭 비교 실행
                    </>
                  )}
                </button>
              </div>
              
              {!canCompare && (
                <div className="text-center mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    주문전체내역과 매물코칭DB 파일을 모두 업로드하고 시트를 선택해주세요.
                  </p>
                </div>
              )}
            </section>

              {/* 결과 표시 */}
              {showPropertyResults && propertyComparisonStats && (
                <section>
                  <ComparisonStats 
                    stats={propertyComparisonStats} 
                    coachingType="property" 
                  />
                  <ComparisonTable
                    items={propertyComparisonItems}
                    onDownloadMatched={() => handleDownload('matched')}
                    onDownloadMismatched={() => handleDownload('mismatched')}
                    onDownloadSettlement={handleSettlementDownload}
                    onDownloadSuspectedMatches={handleSuspectedMatchesDownload}
                    onDownloadDuplicates={handleDuplicateCasesDownload}
                    coachingType="property"
                  />
                </section>
              )}
          </>
        )}

        {/* 투자코칭 탭 */}
        {activeTab === 'investment' && (
          <>
            {console.log('투자코칭 탭 렌더링됨')}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">📈 투자코칭</h2>
              <p className="text-green-700">
                투자코칭 주문내역과 내집마련코칭 주문내역을 병합하여 참여자 정보와 매칭하여 실제 참여자만 필터링합니다.
              </p>
            </div>

            {/* 파일 업로드 섹션 */}
            <section className="mb-8">
              <InvestmentFileUpload
                uploadState={investmentUploadState}
                onFileUpload={handleInvestmentFileUpload}
                onDateChange={handleInvestmentDateChange}
                onCompare={handleInvestmentCompare}
                isComparing={isComparing}
              />
            </section>

            {/* 결과 표시 */}
            {showInvestmentResults && investmentMatchingResult && (
              <section>
                <InvestmentResultTable
                  result={investmentMatchingResult}
                  onDownload={handleInvestmentDownload}
                  onDownloadUnmatchedOrders={handleInvestmentUnmatchedOrdersDownload}
                  onDownloadUnmatchedParticipants={handleInvestmentUnmatchedParticipantsDownload}
                />
              </section>
            )}
          </>
        )}

        {/* 파일 분석 탭 */}
        {activeTab === 'analyze' && (
          <section>
            <FileAnalyzer 
              onAnalyzeComplete={handleAnalysisComplete} 
              initialData={fileAnalyzerData}
              onDataChange={setFileAnalyzerData}
            />
          </section>
        )}

        {/* 주문대량업로드템플릿 탭 */}
        {activeTab === 'bulkUpload' && (
          <section>
            <BulkUploadTemplate />
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>데이터 비교 서비스 v2.0</p>
            <p className="mt-1">통합 데이터 생성 도구</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
