import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

test("product screens render empty and restored data without requiring backend access", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mindineers-render-"));
  try {
    const src = fileURLToPath(new URL("../src/", import.meta.url));
    const code = `
 import React from 'react';
 import Office from '${src}Office.tsx';
 import WorkspaceManager from '${src}WorkspaceManager.tsx';
 import RecoveryPanel from '${src}domains/recovery/RecoveryPanel.tsx';
 import {initialHistory} from '${src}domains/recovery/model.ts';
 import Artifacts from '${src}Artifacts.tsx';
 import CalendarWorkspace from '${src}CalendarWorkspace.tsx';
 import Customers from '${src}Customers.tsx';
 import Conversations from '${src}Conversations.tsx';
 import MissionPlanner from '${src}MissionPlanner.tsx';
 import Connections from '${src}Connections.tsx';
 import Workbench from '${src}Workbench.tsx';
 import {renderToString} from 'react-dom/server';
 import Documents from '${src}DocumentsStudio.jsx';
 import Decisions from '${src}Decisions.jsx';
 import Admin,{Subscription} from '${src}Administration.jsx';
 import Knowledge from '${src}KnowledgeHub.jsx';
 import Engineering from '${src}EngineeringDesk.jsx';
 import Creative from '${src}CreativeStudio.jsx';
 import Runtime from '${src}RuntimeSettings.jsx';
 import Runs,{exampleRun,validateTrace} from '${src}RunWorkspace.jsx';
 import {LoadingState,ErrorState,SaveFailure,RouteBoundary} from '${src}shared/ui/AsyncState.tsx';
 import {ServiceError} from '${src}shared/services/errors.ts';
 import {Button,Field,Tabs} from '${src}shared/ui/controls.tsx';
 import ScopeSettings from '${src}domains/settings/ScopeSettings.tsx';
 import ResearchWorkspace from '${src}domains/product/ResearchWorkspace.tsx';
 import Ingestion from '${src}domains/product/Ingestion.tsx';
 import ReviewPanel from '${src}domains/product/ReviewPanel.tsx';
 import Adjudication from '${src}domains/product/Adjudication.tsx';
 import RepositoryInspector from '${src}domains/product/RepositoryInspector.tsx';
 import MarkdownPreview from '${src}domains/product/MarkdownPreview.tsx';
 import WorkflowCanvas from '${src}domains/execution/WorkflowCanvas.tsx';
 import ConfigurationDiff from '${src}domains/execution/ConfigurationDiff.tsx';
 import Triggers from '${src}domains/execution/Triggers.tsx';
 import RunReview from '${src}domains/execution/RunReview.tsx';
 import RunControls from '${src}domains/execution/RunControls.tsx';
 import Organization from '${src}domains/administration/Organization.tsx';
 import Lifecycle from '${src}domains/administration/Lifecycle.tsx';
 import BillingManagement from '${src}domains/administration/BillingManagement.tsx';
 import PermissionInspector from '${src}domains/administration/PermissionInspector.tsx';
 import IdentityJourney from '${src}domains/administration/IdentityJourney.tsx';
 import Sessions from '${src}domains/administration/Sessions.tsx';
 import AccessReview from '${src}AccessReview.jsx';
 import EvidenceMap from '${src}EvidenceMap.jsx';
 import Incidents,{newIncident} from '${src}SecurityIncidents.jsx';
 import Suggestions from '${src}DocumentSuggestions.jsx';
 import Experiments,{newScenario,newEvaluation,newImprovement} from '${src}ExperimentWorkspace.jsx';
 import Finance,{newLedger} from '${src}FinanceWorkspace.jsx';
 import Delivery,{newDelivery} from '${src}DeliveryWorkspace.jsx';
 import Operations,{newProcedure} from '${src}OperationsWorkspace.jsx';
 import Help from '${src}HelpCenter.jsx';
 import Welcome from '${src}Welcome.jsx';
 import {AccountEntry,ProfileExperience} from '${src}AccountExperience.jsx';
 import Dashboard from '${src}PersonalDashboard.jsx';
 import {GuidedTour,CoreAssistant} from '${src}WorkspaceGuide.jsx';
 import Onboarding from '${src}Onboarding.jsx';
 import CustomerTools from '${src}CustomerTools.jsx';
 import ReviewRouting from '${src}ReviewRouting.jsx';
 import {validateProduct} from '${src}product-model.js';
 const now=new Date().toISOString();
 const base={messages:[],posts:[],approvals:[],settings:{name:'Test',budget:50},projects:[],agents:[],records:{documents:[],missions:[]},product:{}};
 const populated={...base,product:{
 incidents:[newIncident()],evaluations:[newEvaluation()],scenarios:[newScenario()],improvements:[newImprovement()],ledger:[newLedger()],deliveries:[newDelivery()],procedures:[newProcedure()],
 documents:[{id:'d',name:'Doc',kind:'Document',body:'# Hello',rows:[],slides:[],comments:[],versions:[],updatedAt:now}],
 decisions:[{id:'r',name:'Request',destination:'Account',payload:'Text',scopes:[],effects:'Draft',rollback:'None',expiresAt:'2099-01-01T00:00',version:1,state:'Pending',mode:'Local review',previous:[]}],
 members:[{id:'m',name:'Member',email:'member@example.org',role:'member',state:'Invitation draft'}],roles:[],policies:[],subscription:[],
 sources:[{id:'s',kind:'source',name:'Source',url:'https://example.org',excerpt:'Evidence',collection:'General',scope:'Workspace',state:'Reference only',retrievedAt:'2026-10-23',notes:''}],
 memories:[],
 changes:[{id:'c',name:'Change',repository:'',branch:'',files:[{id:'f',path:'README.md',before:'A',after:'B'}],checks:[],comments:[],release:'',rollback:'',status:'Draft'}],
 campaigns:[{id:'c',name:'Campaign',audience:'',message:'',brand:'',channel:'Website',rights:'',origin:'User authored',variants:[],schedule:'',account:'',status:'Draft'}],
 modelProfiles:[{id:'p',name:'Model',provider:'Compatible API',model:'',endpoint:'',region:'',context:'32000',fallback:'',transfer:'Ask before cloud transfer',enabled:true}],devices:[]
 }};
 validateProduct(populated.product);
 validateTrace(exampleRun);
 validateProduct({traces:[exampleRun]});
 const screens=[Artifacts,CalendarWorkspace,Customers,Conversations,MissionPlanner,Connections,Finance,Delivery,Operations,Documents,Decisions,Admin,Subscription,Knowledge,Engineering,Creative,Runtime,Runs,Help];
 export const entryResults=[
 React.createElement(ResearchWorkspace,{data:base,update:()=>{}}),
 React.createElement(Ingestion,{data:base,update:()=>{}}),
 React.createElement(ReviewPanel,{data:base,update:()=>{},domain:'Engineering',entityId:'e',content:{}}),
 React.createElement(Adjudication,{data:base,update:()=>{},evaluation:newEvaluation()}),
 React.createElement(RepositoryInspector,{repository:'repo',refName:'main'}),
 React.createElement(MarkdownPreview,{body:'# Safe heading\\n**bold** [safe](https://example.org) [unsafe](javascript:alert) <script>attack</script>'}),
 React.createElement(WorkflowCanvas,{graph:{nodes:[{id:'n',name:'Review',type:'Agent',timeout:60,retries:0}],edges:[]},selected:'n',select:()=>{},save:()=>{}}),
 React.createElement(ConfigurationDiff,{current:{fields:{name:'Changed'}},versions:[{id:'v',at:now,values:{name:'Original'}}]}),
 React.createElement(Triggers,{data:base,update:()=>{},workflowId:'w'}),
 React.createElement(RunReview,{run:exampleRun,data:base,update:()=>{}}),
 React.createElement(RunControls,{run:exampleRun}),
 React.createElement(Organization,{data:base,update:()=>{}}),
 React.createElement(Lifecycle,{data:base,update:()=>{},provider:'github',account:'Work',scopes:[]}),
 React.createElement(BillingManagement,{data:base,update:()=>{}}),
 React.createElement(PermissionInspector),React.createElement(Sessions),
 ...['sign-in','sign-up','recovery','join'].map(intent=>React.createElement(IdentityJourney,{intent})),
 React.createElement(LoadingState),
 React.createElement(ErrorState,{error:new ServiceError('forbidden')}),
 React.createElement(SaveFailure,{retry:()=>{},exportData:()=>{}}),
 React.createElement(RouteBoundary,null,React.createElement('p',null,'Workspace content preserved')),
 React.createElement(Field,{label:'Name',value:'Example',onChange:()=>{},required:true}),
 React.createElement(Field,{label:'Mode',value:'A',options:['A','B'],onChange:()=>{}}),
 React.createElement(Field,{label:'Notes',value:'Text',type:'textarea',onChange:()=>{}}),
 React.createElement(Tabs,{values:['A','B'],value:'A',onChange:()=>{}}),
 ...[base,populated].flatMap(data=>[React.createElement(AccessReview,{data,update:()=>{},roles:[]}),React.createElement(EvidenceMap,{data,update:()=>{}}),React.createElement(Incidents,{data,update:()=>{}})]),
 React.createElement(Suggestions,{doc:populated.product.documents[0],patch:()=>{}}),
 ...[base,populated].flatMap(data=>["simulation","evaluations","improvement"].map(route=>React.createElement(Experiments,{data,route,update:()=>{}}))),
 React.createElement(CustomerTools,{items:[],update:()=>{}}),
 React.createElement(ReviewRouting,{request:populated.product.decisions[0],reviewers:[],actor:"Test",save:()=>{}}),
 React.createElement(Welcome,{theme:'Light',toggle:()=>{}}),
 ...['sign-in','sign-up','recovery','join'].map(route=>React.createElement(AccountEntry,{route,theme:'Dark',toggle:()=>{}})),
 React.createElement(ProfileExperience,{data:base,update:()=>{},startTour:()=>{}}),
 React.createElement(Dashboard,{data:base,update:()=>{},startTour:()=>{},openAssistant:()=>{}}),
 React.createElement(GuidedTour,{settings:{tour:{step:5,state:'Active'}},update:()=>{},navigate:()=>{},close:()=>{}}),
 React.createElement(CoreAssistant,{data:base,route:'home',initialPrompt:'brief me',onClose:()=>{},navigate:()=>{}}),
 React.createElement(ScopeSettings,{suite:{settings:{}},change:()=>{},entities:{}}),
 React.createElement(ScopeSettings,{suite:{settings:{Organization:{language:'French','mandatory:language':'true'},Workspace:{language:'English'}}},change:()=>{},entities:{Agent:[{id:'a',name:'Agent A'}]}}),
 React.createElement(Onboarding,{settings:{name:'You',workspace:'Test',theme:'Light',motion:false,budget:50},finish:()=>{}})
 ,React.createElement(Office,{agents:[],onSelect:()=>{},reduced:true}),
 React.createElement(WorkspaceManager,{index:{active:"test",items:[{id:"test",name:"Test"}]},activeName:"Test",onSwitch:()=>{},onCreate:()=>{},onClose:()=>{}}),
 React.createElement(RecoveryPanel,{history:initialHistory(base),restore:()=>{},blocked:false}),
 ...[base,populated].flatMap(data=>["workflows","teams","tools","settings","projects","agents"].map(route=>React.createElement(Workbench,{data,route,update:()=>{}})))
 ].map(renderToString);
 export const results=[base,populated].flatMap(data=>screens.map(Component=>renderToString(React.createElement(Component,{data,update:()=>{}}))));
 `;
    const outfile = join(dir, "screens.mjs");
    await build({
      stdin: {
        contents: code,
        resolveDir: fileURLToPath(new URL("..", import.meta.url)),
        loader: "jsx",
      },
      bundle: true,
      platform: "node",
      format: "esm",
      banner: {
        js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
      },
      outfile,
      logLevel: "silent",
    });
    const { results, entryResults } = await import(pathToFileURL(outfile).href);
    assert.equal(results.length, 38);
    assert.equal(entryResults.length, 70);
    assert.match(entryResults[5], /<strong>bold<\/strong>/);
    assert.doesNotMatch(entryResults[5], /href="javascript:|<script>/);
    assert.match(entryResults[5], /&lt;script&gt;/);
    for (const html of entryResults) assert.ok(html.length > 20);
    for (const html of results) {
      assert.ok(html.length > 300);
      assert.doesNotMatch(html, /Let’s get your workspace back/);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
