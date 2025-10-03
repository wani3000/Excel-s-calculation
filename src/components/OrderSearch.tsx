import React, { useState } from 'react';
import { Upload, Search, FileSpreadsheet, Download, X, AlertCircle } from 'lucide-react';
import { OrderSearchState } from '../types';

interface OrderSearchProps {
  onFileUpload: (file: File | null) => void;
  onSearch: (orderNumbers: string[]) => void;
  onSearchQueryChange: (query: string) => void;
  searchState: OrderSearchState;
}

const OrderSearch: React.FC<OrderSearchProps> = ({ 
  onFileUpload, 
  onSearch, 
  onSearchQueryChange,
  searchState 
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onFileUpload(null);
  };

  const handleSearch = () => {
    const orderNumbers = searchState.searchQuery
      .split(',')
      .map(num => num.trim())
      .filter(num => num.length > 0);
    
    if (orderNumbers.length === 0) {
      alert('주문번호를 입력해주세요.');
      return;
    }

    onSearch(orderNumbers);
  };

  const downloadResults = async () => {
    if (searchState.searchResults.length === 0) {
      alert('다운로드할 결과가 없습니다.');
      return;
    }

    // Excel 파일 생성 및 다운로드 로직
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(searchState.searchResults);
    XLSX.utils.book_append_sheet(workbook, worksheet, '주문번호 검색 결과');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '주문번호_검색결과.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 파일 업로드 섹션 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">결산 파일 업로드</h2>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            YYMM_매물코칭_결산.xlsx 파일을 업로드해주세요.
          </p>
        </div>

        {!searchState.uploadedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-gray-500">
                Excel 파일 (.xlsx)만 지원됩니다
              </p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {searchState.uploadedFile.name}
                  </p>
                  <p className="text-xs text-green-700">
                    {(searchState.uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 주문번호 검색 섹션 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Search className="w-6 h-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">주문번호 검색</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주문번호 입력
            </label>
            <textarea
              value={searchState.searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="주문번호를 쉼표(,)로 구분하여 입력하세요&#10;예: 202509291000054951185722177, 20250929111432831539880, 202509281553240932051625029"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={!searchState.uploadedFile}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={!searchState.uploadedFile || searchState.isSearching}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {searchState.isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  검색
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 검색 결과 섹션 */}
      {searchState.searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                검색 결과 ({searchState.searchResults.length}건)
              </h2>
            </div>
            <button
              onClick={downloadResults}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              결과 다운로드
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전시상품명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    휴대폰번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
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
                    코치
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코칭진행일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchState.searchResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {result.전시상품명}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.이름}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.휴대폰번호}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {result.주문번호}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.ID}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.닉네임}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {result.옵션정보}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {typeof result['판매액(원)'] === 'number' 
                        ? result['판매액(원)'].toLocaleString() 
                        : result['판매액(원)']
                      }원
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.코치}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {result.코칭진행일}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {searchState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{searchState.error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSearch;
