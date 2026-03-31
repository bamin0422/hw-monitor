export const ko: Record<string, string> = {
  // App
  'app.title': 'HW MONITOR',
  'app.subtitle': '하드웨어 통신 + 프로토콜 어시스턴트',

  // Monitor
  'monitor.noConnection': '연결된 포트가 없습니다',
  'monitor.newConnection': '새 연결',
  'monitor.display': '디스플레이',
  'monitor.autoScroll': '자동 스크롤',
  'monitor.clients': '클라이언트',
  'monitor.clear': '지우기',
  'monitor.exportLog': '로그 내보내기',
  'monitor.entries': '건',

  // Serial
  'serial.title': '시리얼 설정',
  'serial.port': '포트',
  'serial.selectPort': '포트 선택...',
  'serial.baudRate': '보드 레이트',
  'serial.dataBits': '데이터 비트',
  'serial.stopBits': '정지 비트',
  'serial.parity': '패리티',
  'serial.flowControl': '흐름 제어',
  'serial.connect': '연결',
  'serial.disconnect': '연결 해제',
  'serial.flowNone': '없음',
  'serial.flowHardware': '하드웨어 (RTS/CTS)',
  'serial.flowSoftware': '소프트웨어 (XON/XOFF)',

  // TCP
  'tcp.client': 'TCP 클라이언트',
  'tcp.server': 'TCP 서버',
  'tcp.host': '호스트',
  'tcp.port': '포트',
  'tcp.bindAddress': '바인드 주소',
  'tcp.connect': '연결',
  'tcp.disconnect': '연결 해제',
  'tcp.stopServer': '서버 중지',
  'tcp.startServer': '서버 시작',

  // UDP
  'udp.title': 'UDP 소켓',
  'udp.localHost': '로컬 호스트',
  'udp.localPort': '로컬 포트',
  'udp.targetHost': '대상 호스트',
  'udp.targetPort': '대상 포트',
  'udp.closeSocket': '소켓 닫기',
  'udp.bindSocket': '소켓 바인드',

  // Reconnect Dialog
  'reconnect.title': '기존 연결 존재',
  'reconnect.description': '이미 활성화된 연결이 있습니다. 기존 연결을 끊고 새로 연결하시겠습니까?',
  'reconnect.cancel': '취소',
  'reconnect.confirm': '재연결',

  // Connection Status
  'status.disconnected': '연결 해제',
  'status.connecting': '연결 중...',
  'status.connected': '연결됨',
  'status.listening': '수신 대기',
  'status.error': '오류',

  // Data Display
  'data.noData': '데이터가 없습니다. 연결 후 통신을 시작하세요.',

  // Send Panel
  'send.placeholder': '메시지 입력...',
  'send.hexPlaceholder': 'AA BB CC DD...',
  'send.send': '전송',
  'send.periodicPlaceholder': '주기적 데이터...',
  'send.every': '주기',
  'send.ms': 'ms',
  'send.start': '시작',
  'send.stop': '중지',

  // Chat
  'chat.title': '프로토콜 어시스턴트',
  'chat.clearChat': '대화 초기화',
  'chat.askProtocol': 'RS-232, TCP, UDP 프로토콜에 대해 물어보세요',
  'chat.pasteData': '또는 통신 데이터를 붙여넣어 분석하세요',
  'chat.geminiKeyRequired': '⚠️ Gemini를 사용하려면 오른쪽 상단 ⚙️ 설정 → Google 카드를 열어 AI API Key를 입력해주세요.',
  'chat.anthropicKeyRequired': '⚠️ 오른쪽 상단 ⚙️ 설정 → Anthropic 카드를 열어 API Key를 입력해주세요.',
  'chat.inputPlaceholder': '프로토콜 질문, 데이터 분석... (Shift+Enter로 줄바꿈)',
  'chat.attachData': '통신 데이터 첨부',
  'chat.analyzeAndFix': '이 통신 데이터를 분석하고, 문제가 있다면 해결 방법을 제안해주세요',

  // Action blocks
  'action.send': '데이터 전송',
  'action.reconnect': '재연결',
  'action.disconnect': '연결 해제',
  'action.configure': '설정 변경',
  'action.execute': '실행',
  'action.executing': '실행 중...',
  'action.success': '실행 완료',
  'action.failed': '실행 실패',
  'action.noConnection': '활성 연결이 없습니다',

  // Settings
  'settings.title': '설정',
  'settings.apiKey': 'API Key',
  'settings.encryptedStorage': 'OS 키체인에 암호화 저장',
  'settings.logout': '로그아웃',
  'settings.authenticating': '브라우저에서 인증 중...',
  'settings.googleLogin': 'Google로 로그인',
  'settings.googleConsoleGuide': 'Google Cloud Console → OAuth 2.0 → 데스크톱 앱 유형',
  'settings.geminiLabel': '(Gemini 사용 시)',
  'settings.llmModel': 'LLM 모델',
  'settings.parameters': '파라미터',
  'settings.cancel': '취소',
  'settings.save': '저장',
  'settings.clientIdRequired': 'Client ID와 Secret을 입력해주세요.',
  'settings.loginFailed': '로그인 실패',

  // Settings - Provider
  'settings.providerKeys': 'API 키 / 인증',
  'settings.anthropicConnected': 'Anthropic 연결됨',
  'settings.googleConnected': 'Google 연결됨',
  'settings.notConfigured': '미설정',
  'settings.configured': '설정됨',
  'settings.googleAiKeyPlaceholder': 'AI Studio 키 — aistudio.google.com',
  'settings.oauthOptional': 'OAuth (선택사항)',
  'settings.oauthDesc': 'Google 계정 연동 시 필요',

  // Settings - Connect buttons
  'settings.getApiKey': 'API Key 발급',
  'settings.openaiConnected': 'OpenAI 연결됨',
  'settings.openaiKeyPlaceholder': 'sk-... (platform.openai.com)',
  'settings.pasteKeyHere': '발급받은 키를 여기에 붙여넣기',
  'settings.openConsole': '콘솔 열기',

  // Chat - OpenAI
  'chat.openaiKeyRequired': '⚠️ 오른쪽 상단 ⚙️ 설정 → OpenAI 카드를 열어 API Key를 입력해주세요.',

  // Settings - Built-in agent
  'settings.builtInAgent': 'HW Monitor 기본 에이전트',
  'settings.builtInLabel': '기본 제공',
  'settings.builtInActive': '활성화됨',
  'settings.builtInDesc': 'API 키 없이 바로 사용할 수 있는 기본 AI 에이전트입니다. 일일 사용량 제한이 적용됩니다.',
  'settings.builtInAdvanced': '고급: 개인 키로 무제한 사용',
  'settings.personalGoogleKey': 'Google AI API Key (선택사항)',
  'settings.personalKeyDesc': '개인 키를 입력하면 일일 제한 없이 무제한으로 사용할 수 있습니다.',

  // Settings - Free providers
  'settings.freeProviders': '무료 AI 프로바이더',
  'settings.premiumProviders': '프리미엄 프로바이더 (API Key)',
  'settings.free': '무료',
  'settings.noKeyNeeded': 'API Key 불필요',
  'settings.getFreeKey': '무료 Key 발급',
  'settings.ollamaSettings': 'Ollama 설정',
  'settings.ollamaUrl': 'Ollama 서버 URL',
  'settings.ollamaDesc': 'Ollama를 설치하면 로컬에서 무료로 AI 사용 가능 (ollama.com)',
  'settings.groqDesc': '무료 클라우드 AI · 초고속 추론 (console.groq.com)',
  'settings.openrouterDesc': '다양한 무료 모델 제공 (openrouter.ai)',

  // Settings - Model selector
  'settings.needsKey': 'Key 필요',
  'settings.keyRequiredForModel': '이 모델을 사용하려면 위에서 API Key를 입력해주세요.',

  // Chat - Model selector
  'chat.freeModels': '무료 모델',
  'chat.premiumModels': '프리미엄 (API Key 필요)',
  'chat.builtInModels': '기본 제공 모델',
  'chat.builtIn': '기본 제공',
  'chat.builtInAgentSection': 'HW Monitor 기본 에이전트',
  'chat.builtInAgentName': 'HW Monitor AI',
  'chat.builtInAgentDesc': '기본 제공 · 일일 사용량 제한',
  'chat.dailyUsage': '오늘 사용량',
  'chat.dailyLimitExceeded': '⚠️ 오늘의 AI 사용량 한도에 도달했습니다. 내일 다시 시도하거나, 설정에서 개인 Google AI API Key를 입력하면 제한 없이 사용할 수 있습니다.',
  'chat.ollamaNotRunning': '⚠️ Ollama가 실행되지 않았습니다. ollama.com 에서 설치 후 `ollama run llama3.2` 명령으로 모델을 실행해주세요.',
  'chat.groqKeyRequired': '⚠️ Groq를 사용하려면 ⚙️ 설정 → Groq 카드에서 무료 API Key를 입력해주세요. (console.groq.com 에서 무료 발급)',
  'chat.openrouterKeyRequired': '⚠️ OpenRouter를 사용하려면 ⚙️ 설정 → OpenRouter 카드에서 API Key를 입력해주세요. (openrouter.ai 에서 무료 발급)',

  // Model descriptions - Free
  'model.llama32.desc': '로컬 · 경량 · 빠름',
  'model.llama31.desc': '로컬 · 균형 성능',
  'model.mistral.desc': '로컬 · 다국어 지원',
  'model.gemma2.desc': '로컬 · Google 오픈소스',
  'model.llama33groq.desc': '클라우드 · 고성능 · 무료',
  'model.llama31instant.desc': '클라우드 · 초고속 · 무료',
  'model.gemma2groq.desc': '클라우드 · Google 오픈소스 · 무료',
  'model.llama33or.desc': '클라우드 · 고성능 · 무료',
  'model.deepseekChat.desc': '클라우드 · DeepSeek V3 · 무료',
  'model.deepseekR1.desc': '클라우드 · 추론 모델 · 무료',
  'model.geminiFlashOr.desc': '클라우드 · 빠름 · 무료',

  // BLE
  'ble.title': 'BLE 설정',
  'ble.device': '장치',
  'ble.selectDevice': '장치 선택...',
  'ble.noDevices': '검색된 장치 없음',
  'ble.serviceUuid': '서비스 UUID',
  'ble.characteristicUuid': '특성 UUID',
  'ble.connect': '연결',
  'ble.disconnect': '연결 해제',
  'ble.notAvailable': 'BLE를 사용할 수 없습니다. noble 모듈을 확인해주세요.',
  'ble.services': '서비스',
  'ble.scanning': '스캔 중...',

  // Login page
  'login.subtitle': '하드웨어 통신 + 프로토콜 어시스턴트',
  'login.github': 'GitHub으로 계속하기',
  'login.google': 'Google로 계속하기',
  'login.failed': '로그인에 실패했습니다. 다시 시도해주세요.',
  'login.footer': '로그인하면 통신 설정과 AI 키가 계정에 안전하게 저장됩니다.',

  // Settings - Account
  'settings.account': '계정',
  'settings.login': '로그인',
  'settings.config': '설정',

  // Model descriptions - Paid
  'model.claudeSonnet4.desc': '최신 고성능 · 200K 컨텍스트',
  'model.claudeOpus4.desc': '최고 성능 · 복잡한 추론',
  'model.claude35Sonnet.desc': '빠르고 균형 잡힌 성능',
  'model.claude35Haiku.desc': '초고속 · 경량 작업',
  'model.geminiFlash.desc': '빠르고 효율적 · 멀티모달',
  'model.geminiPro.desc': '긴 컨텍스트 · 고성능',
  'model.gpt4o.desc': '최고 성능 · 멀티모달',
  'model.gpt4oMini.desc': '빠르고 경제적',

  // Session
  'session.save': '세션 저장',
  'session.load': '세션 불러오기',
  'session.saveTitle': '세션 저장',
  'session.saveDesc': '현재 연결 설정과 최근 로그를 클라우드에 저장합니다.',
  'session.loadTitle': '세션 불러오기',
  'session.loadDesc': '저장된 세션을 복원합니다. 연결은 해제 상태로 복원됩니다.',
  'session.namePlaceholder': '세션 이름',
  'session.connections': '개 연결',
  'session.logEntries': '건 로그 (연결당 최대 100건)',
  'session.noSessions': '저장된 세션이 없습니다',
  'session.deleteTitle': '세션 삭제',
  'session.deleteDesc': '이 세션은 영구적으로 삭제됩니다.',
  'session.delete': '삭제',
  'common.cancel': '취소',
  'common.close': '닫기'
}
