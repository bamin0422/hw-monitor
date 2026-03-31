export const zh: Record<string, string> = {
  // App
  'app.title': 'HW MONITOR',
  'app.subtitle': '硬件通信 + 协议助手',

  // Monitor
  'monitor.noConnection': '没有已连接的端口',
  'monitor.newConnection': '新建连接',
  'monitor.display': '显示',
  'monitor.autoScroll': '自动滚动',
  'monitor.clients': '客户端',
  'monitor.clear': '清除',
  'monitor.exportLog': '导出日志',
  'monitor.entries': '条',

  // Serial
  'serial.title': '串口设置',
  'serial.port': '端口',
  'serial.selectPort': '选择端口...',
  'serial.baudRate': '波特率',
  'serial.dataBits': '数据位',
  'serial.stopBits': '停止位',
  'serial.parity': '校验位',
  'serial.flowControl': '流控制',
  'serial.connect': '连接',
  'serial.disconnect': '断开',
  'serial.flowNone': '无',
  'serial.flowHardware': '硬件 (RTS/CTS)',
  'serial.flowSoftware': '软件 (XON/XOFF)',

  // TCP
  'tcp.client': 'TCP 客户端',
  'tcp.server': 'TCP 服务器',
  'tcp.host': '主机',
  'tcp.port': '端口',
  'tcp.bindAddress': '绑定地址',
  'tcp.connect': '连接',
  'tcp.disconnect': '断开',
  'tcp.stopServer': '停止服务器',
  'tcp.startServer': '启动服务器',

  // UDP
  'udp.title': 'UDP 套接字',
  'udp.localHost': '本地主机',
  'udp.localPort': '本地端口',
  'udp.targetHost': '目标主机',
  'udp.targetPort': '目标端口',
  'udp.closeSocket': '关闭套接字',
  'udp.bindSocket': '绑定套接字',

  // Reconnect Dialog
  'reconnect.title': '已存在连接',
  'reconnect.description': '已有活跃连接。是否断开并重新连接？',
  'reconnect.cancel': '取消',
  'reconnect.confirm': '重新连接',

  // Connection Status
  'status.disconnected': '已断开',
  'status.connecting': '连接中...',
  'status.connected': '已连接',
  'status.listening': '监听中',
  'status.error': '错误',

  // Data Display
  'data.noData': '暂无数据。请连接后开始通信。',

  // Send Panel
  'send.placeholder': '输入消息...',
  'send.hexPlaceholder': 'AA BB CC DD...',
  'send.send': '发送',
  'send.periodicPlaceholder': '定时发送数据...',
  'send.every': '间隔',
  'send.ms': 'ms',
  'send.start': '开始',
  'send.stop': '停止',

  // Chat
  'chat.title': '协议助手',
  'chat.clearChat': '清除聊天',
  'chat.askProtocol': '询问有关 RS-232、TCP、UDP 协议的问题',
  'chat.pasteData': '或粘贴通信数据进行分析',
  'chat.geminiKeyRequired': '⚠️ 使用Gemini请打开右上角⚙️设置 → Google卡片，输入AI API密钥。',
  'chat.anthropicKeyRequired': '⚠️ 请打开右上角⚙️设置 → Anthropic卡片，输入API密钥。',
  'chat.inputPlaceholder': '协议问题、数据分析... (Shift+Enter换行)',
  'chat.attachData': '附加通信数据',
  'chat.analyzeAndFix': '分析此通信数据，如有问题请提供解决方案',

  // Action blocks
  'action.send': '发送数据',
  'action.reconnect': '重新连接',
  'action.disconnect': '断开连接',
  'action.configure': '更改设置',
  'action.execute': '执行',
  'action.executing': '执行中...',
  'action.success': '执行完成',
  'action.failed': '执行失败',
  'action.noConnection': '没有活跃连接',

  // Settings
  'settings.title': '设置',
  'settings.apiKey': 'API Key',
  'settings.encryptedStorage': '已加密存储在系统钥匙串中',
  'settings.logout': '退出登录',
  'settings.authenticating': '正在浏览器中认证...',
  'settings.googleLogin': '使用Google登录',
  'settings.googleConsoleGuide': 'Google Cloud Console → OAuth 2.0 → 桌面应用',
  'settings.geminiLabel': '(使用Gemini时)',
  'settings.llmModel': 'LLM 模型',
  'settings.parameters': '参数',
  'settings.cancel': '取消',
  'settings.save': '保存',
  'settings.clientIdRequired': '请输入Client ID和Secret。',
  'settings.loginFailed': '登录失败',

  // Settings - Provider
  'settings.providerKeys': 'API密钥 / 认证',
  'settings.anthropicConnected': 'Anthropic 已连接',
  'settings.googleConnected': 'Google 已连接',
  'settings.notConfigured': '未配置',
  'settings.configured': '已配置',
  'settings.googleAiKeyPlaceholder': 'AI Studio密钥 — aistudio.google.com',
  'settings.oauthOptional': 'OAuth（可选）',
  'settings.oauthDesc': '关联Google账号时需要',

  // Settings - Connect buttons
  'settings.getApiKey': '获取API密钥',
  'settings.openaiConnected': 'OpenAI 已连接',
  'settings.openaiKeyPlaceholder': 'sk-... (platform.openai.com)',
  'settings.pasteKeyHere': '在此粘贴密钥',
  'settings.openConsole': '打开控制台',

  // Chat - OpenAI
  'chat.openaiKeyRequired': '⚠️ 请打开右上角⚙️设置 → OpenAI卡片，输入API密钥。',

  // Settings - Free providers
  'settings.freeProviders': '免费AI提供商',
  'settings.premiumProviders': '高级提供商（需API密钥）',
  'settings.free': '免费',
  'settings.noKeyNeeded': '无需API密钥',
  'settings.getFreeKey': '获取免费密钥',
  'settings.ollamaSettings': 'Ollama 设置',
  'settings.ollamaUrl': 'Ollama 服务器URL',
  'settings.ollamaDesc': '安装Ollama即可免费在本地使用AI (ollama.com)',
  'settings.groqDesc': '免费云端AI · 超快推理 (console.groq.com)',
  'settings.openrouterDesc': '提供多种免费模型 (openrouter.ai)',

  // Settings - Model selector
  'settings.needsKey': '需要密钥',
  'settings.keyRequiredForModel': '使用此模型需要在上方输入API密钥。',

  // Chat - Model selector
  'chat.freeModels': '免费模型',
  'chat.premiumModels': '高级版（需API密钥）',
  'chat.ollamaNotRunning': '⚠️ Ollama未运行。请从ollama.com安装后运行 `ollama run llama3.2` 启动模型。',
  'chat.groqKeyRequired': '⚠️ 使用Groq请在⚙️设置 → Groq卡片中输入免费API密钥。(在console.groq.com免费获取)',
  'chat.openrouterKeyRequired': '⚠️ 使用OpenRouter请在⚙️设置 → OpenRouter卡片中输入API密钥。(在openrouter.ai免费获取)',

  // Model descriptions - Free
  'model.llama32.desc': '本地 · 轻量 · 快速',
  'model.llama31.desc': '本地 · 均衡性能',
  'model.mistral.desc': '本地 · 多语言支持',
  'model.gemma2.desc': '本地 · Google开源',
  'model.llama33groq.desc': '云端 · 高性能 · 免费',
  'model.llama31instant.desc': '云端 · 超快 · 免费',
  'model.gemma2groq.desc': '云端 · Google开源 · 免费',
  'model.llama33or.desc': '云端 · 高性能 · 免费',
  'model.deepseekChat.desc': '云端 · DeepSeek V3 · 免费',
  'model.deepseekR1.desc': '云端 · 推理模型 · 免费',
  'model.geminiFlashOr.desc': '云端 · 快速 · 免费',

  // BLE
  'ble.title': 'BLE 设置',
  'ble.device': '设备',
  'ble.selectDevice': '选择设备...',
  'ble.noDevices': '未找到设备',
  'ble.serviceUuid': '服务UUID',
  'ble.characteristicUuid': '特征UUID',
  'ble.connect': '连接',
  'ble.disconnect': '断开',
  'ble.notAvailable': 'BLE不可用。请检查noble模块。',
  'ble.services': '服务',
  'ble.scanning': '扫描中...',

  // Login page
  'login.subtitle': '硬件通信 + 协议助手',
  'login.github': '使用GitHub继续',
  'login.google': '使用Google继续',
  'login.failed': '登录失败，请重试。',
  'login.footer': '登录后，通信设置和AI密钥将安全存储在您的账户中。',

  // Settings - Account
  'settings.account': '账户',
  'settings.login': '登录',
  'settings.config': '配置',

  // Model descriptions - Paid
  'model.claudeSonnet4.desc': '最新高性能 · 200K上下文',
  'model.claudeOpus4.desc': '顶级性能 · 复杂推理',
  'model.claude35Sonnet.desc': '快速均衡的性能',
  'model.claude35Haiku.desc': '超快 · 轻量任务',
  'model.geminiFlash.desc': '快速高效 · 多模态',
  'model.geminiPro.desc': '长上下文 · 高性能',
  'model.gpt4o.desc': '顶级性能 · 多模态',
  'model.gpt4oMini.desc': '快速经济',

  // Session
  'session.save': '保存会话',
  'session.load': '加载会话',
  'session.saveTitle': '保存会话',
  'session.saveDesc': '将当前连接设置和最近日志保存到云端。',
  'session.loadTitle': '加载会话',
  'session.loadDesc': '恢复已保存的会话。连接将以断开状态恢复。',
  'session.namePlaceholder': '会话名称',
  'session.connections': '个连接',
  'session.logEntries': '条日志（每个连接最多100条）',
  'session.noSessions': '没有已保存的会话',
  'session.deleteTitle': '删除会话',
  'session.deleteDesc': '此会话将被永久删除。',
  'session.delete': '删除',
  'common.cancel': '取消',
  'common.close': '关闭',

  // Built-in model
  'model.builtinGeminiFlash.desc': '内置 · 免费 · 无需配置',
  'chat.builtinLabel': '内置（免费）',
  'chat.rateLimitHourly': '⚠️ 已达到每小时使用上限（30次/小时）。请稍后再试，或在设置中添加API密钥以无限制使用。',
  'chat.rateLimitDaily': '⚠️ 已达到每日使用上限（200次/日）。请在设置中添加API密钥以无限制使用。',
  'chat.builtinNotConfigured': '⚠️ 内置AI模型尚未配置。请选择其他模型或在设置中添加API密钥。',
  'chat.loginRequired': '⚠️ 使用内置AI模型需要登录。'
}
