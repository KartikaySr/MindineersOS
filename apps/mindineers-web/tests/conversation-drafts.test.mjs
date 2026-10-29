import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {validateWorkspace} from '../src/storage.ts';
test('conversation composer survives switching threads and remounting, then clears only its saved draft',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});
 const names=['window','document','navigator','HTMLElement','IS_REACT_ACT_ENVIRONMENT'];
 const old=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 for(const n of names) Object.defineProperty(globalThis,n,{configurable:true,writable:true,value:n==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[n]});
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const {createRoot}=await import('react-dom/client');
 const {default:Conversations}=await import('../src/Conversations.tsx');
 let data={settings:{name:'Owner',workspace:'Test',theme:'Light',motion:false,notifications:false,budget:0},agents:[],projects:[],records:{},posts:[],approvals:[],messages:[],conversations:[{id:'one',title:'First',agent:'',context:[],createdAt:new Date().toISOString(),messages:[]},{id:'two',title:'Second',agent:'',context:[],createdAt:new Date().toISOString(),messages:[],draft:'Other draft'}]};
 let root=createRoot(document.getElementById('root'));
 const update=fn=>{data=fn(data);render();};
 const render=()=>root.render(React.createElement(Conversations,{data,update}));
 const click=async text=>{const button=[...document.querySelectorAll('button')].find(el=>el.textContent.startsWith(text));assert.ok(button);await act(async()=>button.click());};
 try{
  await act(async()=>render());
  const textarea=document.querySelector('textarea');
  await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'Keep this thought');textarea.dispatchEvent(new window.Event('input',{bubbles:true}));});
  assert.equal(data.conversations[0].draft,'Keep this thought');
  await click('Second'); assert.equal(document.querySelector('textarea').value,'Other draft');
  await click('First'); assert.equal(document.querySelector('textarea').value,'Keep this thought');
  assert.doesNotThrow(()=>validateWorkspace(data));
  await act(async()=>root.unmount());root=createRoot(document.getElementById('root'));await act(async()=>render());
  assert.equal(document.querySelector('textarea').value,'Keep this thought');
  await click('Save draft');
  assert.equal(data.conversations[0].draft,'');assert.equal(data.conversations[0].messages[0].text,'Keep this thought');assert.equal(data.conversations[1].draft,'Other draft');
 }finally{await act(async()=>root.unmount());dom.window.close();for(const n of names){const descriptor=old.get(n);if(descriptor)Object.defineProperty(globalThis,n,descriptor);else delete globalThis[n];}}
});
