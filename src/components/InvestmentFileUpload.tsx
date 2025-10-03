import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Calendar, AlertTriangle } from 'lucide-react';
import { InvestmentUploadState } from '../types';

interface InvestmentFileUploadProps {
  uploadState: InvestmentUploadState;
  onFileUpload: (file: File, type: 'investmentOrder' | 'homeOrder' | 'coachingStatus') => void;
  onDateChange: (year: number, month: number) => void;
  onCompare: () => void;
  isComparing: boolean;
}

const InvestmentFileUpload: React.FC<InvestmentFileUploadProps> = ({
  uploadState,
  onFileUpload,
  onDateChange,
  onCompare,
  isComparing
}) => {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState<'investmentOrder' | 'homeOrder' | 'coachingStatus' | null>(null);

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      alert('파일 크기는 10MB 이하로 제한됩니다.');
      return false;
    }
    
    return true;
  };

  const handleFileUpload = async (file: File, type: 'investmentOrder' | 'homeOrder' | 'coachingStatus') => {
    if (!validateFile(file)) return;
    
    setLoading(type);
    
    try {
      onFileUpload(file, type);
    } catch (error) {
      alert(`파일 읽기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'investmentOrder' | 'homeOrder' | 'coachingStatus') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const removeFile = (type: 'investmentOrder' | 'homeOrder' | 'coachingStatus') => {
    onFileUpload(null, type);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const canCompare = uploadState.investmentOrderFile && uploadState.homeOrderFile && uploadState.coachingStatusFile;

  return (
    <div className="space-y-8">
      {/* 연도/월 선택 섹션 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-black">연도/월 선택</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연도</label>
            <select
              value={uploadState.selectedYear}
              onChange={(e) => onDateChange(parseInt(e.target.value), uploadState.selectedMonth)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => 2023 + i).map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">월</label>
            <select
              value={uploadState.selectedMonth}
              onChange={(e) => onDateChange(uploadState.selectedYear, parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>선택된 기간: {uploadState.selectedYear}년 {uploadState.selectedMonth}월</span>
        </div>
        
        <p className="mt-2 text-xs text-gray-500">
          이 기간은 다운로드되는 Excel 파일명에 사용됩니다.
        </p>
      </div>

      {/* 투자코칭 주문내역 업로드 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-black">투자코칭 주문내역 (기준 파일)</h3>
        </div>
        
        <p className="text-gray-600 mb-4">투자코칭 주문전체내역.xlsx 파일을 업로드하세요</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              해당하는 달의 Excel만 넣어주세요. 해당하는 달이 아닌 이외 날짜의 데이터는 삭제해주세요.
            </p>
          </div>
        </div>

        {!uploadState.investmentOrderFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver === 'investmentOrder'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => handleDragOver(e, 'investmentOrder')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'investmentOrder')}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload(file, 'investmentOrder');
              };
              input.click();
            }}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Excel 파일을 업로드하세요</p>
            <p className="text-sm text-gray-500">.xlsx, .xls 파일만 지원됩니다</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">{uploadState.investmentOrderFile.name}</p>
                <p className="text-sm text-blue-700">({formatFileSize(uploadState.investmentOrderFile.size)})</p>
              </div>
            </div>
            <button
              onClick={() => removeFile('investmentOrder')}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {loading === 'investmentOrder' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">파일 처리 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* 내집마련코칭 주문내역 업로드 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-black">내집마련코칭 주문내역 (기준 파일)</h3>
        </div>
        
        <p className="text-gray-600 mb-4">내집마련코칭 주문전체내역.xlsx 파일을 업로드하세요</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              해당하는 달의 Excel만 넣어주세요. 해당하는 달이 아닌 이외 날짜의 데이터는 삭제해주세요.
            </p>
          </div>
        </div>

        {!uploadState.homeOrderFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver === 'homeOrder'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => handleDragOver(e, 'homeOrder')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'homeOrder')}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload(file, 'homeOrder');
              };
              input.click();
            }}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Excel 파일을 업로드하세요</p>
            <p className="text-sm text-gray-500">.xlsx, .xls 파일만 지원됩니다</p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{uploadState.homeOrderFile.name}</p>
                <p className="text-sm text-green-700">({formatFileSize(uploadState.homeOrderFile.size)})</p>
              </div>
            </div>
            <button
              onClick={() => removeFile('homeOrder')}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {loading === 'homeOrder' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-green-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-sm">파일 처리 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* 코칭현황 업로드 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-black">코칭현황 (비교 파일)</h3>
        </div>
        
        <p className="text-gray-600 mb-4">투자코칭 현황.xlsx 파일을 업로드하세요</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              참여자 정보가 포함된 Excel 파일을 업로드하세요.
            </p>
          </div>
        </div>

        {!uploadState.coachingStatusFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver === 'coachingStatus'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => handleDragOver(e, 'coachingStatus')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'coachingStatus')}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload(file, 'coachingStatus');
              };
              input.click();
            }}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Excel 파일을 업로드하세요</p>
            <p className="text-sm text-gray-500">.xlsx, .xls 파일만 지원됩니다</p>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">{uploadState.coachingStatusFile.name}</p>
                <p className="text-sm text-purple-700">({formatFileSize(uploadState.coachingStatusFile.size)})</p>
              </div>
            </div>
            <button
              onClick={() => removeFile('coachingStatus')}
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {loading === 'coachingStatus' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-purple-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm">파일 처리 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* 비교 실행 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            console.log('🔥 버튼 클릭됨!');
            console.log('onCompare 함수:', onCompare);
            console.log('canCompare:', canCompare);
            console.log('isComparing:', isComparing);
            
            if (onCompare && typeof onCompare === 'function') {
              console.log('onCompare 함수 호출 시도');
              onCompare();
            } else {
              console.error('onCompare 함수가 없거나 함수가 아님!');
            }
          }}
          disabled={!canCompare || isComparing}
          className={`flex items-center space-x-3 px-8 py-4 rounded-lg font-medium transition-colors ${
            canCompare && !isComparing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isComparing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>비교 중...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-9v4m0 0l-2-2m2 2l2-2" />
              </svg>
              <span>투자코칭 비교 실행</span>
            </>
          )}
        </button>
      </div>

      {/* 디버깅 정보 */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
        <div>파일 업로드 상태:</div>
        <div>• 투자코칭 주문내역: {uploadState.investmentOrderFile ? '✅' : '❌'}</div>
        <div>• 내집마련코칭 주문내역: {uploadState.homeOrderFile ? '✅' : '❌'}</div>
        <div>• 투자코칭 현황: {uploadState.coachingStatusFile ? '✅' : '❌'}</div>
        <div>• 비교 가능: {canCompare ? '✅' : '❌'}</div>
        <div>• 비교 중: {isComparing ? '⏳' : '⏸️'}</div>
      </div>
    </div>
  );
};

export default InvestmentFileUpload;