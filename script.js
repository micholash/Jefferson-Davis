import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ⚠️ 본인의 Firebase 설정값으로 변경하세요!
const firebaseConfig = {
  apiKey: "AIzaSyBJYjgM5bF-i0spqmYFzwSz0rXrSJsFXH4",
  authDomain: "jefferson-davis-c40d1.firebaseapp.com",
  databaseURL: "https://jefferson-davis-c40d1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jefferson-davis-c40d1",
  storageBucket: "jefferson-davis-c40d1.firebasestorage.app",
  messagingSenderId: "981476340214",
  appId: "1:981476340214:web:2a641f7f79c27ad4b2d7d7",
  measurementId: "G-YJ3GKC67YM"
};


// ⚠️ 본인의 구글 앱스 스크립트 배포 Web App URL로 변경하세요!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-EycFyGtsvX8zMsh59wyCWr5kCOUMt-025fWADDa2OsE5lvyDjreVH99sAao4Me_EMg/exec';

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM 요소 캐싱
const authSection = document.getElementById('authSection');
const gameSection = document.getElementById('gameSection');
const createCharBox = document.getElementById('createCharBox');
const mainGamePlay = document.getElementById('mainGamePlay');
const storyBox = document.getElementById('storyBox');
const optionsBox = document.getElementById('optionsBox');
const statusText = document.getElementById('statusText');
const audioPlayer = document.getElementById('audioPlayer');

let currentUser = null;
let charData = null;
let chatHistory = []; // AI가 맥락을 이해하도록 보관하는 로컬 저장용 로그

/* ==========================================
   1. AUTHENTICATION (로그인 / 회원가입)
   ========================================== */

// 회원가입 버튼
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  if(!email || !password) return alert('이메일과 비밀번호를 입력해 주세요.');
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('새로운 모험가 등록 성공!');
  } catch(e) { 
    alert("가입 실패: " + e.message); 
  }
});

// 로그인 버튼
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  if(!email || !password) return alert('이메일과 비밀번호를 입력해 주세요.');
  
  try { 
    await signInWithEmailAndPassword(auth, email, password); 
  } catch(e) { 
    alert("로그인 실패: " + e.message); 
  }
});

// 로그아웃 버튼
document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth);
});

// 인증 상태 변화 감지 실시간 감시자
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    document.getElementById('userEmail').textContent = user.email;
    
    // Realtime Database에서 유저 고유 UID 하위의 캐릭터 데이터 감시 시작 (CRUD - Read)
    onValue(ref(database, `users/${user.uid}/character`), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // 생성된 캐릭터 시트가 전혀 없다면 생성 UI 표시
        createCharBox.classList.remove('hidden');
        mainGamePlay.classList.add('hidden');
      } else {
        // 기존 캐릭터가 있다면 곧바로 인게임 구동 및 UI 렌더링
        charData = data;
        createCharBox.classList.add('hidden');
        mainGamePlay.classList.remove('hidden');
        updateCharSheetUI();
      }
    });
  } else {
    currentUser = null;
    authSection.classList.remove('hidden');
    gameSection.classList.add('hidden');
  }
});


/* ==========================================
   2. CHARACTER DATABASE INTERACTION (CRUD)
   ========================================== */

// 최초 신규 캐릭터 생성 등록 (CRUD - Create)
document.getElementById('createCharBtn').addEventListener('click', async () => {
  const name = document.getElementById('charNameInput').value.trim();
  const job = document.getElementById('charJobSelect').value;
  if(!name) return alert('영웅의 이름을 정해 주세요!');
  
  const defaultChar = {
    name: name, 
    job: job, 
    level: 1, 
    exp: 0, 
    gold: 100,
    hp: 100, 
    maxHp: 100
  };
  
  setStatus('캐릭터 연동 데이터를 서버에 바인딩 중...');
  await set(ref(database, `users/${currentUser.uid}/character`), defaultChar);
  
  // 첫 게임 개시를 선언하며 AI 마스터 깨우기
  sendActionToMaster("던전에 진입하여 장엄한 모험을 첫 개시한다.");
});

// 캐릭터 삭제 및 초기화 (CRUD - Delete)
async function resetCharacter() {
  if(!currentUser) return;
  const check = confirm('정말 이 캐릭터 시트를 소멸시키고 영구 파괴하겠습니까?');
  if(!check) return;
  
  setStatus('캐릭터 시트 파기 중...');
  chatHistory = [];
  await remove(ref(database, `users/${currentUser.uid}/character`));
  storyBox.textContent = "영웅의 혼백이 흩어졌습니다. 새로운 캐릭터를 생성하여 모험을 기약하세요.";
  optionsBox.innerHTML = "";
}

document.getElementById('btnResetChar').addEventListener('click', resetCharacter);

// 데이터 변화를 UI 화면 컴포넌트에 뿌려주는 함수
function updateCharSheetUI() {
  if(!charData) return;
  document.getElementById('lblCharName').textContent = charData.name;
  document.getElementById('lblCharJob').textContent = charData.job;
  document.getElementById('lblCharLevel').textContent = charData.level;
  document.getElementById('lblCharExp').textContent = charData.exp;
  document.getElementById('lblCharGold').textContent = charData.gold + " G";
  document.getElementById('lblCharHp').textContent = `${charData.hp}/${charData.maxHp}`;
  
  const hpPercent = Math.max(0, (charData.hp / charData.maxHp) * 100);
  document.getElementById('hpBar').style.width = hpPercent + "%";
}


/* ==========================================
   3. AI MASTER CONNECTIVITY & TTS ENGINE
   ========================================== */

// 유저의 행동 선택지를 AI 프록시 서버로 전달해 판정 결과를 가져오는 핵심 함수
async function sendActionToMaster(actionText) {
  if(!currentUser || !charData) return;
  
  try {
    optionsBox.innerHTML = ""; // 응답 로딩 중 중복 클릭을 방지하기 위해 선택지 일시 초기화
    setStatus("마스터가 주사위를 판정하고 서사를 구상 중입니다...");
    
    // 현재 캐릭터의 세부 스탯 현황을 스트링화하여 AI에게 맥락 공급
    const currentStateStr = `${charData.job} ${charData.name} (LV: ${charData.level}, HP: ${charData.hp}, GOLD: ${charData.gold})`;
    
    // 🅰️ 1단계: ChatGPT 던전 마스터 API 통신 요청
    const chatResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'chat',
        question: actionText,
        charState: currentStateStr,
        history: chatHistory
      })
    });
    
    const gameResult = await chatResponse.json();
    if(gameResult.error) throw new Error(gameResult.error);
    
    // 맥락 기억 저장소에 대화 추가
    chatHistory.push({ role: "user", content: actionText });
    chatHistory.push({ role: "assistant", content: gameResult.story });
    
    // 마스터의 지문 텍스트 화면 노출
    storyBox.textContent = gameResult.story;
    
    // 🅱️ 2단계: AI 판정 변화량 연산 및 데이터베이스 동기화 (CRUD - Update)
    let newHp = Math.min(charData.maxHp, Math.max(0, charData.hp + (gameResult.hpChange || 0)));
    let newGold = Math.max(0, charData.gold + (gameResult.goldChange || 0));
    let newExp = charData.exp + (gameResult.expChange || 0);
    let newLevel = charData.level;
    
    // 레벨업 트리거 점검 (100점 단위 상승 기준)
    if (newExp >= newLevel * 100) {
      newExp -= newLevel * 100;
      newLevel += 1;
      storyBox.textContent += "\n\n✨ 레벨이 상승했습니다! 캐릭터의 잠재력이 깨어납니다! ✨";
    }
    
    if(newHp <= 0) {
      storyBox.textContent += "\n\n💀 운명이 다했습니다. 당신은 치명적인 상흔을 입고 전사했습니다.";
    }
    
    // 연산된 수치를 실시간으로 DB에 업데이트
    await update(ref(database, `users/${currentUser.uid}/character`), {
      hp: newHp, gold: newGold, exp: newExp, level: newLevel
    });
    
    // 🅲 3단계: 생존 시 다음 분기용 선택지 버튼 렌더링 연출
    if(newHp > 0 && gameResult.options) {
      gameResult.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener('click', () => sendActionToMaster(opt));
        optionsBox.appendChild(btn);
      });
    } else if (newHp <= 0) {
      // 사망 시 패배 부활용 버튼 처리
      const btn = document.createElement('button');
      btn.className = "danger-btn";
      btn.textContent = "다시 묘지에서 부활하기 (캐릭터 리셋)";
      btn.style.width = "100%";
      btn.addEventListener('click', resetCharacter);
      optionsBox.appendChild(btn);
    }
    
    setStatus("마스터의 목소리를 영적 주파수로 변환하는 중 (TTS)...");
    
    // 🅳 4단계: 받아온 서사를 TTS API를 통해 오디오북 음성 재생
    const ttsResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'tts',
        text: gameResult.story,
        model: 'tts-1',
        voice: 'onyx' // 던전 마스터에 가장 어울리는 딥하고 어두운 톤의 남성 목소리
      })
    });
    
    const ttsData = await ttsResponse.json();
    if(ttsData.audioBase64) {
      // Base64 스트링 인코딩 소스를 직독직해 오디오 소스로 바인딩하여 자동 재생
      audioPlayer.src = "data:audio/mpeg;base64," + ttsData.audioBase64;
    }
    
    setStatus("대기 중");
    
  } catch (err) {
    console.error(err);
    storyBox.textContent = "치명적인 마법 통신 장애 발생: " + err.message;
    setStatus("연동 실패");
  }
}

function setStatus(msg) { 
  statusText.textContent = msg; 
}
