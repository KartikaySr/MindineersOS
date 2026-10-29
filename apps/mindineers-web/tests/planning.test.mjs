import test from 'node:test';
import assert from 'node:assert/strict';
import {freezePlan,revisePlan,validatePlanning} from '../src/domains/planning/model.ts';
const task=(id,dependsOn=[],status='Planned')=>({id,name:id,description:'Scope',owner:'You',status,dependsOn,criteria:[{id:'c'+id,text:'Verify',done:true}]});
const workspace=missions=>({settings:{name:'Owner'},records:{missions}});
const change=(data,kind,ids,names)=>revisePlan(data,{kind,ids,names,reason:'Restructure scope',expected:JSON.stringify(data.records.missions)});
test('split retains parent acceptance and prerequisites; downstream completion is invalidated',()=>{
 const data=workspace([task('prior',[],'Done'),task('parent',['prior']),task('downstream',['parent'],'Done')]);
 const next=change(data,'Split',['parent'],['Part one','Part two']);
 const parent=next.records.missions.find(t=>t.id==='parent');
 assert.equal(parent.dependsOn.length,2);
 for(const id of parent.dependsOn) assert.deepEqual(next.records.missions.find(t=>t.id===id).dependsOn,['prior']);
 assert.equal(next.records.missions.find(t=>t.id==='downstream').status,'Draft');
 assert.equal(parent.criteria[0].done,false);
 assert.equal(data.records.missions[2].status,'Done');
 assert.doesNotThrow(()=>validatePlanning(next.planning));
});
test('merge redirects prerequisites and preserves source and affected snapshots',()=>{
 const data=workspace([task('first'),task('second',['first']),task('dependent',['second'],'Done')]);
 const next=change(data,'Merge',['first','second'],['Combined']);
 const merged=next.records.missions.find(t=>t.name==='Combined');
 assert.deepEqual(merged.dependsOn,[]);
 assert.deepEqual(next.records.missions.find(t=>t.id==='dependent').dependsOn,[merged.id]);
 assert.equal(next.planning.changes[0].before.length,3);
 assert.equal(merged.criteria.length,2);
 assert.ok(merged.criteria.every(c=>!c.done));
 assert.throws(()=>revisePlan(next,{kind:'Split',ids:[merged.id],names:['A','B'],reason:'test',expected:JSON.stringify(data.records.missions)}),/changed/);
});
test('merging across an external dependency cycle is rejected and baselines are independent copies',()=>{
 const data=workspace([task('a'),task('b',['a']),task('c',['b'])]);
 assert.throws(()=>change(data,'Merge',['a','c'],['Cycle']),/cycle/);
 const frozen=freezePlan(data,'Original');data.records.missions[0].name='Changed';
 assert.equal(frozen.planning.baselines[0].missions[0].name,'a');
 assert.doesNotThrow(()=>validatePlanning(frozen.planning));
 assert.throws(()=>validatePlanning({baselines:[{id:'bad'}],changes:[]}),/baseline/);
});
