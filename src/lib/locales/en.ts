export const en: Record<string, string> = {
  // App
  'app.title': 'HW MONITOR',
  'app.subtitle': 'Hardware Communication + Protocol Assistant',

  // Monitor
  'monitor.noConnection': 'No connection open',
  'monitor.newConnection': 'New Connection',
  'monitor.display': 'Display',
  'monitor.autoScroll': 'Auto-scroll',
  'monitor.clients': 'Clients',
  'monitor.clear': 'Clear',
  'monitor.exportLog': 'Export Log',
  'monitor.entries': 'entries',

  // Serial
  'serial.title': 'Serial Config',
  'serial.port': 'Port',
  'serial.selectPort': 'Select port...',
  'serial.baudRate': 'Baud Rate',
  'serial.dataBits': 'Data Bits',
  'serial.stopBits': 'Stop Bits',
  'serial.parity': 'Parity',
  'serial.flowControl': 'Flow Control',
  'serial.connect': 'Connect',
  'serial.disconnect': 'Disconnect',
  'serial.flowNone': 'None',
  'serial.flowHardware': 'Hardware (RTS/CTS)',
  'serial.flowSoftware': 'Software (XON/XOFF)',

  // TCP
  'tcp.client': 'TCP Client',
  'tcp.server': 'TCP Server',
  'tcp.host': 'Host',
  'tcp.port': 'Port',
  'tcp.bindAddress': 'Bind Address',
  'tcp.connect': 'Connect',
  'tcp.disconnect': 'Disconnect',
  'tcp.stopServer': 'Stop Server',
  'tcp.startServer': 'Start Server',

  // UDP
  'udp.title': 'UDP Socket',
  'udp.localHost': 'Local Host',
  'udp.localPort': 'Local Port',
  'udp.targetHost': 'Target Host',
  'udp.targetPort': 'Target Port',
  'udp.closeSocket': 'Close Socket',
  'udp.bindSocket': 'Bind Socket',

  // Reconnect Dialog
  'reconnect.title': 'Connection Already Exists',
  'reconnect.description': 'An active connection already exists. Disconnect and reconnect?',
  'reconnect.cancel': 'Cancel',
  'reconnect.confirm': 'Reconnect',

  // Connection Status
  'status.disconnected': 'Disconnected',
  'status.connecting': 'Connecting...',
  'status.connected': 'Connected',
  'status.listening': 'Listening',
  'status.error': 'Error',

  // Data Display
  'data.noData': 'No data yet. Connect and start communicating.',

  // Send Panel
  'send.placeholder': 'Type message...',
  'send.hexPlaceholder': 'AA BB CC DD...',
  'send.send': 'Send',
  'send.periodicPlaceholder': 'Periodic data...',
  'send.every': 'every',
  'send.ms': 'ms',
  'send.start': 'Start',
  'send.stop': 'Stop',

  // Chat
  'chat.title': 'Protocol Assistant',
  'chat.clearChat': 'Clear chat',
  'chat.askProtocol': 'Ask about RS-232, TCP, UDP protocols',
  'chat.pasteData': 'or paste communication data for analysis',
  'chat.geminiKeyRequired': '⚠️ To use Gemini, open ⚙️ Settings (top-right) → Google card and enter your AI API Key.',
  'chat.anthropicKeyRequired': '⚠️ Open ⚙️ Settings (top-right) → Anthropic card and enter your API Key.',
  'chat.inputPlaceholder': 'Ask about protocols, analyze data... (Shift+Enter for newline)',
  'chat.attachData': 'Attach communication data',
  'chat.analyzeAndFix': 'Analyze this communication data and suggest fixes if there are issues',

  // Action blocks
  'action.send': 'Send Data',
  'action.reconnect': 'Reconnect',
  'action.disconnect': 'Disconnect',
  'action.configure': 'Configure',
  'action.execute': 'Execute',
  'action.executing': 'Executing...',
  'action.success': 'Executed successfully',
  'action.failed': 'Execution failed',
  'action.noConnection': 'No active connection',

  // Settings
  'settings.title': 'Settings',
  'settings.apiKey': 'API Key',
  'settings.encryptedStorage': 'Encrypted in OS keychain',
  'settings.logout': 'Logout',
  'settings.authenticating': 'Authenticating in browser...',
  'settings.googleLogin': 'Sign in with Google',
  'settings.googleConsoleGuide': 'Google Cloud Console → OAuth 2.0 → Desktop app type',
  'settings.geminiLabel': '(for Gemini)',
  'settings.llmModel': 'LLM Model',
  'settings.parameters': 'Parameters',
  'settings.cancel': 'Cancel',
  'settings.save': 'Save',
  'settings.clientIdRequired': 'Please enter Client ID and Secret.',
  'settings.loginFailed': 'Login failed',

  // Settings - Provider
  'settings.providerKeys': 'API Keys / Auth',
  'settings.anthropicConnected': 'Anthropic connected',
  'settings.googleConnected': 'Google connected',
  'settings.notConfigured': 'Not configured',
  'settings.configured': 'Configured',
  'settings.googleAiKeyPlaceholder': 'AI Studio key — aistudio.google.com',
  'settings.oauthOptional': 'OAuth (optional)',
  'settings.oauthDesc': 'Required for Google account linking',

  // Settings - Connect buttons
  'settings.getApiKey': 'Get API Key',
  'settings.openaiConnected': 'OpenAI connected',
  'settings.openaiKeyPlaceholder': 'sk-... (platform.openai.com)',
  'settings.pasteKeyHere': 'Paste your key here',
  'settings.openConsole': 'Open Console',

  // Chat - OpenAI
  'chat.openaiKeyRequired': '⚠️ Open ⚙️ Settings (top-right) → OpenAI card and enter your API Key.',

  // Settings - Built-in agent
  'settings.builtInAgent': 'HW Monitor Agent',
  'settings.builtInLabel': 'Built-in',
  'settings.builtInActive': 'Active',
  'settings.builtInDesc': 'Built-in AI agent that works without an API key. Monthly usage limits apply.',
  'settings.builtInAdvanced': 'Advanced: Unlimited with personal key',
  'settings.personalGoogleKey': 'Google AI API Key (Optional)',
  'settings.personalKeyDesc': 'Enter your own key to remove the daily usage limit.',

  // Settings - Free providers
  'settings.freeProviders': 'Free AI Providers',
  'settings.premiumProviders': 'Premium Providers (API Key)',
  'settings.free': 'Free',
  'settings.noKeyNeeded': 'No API Key needed',
  'settings.getFreeKey': 'Get Free Key',
  'settings.ollamaSettings': 'Ollama Settings',
  'settings.ollamaUrl': 'Ollama Server URL',
  'settings.ollamaDesc': 'Install Ollama for free local AI (ollama.com)',
  'settings.groqDesc': 'Free cloud AI · Ultra-fast inference (console.groq.com)',
  'settings.openrouterDesc': 'Various free models available (openrouter.ai)',

  // Settings - Model selector
  'settings.needsKey': 'Key needed',
  'settings.keyRequiredForModel': 'Please enter the API Key above to use this model.',

  // Chat - Model selector
  'chat.freeModels': 'Free Models',
  'chat.premiumModels': 'Premium (API Key Required)',
  'chat.builtInModels': 'Built-in Models',
  'chat.builtIn': 'Built-in',
  'chat.builtInAgentSection': 'HW Monitor Agent',
  'chat.builtInAgentName': 'HW Monitor AI',
  'chat.builtInAgentDesc': 'Built-in · Monthly usage limit',
  'chat.registeredModels': 'Registered Models',
  'chat.monthlyUsage': 'This Month\'s Usage',
  'chat.monthlyLimitExceeded': '⚠️ You\'ve reached this month\'s AI usage limit. It will reset on the 1st of next month. Enter your own Google AI API Key in Settings for unlimited use.',
  'chat.ollamaNotRunning': '⚠️ Ollama is not running. Install from ollama.com and run `ollama run llama3.2` to start a model.',
  'chat.groqKeyRequired': '⚠️ To use Groq, open ⚙️ Settings → Groq card and enter your free API Key. (Get one free at console.groq.com)',
  'chat.openrouterKeyRequired': '⚠️ To use OpenRouter, open ⚙️ Settings → OpenRouter card and enter your API Key. (Get one free at openrouter.ai)',

  // Model descriptions - Free
  'model.llama32.desc': 'Local · Lightweight · Fast',
  'model.llama31.desc': 'Local · Balanced',
  'model.mistral.desc': 'Local · Multilingual',
  'model.gemma2.desc': 'Local · Google open-source',
  'model.llama33groq.desc': 'Cloud · High-perf · Free',
  'model.llama31instant.desc': 'Cloud · Ultra-fast · Free',
  'model.gemma2groq.desc': 'Cloud · Google open-source · Free',
  'model.llama33or.desc': 'Cloud · High-perf · Free',
  'model.deepseekChat.desc': 'Cloud · DeepSeek V3 · Free',
  'model.deepseekR1.desc': 'Cloud · Reasoning model · Free',
  'model.geminiFlashOr.desc': 'Cloud · Fast · Free',

  // BLE
  'ble.title': 'BLE Config',
  'ble.device': 'Device',
  'ble.selectDevice': 'Select device...',
  'ble.noDevices': 'No devices found',
  'ble.serviceUuid': 'Service UUID',
  'ble.characteristicUuid': 'Characteristic UUID',
  'ble.connect': 'Connect',
  'ble.disconnect': 'Disconnect',
  'ble.notAvailable': 'BLE is not available. Check noble module.',
  'ble.services': 'Services',
  'ble.scanning': 'Scanning...',

  // Login page
  'login.subtitle': 'Hardware Communication + Protocol Assistant',
  'login.github': 'Continue with GitHub',
  'login.google': 'Continue with Google',
  'login.failed': 'Login failed. Please try again.',
  'login.footer': 'Sign in to securely store your communication settings and AI keys.',

  // Settings - Account
  'settings.account': 'Account',
  'settings.login': 'Login',
  'settings.config': 'Config',

  // Model descriptions - Paid
  'model.claudeSonnet4.desc': 'Latest high-performance · 200K context',
  'model.claudeOpus4.desc': 'Top performance · Complex reasoning',
  'model.claude35Sonnet.desc': 'Fast and balanced performance',
  'model.claude35Haiku.desc': 'Ultra-fast · Lightweight tasks',
  'model.geminiFlash.desc': 'Fast and efficient · Multimodal',
  'model.geminiPro.desc': 'Long context · High-performance',
  'model.gpt4o.desc': 'Top performance · Multimodal',
  'model.gpt4oMini.desc': 'Fast and economical',

  // Session
  'session.save': 'Save Session',
  'session.load': 'Load Session',
  'session.saveTitle': 'Save Session',
  'session.saveDesc': 'Save current connections and recent logs to the cloud.',
  'session.loadTitle': 'Load Session',
  'session.loadDesc': 'Restore a saved session. Connections will be in disconnected state.',
  'session.namePlaceholder': 'Session name',
  'session.connections': 'connection(s)',
  'session.logEntries': 'log entries (max 100 per connection)',
  'session.noSessions': 'No saved sessions',
  'session.deleteTitle': 'Delete Session',
  'session.deleteDesc': 'This session will be permanently deleted.',
  'session.delete': 'Delete',
  'common.cancel': 'Cancel',
  'common.close': 'Close'
}
