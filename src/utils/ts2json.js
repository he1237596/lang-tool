/* simpro ts to json */
const fs = require('fs');
const path = require('path');

const langDir = path.resolve( process.cwd(),'./src/lang'); // 替换为你的 lang 目录路径
const fileNames = []
async function main() {
    const files = fs.readdirSync(langDir);

    for (const file of files) {
        const filePath = path.join(langDir, file);
        console.log(filePath)
        // 检查文件扩展名和排除特定文件
        if (path.extname(file) !== '.json' && path.extname(file) === '.ts' && file !== 'index.ts'&& file !== 'lang.d.ts'&& file !== 'resources.ts') {
            const translations = require(filePath).default;

            // 写入对应的 JSON 文件
            const jsonFilePath = path.join(langDir, `translations/${path.basename(file, '.ts')}.json`);
            fs.writeFileSync(jsonFilePath, JSON.stringify(translations, null, 2));

            console.log(`已写入: ${jsonFilePath}`);
            fileNames.push(path.basename(file, '.ts'))
        }
    }
    console.log(JSON.stringify(fileNames))
}

main().catch(err => {
    console.error('Error:', err);
});
