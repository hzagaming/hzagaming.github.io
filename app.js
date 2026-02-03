import { getDeepSeekResponse } from './deepseek.js';

window.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('chat-form');
  const input   = document.getElementById('chat-input');
  const content = document.getElementById('chat-content');

  if (!form || !input || !content) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = input.value.trim();
    if (!userText) return;

    input.value = '';
    input.focus();

    // ===== 用户消息 =====
    const userP = document.createElement('p');
    userP.textContent = `你：${userText}`;
    content.appendChild(userP);

    // ===== AI 回复（安全处理）=====
    const botP = document.createElement('p');
    botP.textContent = 'Tia：……';
    content.appendChild(botP);

    try {
      const reply = await getDeepSeekResponse(userText);

      // 正常返回
      botP.textContent = `Tia：${reply || '……'}`;

    } catch (err) {
      // ⛔ 接口未配置（当前止血状态）
      if (err?.message === 'ENDPOINT_NOT_CONFIGURED') {
        botP.textContent = 'Tia：我现在还没有连接到外部世界，请稍后再来找我吧。';
      } else {
        // 其他异常（网络 / 服务器）
        console.error(err);
        botP.textContent = 'Tia：刚刚有点小问题，我没能回答你。';
      }
    }

    // ===== 滚动到底部 =====
    content.scrollTop = content.scrollHeight;
  });
});
