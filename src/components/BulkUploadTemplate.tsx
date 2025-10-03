import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUploadTemplateProps {}

interface SettlementData {
  닉네임: string;
  휴대폰번호: string;
  주문번호: string;
  결제일시: string;
  [key: string]: any;
}

interface BulkUploadRow {
  displayId: string;
  nickName: string;
  phoneNumber: string;
  merchantUid: string;
  saleConfirmationAt: string;
  memo: string;
}

const BulkUploadTemplate: React.FC<BulkUploadTemplateProps> = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<'upload' | 'convert' | null>(null);
  const [convertedData, setConvertedData] = useState<BulkUploadRow[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const readSettlementFile = async (file: File): Promise<SettlementData[]> => {
    const data = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsArrayBuffer(file);
    });

    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('파일에 데이터가 없습니다.');
    }

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);
    
    const settlementData = rows.map((row: unknown) => {
      const rowArray = row as any[];
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = rowArray[index] || '';
      });
      return obj;
    }).filter(row => row.닉네임 && row.휴대폰번호 && row.주문번호);

    return settlementData;
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // 이미 YYYY-MM-DD 형식인 경우
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Excel 숫자 날짜인 경우
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // YYYY-MM-DD HH:MM:SS 형식인 경우
    if (typeof dateValue === 'string' && dateValue.includes(' ')) {
      return dateValue.split(' ')[0];
    }
    
    // 기타 날짜 형식 처리
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('날짜 파싱 실패:', dateValue);
    }
    
    return '';
  };

  const convertToBulkUploadFormat = (settlementData: SettlementData[]): BulkUploadRow[] => {
    return settlementData.map(row => ({
      displayId: '', // 비워둠
      nickName: String(row.닉네임 || '').trim(),
      phoneNumber: String(row.휴대폰번호 || '').trim(),
      merchantUid: String(row.주문번호 || '').trim(),
      saleConfirmationAt: formatDate(row.결제일시),
      memo: ''
    }));
  };

  const handleFileUpload = async (file: File) => {
    setLoading('upload');
    setFileName(file.name);
    
    try {
      const settlementData = await readSettlementFile(file);
      const bulkUploadData = convertToBulkUploadFormat(settlementData);
      
      setUploadedFile(file);
      setConvertedData(bulkUploadData);
      
    } catch (error) {
      console.error('파일 처리 오류:', error);
      alert(`파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setUploadedFile(null);
      setConvertedData([]);
    } finally {
      setLoading(null);
    }
  };

  const downloadBulkUploadTemplate = () => {
    if (convertedData.length === 0) {
      alert('변환할 데이터가 없습니다.');
      return;
    }

    setLoading('convert');

    try {
      const workbook = XLSX.utils.book_new();
      
      // 헤더 정의
      const headers = ['displayId', 'nickName', 'phoneNumber', 'merchantUid', 'saleConfirmationAt', 'memo'];
      
      // 데이터 변환
      const sheetData = [
        headers,
        ...convertedData.map(row => [
          row.displayId,
          row.nickName,
          row.phoneNumber,
          row.merchantUid,
          row.saleConfirmationAt,
          row.memo
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // 컬럼 너비 설정
      worksheet['!cols'] = [
        { width: 15 }, // displayId
        { width: 20 }, // nickName
        { width: 20 }, // phoneNumber
        { width: 25 }, // merchantUid
        { width: 20 }, // saleConfirmationAt
        { width: 15 }  // memo
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, '주문대량업로드템플릿');

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `주문대량업로드템플릿_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <Upload className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black">주문대량업로드템플릿 변환</h3>
            <p className="text-gray-600 mt-2">
              YYMM_매물코칭_결산.xlsx 파일을 주문대량업로드템플릿 형식으로 변환합니다
            </p>
          </div>
        </div>
      </div>

      {/* 파일 업로드 섹션 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-black">결산 파일 업로드</h4>
            <p className="text-gray-600 mt-1">YYMM_매물코칭_결산.xlsx 파일을 업로드하세요</p>
          </div>
        </div>
        
        {!uploadedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-all duration-200 bg-gray-50">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id="settlement-file-input"
            />
            <label
              htmlFor="settlement-file-input"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-10 h-10 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black">
                  {loading === 'upload' ? '파일 처리 중...' : 'Excel 파일을 업로드하세요'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  .xlsx, .xls 파일만 지원됩니다
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-black">{fileName}</p>
                  <p className="text-sm text-gray-600">
                    변환된 데이터: {convertedData.length}건
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setConvertedData([]);
                  setFileName('');
                }}
                className="px-3 py-1 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                제거
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 변환 결과 및 다운로드 */}
      {convertedData.length > 0 && (
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-black">변환 결과</h4>
                <p className="text-gray-600 mt-1">주문대량업로드템플릿 형식으로 변환 완료</p>
              </div>
            </div>
            <button
              onClick={downloadBulkUploadTemplate}
              disabled={loading === 'convert'}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                loading === 'convert'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              }`}
            >
              {loading === 'convert' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  변환 중...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  주문대량업로드템플릿 다운로드
                </>
              )}
            </button>
          </div>

          {/* 변환된 데이터 미리보기 */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h5 className="text-lg font-semibold text-black mb-4">변환된 데이터 미리보기 (상위 5건)</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 border-b">displayId</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 border-b">nickName</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 border-b">phoneNumber</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 border-b">merchantUid</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 border-b">saleConfirmationAt</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 border-b">memo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {convertedData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-gray-900">{row.displayId || '-'}</td>
                      <td className="px-3 py-2 text-gray-900">{row.nickName}</td>
                      <td className="px-3 py-2 text-gray-900">{row.phoneNumber}</td>
                      <td className="px-3 py-2 text-gray-900">{row.merchantUid}</td>
                      <td className="px-3 py-2 text-gray-900">{row.saleConfirmationAt}</td>
                      <td className="px-3 py-2 text-gray-900">{row.memo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {convertedData.length > 5 && (
              <p className="text-sm text-gray-600 mt-3">
                ... 및 {convertedData.length - 5}건 더
              </p>
            )}
          </div>

          {/* 변환 규칙 안내 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h6 className="text-sm font-semibold text-blue-800 mb-2">변환 규칙</h6>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>displayId</strong>: 비워둠 (향후 매핑테이블 제공 시 채움)</li>
              <li>• <strong>nickName</strong>: 닉네임 컬럼 값</li>
              <li>• <strong>phoneNumber</strong>: 휴대폰번호 컬럼 값 (하이픈 포함)</li>
              <li>• <strong>merchantUid</strong>: 주문번호 컬럼 값</li>
              <li>• <strong>saleConfirmationAt</strong>: 결제일시에서 날짜만 추출 (YYYY-MM-DD)</li>
              <li>• <strong>memo</strong>: 비워둠</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadTemplate;
