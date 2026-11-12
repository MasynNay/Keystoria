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
  numpad: {title:'NUMPAD',description:'Timed number-pad drills. Type digits and use Space or Numpad Enter between groups.',words:[]},
  atmosphere: {
    title: 'STORY MODE',
    description: 'Fast cinematic prose with richer words and punctuation.',
    words: 'shadows corridor tremble midnight beacon orbit signal flicker reactor storm escape mission captain rescue danger stars dark door whisper lantern mystery evidence archive secret witness footsteps silence arrival transmission shelter station pulse breach countdown detective alibi survivor oxygen captain gravity distant flickering terminal chamber hallway locked sealed ancient hallway drawing echo voices horizon cold distant flicker quiet breath courage shield approaching search discover release protect survive unlock countdown final verify prepare urgent response courage signal escape tunnel pulse silence footsteps distant hallway gravity alert danger tremble storm endless hollow bright blue green warning system secret recover rescue protect signal hope'.split(' '),
  },
  legal: {
    title: 'LEGAL',
    professional: true,
    description: 'General legal-office vocabulary for documents, filing, and court administration; not legal advice.',
    words: 'affidavit agreement allegation amendment appeal applicant archive arbitration attorney authorization bailiff brief calendar case citation claimant clerk client compliance contract counsel court custody declaration decree defendant deposition discovery disclosure docket evidence exhibit filing hearing injunction jurisdiction judgment jury legislation litigation mediation memorandum motion notice objection ordinance order paralegal petition plaintiff precedent procedure provision record regulation release remedy renewal request respondent review ruling schedule settlement signature statute subpoena summons testimony transcript trial trustee verification verdict waiver witness worksheet'.split(' '),
  },
  education: {
    title: 'EDUCATION',
    professional: true,
    description: 'School and education administration words for everyday professional communication.',
    words: 'academic accommodation activity admission advisor assessment assignment attendance benchmark bulletin campus certificate classroom collaboration college conference curriculum deadline department diploma discussion enrollment evaluation faculty feedback grade graduation guardian handbook homework instruction learning lecture lesson library literacy mentor objective orientation outcome parent participation pedagogy policy portfolio principal program progress project registrar report resource review rubric schedule scholarship school semester session student syllabus teacher teaching textbook timetable transcript training tutorial university workshop'.split(' '),
  },
  government: {
    title: 'GOVERNMENT',
    professional: true,
    description: 'Municipal and public-service vocabulary for records, utilities, and community operations.',
    words: 'agenda allocation annexation application archive assessment authority ballot board budget building capital charter city citizen clerk code commission committee community compliance council county district documentation election enforcement engineering facility finance fire funding hearing inspection infrastructure jurisdiction licensing maintenance meeting municipal notice ordinance oversight parks permit planning policy procurement project property public records recreation report request resolution review safety service session sewer sidewalk signage staff street survey tax transportation utilities utility variance water zoning'.split(' '),
  },
  healthcare: {
    title: 'HEALTHCARE ADMIN',
    professional: true,
    description: 'Non-clinical healthcare administration terms; no patient records or diagnostic content.',
    words: 'admission appointment authorization availability benefit billing calendar cancellation capacity care center checklist claim clinic confirmation consent contact coordination copayment coverage credential customer deadline department directory discharge documentation eligibility enrollment estimate examination facility finance form frontdesk guideline intake insurance invoice laboratory letter location logistics medical message notification office operations outpatient payment pharmacy policy portal privacy procedure processing provider reception record referral registration reminder request reschedule resource review roster schedule screening service shift specialist statement support telehealth timetable tracking transfer transportation verification visit waiting wellness workflow'.split(' '),
  },
  finance: {
    title: 'FINANCE',
    professional: true,
    description: 'Business finance and accounting vocabulary for reporting, budgets, and transactions.',
    words: 'account accounting accrual allocation amortization analysis annual asset audit authorization balance bank banking benchmark billing budget capital cash category charge closing collection commission compliance contract cost credit currency customer debit deduction deposit depreciation dividend earnings equity expense fee finance fiscal forecast funding income interest inventory invoice journal ledger liability margin maturity monthly net operating payment payroll payable performance portfolio posting pricing profit purchase quarter receipt receivable reconciliation record refund report reserve revenue review risk savings schedule settlement statement subtotal tax taxable transaction transfer treasury variance vendor verification voucher worksheet yearly yield'.split(' '),
  },
  hospitality: {
    title: 'HOSPITALITY',
    professional: true,
    description: 'Guest service, travel, reception, and hospitality operations vocabulary.',
    words: 'accommodation arrival assistant availability banquet booking brochure cancellation capacity catering checkin checkout confirmation concierge contact courtesy customer departure desk destination dining directory discount event excursion feedback frontdesk greeting group guest housekeeping itinerary kitchen laundry location lodging lounge loyalty luggage maintenance management manager meal menu message occupancy offer operations order package payment policy preference preparation pricing reception recommendation refund registration reservation restaurant review room roster schedule seating service shift shuttle special staff stay support survey table ticket timetable tourism transportation travel upgrade vacancy vendor venue visitor welcome wellness workshop'.split(' '),
  },
});

export function createWordStream(pack, count = 700, rng = Math.random) {
  if (pack === 'numpad') {
    const groups=[];
    for(let i=0;i<count;i++){
      let group='';
      for(let j=0;j<3+(i%4);j++){
        const n=Number(rng());
        group+=String(Math.min(9,Math.max(0,Math.floor((Number.isFinite(n)?n:0)*10))));
      }
      groups.push(group);
    }
    return groups.join(' ');
  }
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
