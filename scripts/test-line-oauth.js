#!/usr/bin/env node

/**
 * LINE OAuth設定テストスクリプト
 * 環境変数が正しく設定されているかチェック
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkEnvFile(filePath, envName) {
  console.log(`\n=== ${envName} 環境変数チェック ===`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${filePath} が見つかりません`);
    return false;
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const hasLineClientId = envContent.includes('LINE_CLIENT_ID');
  const hasLineClientSecret = envContent.includes('LINE_CLIENT_SECRET');
  const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL');
  
  console.log(`LINE_CLIENT_ID: ${hasLineClientId ? '✅' : '❌'}`);
  console.log(`LINE_CLIENT_SECRET: ${hasLineClientSecret ? '✅' : '❌'}`);
  console.log(`NEXTAUTH_URL: ${hasNextAuthUrl ? '✅' : '❌'}`);
  
  return hasLineClientId && hasLineClientSecret && hasNextAuthUrl;
}

function main() {
  console.log('LINE OAuth設定チェック開始...\n');
  
  const rootDir = path.resolve(__dirname, '..');
  const devEnvPath = path.join(rootDir, '.env.development');
  const prodEnvPath = path.join(rootDir, '.env.production');
  const mainEnvPath = path.join(rootDir, '.env');
  
  // 各環境の設定をチェック
  const devOk = checkEnvFile(devEnvPath, '開発');
  const prodOk = checkEnvFile(prodEnvPath, '本番');
  const mainOk = checkEnvFile(mainEnvPath, 'メイン');
  
  console.log('\n=== 設定ファイルチェック ===');
  console.log(`LINE_OAUTH_SETUP.md: ${fs.existsSync(path.join(rootDir, 'LINE_OAUTH_SETUP.md')) ? '✅' : '❌'}`);
  
  console.log('\n=== 必要なコールバックURL ===');
  console.log('開発環境: http://localhost:3001/api/auth/callback/line');
  console.log('本番環境: https://your-domain.com/api/auth/callback/line');
  
  console.log('\n=== 次のステップ ===');
  console.log('1. LINE Developer Console でチャンネル作成');
  console.log('2. 環境変数ファイルに実際の値を設定');
  console.log('3. pnpm dev:guest でテスト実行');
  
  if (devOk && prodOk && mainOk) {
    console.log('\n✅ 環境変数設定の準備完了');
    process.exit(0);
  } else {
    console.log('\n❌ 環境変数設定に不備があります');
    process.exit(1);
  }
}

main();