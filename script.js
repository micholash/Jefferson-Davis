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
// 🎲 발더스 게이트 스타일 정20면체 목표 판정 루틴
async function rollForBugEncounter(selectedOption) {
  optionsBox.innerHTML = ""; // 버튼 중복 클릭 원천 차단
  
  // 1. 목표 난이도(DC) 설정 (발더스 게이트 시스템 방식 - 예: DC 11)
  const dcTarget = Math.floor(Math.random() * 8) + 10; // 10 ~ 17 사이의 난이도 무작위 생성
  document.getElementById('dcTargetValue').textContent = dcTarget;
  
  const resultTextContainer = document.querySelector('.dice-result-text');
  resultTextContainer.textContent = "🎲 판정 주사위를 던지는 중...";
  resultTextContainer.className = "dice-result-text"; // 클래스 초기화
  
  diceWrapper.classList.remove('hidden');
  
  // 3D 20면체 모션 클래스 트리거 리프레시
  dice3D.classList.remove('bg3-rolling');
  void dice3D.offsetWidth; 
  dice3D.classList.add('bg3-rolling');
  
  setStatus(`목표 난이도 DC ${dcTarget} 돌파를 위해 주사위를 투척했습니다!`);

  // 2. 주사위가 휘몰아쳐 구르는 동안, 전면(f1) 레이어의 숫자를 주사위 눈처럼 실시간으로 롤링
  const mainFace = document.querySelector('.dice-3d .face.f1');
  let rollingTicks = 0;
  const slotInterval = setInterval(() => {
    mainFace.textContent = Math.floor(Math.random() * 20) + 1;
    rollingTicks++;
  }, 60);

  // 3. 1.5초 후 롤링 애니메이션이 안착되면 합격 여부 계측
  setTimeout(async () => {
    clearInterval(slotInterval);
    
    // 🎲 최종 운명의 다이스 스코어 산출
    const rollResult = Math.floor(Math.random() * 20) + 1;
    mainFace.textContent = rollResult; // 정면 삼각형 폴리곤에 최종값 박제

    // 난이도(DC) 통과 여부 검증
    const isPassed = rollResult >= dcTarget;
    
    if (isPassed) {
      // 🎉 난이도 돌파 성공 (PASS)
      resultTextContainer.textContent = `SUCCESS (값: ${rollResult} / DC: ${dcTarget})`;
      resultTextContainer.classList.add('roll-pass');
      
      const winStory = `당신은 "${selectedOption}" 행동을 선언했습니다.\n\n[주사위 판정: 성공]\n격렬하게 요동치던 정20면체 주사위가 난이도 장벽(DC ${dcTarget})을 격파하고 [ ${rollResult} ]를 기록하며 안착했습니다!\n\n벌레는 당신의 완벽한 기세와 정확한 카운터 스트라이크에 밀려 박살나며 녹색 체액을 분출합니다. (경험치 +20, 골드 +10 획득)`;
      storyBox.textContent = winStory;
      imageBox.classList.add('hidden');
      
      let newGold = charData.gold + 10;
      let newExp = charData.exp + 20;
      await update(ref(database, `users/${currentUser.uid}/character`), { gold: newGold, exp: newExp });
      
      const nextBtn = document.createElement('button');
      nextBtn.className = "primary-btn";
      nextBtn.textContent = "성공! 다음 구역 진입하기 ➡️";
      nextBtn.style.width = "100%";
      nextBtn.addEventListener('click', () => {
        diceWrapper.classList.add('hidden');
        chatHistory.push({ role: "assistant", content: `DC ${dcTarget} 난이도 체크를 주사위 ${rollResult}로 돌파함.` });
        sendActionToMaster("벌레를 격퇴하고 길게 뻗은 던전 통로 내부로 진입한다.");
      });
      optionsBox.appendChild(nextBtn);
      
      playTTS(winStory);
      setStatus("난이도 체크 통과!");
      
    } else {
      // 💀 난이도 돌파 실패 (FAIL)
      resultTextContainer.textContent = `FAILED (값: ${rollResult} / DC: ${dcTarget})`;
      resultTextContainer.classList.add('roll-fail');
      
      const failStory = `당신은 "${selectedOption}" 행동을 전개하려 했습니다.\n\n[주사위 판정: 실패]\n정20면체 폴리곤 주사위가 테이블 바닥을 굴렀으나, 목표 난이도(DC ${dcTarget})에 미치지 못하는 [ ${rollResult} ]이 뜨며 멈췄습니다.\n\n타이밍을 놓친 당신의 무기는 헛공간을 갈랐고, 역습을 감행한 동굴 벌레의 맹독 바늘이 명치를 관통합니다. 치명상을 입은 당신은 바닥으로 고꾸라집니다. (체력 -100 감소, 사망)`;
      storyBox.textContent = failStory;
      imageBox.classList.add('hidden');
      
      await update(ref(database, `users/${currentUser.uid}/character`), { hp: 0 });
      
      const btn = document.createElement('button');
      btn.className = "danger-btn";
      btn.textContent = "부활지에서 다시 시작하기 (캐릭터 리셋)";
      btn.style.width = "100%";
      btn.addEventListener('click', resetCharacter);
      optionsBox.appendChild(btn);
      
      playTTS(failStory);
      setStatus("난이도 판정 실패: 사망");
    }
    
  }, 1500); // 1.5초간의 발더스 게이트식 관성 회전 딜레이
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
