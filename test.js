// 调用 create 接口进行数据批量插入
const axios = require('axios');
const fse = require('fs-extra');
const data = fse.readJsonSync('./src/temp.json');
const apiUrl = "http://127.0.0.1:8888"
const createTranslationKeys = async (batchData) => {
  try {
    // for (const data of batchData) {
    //     const { keyName, description = '', translations } = data;
    //     const response = await axios.post(`${apiUrl}/api/projects/6/keys`, {
    //         keyName,
    //         description,
    //         translations
    //     }, {
    //       headers: {
    //           Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI1ZWI4YjNhOC0wZTUwLTQ5ZjUtYmM0NC1jNzhkYjQ5Mzg5OGUiLCJpYXQiOjE3NDMwNTk2MDUsImV4cCI6MTc0MzA2NjgwNX0.EHJBJlopFtAJovEKAYneeX-_ESVtdlkt-gRAOadsoxM'
    //       }
    //     });
    //     console.log(`翻译键 ${keyName} 已成功创建`, response.data);
    // }
    const res = await axios.post(`http://127.0.0.1:8888/api/projects/10/keys/bulk_create`, {
      data: batchData
    }, {
      headers: {
        Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI1ZWI4YjNhOC0wZTUwLTQ5ZjUtYmM0NC1jNzhkYjQ5Mzg5OGUiLCJpYXQiOjE3NDMwNTk2MDUsImV4cCI6MTc0MzA2NjgwNX0.EHJBJlopFtAJovEKAYneeX-_ESVtdlkt-gRAOadsoxM'
      }
    });
    console.log(`成功创建`, res.data);
  } catch (error) {
    console.error('创建翻译键时出错:', error);
  }
};
createTranslationKeys(data)
