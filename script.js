import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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


const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfUN9Em7KWD7RSJQ90u9BZXkRTp9DEsVKR6hN7aIsuJ-70ASIA2CNwM9f8XMR4DpIs8A/exec';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const authSection = document.getElementById('authSection');
const gameSection = document.getElementById('gameSection');
const createCharBox = document.getElementById('createCharBox');
const mainGamePlay = document.getElementById('mainGamePlay');
const storyBox = document.getElementById('storyBox');
const optionsBox = document.getElementById('optionsBox');
const statusText = document.getElementById('statusText');
const audioPlayer = document.getElementById('audioPlayer');

const imageBox = document.getElementById('imageBox');
const monsterImage = document.getElementById('monsterImage');

// 🎲 3D 주사위 DOM 캐싱
const diceWrapper = document.getElementById('diceWrapper');
const dice3D = document.getElementById('dice3D');
const diceValue = document.getElementById('diceValue');
const diceFaceFront = document.querySelector('.dice-3d .face.front');

let currentUser = null;
let charData = null;
let chatHistory = [];
let isTutorial = false;

/* ==========================================
   1. AUTHENTICATION (로그인 / 회원가입)
   ========================================== */
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  if(!email || !password) return alert('이메일과 비밀번호를 입력해 주세요.');
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('새로운 모험가 등록 성공!');
  } catch(e) { alert("가입 실패: " + e.message); }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  if(!email || !password) return alert('이메일과 비밀번호를 입력해 주세요.');
  try { await signInWithEmailAndPassword(auth, email, password); } catch(e) { alert("로그인 실패: " + e.message); }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    document.getElementById('userEmail').textContent = user.email;
    
    onValue(ref(database, `users/${user.uid}/character`), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        createCharBox.classList.remove('hidden');
        mainGamePlay.classList.add('hidden');
        imageBox.classList.add('hidden');
        diceWrapper.classList.add('hidden');
      } else {
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
document.getElementById('createCharBtn').addEventListener('click', async () => {
  const name = document.getElementById('charNameInput').value.trim();
  const job = document.getElementById('charJobSelect').value;
  if(!name) return alert('영웅의 이름을 정해 주세요!');
  
  const defaultChar = {
    name: name, job: job, level: 1, exp: 0, gold: 100, hp: 100, maxHp: 100
  };
  
  setStatus('캐릭터 연동 데이터를 서버에 바인딩 중...');
  await set(ref(database, `users/${currentUser.uid}/character`), defaultChar);
  
  startBugEncounter();
});

async function resetCharacter() {
  if(!currentUser) return;
  const check = confirm('정말 이 캐릭터 시트를 소멸시키고 영구 파괴하겠습니까?');
  if(!check) return;
  
  setStatus('캐릭터 시트 파기 중...');
  chatHistory = [];
  isTutorial = false;
  imageBox.classList.add('hidden');
  diceWrapper.classList.add('hidden');
  await remove(ref(database, `users/${currentUser.uid}/character`));
  storyBox.textContent = "영웅의 혼백이 흩어졌습니다. 새로운 캐릭터를 생성하여 모험을 기약하세요.";
  optionsBox.innerHTML = "";
}

document.getElementById('btnResetChar').addEventListener('click', resetCharacter);

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
   3. 🐛 고정 첫 번째 인카운터 (3D 주사위 연출)
   ========================================== */
function startBugEncounter() {
  isTutorial = true;
  optionsBox.innerHTML = "";
  diceWrapper.classList.add('hidden'); 
  
  imageBox.classList.remove('hidden');
  monsterImage.src = "bug.png"; 
  
  const tutorialStory = `어둡고 습한 던전의 초입에 들어서자마자, 바닥에서 부스럭거리는 기괴한 소리가 들려옵니다. 횃불을 비추자 몸집이 거대한 '동굴 벌레' 한 마리가 기어옵니다! 벌레는 위협적으로 더듬이를 까딱이고 있습니다. 자, 첫 번째 전투 주사위를 굴릴 시간입니다. (1이 나오면 즉사합니다!)`;
  storyBox.textContent = tutorialStory;
  
  const options = [
    `무기를 휘둘러 벌레를 내려친다.`,
    `발로 강하게 밟아 뭉개버린다.`,
    `조심스럽게 횃불로 지져버린다.`
  ];
  
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener('click', () => rollForBugEncounter(opt));
    optionsBox.appendChild(btn);
  });
  
  playTTS(tutorialStory);
  setStatus("첫 번째 인카운터 발생!");
}

// 🎲 3D 주사위 모션 작동 루틴
async function rollForBugEncounter(selectedOption) {
  optionsBox.innerHTML = ""; // 중복 클릭 차단
  
  // 1. 주사위 연출 영역 활성화 및 모션 가동
  diceWrapper.classList.remove('hidden');
  diceFaceFront.textContent = "🎲"; // 구르는 중에는 징표 표시
  diceValue.textContent = "...";
  dice3D.classList.add('dice-rolling'); // 빙글빙글 도는 CSS 애니메이션 주입
  setStatus("주사위를 힘차게 던졌습니다!");

  // 2. 1.2초 동안 주사위가 구른 후에 결과를 산출하고 멈추는 효과 (타이밍 동기화)
  setTimeout(async () => {
    // 애니메이션 멈춤
    dice3D.classList.remove('dice-rolling');
    
    // 1~20 결과 랜덤 산출
    const rollResult = Math.floor(Math.random() * 20) + 1;
    
    // 주사위 한가운데와 텍스트창에 결과 숫자 주입
    diceFaceFront.textContent = rollResult;
    diceValue.textContent = rollResult;
    
    if (rollResult === 1) {
      // 💀 대실패 사망 루틴
      const deathStory = `당신은 "${selectedOption}" 행동을 취하려 했습니다.\n\n그러나 아차! 발이 미끄러지며 중심을 잃고 그대로 벌레의 독니 위로 넘어집니다! 주사위가 [1] (대실패)이 나오며 벌레의 치명적인 맹독이 온몸에 퍼집니다. 당신은 던전 초입에서 비명도 지르지 못하고 쓰러집니다. (체력 -100 감소, 사망)`;
      storyBox.textContent = deathStory;
      
      diceWrapper.style.color = "#ff4444";
      imageBox.classList.add('hidden'); 
      
      await update(ref(database, `users/${currentUser.uid}/character`), { hp: 0 });
      
      const btn = document.createElement('button');
      btn.className = "danger-btn";
      btn.textContent = "다시 무덤에서 부활하기 (캐릭터 리셋)";
      btn.style.width = "100%";
      btn.addEventListener('click', resetCharacter);
      optionsBox.appendChild(btn);
      
      playTTS(deathStory);
      setStatus("치명적 대실패: 사망");
      
    } else {
      // 🎉 성공 루틴
      const winStory = `당신은 "${selectedOption}" 행동을 취했습니다!\n\n주사위가 [${rollResult}] (성공)이 나왔습니다! 벌레는 당신의 일격에 힘없이 찌그러지며 녹색 즙을 뿜고 쓰러집니다. 너무나도 손쉬운 승리입니다! 벌레의 잔해 속에서 동전 몇 개를 발견했습니다. (경험치 +20, 골드 +10 획득)`;
      storyBox.textContent = winStory;
      
      diceWrapper.style.color = "#d4af37";
      imageBox.classList.add('hidden'); 
      
      let newGold = charData.gold + 10;
      let newExp = charData.exp + 20;
      await update(ref(database, `users/${currentUser.uid}/character`), { gold: newGold, exp: newExp });
      
      const nextBtn = document.createElement('button');
      nextBtn.className = "primary-btn";
      nextBtn.textContent = "던전 더 깊은 곳으로 이동하기 ➡️";
      nextBtn.style.width = "100%";
      nextBtn.addEventListener('click', () => {
        diceWrapper.classList.add('hidden'); 
        chatHistory.push({ role: "assistant", content: `첫 번째 방에서 동굴 벌레를 주사위 ${rollResult}로 가볍게 처치하고 통과했다.` });
        sendActionToMaster("벌레를 잡고 통로를 따라 다음 방으로 조심스럽게 걸어간다.");
      });
      optionsBox.appendChild(nextBtn);
      
      playTTS(winStory);
      setStatus("전투 승리!");
    }
  }, 1200); // 1.2초간 주사위 롤링 연출 시간 고정
}

/* ==========================================
   4. AI MASTER CONNECTIVITY & TTS ENGINE
   ========================================== */
async function sendActionToMaster(actionText) {
  if(!currentUser || !charData) return;
  
  try {
    optionsBox.innerHTML = "";
    setStatus("마스터가 주사위를 판정하고 서사를 구상 중입니다...");
    
    const currentStateStr = `${charData.job} ${charData.name} (LV: ${charData.level}, HP: ${charData.hp}, GOLD: ${charData.gold})`;
    
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
    
    chatHistory.push({ role: "user", content: actionText });
    chatHistory.push({ role: "assistant", content: gameResult.story });
    
    storyBox.textContent = gameResult.story;
    
    let newHp = Math.min(charData.maxHp, Math.max(0, charData.hp + (gameResult.hpChange || 0)));
    let newGold = Math.max(0, charData.gold + (gameResult.goldChange || 0));
    let newExp = charData.exp + (gameResult.expChange || 0);
    let newLevel = charData.level;
    
    if (newExp >= newLevel * 100) {
      newExp -= newLevel * 100;
      newLevel += 1;
      storyBox.textContent += "\n\n✨ 레벨이 상승했습니다! 캐릭터의 잠재력이 깨어납니다! ✨";
    }
    
    if(newHp <= 0) {
      storyBox.textContent += "\n\n💀 운명이 다했습니다. 당신은 치명적인 상흔을 입고 전사했습니다.";
    }
    
    await update(ref(database, `users/${currentUser.uid}/character`), {
      hp: newHp, gold: newGold, exp: newExp, level: newLevel
    });
    
    if(newHp > 0 && gameResult.options) {
      gameResult.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener('click', () => sendActionToMaster(opt));
        optionsBox.appendChild(btn);
      });
    } else if (newHp <= 0) {
      const btn = document.createElement('button');
      btn.className = "danger-btn";
      btn.textContent = "다시 묘지에서 부활하기 (캐릭터 리셋)";
      btn.style.width = "100%";
      btn.addEventListener('click', resetCharacter);
      optionsBox.appendChild(btn);
    }
    
    setStatus("마스터의 목소리를 영적 주파수로 변환하는 중 (TTS)...");
    playTTS(gameResult.story);
    
  } catch (err) {
    console.error(err);
    storyBox.textContent = "치명적인 마법 통신 장애 발생: " + err.message;
    setStatus("연동 실패");
  }
}

async function playTTS(textToRead) {
  try {
    const ttsResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'tts',
        text: textToRead,
        model: 'tts-1',
        voice: 'onyx'
      })
    });
    const ttsData = await ttsResponse.json();
    if(ttsData.audioBase64) {
      audioPlayer.src = "data:audio/mpeg;base64," + ttsData.audioBase64;
    }
    setStatus("대기 중");
  } catch (e) {
    console.error("TTS 재생 실패:", e);
  }
}

function setStatus(msg) { statusText.textContent = msg; }
