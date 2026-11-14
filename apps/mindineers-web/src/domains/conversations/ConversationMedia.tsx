import {useEffect,useRef,useState} from 'react';
import type {Conversation,Workspace,WorkspaceUpdate} from '../../shared/contracts/workspace';
import ArtifactPreview from '../../shared/ui/ArtifactPreview';
import {saveFile,downloadFile} from '../../shared/services/files';
export default function ConversationMedia({thread,data,update}:{thread:Conversation;data:Workspace;update:WorkspaceUpdate}) {
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[recording,setRecording]=useState(false);
 const alive=useRef(true),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),pending=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(timer.current)clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop());};},[]);
 const attach=async(file:File)=>{
  if(pending.current)return;pending.current=true;setBusy(true);
  try {
   if(file.size>25*1024*1024)throw Error('Choose a file smaller than 25 MB.');
   if((thread.attachments||[]).length>=20)throw Error('Each conversation supports up to 20 attachments.');
   const id=crypto.randomUUID();await saveFile(file,id);if(!alive.current)return;
   update(current=>{
    const target=current.conversations?.find(item=>item.id===thread.id);
    if(!target||(target.attachments||[]).length>=20)return current;
    return {...current,records:{...current.records,files:[{id,name:file.name.slice(0,300),description:'',status:'Uploaded',mime:file.type,bytes:file.size,owner:current.settings.name},...(current.records.files||[])]},conversations:current.conversations!.map(item=>item.id===thread.id?{...item,attachments:[...(item.attachments||[]),id]}:item)};
   });setMessage('Attachment saved on this device. Add a transcript or description in the conversation for accessibility.');
  }catch(error){if(alive.current)setMessage(error instanceof Error?error.message:'Unable to save attachment.');}
  finally{pending.current=false;if(alive.current)setBusy(false);}
 };
 const start=async()=>{
  if(pending.current||recorder.current)return;setBusy(true);setMessage('Waiting for microphone permission…');pending.current=true;
  try {
   const input=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!alive.current){input.getTracks().forEach(track=>track.stop());return;}
   stream.current=input;const device=new MediaRecorder(input);recorder.current=device;const chunks:Blob[]=[];let bytes=0;
   device.ondataavailable=event=>{if(event.data.size){chunks.push(event.data);bytes+=event.data.size;if(bytes>20*1024*1024&&device.state==='recording')device.stop();}};
   device.onstop=()=>{if(timer.current)clearTimeout(timer.current);input.getTracks().forEach(track=>track.stop());recorder.current=null;stream.current=null;if(!alive.current)return;setRecording(false);const blob=new Blob(chunks,{type:device.mimeType});if(blob.size)void attach(new File([blob],`Voice note ${new Date().toISOString().slice(0,19).replaceAll(':','-')}.${device.mimeType.includes('mp4')?'m4a':'webm'}`,{type:device.mimeType}));else setMessage('No audio captured. Try again.');};
   device.onerror=()=>{setMessage('Recording failed. Check microphone access and try again.');if(device.state==='recording')device.stop();input.getTracks().forEach(track=>track.stop());};
   device.start(1000);setRecording(true);setMessage('Recording locally. Stop to save. Maximum duration: five minutes.');timer.current=setTimeout(()=>{if(device.state==='recording')device.stop();},300000);
  }catch(error){stream.current?.getTracks().forEach(track=>track.stop());recorder.current=null;if(alive.current)setMessage(error instanceof Error?error.message:'Microphone unavailable.');}
  finally{pending.current=false;if(alive.current)setBusy(false);}
 };
 return <details className="panel"><summary>Voice notes & attachments ({thread.attachments?.length||0})</summary>
  <p>Files stay on this device. Workspace JSON backups contain references, not file contents. Automatic transcription and shared access require a connected service.</p>
  <label>Attach a file (up to 25 MB)<input type="file" disabled={busy||recording} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void attach(file);}}/></label>
  {typeof MediaRecorder!=='undefined'&&typeof navigator.mediaDevices?.getUserMedia==='function'?<button type="button" className="button" disabled={busy} onClick={()=>recording?recorder.current?.stop():void start()}>{recording?'Stop and save voice note':'Record voice note'}</button>:<p>Recording is unavailable in this browser. Attach an existing audio file instead.</p>}
  {message&&<p role="status">{message}</p>}
  {(thread.attachments||[]).map(id=>{const file=data.records.files?.find(item=>item.id===id);return <article key={id}><h4>{file?.name||'Unavailable attachment'}</h4>{file&&<><ArtifactPreview item={file}/><label>Transcript or description<textarea maxLength={10000} value={file.description} onChange={event=>{const description=event.target.value;update(current=>({...current,records:{...current.records,files:(current.records.files||[]).map(item=>item.id===id?{...item,description}:item)}}));}}/></label><button type="button" className="button" onClick={()=>void downloadFile(id,file.name).catch(()=>setMessage('The file is unavailable on this device.'))}>Download</button></>}<button type="button" className="button" onClick={()=>update(current=>({...current,conversations:current.conversations?.map(item=>item.id===thread.id?{...item,attachments:(item.attachments||[]).filter(value=>value!==id)}:item)||[]}))}>Unlink attachment</button></article>;})}
 </details>;
}
export function ReadAloud({text}:{text:string}) {
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[speaking,setSpeaking]=useState(false);
 useEffect(()=>{if(!('speechSynthesis' in window))return;const refresh=()=>setVoices(speechSynthesis.getVoices().filter(voice=>voice.localService));refresh();speechSynthesis.addEventListener('voiceschanged',refresh);return()=>{speechSynthesis.removeEventListener('voiceschanged',refresh);speechSynthesis.cancel();};},[]);
 if(!voices.length)return null;
 return <button type="button" onClick={()=>{speechSynthesis.cancel();if(speaking){setSpeaking(false);return;}const utterance=new SpeechSynthesisUtterance(text.slice(0,10000));utterance.voice=voices[0]!;utterance.onend=utterance.onerror=()=>setSpeaking(false);speechSynthesis.speak(utterance);setSpeaking(true);}}>{speaking?'Stop reading':text.length>10000?'Read first 10,000 characters aloud':'Read aloud (device voice)'}</button>;
}
