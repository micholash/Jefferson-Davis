<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChatGPT 질문 답변 페이지</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(135deg, #e3f2fd, #fce4ec);
      font-family: Arial, sans-serif;
      color: #333;
    }

    .container {
      width: min(900px, 92%);
      margin: 40px auto;
      background: #ffffff;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.16);
    }

    h1 {
      margin: 0 0 8px;
      text-align: center;
      font-size: 28px;
    }

    .subtitle {
      text-align: center;
      color: #777;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .info {
      padding: 14px;
      margin-bottom: 20px;
      border-radius: 14px;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 14px;
      line-height: 1.6;
    }

    .chat-box {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    textarea {
      width: 100%;
      min-height: 140px;
      resize: vertical;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 16px;
      font-size: 16px;
      line-height: 1.5;
      outline: none;
      font-family: Arial, sans-serif;
    }

    textarea:focus {
      border-color: #42a5f5;
      box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.15);
    }

    .button-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    button {
      border: none;
      border-radius: 12px;
      padding: 0 18px;
      height: 46px;
      font-size: 15px;
      cursor: pointer;
      transition: 0.15s;
      font-weight: bold;
    }

    button:hover {
      transform: translateY(-2px);
      opacity: 0.9;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
      transform: none;
    }

    .ask-btn {
      background: #42a5f5;
      color: white;
    }

    .clear-btn {
      background: #b0bec5;
      color: white;
    }

    .answer-box {
      min-height: 220px;
      padding: 18px;
      border-radius: 18px;
      background: #f7f9fb;
      border: 1px solid #edf1f5;
      line-height: 1.7;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .status {
      min-height: 24px;
      color: #555;
      font-size: 14px;
    }

    .label {
      font-weight: bold;
      margin-bottom: 6px;
    }

    .help {
      margin-top: 12px;
      font-size: 13px;
      color: #777;
      line-height: 1.6;
    }

    @media (max-width: 700px) {
      .button-row {
        justify-content: stretch;
      }

      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>ChatGPT 질문 답변</h1>
    <div class="subtitle">GitHub Pages + Google Apps Script + OpenAI API 연동</div>

    <div class="info">
      현재 구조: GitHub Pages 화면 → Google Apps Script 서버 → OpenAI API → 답변 반환<br />
      API Key는 index.html에 들어가지 않고 Apps Script의 스크립트 속성에 저장됩니다.
    </div>

    <div class="chat-box">
      <div>
        <div class="label">질문</div>
        <textarea id="questionInput" placeholder="질문을 입력하세요. 예: 고등학생에게 파이썬 반복문을 쉽게 설명해줘."></textarea>
      </div>

      <div class="button-row">
        <button class="clear-btn" id="clearBtn">초기화</button>
        <button class="ask-btn" id="askBtn">질문하기</button>
      </div>

      <div id="status" class="status"></div>

      <div>
        <div class="label">답변</div>
        <div id="answerBox" class="answer-box">아직 답변이 없습니다.</div>
      </div>

      <div class="help">
        단축키: 질문 입력창에서 Ctrl + Enter를 누르면 질문이 전송됩니다.<br />
        오류가 발생하면 Apps Script 배포 권한이 “모든 사용자”인지 확인하세요.
      </div>
    </div>
  </div>

  <script>
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTmD_aKFktnu5BcmOj0x84D15A5qOEkAbpoyJ7DEGzJR7UayIGwKLDL7nFhU3hbB_wVw/exec';

    const questionInput = document.getElementById('questionInput');
    const answerBox = document.getElementById('answerBox');
    const statusBox = document.getElementById('status');
    const askBtn = document.getElementById('askBtn');
    const clearBtn = document.getElementById('clearBtn');

    askBtn.addEventListener('click', askChatGPT);
    clearBtn.addEventListener('click', clearPage);

    questionInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && event.ctrlKey) {
        askChatGPT();
      }
    });

    async function askChatGPT() {
      const question = questionInput.value.trim();

      if (!question) {
        alert('질문을 입력해주세요.');
        return;
      }

      try {
        setLoading(true);
        answerBox.textContent = '답변을 생성하는 중입니다...';
        statusBox.textContent = 'Apps Script 서버에 요청을 보내는 중입니다.';

        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({
            question: question
          })
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        answerBox.textContent = data.answer || '답변을 가져오지 못했습니다.';
        statusBox.textContent = '답변 생성 완료';
      } catch (error) {
        console.error(error);
        answerBox.textContent = '오류가 발생했습니다.\n\n' + error.message;
        statusBox.textContent = '요청 실패';
      } finally {
        setLoading(false);
      }
    }

    function setLoading(isLoading) {
      askBtn.disabled = isLoading;
      askBtn.textContent = isLoading ? '생성 중...' : '질문하기';
    }

    function clearPage() {
      questionInput.value = '';
      answerBox.textContent = '아직 답변이 없습니다.';
      statusBox.textContent = '';
    }
  </script>
</body>
</html>


