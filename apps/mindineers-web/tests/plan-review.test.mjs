import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
test('plan review freezes and splits through the actual controls',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});
 const names=['window','document','navigator','HTMLElement','HTMLDialogElement','IS_REACT_ACT_ENVIRONMENT'];
 const old=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 for(const n of names)Object.defineProperty(globalThis,n,{configurable:true,writable:true,value:n==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[n]});
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const {createRoot}=await import('react-dom/client');const {default:PlanReview}=await import('../src/domains/planning/PlanReview.tsx');
 let data={settings:{name:'Owner'},records:{missions:[{id:'one',name:'Launch',description:'Deliver',status:'Planned',owner:'You'}]}};
 const root=createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(PlanReview,{data,update:fn=>{data=fn(data);render();}}));
 const click=async name=>{const element=[...document.querySelectorAll('button')].find(el=>el.textContent===name);assert.ok(element,name);await act(async()=>element.click());};
 const fill=async(label,value)=>{const el=[...document.querySelectorAll('label')].find(el=>el.textContent.startsWith(label)).querySelector('input,textarea');await act(async()=>{Object.getOwnPropertyDescriptor(el.tagName==='INPUT'?window.HTMLInputElement.prototype:window.HTMLTextAreaElement.prototype,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}));});};
 try{await act(async()=>render());await fill('Baseline name','Before launch');await click('Freeze baseline');assert.equal(data.planning.baselines.length,1);await click('Split missions');await act(async()=>document.querySelector('input[type="radio"]').click());await fill('New part names','Build\nReview');await fill('Reason for scope change','Independent verification');await click('Confirm split');assert.equal(data.records.missions.length,3);assert.equal(data.planning.changes[0].kind,'Split');assert.equal(data.planning.baselines[0].missions.length,1);}finally{await act(async()=>root.unmount());dom.window.close();for(const n of names){const descriptor=old.get(n);if(descriptor)Object.defineProperty(globalThis,n,descriptor);else delete globalThis[n];}}
});
