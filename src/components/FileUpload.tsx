import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Calendar } from 'lucide-react';
import { FileUploadState, CoachingType } from '../types';
import { getSheetNames } from '../utils/excel';

interface FileUploadProps {
  uploadState: FileUploadState;
  onUploadStateChange: (state: FileUploadState) => void;
  onError: (error: string) => void;
  coachingType: CoachingType;
}

const FileUpload: React.FC<FileUploadProps> = ({
  uploadState,
  onUploadStateChange,
  onError,
  coachingType
}) => {
  const [loading, setLoading] = useState<'order' | 'coaching' | null>(null);

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      onError('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      onError('파일 크기는 10MB 이하로 제한됩니다.');
      return false;
    }
    
    return true;
  };

  const handleFileUpload = async (file: File, type: 'order' | 'coaching') => {
    if (!validateFile(file)) return;
    
    setLoading(type);
    
    try {
      const sheets = await getSheetNames(file);
      
      if (sheets.length === 0) {
        onError('파일에서 시트를 찾을 수 없습니다.');
        return;
      }
      
      const newState = {
        ...uploadState,
        [type === 'order' ? 'orderFile' : 'coachingFile']: file,
        [type === 'order' ? 'orderSheets' : 'coachingSheets']: sheets,
        [type === 'order' ? 'selectedOrderSheet' : 'selectedCoachingSheet']: sheets[0]
      };
      
      onUploadStateChange(newState);
    } catch (error) {
      onError(`파일 읽기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleSheetChange = (sheetName: string, type: 'order' | 'coaching') => {
    const newState = {
      ...uploadState,
      [type === 'order' ? 'selectedOrderSheet' : 'selectedCoachingSheet']: sheetName
    };
    onUploadStateChange(newState);
  };

  const removeFile = (type: 'order' | 'coaching') => {
    const newState = {
      ...uploadState,
      [type === 'order' ? 'orderFile' : 'coachingFile']: null,
      [type === 'order' ? 'orderSheets' : 'coachingSheets']: [],
      [type === 'order' ? 'selectedOrderSheet' : 'selectedCoachingSheet']: ''
    };
    onUploadStateChange(newState);
  };

  const handleDateChange = (year: number, month: number) => {
    const newState = {
      ...uploadState,
      selectedYear: year,
      selectedMonth: month
    };
    onUploadStateChange(newState);
  };

  return (
    <div className="space-y-8">
      {/* 연도/월 선택 섹션 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <Calendar className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-black">연도/월 선택</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-black mb-3">
              연도
            </label>
            <select
              value={uploadState.selectedYear}
              onChange={(e) => handleDateChange(Number(e.target.value), uploadState.selectedMonth)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 text-lg font-medium"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-black mb-3">
              월
            </label>
            <select
              value={uploadState.selectedMonth}
              onChange={(e) => handleDateChange(uploadState.selectedYear, Number(e.target.value))}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 text-lg font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-black">
                선택된 기간: {uploadState.selectedYear}년 {uploadState.selectedMonth}월
              </p>
              <p className="text-sm text-gray-600 mt-1">
                이 기간은 다운로드되는 Excel 파일명에 사용됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 주문 전체내역 파일 업로드 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black">주문 전체내역 (기준 파일)</h3>
            <p className="text-gray-600 mt-1">주문 정보가 포함된 Excel 파일을 업로드하세요</p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ 해당하는 달의 Excel만 넣어주세요. 해당하는 달이 아닌 이외 날짜의 데이터는 삭제해주세요.
          </p>
        </div>
        
        {!uploadState.orderFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-all duration-200 bg-gray-50">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'order');
              }}
              className="hidden"
              id="order-file-input"
            />
            <label
              htmlFor="order-file-input"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-10 h-10 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black">
                  {loading === 'order' ? '파일 처리 중...' : 'Excel 파일을 업로드하세요'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  .xlsx, .xls 파일만 지원됩니다
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-black text-lg">{uploadState.orderFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(uploadState.orderFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile('order')}
                className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                제거
              </button>
            </div>
            
            {uploadState.orderSheets.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-black mb-3">
                  시트 선택
                </label>
                <select
                  value={uploadState.selectedOrderSheet}
                  onChange={(e) => handleSheetChange(e.target.value, 'order')}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 text-lg font-medium"
                >
                  {uploadState.orderSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 코칭 DB 파일 업로드 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black">
              {coachingType === 'property' ? '매물코칭 DB (비교 파일)' : '투자코칭 DB (비교 파일)'}
            </h3>
            <p className="text-gray-600 mt-1">코칭 정보가 포함된 Excel 파일을 업로드하세요</p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ 해당하는 달의 Excel만 넣어주세요. 해당하는 달이 아닌 이외 날짜의 데이터는 삭제해주세요.
          </p>
        </div>
        
        {!uploadState.coachingFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-all duration-200 bg-gray-50">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'coaching');
              }}
              className="hidden"
              id="coaching-file-input"
            />
            <label
              htmlFor="coaching-file-input"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-10 h-10 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black">
                  {loading === 'coaching' ? '파일 처리 중...' : 'Excel 파일을 업로드하세요'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  .xlsx, .xls 파일만 지원됩니다
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-black text-lg">{uploadState.coachingFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(uploadState.coachingFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile('coaching')}
                className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                제거
              </button>
            </div>
            
            {uploadState.coachingSheets.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-black mb-3">
                  시트 선택
                </label>
                <select
                  value={uploadState.selectedCoachingSheet}
                  onChange={(e) => handleSheetChange(e.target.value, 'coaching')}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 text-lg font-medium"
                >
                  {uploadState.coachingSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
