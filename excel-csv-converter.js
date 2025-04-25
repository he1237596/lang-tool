const fs = require('fs-extra');
const path = require('path');
const xlsx = require('xlsx');
const iconv = require('iconv-lite');
const chardet = require('chardet');

// 自动检测文件编码
const detectEncoding = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return chardet.detect(buffer) || 'utf-8';
};

// Excel → CSV
const excelToCsv = (excelPath, csvPath, sheetName = '') => {
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  const csvContent = xlsx.utils.sheet_to_csv(sheet);

  // 写入 GBK/GB18030 编码的 CSV
  const gbkBuffer = iconv.encode(csvContent, 'gb18030');
  fs.writeFileSync(csvPath, gbkBuffer);
  console.log(`✅ Excel 转 CSV 完成：${csvPath}`);
};

// CSV → Excel（自动检测编码）
const csvToExcel = (csvPath, excelPath) => {
  const encoding = detectEncoding(csvPath);
  const buffer = fs.readFileSync(csvPath);
  const content = iconv.decode(buffer, encoding);
  const rows = content.split(/\r?\n/).map((line) => line.split(','));

  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  xlsx.writeFile(workbook, excelPath);
  console.log(`✅ CSV(${encoding}) 转 Excel 完成：${excelPath}`);
};

// CLI 参数支持
const [,, command, inputPath, outputPath, sheetName] = process.argv;

(async () => {
  if (!command || !inputPath || !outputPath) {
    console.log(`用法:
  node excel-csv-converter.js toCsv <input.xlsx> <output.csv> [sheetName]
  node excel-csv-converter.js toExcel <input.csv> <output.xlsx>`);
    process.exit(1);
  }

  if (command === 'toCsv') {
    excelToCsv(inputPath, outputPath, sheetName);
  } else if (command === 'toExcel') {
    csvToExcel(inputPath, outputPath);
  } else {
    console.log('未知命令，仅支持 toCsv / toExcel');
  }
})();
