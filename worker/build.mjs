// 서버 코드를 Cloudflare에 붙여넣을 수 있는 파일 하나(dist/worker.js)로 묶어요.
// AI 라이브러리 안의 '컴퓨터 파일 읽기' 같은 부분은 서버에서 쓰지 않으므로 빈 껍데기로 바꿔요.
import { build } from 'esbuild';
const stubNode = {
  name: 'stub-node',
  setup(b) {
    b.onResolve({ filter: /^node:/ }, a => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'const f=()=>{throw new Error("not available on this server")};const p=new Proxy(f,{get:()=>p,apply:f});export default p;export const fs=p,path=p,os=p,crypto=p,promises=p,spawn=p,execFile=p,createInterface=p,Readable=p,promisify=p,readFile=p,writeFile=p,mkdir=p,stat=p,join=p,dirname=p,homedir=p,randomUUID=p,createHash=p;',
      loader: 'js'
    }));
  }
};
await build({
  entryPoints: ['src/index.js'], bundle: true, format: 'esm', platform: 'neutral',
  mainFields: ['browser', 'module', 'main'], conditions: ['workerd', 'worker', 'browser'],
  target: 'es2022', minify: true, outfile: 'dist/worker.js', plugins: [stubNode], logLevel: 'warning'
});
console.log('built dist/worker.js');
