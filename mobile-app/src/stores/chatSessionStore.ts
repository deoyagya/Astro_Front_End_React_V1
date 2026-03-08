interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  follow_up_suggestions?: string[];
  created_at?: string;
}

let _sessionId: string | null = null;
let _lifeAreaKey: string | null = null;
let _lifeAreaName: string | null = null;
let _messages: ChatMessage[] = [];

export const chatSessionStore = {
  set: (sessionId: string, lifeAreaKey: string, lifeAreaName: string) => {
    _sessionId = sessionId;
    _lifeAreaKey = lifeAreaKey;
    _lifeAreaName = lifeAreaName;
    _messages = [];
  },

  getSessionId: (): string | null => _sessionId,
  getLifeAreaKey: (): string | null => _lifeAreaKey,
  getLifeAreaName: (): string | null => _lifeAreaName,
  getMessages: (): ChatMessage[] => _messages,

  addMessage: (msg: ChatMessage) => {
    _messages = [..._messages, msg];
  },

  setMessages: (msgs: ChatMessage[]) => {
    _messages = msgs;
  },

  clear: () => {
    _sessionId = null;
    _lifeAreaKey = null;
    _lifeAreaName = null;
    _messages = [];
  },

  isActive: (): boolean => _sessionId !== null,
};
