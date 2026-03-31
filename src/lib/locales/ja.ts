export const ja: Record<string, string> = {
  // App
  'app.title': 'HW MONITOR',
  'app.subtitle': 'ハードウェア通信 + プロトコルアシスタント',

  // Monitor
  'monitor.noConnection': '接続されたポートがありません',
  'monitor.newConnection': '新しい接続',
  'monitor.display': 'ディスプレイ',
  'monitor.autoScroll': '自動スクロール',
  'monitor.clients': 'クライアント',
  'monitor.clear': 'クリア',
  'monitor.exportLog': 'ログ出力',
  'monitor.entries': '件',

  // Serial
  'serial.title': 'シリアル設定',
  'serial.port': 'ポート',
  'serial.selectPort': 'ポートを選択...',
  'serial.baudRate': 'ボーレート',
  'serial.dataBits': 'データビット',
  'serial.stopBits': 'ストップビット',
  'serial.parity': 'パリティ',
  'serial.flowControl': 'フロー制御',
  'serial.connect': '接続',
  'serial.disconnect': '切断',
  'serial.flowNone': 'なし',
  'serial.flowHardware': 'ハードウェア (RTS/CTS)',
  'serial.flowSoftware': 'ソフトウェア (XON/XOFF)',

  // TCP
  'tcp.client': 'TCP クライアント',
  'tcp.server': 'TCP サーバー',
  'tcp.host': 'ホスト',
  'tcp.port': 'ポート',
  'tcp.bindAddress': 'バインドアドレス',
  'tcp.connect': '接続',
  'tcp.disconnect': '切断',
  'tcp.stopServer': 'サーバー停止',
  'tcp.startServer': 'サーバー開始',

  // UDP
  'udp.title': 'UDP ソケット',
  'udp.localHost': 'ローカルホスト',
  'udp.localPort': 'ローカルポート',
  'udp.targetHost': 'ターゲットホスト',
  'udp.targetPort': 'ターゲットポート',
  'udp.closeSocket': 'ソケットを閉じる',
  'udp.bindSocket': 'ソケットをバインド',

  // Reconnect Dialog
  'reconnect.title': '既存の接続があります',
  'reconnect.description': 'すでにアクティブな接続があります。切断して再接続しますか？',
  'reconnect.cancel': 'キャンセル',
  'reconnect.confirm': '再接続',

  // Connection Status
  'status.disconnected': '切断',
  'status.connecting': '接続中...',
  'status.connected': '接続済み',
  'status.listening': '待ち受け中',
  'status.error': 'エラー',

  // Data Display
  'data.noData': 'データがありません。接続して通信を開始してください。',

  // Send Panel
  'send.placeholder': 'メッセージを入力...',
  'send.hexPlaceholder': 'AA BB CC DD...',
  'send.send': '送信',
  'send.periodicPlaceholder': '定期送信データ...',
  'send.every': '間隔',
  'send.ms': 'ms',
  'send.start': '開始',
  'send.stop': '停止',

  // Chat
  'chat.title': 'プロトコルアシスタント',
  'chat.clearChat': 'チャットをクリア',
  'chat.askProtocol': 'RS-232、TCP、UDPプロトコルについて質問してください',
  'chat.pasteData': 'または通信データを貼り付けて分析してください',
  'chat.geminiKeyRequired': '⚠️ Geminiを使用するには、右上の⚙️設定 → Googleカードを開き、AI APIキーを入力してください。',
  'chat.anthropicKeyRequired': '⚠️ 右上の⚙️設定 → Anthropicカードを開き、APIキーを入力してください。',
  'chat.inputPlaceholder': 'プロトコルの質問、データ分析... (Shift+Enterで改行)',
  'chat.attachData': '通信データを添付',
  'chat.analyzeAndFix': 'この通信データを分析し、問題があれば解決方法を提案してください',

  // Action blocks
  'action.send': 'データ送信',
  'action.reconnect': '再接続',
  'action.disconnect': '切断',
  'action.configure': '設定変更',
  'action.execute': '実行',
  'action.executing': '実行中...',
  'action.success': '実行完了',
  'action.failed': '実行失敗',
  'action.noConnection': 'アクティブな接続がありません',

  // Settings
  'settings.title': '設定',
  'settings.apiKey': 'API Key',
  'settings.encryptedStorage': 'OSキーチェーンに暗号化保存',
  'settings.logout': 'ログアウト',
  'settings.authenticating': 'ブラウザで認証中...',
  'settings.googleLogin': 'Googleでログイン',
  'settings.googleConsoleGuide': 'Google Cloud Console → OAuth 2.0 → デスクトップアプリ',
  'settings.geminiLabel': '(Gemini使用時)',
  'settings.llmModel': 'LLMモデル',
  'settings.parameters': 'パラメータ',
  'settings.cancel': 'キャンセル',
  'settings.save': '保存',
  'settings.clientIdRequired': 'Client IDとSecretを入力してください。',
  'settings.loginFailed': 'ログイン失敗',

  // Settings - Provider
  'settings.providerKeys': 'APIキー / 認証',
  'settings.anthropicConnected': 'Anthropic 接続済み',
  'settings.googleConnected': 'Google 接続済み',
  'settings.notConfigured': '未設定',
  'settings.configured': '設定済み',
  'settings.googleAiKeyPlaceholder': 'AI Studioキー — aistudio.google.com',
  'settings.oauthOptional': 'OAuth（任意）',
  'settings.oauthDesc': 'Googleアカウント連携時に必要',

  // Settings - Connect buttons
  'settings.getApiKey': 'APIキーを取得',
  'settings.openaiConnected': 'OpenAI 接続済み',
  'settings.openaiKeyPlaceholder': 'sk-... (platform.openai.com)',
  'settings.pasteKeyHere': '取得したキーをここに貼り付け',
  'settings.openConsole': 'コンソールを開く',

  // Chat - OpenAI
  'chat.openaiKeyRequired': '⚠️ 右上の⚙️設定 → OpenAIカードを開き、APIキーを入力してください。',

  // Settings - Free providers
  'settings.freeProviders': '無料AIプロバイダー',
  'settings.premiumProviders': 'プレミアムプロバイダー（APIキー）',
  'settings.free': '無料',
  'settings.noKeyNeeded': 'APIキー不要',
  'settings.getFreeKey': '無料キーを取得',
  'settings.ollamaSettings': 'Ollama 設定',
  'settings.ollamaUrl': 'Ollama サーバーURL',
  'settings.ollamaDesc': 'Ollamaをインストールしてローカルで無料AI利用可能 (ollama.com)',
  'settings.groqDesc': '無料クラウドAI · 超高速推論 (console.groq.com)',
  'settings.openrouterDesc': '多様な無料モデル提供 (openrouter.ai)',

  // Settings - Model selector
  'settings.needsKey': 'キーが必要',
  'settings.keyRequiredForModel': 'このモデルを使用するには、上でAPIキーを入力してください。',

  // Chat - Model selector
  'chat.freeModels': '無料モデル',
  'chat.premiumModels': 'プレミアム（APIキー必要）',
  'chat.ollamaNotRunning': '⚠️ Ollamaが起動していません。ollama.comからインストールし、`ollama run llama3.2`コマンドでモデルを起動してください。',
  'chat.groqKeyRequired': '⚠️ Groqを使用するには⚙️設定 → Groqカードで無料APIキーを入力してください。(console.groq.comで無料取得)',
  'chat.openrouterKeyRequired': '⚠️ OpenRouterを使用するには⚙️設定 → OpenRouterカードでAPIキーを入力してください。(openrouter.aiで無料取得)',

  // Model descriptions - Free
  'model.llama32.desc': 'ローカル · 軽量 · 高速',
  'model.llama31.desc': 'ローカル · バランス型',
  'model.mistral.desc': 'ローカル · 多言語対応',
  'model.gemma2.desc': 'ローカル · Googleオープンソース',
  'model.llama33groq.desc': 'クラウド · 高性能 · 無料',
  'model.llama31instant.desc': 'クラウド · 超高速 · 無料',
  'model.gemma2groq.desc': 'クラウド · Googleオープンソース · 無料',
  'model.llama33or.desc': 'クラウド · 高性能 · 無料',
  'model.deepseekChat.desc': 'クラウド · DeepSeek V3 · 無料',
  'model.deepseekR1.desc': 'クラウド · 推論モデル · 無料',
  'model.geminiFlashOr.desc': 'クラウド · 高速 · 無料',

  // BLE
  'ble.title': 'BLE 設定',
  'ble.device': 'デバイス',
  'ble.selectDevice': 'デバイスを選択...',
  'ble.noDevices': 'デバイスが見つかりません',
  'ble.serviceUuid': 'サービスUUID',
  'ble.characteristicUuid': 'キャラクタリスティックUUID',
  'ble.connect': '接続',
  'ble.disconnect': '切断',
  'ble.notAvailable': 'BLEが利用できません。nobleモジュールを確認してください。',
  'ble.services': 'サービス',
  'ble.scanning': 'スキャン中...',

  // Login page
  'login.subtitle': 'ハードウェア通信 + プロトコルアシスタント',
  'login.github': 'GitHubで続ける',
  'login.google': 'Googleで続ける',
  'login.failed': 'ログインに失敗しました。もう一度お試しください。',
  'login.footer': 'ログインすると、通信設定とAIキーがアカウントに安全に保存されます。',

  // Settings - Account
  'settings.account': 'アカウント',
  'settings.login': 'ログイン',
  'settings.config': '設定',

  // Model descriptions - Paid
  'model.claudeSonnet4.desc': '最新高性能 · 200Kコンテキスト',
  'model.claudeOpus4.desc': '最高性能 · 複雑な推論',
  'model.claude35Sonnet.desc': '高速でバランスの取れた性能',
  'model.claude35Haiku.desc': '超高速 · 軽量タスク',
  'model.geminiFlash.desc': '高速で効率的 · マルチモーダル',
  'model.geminiPro.desc': 'ロングコンテキスト · 高性能',
  'model.gpt4o.desc': '最高性能 · マルチモーダル',
  'model.gpt4oMini.desc': '高速で経済的',

  // Session
  'session.save': 'セッション保存',
  'session.load': 'セッション読み込み',
  'session.saveTitle': 'セッション保存',
  'session.saveDesc': '現在の接続設定と最近のログをクラウドに保存します。',
  'session.loadTitle': 'セッション読み込み',
  'session.loadDesc': '保存されたセッションを復元します。接続は切断状態で復元されます。',
  'session.namePlaceholder': 'セッション名',
  'session.connections': '件の接続',
  'session.logEntries': '件のログ（接続ごとに最大100件）',
  'session.noSessions': '保存されたセッションがありません',
  'session.deleteTitle': 'セッション削除',
  'session.deleteDesc': 'このセッションは完全に削除されます。',
  'session.delete': '削除',
  'common.cancel': 'キャンセル',
  'common.close': '閉じる',

  // Built-in model
  'model.builtinGeminiFlash.desc': '標準搭載 · 無料 · 設定不要',
  'chat.builtinLabel': '標準搭載（無料）',
  'chat.rateLimitHourly': '⚠️ 1時間あたりの使用上限に達しました（30回/時間）。しばらく待つか、設定でAPIキーを登録すると制限なく使用できます。',
  'chat.rateLimitDaily': '⚠️ 1日の使用上限に達しました（200回/日）。設定でAPIキーを登録すると制限なく使用できます。',
  'chat.builtinNotConfigured': '⚠️ 標準AIモデルがまだ設定されていません。他のモデルを選択するか、設定でAPIキーを登録してください。',
  'chat.loginRequired': '⚠️ 標準AIモデルを使用するにはログインが必要です。'
}
