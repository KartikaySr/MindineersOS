import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('./vercel.json',import.meta.url),'utf8'));
export default defineConfig({preview:{headers:Object.fromEntries(config.headers[0].headers.map(h=>[h.key,h.value]))}});
