/** Small, local-only Field Academy checkpoints. Never persist typed drafts. */
import { LESSONS } from './lessons.js';

const KEY='keystoria.academy.checkpoints.v1';
const MAX_ERRORS=10000;

// A lesson update can change course length. Reject stale/modified shuffles
// instead of using an out-of-bounds command index in trainingTemplate().
function validCheckpoint(os, data) {
  const length=LESSONS[os]?.commands.length;
  if(!length || !data || typeof data!=='object' || Array.isArray(data)
    || !Number.isInteger(data.index) || data.index<0 || data.index>=length
    || typeof data.answered!=='boolean'
    || !Number.isInteger(data.errors) || data.errors<0 || data.errors>MAX_ERRORS
    || !Array.isArray(data.order) || data.order.length!==length
    || data.order.some(index=>!Number.isInteger(index)||index<0||index>=length)
    || new Set(data.order).size!==length)return null;
  return {index:data.index,answered:data.answered,errors:data.errors,order:[...data.order]};
}

export function readAcademyCheckpoints(storage=globalThis.localStorage) {
  try {
    const raw=JSON.parse(storage?.getItem(KEY)||'{}');
    if(!raw || typeof raw!=='object' || Array.isArray(raw))return {};
    const saved={};
    for(const os of Object.keys(LESSONS)) {
      const value=validCheckpoint(os,raw[os]);
      if(value)saved[os]=value;
    }
    return saved;
  }catch{return {};}
}

export function readAcademyCheckpoint(os,storage=globalThis.localStorage) {
  const checkpoint=readAcademyCheckpoints(storage)[os];
  return checkpoint
    ? {...checkpoint,os,completed:false,review:false,errorMessage:'',draft:'',referenceIndex:null}
    : null;
}

export function saveAcademyCheckpoint(session,storage=globalThis.localStorage) {
  const checkpoint=validCheckpoint(session?.os,session);
  if(!checkpoint)return false;
  try {
    const all=readAcademyCheckpoints(storage);
    all[session.os]=checkpoint;
    storage.setItem(KEY,JSON.stringify(all));
    return true;
  }catch{return false;}
}

export function clearAcademyCheckpoint(os,storage=globalThis.localStorage) {
  if(!LESSONS[os])return false;
  try {
    const all=readAcademyCheckpoints(storage);
    delete all[os];
    if(Object.keys(all).length)storage.setItem(KEY,JSON.stringify(all));
    else storage.removeItem(KEY);
    return true;
  }catch{return false;}
}
