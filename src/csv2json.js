const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

const languages = ["zh-CN", "zh-Hant", "en-US", "es", "fr", "it", "ja", "kr"];
const inputPath = path.resolve(__dirname, './source');
const outputPath = path.resolve(process.cwd(), './src/output');

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

const csvToJson = () => {
    const results = [];
    fs.ensureDirSync(outputPath)
    fs.createReadStream(path.join(outputPath, 'translations.csv'))
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            languages.forEach(lang => {
                const translation = {};
                results.forEach(row => {
                    // if (row[lang]) {
                        translation[row.key] = row[lang];
                        // const unflattenedData = unflattenObject({ [row.key]: row[lang] });
                        // Object.assign(translation, unflattenedData);
                    // }
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

// 执行转换
csvToJson(); // 执行 CSV 转 JSON
