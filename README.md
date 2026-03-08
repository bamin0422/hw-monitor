# HW Monitor

Hardware Communication Monitoring Tool with LLM Chat

Serial, TCP, UDP, BLE 통신을 모니터링하고, LLM 채팅으로 데이터를 분석할 수 있는 데스크톱 애플리케이션입니다.

## Features

- **Multi-Protocol Support** - Serial, TCP (Client/Server), UDP, BLE 통신 지원
- **Real-time Monitoring** - HEX/ASCII 데이터 실시간 수신 및 전송
- **LLM Chat** - Anthropic, OpenAI, Google Gemini, Groq, Ollama 등 다양한 LLM 연동
- **RAG Analysis** - 통신 데이터를 기반으로 한 AI 분석
- **Session Management** - 연결 설정 및 로그 저장/복원
- **Cloud Sync** - Supabase 기반 설정 동기화
- **Auto Update** - 새 버전 자동 감지 및 업데이트
- **i18n** - 한국어/영어 지원

## Download

[Latest Release](https://github.com/bamin0422/hw-monitor/releases/latest)에서 OS별 설치 파일을 다운로드할 수 있습니다.

| OS | File |
|------|------|
| macOS (Apple Silicon) | `HW-Monitor-*-mac-arm64.dmg` |
| macOS (Intel) | `HW-Monitor-*-mac-x64.dmg` |
| Windows | `HW-Monitor-*-win-x64.exe` |
| Linux | `HW-Monitor-*-linux-x86_64.AppImage` |

## Tech Stack

- **Framework**: Electron + React + TypeScript
- **Build**: electron-vite + electron-builder
- **UI**: Tailwind CSS + Radix UI + Lucide Icons
- **State**: Zustand
- **LLM**: LangChain (Anthropic, OpenAI, Google GenAI, Groq, Ollama)
- **Communication**: serialport, net (TCP), dgram (UDP), @abandonware/noble (BLE)
- **Auth & Sync**: Supabase + Google OAuth
- **Auto Update**: electron-updater

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

## Architecture

```
hw-monitor/
├── electron/          # Main process
│   ├── main.ts        # App entry point
│   ├── preload.ts     # Context bridge (IPC)
│   ├── config.ts      # Supabase & LLM config
│   ├── ipc/           # IPC handlers
│   │   ├── serial.ts  # Serial port
│   │   ├── tcp.ts     # TCP client/server
│   │   ├── udp.ts     # UDP socket
│   │   ├── ble.ts     # Bluetooth Low Energy
│   │   ├── llm.ts     # LLM streaming
│   │   ├── auth.ts    # Google OAuth
│   │   ├── settings.ts
│   │   ├── updater.ts # Auto-update
│   │   └── supabase-sync.ts
│   └── llm/           # LLM providers
├── src/               # Renderer process
│   ├── App.tsx
│   ├── components/
│   │   ├── monitor/   # Connection & data display
│   │   ├── chat/      # LLM chat panel
│   │   ├── auth/      # Login page
│   │   └── ui/        # Shared UI components
│   ├── store/         # Zustand stores
│   ├── lib/           # Utilities & i18n
│   └── types/
└── .github/workflows/ # CI/CD
```

## Author

**mindaein** - [Portfolio](https://hello-daein-min.vercel.app) | [GitHub](https://github.com/bamin0422)

## License

Private
