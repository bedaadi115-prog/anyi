import cloudbase from '@cloudbase/js-sdk';

export const app = cloudbase.init({
  env: 'lvhaojie-d6ghsi9tg5fff6da9' // 用户的环境 ID
});

export const auth = app.auth({
  persistence: 'local'
});

// 使用 any 类型以支持 serverDate() 等运行时方法
export const db: any = app.database();
