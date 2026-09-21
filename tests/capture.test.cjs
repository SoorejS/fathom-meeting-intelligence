const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { CaptureEngine, initialCaptureState } = load('src/lib/captureEngine.ts');
const { createTestMeeting, readTestCallFragment, testCallFragment } = load('src/lib/testCallMeeting.ts');
const { decodeState, applySavedState, emptyState } = load('src/lib/meetingStorage.ts');
const { findMeetingAnswer } = load('src/lib/meetingAnswers.ts');
const descriptor = () => ({ version:1, id:'test_12345678-abcd', title:'Capture integration test', date:'2026-09-21T12:00:00.000Z', duration:0, captureMode:'simulated', hasLocalAudio:false });
function harness(overrides = {}, recovered) {
  let now = Date.parse(descriptor().date), counter = 0;
  const jobs = new Map(), history = [], saved = [], audio = [];
  const deps = {
    now: () => now,
    persist: state => history.push(structuredClone(state)),
    record: async () => { throw Error('No microphone'); },
    saveAudio: async (id,blob) => { audio.push({id,blob}); },
    complete: call => saved.push(call),
    later: (callback,ms) => { const id=++counter; jobs.set(id,{callback,at:now+ms}); return id; },
    cancel: id => jobs.delete(id), ...overrides,
  };
  const engine = new CaptureEngine(deps, recovered);
  function advance(ms) {
    const end=now+ms;
    for (;;) { const next=[...jobs.entries()].filter(([,job])=>job.at<=end).sort((a,b)=>a[1].at-b[1].at)[0]; if(!next)break; now=next[1].at; jobs.delete(next[0]); next[1].callback(); }
    now=end;
  }
  function join(mode='simulated') { engine.open(); engine.join(descriptor(),30,mode); advance(900); }
  return {engine,advance,join,history,saved,audio};
}
test('consent gates capture, decline is safe, remembered approval never bypasses consent', async () => {
  let accesses=0; const h=harness({record:async()=>{accesses++;throw Error('denied');}});
  h.join('microphone'); assert.equal(h.engine.state.phase,'permission'); assert.equal(accesses,0);
  h.engine.decline(true); assert.equal(h.engine.state.phase,'declined'); assert.equal(accesses,0); assert.equal(h.saved.length,0);
  h.join('microphone'); assert.equal(h.engine.state.preference,'decline'); await h.engine.approve(true);
  assert.equal(accesses,1); assert.equal(h.engine.state.phase,'recording'); assert.equal(h.engine.state.call.captureMode,'simulated');
  assert.match(h.engine.state.message,/denied/);
  await h.engine.end(); h.advance(4000); h.join(); assert.equal(h.engine.state.phase,'permission'); assert.equal(h.engine.state.consent,false);
});
test('elapsed recording, processing, meeting intelligence and persistence share one timeline', async () => {
  const h=harness();h.join(); await h.engine.approve(false);h.advance(12340);
  assert.ok(h.engine.state.elapsed>=12);await h.engine.end();assert.equal(h.engine.state.phase,'ending');h.advance(4000);
  assert.equal(h.engine.state.phase,'complete'); assert.equal(h.saved.length,1);
  assert.deepEqual([...new Set(h.history.filter(s=>s.phase==='processing').map(s=>s.step))],[0,1,2,3,4]);
  const d=h.saved[0];assert.equal(d.duration,12.34);const m=createTestMeeting(d);
  assert.deepEqual(m.transcript.map(t=>t.timestamp),[0,5,10]);assert.equal(m.actionItems.length,1);assert.equal(m.actionItems[0].owner,'Soorej');
  const answer=findMeetingAnswer('Who owns the API migration checklist?',m);assert.match(answer.answer,/Soorej/);assert.equal(answer.citations[0].timestamp,10);
  const state=emptyState();state.generated=[d];state.meetings[d.id]={statuses:{[m.actionItems[0].id]:'completed'},highlights:[]};state.templates[d.id]='engineering';
  const restored=applySavedState([],decodeState(JSON.stringify(state),[]))[0];assert.equal(restored.duration,d.duration);assert.equal(restored.actionItems[0].status,'completed');
  assert.equal(decodeState(JSON.stringify(state),[]).templates[d.id],'engineering');
  for(const time of [...m.transcript.map(t=>t.timestamp),...m.highlights.map(t=>t.timestamp),...answer.citations.map(t=>t.timestamp)])assert.ok(time>=0&&time<=d.duration);
});
test('immediate stop and automatic target end both complete without invented future events', async () => {
  const h=harness();h.join();await h.engine.approve(false);await h.engine.end();h.advance(4000);
  const m=createTestMeeting(h.saved[0]);assert.equal(m.duration,0);assert.equal(m.actionItems.length,0);assert.equal(m.highlights.length,0);
  const a=harness();a.join();await a.engine.approve(false);a.advance(35000);assert.equal(a.saved[0].duration,30);assert.equal(a.engine.state.phase,'complete');
});
test('late microphone permission after fallback releases the stream and cannot start another recorder', async () => {
  let resolve,aborted=0;const h=harness({record:()=>new Promise(r=>resolve=r)});h.join('microphone');const pending=h.engine.approve(false);
  assert.equal(h.engine.state.phase,'acquiring');h.engine.useSimulation();resolve({stop:async()=>null,abort:()=>aborted++});await pending;
  assert.equal(aborted,1);assert.equal(h.engine.state.call.captureMode,'simulated');assert.equal(h.engine.state.phase,'recording');
});
test('local audio is preserved and never included in share metadata; empty or failed audio still completes', async () => {
  for(const blob of [new Blob(['test audio'],{type:'audio/webm'}),null]) {
    const h=harness({record:async()=>({stop:async()=>blob,abort(){}})});h.join('microphone');await h.engine.approve(false);h.advance(11000);await h.engine.end();h.advance(4000);
    assert.equal(h.saved[0].hasLocalAudio,!!blob);assert.equal(h.audio.length,blob?1:0);
    const shared=readTestCallFragment(testCallFragment(h.saved[0]));assert.equal(shared.hasLocalAudio,false);assert.equal(shared.duration,11);
    assert.equal(createTestMeeting(shared).transcript.length,3);
  }
  const failed=harness({record:async()=>({stop:async()=>{throw Error('device lost');},abort(){}})});failed.join('microphone');await failed.engine.approve(false);await failed.engine.end();failed.advance(4000);assert.equal(failed.saved.length,1);
});
test('share parser rejects malformed data and shared scenario opens without local storage', () => {
  for(const hash of ['call=not-json','call='+encodeURIComponent(JSON.stringify({...descriptor(),duration:Infinity})),'call='+encodeURIComponent(JSON.stringify({...descriptor(),id:'../../escape'}))])assert.equal(readTestCallFragment(hash),null);
  const d={...descriptor(),duration:26};const m=createTestMeeting(readTestCallFragment(testCallFragment(d)));assert.equal(m.id,d.id);assert.equal(m.actionItems.length,2);assert.ok(findMeetingAnswer('What did we decide?',m));
});
test('resumed processing is idempotent and requires no new microphone capture', () => {
  const recovered={...initialCaptureState(),phase:'processing',call:{...descriptor(),duration:23},elapsed:23,consent:true};const h=harness({},recovered);h.engine.resumeProcessing();h.engine.resumeProcessing();h.advance(4000);assert.equal(h.saved.length,1);assert.equal(h.saved[0].duration,23);
});

test('reload recovers an interrupted clock without continuing phantom microphone recording', async () => {
  const { recoverCapture }=load('src/lib/captureEngine.ts');
  const recovered=recoverCapture(JSON.stringify({...initialCaptureState(),phase:'recording',call:descriptor(),elapsed:14.25,target:30,consent:true}));
  assert.equal(recovered.phase,'interrupted');assert.equal(recovered.elapsed,14.25);
  let requested=false;const h=harness({record:async()=>{requested=true;throw Error();}},recovered);await h.engine.end();h.advance(4000);
  assert.equal(requested,false);assert.equal(h.saved[0].duration,14.25);
  assert.deepEqual(recoverCapture('{invalid'),initialCaptureState());
});

test('MediaRecorder adapter stores the final audio chunk and releases microphone tracks', async () => {
  const { startMicrophone }=load('src/lib/localRecording.ts');
  const previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const previousRecorder=globalThis.MediaRecorder;
  let stops=0,starts=0;
  const stream={getTracks:()=>[{stop:()=>stops++}]};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>stream}}});
  globalThis.MediaRecorder=class {
    state='inactive';mimeType='audio/webm';
    start(){this.state='recording';starts++;}
    stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['final audio'])});this.onstop?.();}
  };
  try {
    const recorder=await startMicrophone(new AbortController().signal);assert.equal(recorder.isActive(),true);
    const blob=await recorder.stop();assert.equal(await blob.text(),'final audio');assert.equal(stops,1);
    const cancelled=new AbortController();cancelled.abort();await assert.rejects(()=>startMicrophone(cancelled.signal));assert.equal(starts,1);assert.equal(stops,2);
  } finally { if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);else delete globalThis.navigator;globalThis.MediaRecorder=previousRecorder; }
});
