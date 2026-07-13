/**
 * Имитация чата с продавцом
 */
const Chat = {
  currentSellerId: null,
  currentSellerName: null,

  open(sellerId, sellerName) {
    this.currentSellerId = sellerId;
    this.currentSellerName = sellerName;
    this.render();
    document.getElementById('chat-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.scrollToBottom();
  },

  close() {
    document.getElementById('chat-modal').classList.add('hidden');
    document.body.style.overflow = '';
    this.currentSellerId = null;
  },

  render() {
    const messages = Storage.getChat(this.currentSellerId);
    const container = document.getElementById('chat-messages');
    const user = Storage.getUser();

    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-400 text-sm py-8">
          <p>Начните диалог с ${this.currentSellerName}</p>
          <p class="mt-1 text-xs">Обычно отвечают в течение часа</p>
        </div>
      `;
    } else {
      container.innerHTML = messages.map(msg => {
        const isMine = msg.from === 'me';
        const time = new Date(msg.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="chat-bubble ${isMine ? 'mine' : 'theirs'} rounded-2xl px-4 py-2 mb-2 text-sm">
            ${msg.text}
            <div class="text-[10px] opacity-60 mt-1 text-right">${time}</div>
          </div>
        `;
      }).join('');
    }

    const title = document.getElementById('chat-seller-name');
    if (title) title.textContent = this.currentSellerName;
  },

  send(text) {
    if (!text.trim() || !this.currentSellerId) return;

    Storage.addChatMessage(this.currentSellerId, { text: text.trim(), from: 'me' });
    this.render();
    this.scrollToBottom();

    // Имитация ответа продавца
    const replies = [
      'Здравствуйте! Да, питомец ещё доступен.',
      'Спасибо за интерес! Могу отправить больше фото.',
      'Когда вам удобно приехать посмотреть?',
      'Да, прививки все по возрасту.',
      'Могу немного уступить в цене при быстрой сделке.'
    ];

    setTimeout(() => {
      const reply = replies[Math.floor(Math.random() * replies.length)];
      Storage.addChatMessage(this.currentSellerId, { text: reply, from: 'seller' });
      this.render();
      this.scrollToBottom();
    }, 1200 + Math.random() * 2000);
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  },

  init() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'chat-close' || e.target.closest('#chat-close')) {
        this.close();
      }
      if (e.target.id === 'chat-overlay') {
        this.close();
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'chat-form') {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        this.send(input.value);
        input.value = '';
      }
    });
  }
};