import test from 'node:test';
import assert from 'node:assert/strict';
import {missionWorkload} from '../src/MissionViews.tsx';
test('filtered workloads resolve prerequisites against the full workspace and retain unassigned blockers',()=>{
 const all=[{id:'done',owner:'A',status:'Done'},{id:'review',owner:'A',status:'In review',dependsOn:['done']},{id:'blocked',owner:'',status:'Planned',dependsOn:['missing']}];
 assert.deepEqual(missionWorkload(all.slice(1),all),[{owner:'A',open:1,blocked:0,review:1,done:0},{owner:'Unassigned',open:1,blocked:1,review:0,done:0}]);
});
