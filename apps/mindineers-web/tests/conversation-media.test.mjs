import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import Media from '../src/domains/conversations/ConversationMedia.tsx';
import {validateWorkspace} from '../src/storage.ts';
test('microphone permission resolving after navigation stops all tracks without saving',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});
 const names=['window','document','navigator','HTMLElement','MediaRecorder','IS_REACT_ACT_ENVIRONMENT'];
 const old=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 for(const n of names)Object.defineProperty(globalThis,n,{configurable:true,writable:true,value:n==='IS_REACT_ACT_ENVIRONMENT'?true:n==='MediaRecorder'?class {}:dom.window[n]});
 let resolve,stopped=0,updates=0;
 Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>new Promise(done=>{resolve=done;})}});
 const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(Media,{thread:{id:'one',attachments:[]},data:{records:{}},update:()=>updates++})));
 await act(async()=>[...document.querySelectorAll('button')].find(el=>el.textContent==='Record voice note').click());
 await act(async()=>root.unmount());await act(async()=>resolve({getTracks:()=>[{stop:()=>stopped++}]}));
 assert.equal(stopped,1);assert.equal(updates,0);
 }finally{dom.window.close();for(const n of names){const descriptor=old.get(n);if(descriptor)Object.defineProperty(globalThis,n,descriptor);else delete globalThis[n];}}
});
test('workspace imports reject duplicate or excessive attachment references',()=>{
 const data={settings:{name:'QA',workspace:'Test',theme:'Light',motion:false,notifications:false,budget:0},projects:[],agents:[],records:{},messages:[],posts:[],approvals:[],conversations:[{id:'one',title:'Thread',agent:'',context:[],createdAt:'now',messages:[],attachments:['a']}]};
 assert.doesNotThrow(()=>validateWorkspace(data));data.conversations[0].attachments=['a','a'];assert.throws(()=>validateWorkspace(data),/conversations/);data.conversations[0].attachments=Array.from({length:21},(_,i)=>String(i));assert.throws(()=>validateWorkspace(data),/conversations/);
});
