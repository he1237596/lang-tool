const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const { pinyin } = require("pinyin");
const _ = require("lodash");
// const iconv = require('iconv-lite');
const xlsx = require('xlsx');

const languages = ["zh-CN", "zh-Hant", "en-US", "es", "fr", "it", "ja", "kr"];
const inputPath = path.resolve(__dirname, './source');
const outputPath = path.resolve(process.cwd(), './src/output');
const chardet = require('chardet')
const iconv = require('iconv-lite')
// 展平嵌套对象的方法
const flattenObject = (obj, parent = '', res = {}) => {
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const propName = parent ? `${parent}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], propName, res); // 递归展平
            } else {
                res[propName] = obj[key];
            }
        }
    }
    return res;
};

// CSV 转回 JSON，处理嵌套结构
const unflattenObject = (data) => {
    const result = {};
    for (let key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const keys = key.split('.');
            keys.reduce((acc, part, index) => {
                if (index === keys.length - 1) {
                    acc[part] = data[key];
                } else {
                    acc[part] = acc[part] || {};
                }
                return acc[part];
            }, result);
        }
    }
    return result;
};
const sortKeys = (obj) => {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            sorted[key] = sortKeys(obj[key]);
        } else {
            sorted[key] = obj[key];
        }
    });
    return sorted;
};
function toCamelCase(text) {
    if (/[\u4e00-\u9fa5]/.test(text)) {
      // 如果是中文，转换为拼音
      const pinyinArray = pinyin(text, { style: pinyin.STYLE_NORMAL });
      text = pinyinArray.flat().join(" ");
    }
    return _.camelCase(text);
}
const csvToJson = () => {
    const results = [];
    fs.ensureDirSync(outputPath)
    const csvPath = path.join(outputPath, 'translations.csv')
    const encoding = chardet.detectFileSync(csvPath) || 'utf-8'
    fs.createReadStream(csvPath)
        .pipe(iconv.decodeStream(encoding))
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            languages.forEach(lang => {
                const translation = {};
                results.forEach(row => {
                    let rowKey = row.key;
                    if (!rowKey) {
                        console.log('key 不存在：', rowKey, '原始：', row[lang], '语言：', lang);
                        // rowKey = toCamelCase(row['zh-CN'] || row['en-US'])
                    } else {
                        translation[row.key] = row[lang];
                        // const unflattenedData = unflattenObject({ [row.key]: row[lang] });
                        // Object.assign(translation, unflattenedData);
                    }
                });
                const sortedTranslation = sortKeys(translation);
                fs.ensureFileSync(path.join(outputPath, `/json/${lang}.json`));
                fs.writeFileSync(path.join(outputPath, `/json/${lang}.json`), JSON.stringify(sortedTranslation, null, 2), 'utf8');
                console.log(`${lang}.json 已成功写入`);
            });
            console.log('CSV 转回 JSON 完成');
        })
        .on('error', (err) => {
            console.error('读取 CSV 文件时出错:', err);
        });
};
// 解析 Excel 文件并转换为 JSON
const excelToJson = () => {
    const filePath = path.join(outputPath, 'translations.xlsx'); // 读取 Excel 文件
    if (!fs.existsSync(filePath)) {
        console.error('找不到 Excel 文件');
        return;
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // 取第一张表
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    fs.ensureDirSync(outputPath);

    languages.forEach(lang => {
        const translation = {};
        sheet.forEach(row => {
            let rowKey = row.key;
            // console.log(rowKey);
            if (!rowKey) {
                // console.log(row)
                console.log('key 不存在：', rowKey, '转换后：', toCamelCase(row['zh-CN'] || row['en-US']), '原始：', row[lang], '语言：', lang);
                rowKey = toCamelCase(row['zh-CN'] || row['en-US'])
            }

            if (rowKey) {
               translation[rowKey] = row[lang] || '';
               if(!row.key) {
                console.log(row[lang])
               }
            }
        });

        const sortedTranslation = sortKeys(translation);
        // const unflattenedTranslation = unflattenObject(sortedTranslation);

        const outputFilePath = path.join(outputPath, `json/${lang}.json`);
        fs.ensureFileSync(outputFilePath);
        // fs.writeJsonSync(outputFilePath, unflattenedTranslation, { spaces: 2 });
        fs.writeJsonSync(outputFilePath, sortedTranslation, { spaces: 2 });
        console.log(`${lang}.json 已成功写入`);
    });

    console.log('Excel 转 JSON 完成');
};

// 执行转换
csvToJson(); // 执行 CSV 转 JSON
// excelToJson(); // 执行 Excel 转 JSON