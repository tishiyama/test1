// index.mjs
const VOWELS = new Set(['A','E','I','O','U','Y']); // Yを母音扱いにする流儀もある
const MAP = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};

function sumDigitsKeepMaster(n){
  const masters = new Set([11,22,33]);
  while(n > 9 && !masters.has(n)){
    n = String(n).split('').reduce((a,d)=>a+Number(d),0);
  }
  return n;
}

// "Taro Yamada" -> ピタゴラス式合計（英字のみ）
function reduceNameToNumber(name){
  const letters = name.toUpperCase().replace(/[^A-Z]/g,'').split('');
  const total = letters.reduce((a,ch)=> a + (MAP[ch] || 0), 0);
  return { total, reduced: sumDigitsKeepMaster(total) };
}

function splitVowelConsonant(name){
  const letters = name.toUpperCase().replace(/[^A-Z]/g,'').split('');
  const vowelSum = letters.filter(ch => VOWELS.has(ch)).reduce((a,ch)=> a + (MAP[ch]||0), 0);
  const consSum  = letters.filter(ch => !VOWELS.has(ch)).reduce((a,ch)=> a + (MAP[ch]||0), 0);
  return {
    vowel: { total: vowelSum, reduced: sumDigitsKeepMaster(vowelSum) },
    consonant: { total: consSum, reduced: sumDigitsKeepMaster(consSum) }
  };
}

function lifePathFromBirthdate(birthdate){
  // 期待フォーマット YYYY-MM-DD
  if(!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) throw new Error('bad_birthdate');
  const digits = birthdate.replace(/-/g,'').split('').map(Number);
  const steps = [];
  const step1 = digits.reduce((a,d)=>a+d,0);
  steps.push(`${digits.join('+')}=${step1}`);
  let n = step1;
  const masters = new Set([11,22,33]);
  while(n > 9 && !masters.has(n)){
    const s = String(n).split('').map(Number);
    const next = s.reduce((a,d)=>a+d,0);
    steps.push(`${s.join('+')}=${next}`);
    n = next;
  }
  return { value: n, steps };
}

export const handler = async (event) => {
  try{
    // 認証（HTTP API + JWTオーソライザーなら claims はここに入る）
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if(!claims) return { statusCode: 401, body: 'unauthorized' };

    if(event.routeKey !== 'POST /numerology'){
      return { statusCode: 404, body: 'not found' };
    }
    const body = JSON.parse(event.body || '{}');
    const name = String(body.name || '').trim();
    const birthdate = String(body.birthdate || '').trim();

    if(!name || !birthdate) {
      return { statusCode: 400, body: JSON.stringify({ error: 'name and birthdate are required' }) };
    }

    const life = lifePathFromBirthdate(birthdate);
    const full = reduceNameToNumber(name);
    const parts = splitVowelConsonant(name);

    const result = {
      lifePath: life.value,
      destiny: full.reduced,
      soulUrge: parts.vowel.reduced,
      personality: parts.consonant.reduced,
      breakdown: {
        nameSum: full.total,
        vowelSum: parts.vowel.total,
        consonantSum: parts.consonant.total,
        birthSumSteps: life.steps
      }
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  }catch(err){
    console.error(err);
    const code = (err && err.message === 'bad_birthdate') ? 400 : 500;
    return { statusCode: code, body: JSON.stringify({ error: 'bad request' }) };
  }
};
