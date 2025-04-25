@echo off
:: 设置 Node 脚本路径
set NODE_SCRIPT=./src/utils/excel-csv-converter.js

:: Excel 转 CSV 示例
echo start translations.xlsx to translations.csv...
node %NODE_SCRIPT% toCsv ./src/output/translations.xlsx ./src/output/translations.csv

:: CSV 转 Excel 示例
@REM echo 正在将 CSV 转为 Excel...
@REM node %NODE_SCRIPT% toExcel ./src/output/translations.csv ./src/output/translations.xlsx

echo.
echo success!
pause
