import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle, Play, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileAnalyzerProps {
  onAnalyzeComplete: (analysis: any) => void;
  initialData?: any;
  onDataChange?: (data: any) => void;
}

interface SheetData {
  sheetName: string;
  data: any[];
  headers: string[];
}

interface FileData {
  fileName: string;
  sheets: SheetData[];
  mainSheet?: SheetData;
}

interface PersonInfo {
  이름: string;
  닉네임: string;
  연락처: string;
  files: string[]; // 'file1', 'file2'
}

interface ComparisonDifference {
  type: 'row_missing' | 'row_extra' | 'value_different' | 'column_missing' | 'column_extra';
  description: string;
  file1Value?: any;
  file2Value?: any;
  rowIndex?: number;
  columnName?: string;
  details?: string;
}

interface ComparisonResult {
  file1Name: string;
  file2Name: string;
  differences: ComparisonDifference[];
  allPersons: PersonInfo[];
  summary: {
    file1Total: number;
    file2Total: number;
    matched: number;
    file1Only: number;
    file2Only: number;
    differentValues: number;
    missingColumns: number;
    extraColumns: number;
  };
}

const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ onAnalyzeComplete, initialData, onDataChange }) => {
  const [file1, setFile1] = useState<FileData | null>(initialData?.file1 || null);
  const [file2, setFile2] = useState<FileData | null>(initialData?.file2 || null);
  const [selectedSheet1, setSelectedSheet1] = useState<string>(initialData?.selectedSheet1 || '');
  const [selectedSheet2, setSelectedSheet2] = useState<string>(initialData?.selectedSheet2 || '');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(initialData?.comparisonResult || null);
  const [loading, setLoading] = useState<'file1' | 'file2' | 'compare' | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'file1' | 'file2' | 'matched' | 'file1Only' | 'file2Only'>(initialData?.activeTab || 'all');

  const readFileData = async (file: File): Promise<FileData> => {
    const data = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsArrayBuffer(file);
    });

    const workbook = XLSX.read(data, { type: 'array' });
    const sheets: SheetData[] = [];

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        // 데이터를 객체 배열로 변환
        const data = rows.map((row: unknown) => {
          const rowArray = row as any[];
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = rowArray[index] || '';
          });
          return obj;
        });

        sheets.push({
          sheetName,
          headers,
          data
        });
      }
    });

    return {
      fileName: file.name,
      sheets,
      mainSheet: sheets[0] // 기본값으로 첫 번째 시트 설정
    };
  };

  const handleFileUpload = async (file: File, fileNumber: 1 | 2) => {
    setLoading(fileNumber === 1 ? 'file1' : 'file2');
    
    try {
      const fileData = await readFileData(file);
      
      if (fileNumber === 1) {
        handleFile1Change(fileData);
        handleSelectedSheet1Change(fileData.sheets[0]?.sheetName || '');
      } else {
        handleFile2Change(fileData);
        handleSelectedSheet2Change(fileData.sheets[0]?.sheetName || '');
      }
      
    } catch (error) {
      console.error('파일 분석 오류:', error);
      alert(`파일 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(null);
    }
  };

  const compareFiles = async () => {
    if (!file1 || !file2 || !selectedSheet1 || !selectedSheet2) {
      alert('두 파일을 모두 업로드하고 시트를 선택해주세요.');
      return;
    }

    const sheet1Data = file1.sheets.find(s => s.sheetName === selectedSheet1);
    const sheet2Data = file2.sheets.find(s => s.sheetName === selectedSheet2);

    if (!sheet1Data || !sheet2Data) {
      alert('선택된 시트를 찾을 수 없습니다.');
      return;
    }

    setLoading('compare');
    
    try {
      const differences: ComparisonDifference[] = [];
      const file1Data = sheet1Data.data;
      const file2Data = sheet2Data.data;
      const file1Headers = sheet1Data.headers;
      const file2Headers = sheet2Data.headers;

      // 1. 컬럼 차이점 확인
      const missingColumnsInFile2 = file1Headers.filter(h => !file2Headers.includes(h));
      const extraColumnsInFile2 = file2Headers.filter(h => !file1Headers.includes(h));

      missingColumnsInFile2.forEach(column => {
        differences.push({
          type: 'column_missing',
          description: `파일2에 없는 컬럼: ${column}`,
          columnName: column,
          details: '파일1에는 있지만 파일2에는 없는 컬럼입니다.'
        });
      });

      extraColumnsInFile2.forEach(column => {
        differences.push({
          type: 'column_extra',
          description: `파일2에만 있는 컬럼: ${column}`,
          columnName: column,
          details: '파일2에는 있지만 파일1에는 없는 컬럼입니다.'
        });
      });

      // 2. 행 개수 차이 확인
      if (file1Data.length !== file2Data.length) {
        differences.push({
          type: 'row_missing',
          description: `행 개수 차이: 파일1(${file1Data.length}행) vs 파일2(${file2Data.length}행)`,
          details: `파일1과 파일2의 행 개수가 다릅니다.`
        });
      }

      // 3. 이름 기준으로 행 비교
      
      // 유효한 데이터만 필터링 (이름이 있는 행만)
      const validFile1Data = file1Data.filter(row => row.이름 && String(row.이름).trim() !== '');
      const validFile2Data = file2Data.filter(row => row.이름 && String(row.이름).trim() !== '');
      
      // 파일1의 각 행을 파일2에서 찾기 (이름 기준)
      validFile1Data.forEach((row1, index1) => {
        const name1 = String(row1.이름 || '').trim();
        const phone1 = String(row1.휴대폰번호 || row1.번호 || '').trim();
        const nickname1 = String(row1.닉네임 || '').trim();
        
        const matchingRow2 = validFile2Data.find(row2 => {
          const name2 = String(row2.이름 || '').trim();
          return name1 === name2 && name1 !== '';
        });

        if (!matchingRow2) {
          differences.push({
            type: 'row_missing',
            description: `파일2에서 찾을 수 없는 사람: ${name1}`,
            file1Value: { 이름: name1, 휴대폰번호: phone1, 닉네임: nickname1 },
            rowIndex: index1 + 1,
            details: `파일1에는 있지만 파일2에는 없는 사람입니다. (${phone1}, ${nickname1})`
          });
        } else {
          // 값 비교
          const phone2 = String(matchingRow2.휴대폰번호 || matchingRow2.번호 || '').trim();
          const nickname2 = String(matchingRow2.닉네임 || '').trim();
          
          if (phone1 !== phone2) {
            differences.push({
              type: 'value_different',
              description: `전화번호가 다른 사람: ${name1}`,
              file1Value: phone1,
              file2Value: phone2,
              rowIndex: index1 + 1,
              columnName: '휴대폰번호',
              details: `${name1}의 전화번호가 다릅니다.`
            });
          }
          
          if (nickname1 !== nickname2) {
            differences.push({
              type: 'value_different',
              description: `닉네임이 다른 사람: ${name1}`,
              file1Value: nickname1,
              file2Value: nickname2,
              rowIndex: index1 + 1,
              columnName: '닉네임',
              details: `${name1}의 닉네임이 다릅니다.`
            });
          }
        }
      });

      // 파일2의 각 행을 파일1에서 찾기 (이름 기준)
      validFile2Data.forEach((row2, index2) => {
        const name2 = String(row2.이름 || '').trim();
        const phone2 = String(row2.휴대폰번호 || row2.번호 || '').trim();
        const nickname2 = String(row2.닉네임 || '').trim();
        
        const matchingRow1 = validFile1Data.find(row1 => {
          const name1 = String(row1.이름 || '').trim();
          return name1 === name2 && name1 !== '';
        });

        if (!matchingRow1) {
          differences.push({
            type: 'row_extra',
            description: `파일1에서 찾을 수 없는 사람: ${name2}`,
            file2Value: { 이름: name2, 휴대폰번호: phone2, 닉네임: nickname2 },
            rowIndex: index2 + 1,
            details: `파일2에는 있지만 파일1에는 없는 사람입니다. (${phone2}, ${nickname2})`
          });
        }
      });

      // 모든 사람 정보 수집
      const allPersonsMap = new Map<string, PersonInfo>();
      
      // 파일1 데이터 추가
      validFile1Data.forEach(row1 => {
        const name = String(row1.이름 || '').trim();
        const nickname = String(row1.닉네임 || '').trim();
        const phone = String(row1.휴대폰번호 || row1.번호 || '').trim();
        
        if (name) {
          allPersonsMap.set(name, {
            이름: name,
            닉네임: nickname,
            연락처: phone,
            files: ['file1']
          });
        }
      });
      
      // 파일2 데이터 추가/업데이트
      validFile2Data.forEach(row2 => {
        const name = String(row2.이름 || '').trim();
        const nickname = String(row2.닉네임 || '').trim();
        const phone = String(row2.휴대폰번호 || row2.번호 || '').trim();
        
        if (name) {
          if (allPersonsMap.has(name)) {
            // 이미 있는 사람이면 file2 추가
            const existing = allPersonsMap.get(name)!;
            existing.files.push('file2');
            // 정보가 다르면 업데이트 (최신 정보로)
            if (nickname) existing.닉네임 = nickname;
            if (phone) existing.연락처 = phone;
          } else {
            // 새로운 사람이면 추가
            allPersonsMap.set(name, {
              이름: name,
              닉네임: nickname,
              연락처: phone,
              files: ['file2']
            });
          }
        }
      });
      
      const allPersons = Array.from(allPersonsMap.values()).sort((a, b) => a.이름.localeCompare(b.이름));
      
      // 매칭된 사람 수 계산
      const matchedNames = new Set();
      validFile1Data.forEach(row1 => {
        const name1 = String(row1.이름 || '').trim();
        const matchingRow2 = validFile2Data.find(row2 => {
          const name2 = String(row2.이름 || '').trim();
          return name1 === name2 && name1 !== '';
        });
        if (matchingRow2) {
          matchedNames.add(name1);
        }
      });

      // 요약 통계 계산 (allPersons 기반으로 일관성 유지)
      const file1OnlyCount = allPersons.filter(person => person.files.includes('file1') && !person.files.includes('file2')).length;
      const file2OnlyCount = allPersons.filter(person => !person.files.includes('file1') && person.files.includes('file2')).length;
      
      const summary = {
        file1Total: validFile1Data.length,
        file2Total: validFile2Data.length,
        matched: matchedNames.size,
        file1Only: file1OnlyCount,
        file2Only: file2OnlyCount,
        differentValues: differences.filter(d => d.type === 'value_different').length,
        missingColumns: differences.filter(d => d.type === 'column_missing').length,
        extraColumns: differences.filter(d => d.type === 'column_extra').length
      };

      const result: ComparisonResult = {
        file1Name: file1.fileName,
        file2Name: file2.fileName,
        differences,
        allPersons,
        summary
      };

      handleComparisonResultChange(result);
      onAnalyzeComplete(result);
      
    } catch (error) {
      console.error('파일 비교 오류:', error);
      alert(`파일 비교 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(null);
    }
  };

  const downloadComparisonResult = () => {
    if (!comparisonResult) return;
    
    const workbook = XLSX.utils.book_new();
    
    // 차이점 요약 시트
    const summaryData = [
      ['결과파일 비교 분석'],
      [''],
      ['파일1', comparisonResult.file1Name],
      ['파일2', comparisonResult.file2Name],
      [''],
      ['결과파일1 총 건수', comparisonResult.summary.file1Total],
      ['결과파일2 총 건수', comparisonResult.summary.file2Total],
      ['동일한 사람', comparisonResult.summary.matched],
      ['파일1에만 있는 사람', comparisonResult.summary.file1Only],
      ['파일2에만 있는 사람', comparisonResult.summary.file2Only],
      ['누락된 컬럼', comparisonResult.summary.missingColumns],
      ['추가된 컬럼', comparisonResult.summary.extraColumns],
      [''],
      ['상세 차이점'],
      ['타입', '설명', '행번호', '컬럼명', '파일1값', '파일2값', '상세내용'],
      ...comparisonResult.differences.map(diff => [
        diff.type,
        diff.description,
        diff.rowIndex || '',
        diff.columnName || '',
        typeof diff.file1Value === 'object' ? JSON.stringify(diff.file1Value) : (diff.file1Value || ''),
        typeof diff.file2Value === 'object' ? JSON.stringify(diff.file2Value) : (diff.file2Value || ''),
        diff.details || ''
      ])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '비교결과요약');

    // 상세 사람 목록 시트
    const personsData = [
      ['이름', '닉네임', '연락처', '결과파일1', '결과파일2'],
      ...comparisonResult.allPersons.map(person => [
        person.이름,
        person.닉네임 || '',
        person.연락처 || '',
        person.files.includes('file1') ? 'O' : '',
        person.files.includes('file2') ? 'O' : ''
      ])
    ];

    const personsSheet = XLSX.utils.aoa_to_sheet(personsData);
    XLSX.utils.book_append_sheet(workbook, personsSheet, '상세사람목록');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `결과파일_비교분석_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canCompare = file1 && file2 && selectedSheet1 && selectedSheet2;

  // 활성 탭에 따른 필터링된 데이터
  const getFilteredPersons = () => {
    if (!comparisonResult) return [];
    
    switch (activeTab) {
      case 'file1':
        return comparisonResult.allPersons.filter(person => person.files.includes('file1'));
      case 'file2':
        return comparisonResult.allPersons.filter(person => person.files.includes('file2'));
      case 'matched':
        return comparisonResult.allPersons.filter(person => person.files.includes('file1') && person.files.includes('file2'));
      case 'file1Only':
        return comparisonResult.allPersons.filter(person => person.files.includes('file1') && !person.files.includes('file2'));
      case 'file2Only':
        return comparisonResult.allPersons.filter(person => !person.files.includes('file1') && person.files.includes('file2'));
      case 'all':
      default:
        return comparisonResult.allPersons;
    }
  };

  const filteredPersons = getFilteredPersons();

  // 상태 변경 시 외부로 데이터 전달
  const updateExternalData = (newData: any) => {
    if (onDataChange) {
      onDataChange({
        file1,
        file2,
        selectedSheet1,
        selectedSheet2,
        comparisonResult,
        activeTab,
        ...newData
      });
    }
  };

  // 상태 변경 시 외부 데이터 업데이트
  const handleFile1Change = (newFile1: FileData | null) => {
    setFile1(newFile1);
    updateExternalData({ file1: newFile1 });
  };

  const handleFile2Change = (newFile2: FileData | null) => {
    setFile2(newFile2);
    updateExternalData({ file2: newFile2 });
  };

  const handleSelectedSheet1Change = (newSheet1: string) => {
    setSelectedSheet1(newSheet1);
    updateExternalData({ selectedSheet1: newSheet1 });
  };

  const handleSelectedSheet2Change = (newSheet2: string) => {
    setSelectedSheet2(newSheet2);
    updateExternalData({ selectedSheet2: newSheet2 });
  };

  const handleComparisonResultChange = (newResult: ComparisonResult | null) => {
    setComparisonResult(newResult);
    updateExternalData({ comparisonResult: newResult });
  };

  const handleActiveTabChange = (newTab: 'all' | 'file1' | 'file2' | 'matched' | 'file1Only' | 'file2Only') => {
    setActiveTab(newTab);
    updateExternalData({ activeTab: newTab });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black">결과파일 비교 분석</h3>
            <p className="text-gray-600 mt-2">
              두 개의 결과파일 엑셀을 업로드하여 차이점을 찾아보세요
            </p>
          </div>
        </div>
      </div>

      {/* 파일 업로드 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파일 1 업로드 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-black mb-4 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-gray-600" />
            결과파일 1
          </h4>
          
          {!file1 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 1);
                }}
                className="hidden"
                id="file1-input"
              />
              <label
                htmlFor="file1-input"
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <div className="p-4 bg-gray-100 rounded-full">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-black">
                    {loading === 'file1' ? '파일 분석 중...' : 'Excel 파일을 업로드하세요'}
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
                    <p className="font-semibold text-black">{file1.fileName}</p>
                    <p className="text-sm text-gray-600">
                      메인 시트: {file1.mainSheet?.sheetName} ({file1.mainSheet?.data.length}행)
                    </p>
                  </div>
                </div>
                    <button
                      onClick={() => {
                        handleFile1Change(null);
                        handleSelectedSheet1Change('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      제거
                    </button>
              </div>
              
              <div className="space-y-4">
                {/* 시트 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    비교할 시트 선택
                  </label>
                      <select
                        value={selectedSheet1}
                        onChange={(e) => handleSelectedSheet1Change(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200"
                      >
                    {file1.sheets.map((sheet) => (
                      <option key={sheet.sheetName} value={sheet.sheetName}>
                        {sheet.sheetName} ({sheet.data.length}행)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 선택된 시트의 컬럼 구조 */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">컬럼 구조:</p>
                  <div className="flex flex-wrap gap-1">
                    {file1.sheets.find(s => s.sheetName === selectedSheet1)?.headers.slice(0, 6).map((header, index) => (
                      <span key={index} className="bg-white px-2 py-1 rounded text-xs border">
                        {header}
                      </span>
                    ))}
                    {file1.sheets.find(s => s.sheetName === selectedSheet1)?.headers && 
                     file1.sheets.find(s => s.sheetName === selectedSheet1)!.headers.length > 6 && (
                      <span className="bg-white px-2 py-1 rounded text-xs border">
                        +{file1.sheets.find(s => s.sheetName === selectedSheet1)!.headers.length - 6}개
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 파일 2 업로드 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-black mb-4 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-gray-600" />
            결과파일 2
          </h4>
          
          {!file2 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 2);
                }}
                className="hidden"
                id="file2-input"
              />
              <label
                htmlFor="file2-input"
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <div className="p-4 bg-gray-100 rounded-full">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-black">
                    {loading === 'file2' ? '파일 분석 중...' : 'Excel 파일을 업로드하세요'}
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
                    <p className="font-semibold text-black">{file2.fileName}</p>
                    <p className="text-sm text-gray-600">
                      메인 시트: {file2.mainSheet?.sheetName} ({file2.mainSheet?.data.length}행)
                    </p>
                  </div>
                </div>
                    <button
                      onClick={() => {
                        handleFile2Change(null);
                        handleSelectedSheet2Change('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      제거
                    </button>
              </div>
              
              <div className="space-y-4">
                {/* 시트 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    비교할 시트 선택
                  </label>
                      <select
                        value={selectedSheet2}
                        onChange={(e) => handleSelectedSheet2Change(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200"
                      >
                    {file2.sheets.map((sheet) => (
                      <option key={sheet.sheetName} value={sheet.sheetName}>
                        {sheet.sheetName} ({sheet.data.length}행)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 선택된 시트의 컬럼 구조 */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">컬럼 구조:</p>
                  <div className="flex flex-wrap gap-1">
                    {file2.sheets.find(s => s.sheetName === selectedSheet2)?.headers.slice(0, 6).map((header, index) => (
                      <span key={index} className="bg-white px-2 py-1 rounded text-xs border">
                        {header}
                      </span>
                    ))}
                    {file2.sheets.find(s => s.sheetName === selectedSheet2)?.headers && 
                     file2.sheets.find(s => s.sheetName === selectedSheet2)!.headers.length > 6 && (
                      <span className="bg-white px-2 py-1 rounded text-xs border">
                        +{file2.sheets.find(s => s.sheetName === selectedSheet2)!.headers.length - 6}개
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 비교 실행 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={compareFiles}
          disabled={!canCompare || loading === 'compare'}
          className={`flex items-center px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300 ${
            canCompare && loading !== 'compare'
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading === 'compare' ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              비교 중...
            </>
          ) : (
            <>
              <Play className="w-6 h-6 mr-3" />
              결과파일 비교 실행
            </>
          )}
        </button>
      </div>

      {!canCompare && (
        <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-700 font-medium">
            두 개의 결과파일을 모두 업로드해주세요.
          </p>
        </div>
      )}

      {/* 비교 결과 */}
      {comparisonResult && (
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-black flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-gray-600" />
              비교 결과
            </h4>
            <button
              onClick={downloadComparisonResult}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              비교결과 다운로드
            </button>
          </div>

          {/* 요약 통계 - 클릭 가능한 탭 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div 
              className={`p-4 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                activeTab === 'file1' 
                  ? 'bg-blue-100 border-blue-400 shadow-md' 
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
                  onClick={() => handleActiveTabChange('file1')}
            >
              <p className="text-2xl font-bold text-blue-600">{comparisonResult.summary.file1Total}</p>
              <p className="text-sm text-blue-600">결과파일1 총 건수</p>
            </div>
            <div 
              className={`p-4 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                activeTab === 'file2' 
                  ? 'bg-green-100 border-green-400 shadow-md' 
                  : 'bg-green-50 border-green-200 hover:bg-green-100'
              }`}
                  onClick={() => handleActiveTabChange('file2')}
            >
              <p className="text-2xl font-bold text-green-600">{comparisonResult.summary.file2Total}</p>
              <p className="text-sm text-green-600">결과파일2 총 건수</p>
            </div>
            <div 
              className={`p-4 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                activeTab === 'matched' 
                  ? 'bg-purple-100 border-purple-400 shadow-md' 
                  : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
              }`}
                  onClick={() => handleActiveTabChange('matched')}
            >
              <p className="text-2xl font-bold text-purple-600">{comparisonResult.summary.matched}</p>
              <p className="text-sm text-purple-600">동일한 사람</p>
            </div>
            <div 
              className={`p-4 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                activeTab === 'file1Only' 
                  ? 'bg-red-100 border-red-400 shadow-md' 
                  : 'bg-red-50 border-red-200 hover:bg-red-100'
              }`}
                  onClick={() => handleActiveTabChange('file1Only')}
            >
              <p className="text-2xl font-bold text-red-600">{comparisonResult.summary.file1Only}</p>
              <p className="text-sm text-red-600">파일1에만 있는 사람</p>
            </div>
            <div 
              className={`p-4 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                activeTab === 'file2Only' 
                  ? 'bg-orange-100 border-orange-400 shadow-md' 
                  : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
              }`}
                  onClick={() => handleActiveTabChange('file2Only')}
            >
              <p className="text-2xl font-bold text-orange-600">{comparisonResult.summary.file2Only}</p>
              <p className="text-sm text-orange-600">파일2에만 있는 사람</p>
            </div>
          </div>

          {/* 상세 차이점 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-lg font-semibold text-black">상세 목록</h5>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  현재 표시: {
                    activeTab === 'all' ? '전체' :
                    activeTab === 'file1' ? '결과파일1' :
                    activeTab === 'file2' ? '결과파일2' :
                    activeTab === 'matched' ? '동일한 사람' :
                    activeTab === 'file1Only' ? '파일1에만 있는 사람' :
                    activeTab === 'file2Only' ? '파일2에만 있는 사람' : '전체'
                  }
                </span>
                <span className="text-sm font-medium text-black">
                  ({filteredPersons.length}건)
                </span>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredPersons.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-green-600">선택된 조건에 해당하는 데이터가 없습니다.</p>
                  <p className="text-gray-600">다른 탭을 클릭해보세요.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">파일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPersons.map((person, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {person.이름}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {person.닉네임 || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {person.연락처 || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex flex-wrap gap-1">
                              {person.files.includes('file1') && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  결과파일1
                                </span>
                              )}
                              {person.files.includes('file2') && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  결과파일2
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileAnalyzer;
