import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
// 🌐 구글 로그인 제공업체 객체 선언
const googleProvider = new GoogleAuthProvider();

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
const diceNumberDigit = document.getElementById('diceNumberDigit');

let currentUser = null;
let charData = null;
let chatHistory = [];
let isTutorial = false;

/* ==========================================
   1. GOOGLE AUTHENTICATION (구글 로그인 인증 제어)
   ========================================== */
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
  try {
    setStatus('구글 인증 서버 통신 중...');
    // 구글 팝업창을 띄워 로그인 처리
    await signInWithPopup(auth, googleProvider);
  } catch(e) { 
    console.error(e);
    alert("구글 로그인에 실패했습니다: " + e.message); 
    setStatus('대기 중');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    document.getElementById('userEmail').textContent = user.displayName || user.email; // 이름이 있으면 이름 출력
    
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
   3. 🐛 고정 첫 번째 인카운터 (발더스 게이트 DC 시스템)
   ========================================== */
function startBugEncounter() {
  isTutorial = true;
  optionsBox.innerHTML = "";
  diceWrapper.classList.add('hidden'); 
  
  imageBox.classList.remove('hidden');
  monsterImage.src = "bug.png"; 
  
  const tutorialStory = `어둡고 습한 던전의 초입에 들어서자마자, 바닥에서 부스럭거리는 기괴한 소리가 들려옵니다. 횃불을 비추자 몸집이 거대한 '동굴 벌레' 한 마리가 기어옵니다! 벌레는 위협적으로 더듬이를 까딱이고 있습니다. 자, 첫 번째 전투 주사위를 굴릴 시간입니다.`;
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

async function rollForBugEncounter(selectedOption) {
  optionsBox.innerHTML = ""; 
  
  const dcTarget = Math.floor(Math.random() * 8) + 10;
  document.getElementById('dcTargetValue').textContent = dcTarget;
  
  const resultTextContainer = document.querySelector('.dice-result-text');
  
  resultTextContainer.textContent = "🎲 운명의 주사위를 굴립니다...";
  resultTextContainer.className = "dice-result-text"; 
  
  diceWrapper.classList.remove('hidden');
  
  dice3D.classList.remove('bg3-rolling-effect', 'bg3-impact');
  void dice3D.offsetWidth; 
  dice3D.classList.add('bg3-rolling-effect');
  
  setStatus(`난이도 DC ${dcTarget} 돌파 체크 중...`);

  let rollCounter = 0;
  const rollingInterval = setInterval(() => {
    diceNumberDigit.textContent = Math.floor(Math.random() * 20) + 1;
    rollCounter++;
  }, 60);

  setTimeout(async () => {
    clearInterval(rollingInterval); 
    
    const rollResult = Math.floor(Math.random() * 20) + 1;
    diceNumberDigit.textContent = rollResult;
    
    dice3D.classList.remove('bg3-rolling-effect');
    void dice3D.offsetWidth;
    dice3D.classList.add('bg3-impact');
    
    const isPassed = rollResult >= dcTarget;
    
    if (isPassed) {
      resultTextContainer.textContent = `성공 (수치: ${rollResult} / DC: ${dcTarget})`;
      resultTextContainer.classList.add('roll-pass');
      
      const winStory = `당신은 "${selectedOption}" 행동을 취했습니다.\n\n[주사위 판정: 성공]\n정20면체 다이스가 묵직하게 구른 뒤, 난이도 장벽(DC ${dcTarget})을 뚫어버리는 [ ${rollResult} ]의 숫자를 띄우며 안착했습니다!\n\n벌레는 당신의 완벽한 일격에 제대로 대처하지 못하고 찌그러지며 녹색 즙을 뿜어냅니다. 초보 모험가답지 않은 아주 훌륭한 솜씨입니다! (경험치 +20, 골드 +10 획득)`;
      storyBox.textContent = winStory;
      imageBox.classList.add('hidden');
      
      let newGold = charData.gold + 10;
      let newExp = charData.exp + 20;
      await update(ref(database, `users/${currentUser.uid}/character`), { gold: newGold, exp: newExp });
      
      const nextBtn = document.createElement('button');
      nextBtn.className = "primary-btn";
      nextBtn.textContent = "성공! 다음 통로로 이동하기 ➡️";
      nextBtn.style.width = "100%";
      nextBtn.addEventListener('click', () => {
        diceWrapper.classList.add('hidden');
        chatHistory.push({ role: "assistant", content: `DC ${dcTarget} 난이도 전투를 주사위 ${rollResult}로 돌파 성공.` });
        sendActionToMaster("벌레를 처치하고 어두운 동굴 안쪽으로 무기를 꽉 쥐고 걸어 들어간다.");
      });
      optionsBox.appendChild(nextBtn);
      
      playTTS(winStory);
      setStatus("주사위 판정 통과!");
      
    } else {
      resultTextContainer.textContent = `실패 (수치: ${rollResult} / DC: ${dcTarget})`;
      resultTextContainer.classList.add('roll-fail');
      
      const failStory = `당신은 "${selectedOption}" 행동을 전개하려 했습니다.\n\n[주사위 판정: 실패]\n금빛 문양이 새겨진 주사위가 멈춰 선 순간, 야속하게도 요구 난이도(DC ${dcTarget})보다 한참 모자란 [ ${rollResult} ]이 선명하게 새겨집니다.\n\n헛점을 보인 당신의 어깨 너머로 동굴 벌레가 사납게 돌진하더니 기어코 날카로운 독침을 꽂아 넣습니다. 온몸에 독이 퍼지며 차가운 던전 바닥에 쓰러집니다. (체력 -100 감소, 사망)`;
      storyBox.textContent = failStory;
      imageBox.classList.add('hidden');
      
      await update(ref(database, `users/${currentUser.uid}/character`), { hp: 0 });
      
      const btn = document.createElement('button');
      btn.className = "danger-btn";
      btn.textContent = "다시 무덤에서 부활하기 (캐릭터 리셋)";
      btn.style.width = "100%";
      btn.addEventListener('click', resetCharacter);
      optionsBox.appendChild(btn);
      
      playTTS(failStory);
      setStatus("주사위 판정 실패: 사망");
    }
    
  }, 1300); 
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
    
    setStatus("마스터의 목소리를 변환하는 중 (TTS)...");
    playTTS(gameResult.story);
    
  } catch (err) {
    console.error(err);
    storyBox.textContent = "치명적인 통신 장애 발생: " + err.message;
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
