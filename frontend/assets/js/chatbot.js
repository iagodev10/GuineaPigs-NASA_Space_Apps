// FireWatch - Bombeiros Chatbot Widget
(function () {
  const CONFIG = {
    BACKEND_URL: "http://localhost:5000/api/chat",
  };

  const SYSTEM_MESSAGE =
    "Você está falando com um assistente virtual do Corpo de Bombeiros. Ele fornece orientações educativas de segurança. Em emergência real, ligue 193 ou 112.";

  let isOpen = false;
  let isSending = false;
  let messages = [
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente virtual do Corpo de Bombeiros. Posso orientar sobre prevenção, queimaduras, extintores e primeiros socorros. Como posso ajudar?",
    },
  ];

  function createStyles() {
    if (document.getElementById("fw-chatbot-styles")) return;
    const style = document.createElement("style");
    style.id = "fw-chatbot-styles";
    style.textContent = `
      .fw-chatbot-button {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #dc2626, #f59e0b);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,.1));
        border: none;
        cursor: pointer;
        z-index: 1100;
      }
      .fw-chatbot-button:hover { transform: translateY(-2px); }

      .fw-chatbot-panel {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: min(380px, calc(100vw - 32px));
        height: 520px;
        background: var(--color-surface, #1e293b);
        color: var(--color-text, #f1f5f9);
        border: 1px solid var(--color-surface-light, #334155);
        border-radius: 16px;
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 1100;
        box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,.1));
      }
      .fw-chatbot-panel.open { display: flex; }
      .fw-chatbot-header {
        background: linear-gradient(135deg, #dc2626, #f59e0b);
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: white;
      }
      .fw-chatbot-header h4 { margin: 0; font-size: 14px; }
      .fw-chatbot-body { flex: 1; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
      .fw-msg { max-width: 85%; padding: 10px 12px; border-radius: 14px; font-size: 14px; line-height: 1.4; }
      .fw-msg.user { align-self: flex-end; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
      .fw-msg.assistant { align-self: flex-start; background: var(--color-background, #0f172a); border: 1px solid var(--color-surface-light, #334155); color: var(--color-text, #f1f5f9); }
      .fw-chatbot-footer { border-top: 1px solid var(--color-surface-light, #334155); padding: 8px; display: flex; gap: 8px; }
      .fw-chatbot-input { flex: 1; background: var(--color-background, #0f172a); color: var(--color-text, #f1f5f9); border: 1px solid var(--color-surface-light, #334155); outline: none; border-radius: 10px; padding: 10px 12px; font-size: 14px; }
      .fw-chatbot-send { background: #dc2626; color: white; border: none; border-radius: 10px; padding: 0 14px; cursor: pointer; }
      .fw-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px; }
      .fw-quick button { background: var(--color-background, #0f172a); color: var(--color-text, #f1f5f9); border: 1px solid var(--color-surface-light, #334155); border-radius: 8px; padding: 6px 8px; font-size: 12px; cursor: pointer; }
      .fw-quick button:hover { border-color: #dc2626; color: #fff; background: #dc2626; }
      .fw-loading { font-size: 12px; opacity: .8; }
      @media (max-width: 480px) {
        .fw-chatbot-panel { right: 8px; left: 8px; width: auto; height: 60vh; bottom: 86px; }
        .fw-chatbot-button { right: 12px; bottom: 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    const btn = document.createElement("button");
    btn.className = "fw-chatbot-button";
    btn.title = "Assistente de Segurança";
    btn.setAttribute("aria-label", "Abrir assistente de segurança");
    btn.innerHTML = "🔥";

    const panel = document.createElement("div");
    panel.className = "fw-chatbot-panel";

    panel.innerHTML = `
      <div class="fw-chatbot-header">
        <h4>Assistente do Corpo de Bombeiros</h4>
        <small>193 | 112</small>
      </div>
      <div class="fw-chatbot-body" id="fwChatBody"></div>
      <div class="fw-quick" id="fwQuick">
        <button type="button">Como prevenir incêndios?</button>
        <button type="button">O que fazer em queimadura?</button>
        <button type="button">Como usar extintor?</button>
        <button type="button">Engasgo: como agir?</button>
      </div>
      <div class="fw-chatbot-footer">
        <input id="fwChatInput" class="fw-chatbot-input" placeholder="Digite sua dúvida de segurança..." />
        <button id="fwChatSend" class="fw-chatbot-send">Enviar</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.addEventListener("click", () => {
      isOpen = !isOpen;
      panel.classList.toggle("open", isOpen);
      if (isOpen) render();
    });

    panel.querySelector("#fwChatSend").addEventListener("click", onSend);
    panel.querySelector("#fwChatInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") onSend();
    });

    panel.querySelectorAll("#fwQuick button").forEach((b) => {
      b.addEventListener("click", () => {
        const q = b.textContent || "";
        sendMessage(q);
      });
    });
  }

  function render() {
    const body = document.getElementById("fwChatBody");
    if (!body) return;
    body.innerHTML = "";

    // system banner (only when empty)
    if (!messages || messages.length === 0) {
      const sys = document.createElement("div");
      sys.className = "fw-msg assistant";
      sys.textContent = SYSTEM_MESSAGE;
      body.appendChild(sys);
    }

    messages.forEach((m) => {
      const el = document.createElement("div");
      el.className = `fw-msg ${m.role}`;
      el.textContent = m.content;
      body.appendChild(el);
    });

    // loading
    if (isSending) {
      const loading = document.createElement("div");
      loading.className = "fw-msg assistant fw-loading";
      loading.textContent = "Analisando...";
      body.appendChild(loading);
    }

    // autoscroll
    body.scrollTop = body.scrollHeight;
  }

  function pushAssistant(text) {
    messages.push({ role: "assistant", content: text });
    render();
  }

  function pushUser(text) {
    messages.push({ role: "user", content: text });
    render();
  }

  async function sendMessage(text) {
    const input = document.getElementById("fwChatInput");
    if (typeof text !== "string") text = input?.value || "";
    const trimmed = (text || "").trim();
    if (!trimmed || isSending) return;
    pushUser(trimmed);
    if (input) input.value = "";

    isSending = true;
    render();
    try {
      const response = await fetch(CONFIG.BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();
      const reply = data?.reply || "Desculpe, ocorreu um erro. Tente novamente.";
      pushAssistant(reply);
    } catch (e) {
      pushAssistant("Desculpe, não consegui responder agora. Verifique sua conexão e tente novamente.");
    } finally {
      isSending = false;
      render();
    }
  }

  function onSend() {
    const input = document.getElementById("fwChatInput");
    sendMessage(input?.value || "");
  }

  function init() {
    createStyles();
    createUI();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
