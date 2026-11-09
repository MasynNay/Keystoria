/** Deterministic typing metrics and bounded local record storage.
 * No browser globals are required until the caller explicitly persists data.
 */
export const DURATIONS = Object.freeze([15, 30, 60, 120]);
export const PACKS = Object.freeze({
  everyday: {
    title: 'EVERYDAY',
    description: 'Clean, common-language words to build raw speed.',
    words: 'the and to of a in is it you that he was for on are with as I his they be at one have this from or had by not word but what some we can out other were all there when up use your how said an each she which do their time if will way about many then them would write like so these her long make thing see him two has look more day could go come did number sound no most people my over know water than call first who may down side been now find any new work part take get place made live where after back little only round man year came show every good me give our under name very through just form sentence great think say help low line differ turn cause much mean before move right boy old too same tell does set three want air well also play small end put home read hand port large spell add even land here must big high such follow act why ask men change went light kind off need house picture try us again animal point mother world near build self earth father head stand own page should country found answer school grow study still learn plant cover food sun four thought let keep eye never last door between city tree cross since hard start might story'.split(' '),
  },
  technology: {
    title: 'TECHNOLOGY',
    description: 'Typing drills inspired by the tools developers and IT teams use.',
    words: 'server client browser terminal memory kernel thread system network packet router switch cloud local remote backup restore login session access token secure firewall certificate virtual container database endpoint service process build compile deploy branch commit merge pull request function variable string object array event promise async await response request status latency cache queue endpoint method header gateway monitor process device driver update firmware hardware software folder directory file path script shell python javascript powershell linux mac windows command account password policy permissions group user domain dns dhcp subnet gateway ethernet wireless protocol socket websocket http https traffic storage disk volume partition archive checksum integrity encryption key secret public private sign validate parse format value integer boolean class module export import test assertion fixture report exception error warning debug trace log history output input library reference release repository pipeline workflow package dependency version telemetry render view state component property template cursor caret accuracy speed timing rhythm focus reliability performance profile metrics'.split(' '),
  },
  numpad: {
    title: 'NUMPAD · DIGITS',
    description: 'Practice quick number entry with 3–6 digit groups. Works with the number row or a physical numpad.',
    numeric: true,
    numericStyle: 'digits',
    words: [],
  },
  'numpad-amounts': {
    title: 'NUMPAD · AMOUNTS',
    description: 'Practice realistic decimal amounts such as 25.40 and 1098.75.',
    numeric: true,
    numericStyle: 'amounts',
    words: [],
  },
  'numpad-codes': {
    title: 'NUMPAD · CODES',
    description: 'Practice structured numeric identifiers in short groups without any real personal information.',
    numeric: true,
    numericStyle: 'codes',
    words: [],
  },
  atmosphere: {
    title: 'STORY MODE',
    description: 'Fast cinematic prose with richer words and punctuation.',
    words: 'shadows corridor tremble midnight beacon orbit signal flicker reactor storm escape mission captain rescue danger stars dark door whisper lantern mystery evidence archive secret witness footsteps silence arrival transmission shelter station pulse breach countdown detective alibi survivor oxygen captain gravity distant flickering terminal chamber hallway locked sealed ancient hallway drawing echo voices horizon cold distant flicker quiet breath courage shield approaching search discover release protect survive unlock countdown final verify prepare urgent response courage signal escape tunnel pulse silence footsteps distant hallway gravity alert danger tremble storm endless hollow bright blue green warning system secret recover rescue protect signal hope'.split(' '),
  },
});

export const isNumericPack = pack => PACKS[pack]?.numeric === true;

/** Generate fictional number-entry drills. A supplied RNG keeps tests deterministic. */
export function createNumberStream(style='digits', count=700, rng=Math.random) {
  const digit=()=>{const value=Number(rng());return String(Math.max(0,Math.min(9,Math.floor((Number.isFinite(value)?value:0)*10))));};
  const groups=[];
  for(let i=0;i<count;i++){
    if(style==='amounts') {
      const width=1+(i%4);
      groups.push(Array.from({length:width},digit).join('')+'.'+digit()+digit());
    } else if(style==='codes') {
      groups.push(Array.from({length:3+(i%3)},digit).join(''));
    } else {
      groups.push(Array.from({length:3+(i%4)},digit).join(''));
    }
  }
  return groups.join(' ');
}

export function createWordStream(pack, count = 700, rng = Math.random) {
  if(isNumericPack(pack)) return createNumberStream(PACKS[pack].numericStyle,count,rng);
  const words = PACKS[pack]?.words || PACKS.everyday.words;
  const result = [];
  for (let index = 0; index < count; index++) {
    const random = Number(rng());
    const position = Math.max(0, Math.min(words.length - 1, Math.floor((Number.isFinite(random) ? random : 0) * words.length)));
    let word = words[position];
    if (pack === 'atmosphere' && index % 23 === 22) word += '.';
    else if (pack === 'atmosphere' && index % 13 === 12) word += ',';
    result.push(word);
  }
  return result.join(' ');
}

export function scoreSpeedRun(reference, typed, seconds, keystrokes = 0) {
  const length = Math.max(0.001, seconds);
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === reference[i]) correct++;
  const elapsedMinutes = length / 60;
  const active = typed.length;
  return {
    wpm: Math.round(correct / 5 / elapsedMinutes),
    rawWpm: Math.round(active / 5 / elapsedMinutes),
    accuracy: active ? Math.round(correct / active * 100) : 100,
    correct,
    incorrect: active - correct,
    characters: active,
    keystrokes,
  };
}

/** Number entry uses actual digits/minute rather than five-character word estimates. */
export function scoreNumericRun(reference,typed,seconds,keystrokes=0) {
  const base=scoreSpeedRun(reference,typed,seconds,keystrokes);
  let digits=0,correctDigits=0;
  for(let i=0;i<typed.length;i++){
    if(/[0-9]/.test(typed[i])){
      digits++;
      if(typed[i]===reference[i]) correctDigits++;
    }
  }
  const minutes=Math.max(.001,seconds)/60;
  return {
    ...base,
    dpm:Math.round(correctDigits/minutes),
    rawDpm:Math.round(digits/minutes),
    digitAccuracy:digits?Math.round(correctDigits/digits*100):100,
    correctDigits,
    typedDigits:digits,
  };
}

const KEY = 'panic.speed.results.v1';
export function readSpeedHistory(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 25).filter(r => Number.isFinite(r.wpm)) : [];
  } catch { return []; }
}
export function saveSpeedResult(entry, storage = localStorage) {
  const history = [entry, ...readSpeedHistory(storage)].slice(0, 25);
  try { storage.setItem(KEY, JSON.stringify(history)); } catch { /* Storage may be disabled. */ }
  return history;
}
