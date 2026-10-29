import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import CustomerPortal from '../src/domains/delivery/CustomerPortal.tsx';

test('portal service changes immediately discard the previous customer and abort pending sign-out', async () => {
  const dom = new JSDOM('<div id="root"></div>', {url:'https://example.test'});
  const names=['window','document','navigator','HTMLElement','IS_REACT_ACT_ENVIRONMENT'];
  const old=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
  for (const n of names) Object.defineProperty(globalThis,n,{configurable:true,writable:true,value:n==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[n]});
  const root=createRoot(document.getElementById('root'));
  let signOutSignal, completeSignOut, calls=0, resolveSession;
  const service={available:true,session:async()=>({customerId:'one',displayName:'First Customer',expiresAt:new Date(Date.now()+60000).toISOString(),permissions:['delivery:read']}),list:async()=>[],respond:async()=>{},signOut:signal=>{calls++; signOutSignal=signal;return new Promise(resolve=>{completeSignOut=resolve;});}};
  try {
    await act(async()=>root.render(React.createElement(CustomerPortal,{service})));
    assert.match(document.body.textContent,/First Customer/);
    const signOut=[...document.querySelectorAll('button')].find(el=>el.textContent==='Sign out');
    await act(async()=>{signOut.click();signOut.click();});
    assert.equal(calls,1);
    assert.equal(signOut.disabled,true);
    const replacement={...service,session:()=>new Promise(resolve=>{resolveSession=resolve;})};
    await act(async()=>root.render(React.createElement(CustomerPortal,{service:replacement})));
    assert.equal(signOutSignal.aborted,true);
    assert.doesNotMatch(document.body.textContent,/First Customer/);
    await act(async()=>{completeSignOut();resolveSession({customerId:'two',displayName:'Second Customer',expiresAt:new Date(Date.now()+60000).toISOString(),permissions:['delivery:read']});});
    assert.match(document.body.textContent,/Second Customer/);
    assert.doesNotMatch(document.body.textContent,/Signed out|First Customer/);
  } finally {
    await act(async()=>root.unmount());dom.window.close();
    for(const n of names){const descriptor=old.get(n);if(descriptor)Object.defineProperty(globalThis,n,descriptor);else delete globalThis[n];}
  }
});
