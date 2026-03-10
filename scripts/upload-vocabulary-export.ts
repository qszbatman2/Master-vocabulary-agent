/**
 * 上传导出的词汇表到对象存储
 */
import { S3Storage } from 'coze-coding-dev-sdk';
import * as fs from 'fs';

async function uploadVocabularyExport() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  // 上传 JSON 文件
  const jsonContent = fs.readFileSync('/tmp/vocabulary-export.json');
  const jsonKey = await storage.uploadFile({
    fileContent: jsonContent,
    fileName: 'vocabulary/vocabulary-export.json',
    contentType: 'application/json',
  });
  console.log('JSON 文件已上传, key:', jsonKey);

  // 上传 CSV 文件
  const csvContent = fs.readFileSync('/tmp/vocabulary-export.csv');
  const csvKey = await storage.uploadFile({
    fileContent: csvContent,
    fileName: 'vocabulary/vocabulary-export.csv',
    contentType: 'text/csv',
  });
  console.log('CSV 文件已上传, key:', csvKey);

  // 生成下载链接（有效期 7 天）
  const jsonUrl = await storage.generatePresignedUrl({
    key: jsonKey,
    expireTime: 7 * 24 * 60 * 60, // 7 天
  });

  const csvUrl = await storage.generatePresignedUrl({
    key: csvKey,
    expireTime: 7 * 24 * 60 * 60, // 7 天
  });

  console.log('\n========== 下载链接（有效期 7 天）==========');
  console.log('\nJSON 格式 (2.1MB):');
  console.log(jsonUrl);
  console.log('\nCSV 格式 (788KB):');
  console.log(csvUrl);
  console.log('\n==========================================');
}

uploadVocabularyExport().catch(console.error);
