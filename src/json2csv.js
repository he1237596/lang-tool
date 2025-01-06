const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const csv = require('csv-parser');

const languages = ["zh-CN", "zh-Hant", "en-US", "es", "fr", "it", "ja", "kr"];
const inputPath = path.resolve(__dirname, './source/translations');
const outputPath = path.resolve(__dirname, './output');

// 展平嵌套对象的方法，将嵌套结构展平为键路径
const flattenObject = (obj, parent = '', res = {}) => {
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const propName = parent ? `${parent}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], propName, res); // 递归展平
            } else {
                res[propName] = obj[key]?.replace(/\n/g, '\\n') || '';
            }
        }
    }
    return res;
};

// 汇总所有语言的 key 并排序
const collectAndSortKeys = () => {
    const allKeys = new Set();

    languages.forEach(lang => {
        const filePath = path.join(inputPath, `${lang}.json`);
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const flattenedData = flattenObject(jsonData);
        Object.keys(flattenedData).forEach(key => {
            allKeys.add(key); // 收集所有 key
        });
    });

    return Array.from(allKeys).sort(); // 返回排序后的键数组
};

// 读取语言文件，生成排序后的翻译对象
const loadTranslations = (sortedKeys) => {
    const translations = [];

    sortedKeys.forEach(key => {
        const row = { key }; // 初始化每一行翻译数据
        languages.forEach(lang => {
            const filePath = path.join(inputPath, `${lang}.json`);
            const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const flattenedData = flattenObject(jsonData);
            row[lang] = flattenedData[key] || ''; // 填充翻译，没有的补空字符串
        });
        translations.push(row);
    });

    return translations;
};

// JSON 转 CSV
const jsonToCsv = () => {
    const sortedKeys = collectAndSortKeys(); // 获取排序后的键
    const translations = loadTranslations(sortedKeys); // 获取排序后的翻译数据
    const fields = ['key', ...languages]; // 固定字段顺序
    const parser = new Parser({ fields });
    const csvData = parser.parse(translations);

    fs.writeFileSync(path.join(outputPath, 'translations.csv'), csvData, 'utf8');
    console.log('JSON 转 CSV 完成');
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

// CSV 转回 JSON
const csvToJson = () => {
    const results = [];
    fs.createReadStream(path.join(outputPath, 'translations.csv'))
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            languages.forEach(lang => {
                const translation = {};
                results.forEach(row => {
                    if (row[lang]) {
                        translation[row.key] = row[lang];
                    }
                });
                const sortedTranslation = sortKeys(translation); // 保证排序一致
                const unflattenedTranslation = unflattenObject(sortedTranslation); // 恢复嵌套结构
                fs.writeFileSync(path.join(inputPath, `/test/${lang}.json`), JSON.stringify(unflattenedTranslation, null, 2), 'utf8');
                console.log(`${lang}.json 已成功写入`);
            });
            console.log('CSV 转回 JSON 完成');
        })
        .on('error', (err) => {
            console.error('读取 CSV 文件时出错:', err);
        });
};

// JSON 键排序
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

// 执行转换
jsonToCsv();  // 执行 JSON 转 CSV
// csvToJson(); // 执行 CSV 转 JSON
