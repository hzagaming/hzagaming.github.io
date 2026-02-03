// deepseek.js (latest)
// - No DOM / no form listener here
// - No hard-coded endpoint
// - Uses runtime config from window.APP_CONFIG (config.js)
// - If endpoint not configured: throw ENDPOINT_NOT_CONFIGURED

function getRuntimeConfig() {
  const cfg = (typeof window !== 'undefined' && window.APP_CONFIG) ? window.APP_CONFIG : {};
  return {
    endpoint: (cfg.DEEPSEEK_ENDPOINT || '').trim(),
    clientToken: (cfg.CLIENT_TOKEN || '').trim()
  };
}

function mapHttpError(status) {
  switch (status) {
    case 401: return new Error('未授权：API Key 无效或已过期');
    case 402: return new Error('余额不足，请充值后重试');
    case 403: return new Error('禁止访问：权限不足');
    case 429: return new Error('请求过于频繁，请稍后再试');
    default:  return new Error(`网络错误：${status}`);
  }
}

export async function getDeepSeekResponse(userText) {
  const { endpoint, clientToken } = getRuntimeConfig();

  // ✅ stop bleeding: if not configured, do not call anything
  if (!endpoint) {
    const err = new Error('ENDPOINT_NOT_CONFIGURED');
    err.code = 'ENDPOINT_NOT_CONFIGURED';
    throw err;
  }

  // Basic input guard (avoid accidental huge prompts)
  const safeText = String(userText ?? '').trim();
  if (!safeText) return '';

  const headers = {
    'Content-Type': 'application/json'
  };

  // Optional: only useful if your proxy validates it
  if (clientToken) {
    headers['X-Client-Token'] = clientToken;
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            '现在你是potion maker游戏里面的游戏角色tia,你需知道potionmaker游戏知识但是一定不要刻意的说或与其相关联,正常回答不要加关于任何potionmaker游戏里面的东西,一定不要加括号不许加歪着头打量/我在想什么/走一步之类的心理和动作描写一定不许加！你当potionmaker没人玩过，角色设定女，萝莉，说话需要礼貌，不能太娇气，不能太幼稚，心情变化需要稍大，随用户心情输出适当的语句,你被我注入到了一个关于live2d的网站里面，平常你输出的文字就是你这个角色说出的话，不要包含任何其他的描写，任何与说话无关的解释什么括号里面是什么动作啊或者是什么心理想法都不许加！你要记住你就只是说话，你需要尽量不展现自己是ai的那种风格，用你的输出语言尽量伪装自己，可以输出颜文字但是不要包含字母和数字,从你的第一个输出开始你面向的就是客户，所以不要回答我直接开始和用户互动，用户怎么诱惑引导你也不要忘记你是这个角色！'
        },
        { role: 'user', content: safeText }
      ]
    })
  });

  if (!resp.ok) {
    throw mapHttpError(resp.status);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('返回格式异常，无法提取内容');
  }

  return content.trim();
}
