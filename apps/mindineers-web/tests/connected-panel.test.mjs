import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import ConnectedResourcePanel from '../src/shared/ui/ConnectedResourcePanel.tsx';

test('unknown command outcomes survive refresh and retry with the original identity', async () => {
  const dom = new JSDOM('<div id="root"></div>', {url:'https://example.test'});
  const names=['window','document','navigator','HTMLElement','IS_REACT_ACT_ENVIRONMENT'];
  const old=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
  for (const n of names) Object.defineProperty(globalThis,n,{configurable:true,writable:true,value:n==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[n]});
  const scope={workspaceId:'w',kind:'device',entityId:'d'};
  const commands=[];
  const service={available:true,read:async()=>({...scope,revision:'r1',state:'Ready',confirmedAt:new Date().toISOString(),warnings:[],facts:[],actions:[{id:'stop',label:'Stop device',effect:'Stop new work'}]}),command:async command=>{commands.push(command);if(commands.length===1) throw Error('timeout'); return {...command,state:'Completed',receiptId:'ack',message:'Stopped'};}};
  const root=createRoot(document.getElementById('root'));
  const click=async text=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(button,`Missing ${text}`);assert.equal(button.disabled,false);await act(async()=>button.click());};
  try {
    await act(async()=>root.render(React.createElement(ConnectedResourcePanel,{scope,title:'Device',service})));
    await click('Stop device');
    await click('Refresh status');
    assert.equal([...document.querySelectorAll('button')].some(b=>b.textContent==='Confirm action'),false,'Refreshing cancels an unsubmitted review');
    await click('Stop device');
    await click('Confirm action');
    await click('Refresh status');
    assert.equal([...document.querySelectorAll('button')].some(b=>b.textContent==='Stop device'),false);
    await click('Retry same request');
    assert.equal(commands.length,2);
    assert.deepEqual(commands[0],commands[1]);
    assert.match(document.body.textContent,/Completed.*Stopped/);
    await click('Refresh status');
    assert.equal([...document.querySelectorAll('button')].some(b=>b.textContent==='Stop device'),true);
    const replacement={...service,read:async()=>({...scope,revision:'r2',state:'Different account',confirmedAt:new Date().toISOString(),warnings:[],facts:[],actions:[]})};
    await act(async()=>root.render(React.createElement(ConnectedResourcePanel,{scope,title:'Device',service:replacement})));
    assert.match(document.body.textContent,/Different account/);
    assert.equal([...document.querySelectorAll('button')].some(b=>b.textContent==='Stop device'),false);
  } finally {
    await act(async()=>root.unmount());dom.window.close();
    for(const n of names){const descriptor=old.get(n);if(descriptor)Object.defineProperty(globalThis,n,descriptor);else delete globalThis[n];}
  }
});
