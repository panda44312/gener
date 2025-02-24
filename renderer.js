
// 保存聊天记录数组，记录每条消息的角色与内容
let chatHistory = [];

// 获取 DOM 元素
const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const saveBtn = document.getElementById('saveBtn');

// Ollama API 的 URL（根据 API 文档使用 /api/generate）
const API_URL = 'http://localhost:11434/api/chat';
// 模型名称，根据实际使用情况调整，例如 "llama3.2"、"llava"、"mistral" 等
const MODEL_NAME = 'llama3.2';

// 更新聊天区域显示
function updateChatDisplay() {
  chatDiv.innerHTML = '';
  chatHistory.forEach(msg => {
    const p = document.createElement('p');
    p.className = 'message ' + msg.role;
    p.textContent = (msg.role === 'user' ? '你: ' : '助手: ') + msg.content;
    chatDiv.appendChild(p);
  });
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 调用 Ollama API 获取回复（非流式模式）
async function getReply(prompt) {
  const payload = {
    model: MODEL_NAME,
    prompt: prompt,
    stream: false,
    // 可通过 options 设置其他参数，如温度等
    options: {
      temperature: 0.8,
      // 可根据需要增加更多参数
    }
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`API请求失败：${res.statusText}`);
    }
    const data = await res.json();
    // data.response 字段中包含生成的回复
    return data.response || '未收到回复';
  } catch (error) {
    console.error(error);
    return '调用API出错：' + error.message;
  }
}

// 发送消息事件
sendBtn.addEventListener('click', async () => {
  const text = messageInput.value.trim();
  if (!text) return;
  
  // 将用户消息添加到记录中
  chatHistory.push({ role: 'user', content: text });
  updateChatDisplay();
  messageInput.value = '';
  
  // 根据当前对话上下文，拼接 prompt（简单示例中仅使用当前输入，可扩展为对话上下文）
  // 例如这里直接使用用户输入作为 prompt
  const reply = await getReply(text);
  chatHistory.push({ role: 'assistant', content: reply });
  updateChatDisplay();
});

// 允许按回车键发送消息
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// 保存聊天记录到本地文件（JSON 格式）
saveBtn.addEventListener('click', () => {
  const filePath = path.join(__dirname, `chatlog-${Date.now()}.json`);
  fs.writeFile(filePath, JSON.stringify(chatHistory, null, 2), (err) => {
    if (err) {
      alert('保存失败：' + err.message);
    } else {
      alert('聊天记录已保存到：' + filePath);
    }
  });
});