import app from '../dist/src/api.js';

// Vercel Serverless Function 入口
export default function handler(req: any, res: any) {
  return app(req, res);
} 