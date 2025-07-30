# 🎙️ AI 팟캐스트 자막 뷰어

실시간 오디오 동기화와 영화 자막 스타일의 타이핑 애니메이션을 제공하는 AI 팟캐스트 자막 시스템입니다.

## ✨ 주요 기능

### 🎬 영화 자막 스타일 UI
- **슬라이딩 채팅**: 현재/이전 화자의 말풍선 2개만 표시
- **실시간 타이핑 애니메이션**: 오디오와 완벽 동기화된 문자별 타이핑
- **부드러운 전환**: TV 자막처럼 자연스러운 화자 전환
- **반응형 디자인**: 다양한 화면 크기 지원

### 🤖 정확한 음성 인식
- **OpenAI Whisper 통합**: 최고 수준의 한국어 음성 인식
- **정밀한 타이밍**: 세그먼트별 정확한 시간 동기화
- **화자 분리**: 자동/수동 화자 구분 지원
- **시간 순서 정렬**: 잘못된 화자 그룹화 자동 수정

### 🛠️ 강력한 편집 도구
- **수동 타이밍 조정**: 실시간 타이밍 편집 도구
- **화자 지정**: 드롭다운으로 쉬운 화자 변경
- **드래그 앤 드롭**: 파일 업로드 간편화
- **JSON 내보내기**: 편집 결과 저장 및 공유

## 🚀 빠른 시작

### 1. 기본 사용법
```bash
# 프로젝트 클론
git clone <repository-url>
cd vibe

# 브라우저에서 실행
# subtitle-chat.html 파일을 브라우저에서 열기
```

### 2. 파일 준비
- **오디오 파일**: `audio.wav` (또는 임의의 오디오 파일)
- **JSON 타이밍 파일**: `whisper-analysis.json` (또는 수동 생성)

### 3. 자동 실행
1. `subtitle-chat.html` 브라우저에서 열기
2. 기본 파일이 있으면 자동 로드
3. 없으면 파일 업로드 섹션에서 수동 업로드

## 📁 프로젝트 구조

```
vibe/
├── subtitle-chat.html          # 🎬 메인 자막 뷰어
├── timing-helper.html          # ⏱️ 수동 타이밍 편집 도구  
├── audio-analyzer.html         # 🔍 오디오 분석 도구
├── whisper-analyzer/           # 🤖 Whisper AI 분석 도구
│   ├── whisper_to_json.py     # Python 음성 인식 스크립트
│   ├── pyproject.toml         # uv 프로젝트 설정
│   └── README.md              # Whisper 도구 사용법
├── audio.wav                   # 🎵 기본 오디오 파일
├── whisper-analysis.json       # 📄 타이밍 데이터
└── README.md                   # 📖 이 파일
```

## 🎯 사용 시나리오

### 시나리오 1: 완전 자동 처리
```bash
# 1. Whisper로 오디오 분석
cd whisper-analyzer
uv run whisper_to_json.py ../audio.wav

# 2. 자막 뷰어에서 확인
# subtitle-chat.html 브라우저에서 열기
```

### 시나리오 2: 수동 편집
```bash
# 1. 타이밍 편집 도구 열기
# timing-helper.html 브라우저에서 열기

# 2. 오디오 + JSON 파일 로드
# 3. 화자 지정 및 타이밍 조정
# 4. JSON 다운로드

# 5. 자막 뷰어에서 확인
# subtitle-chat.html에서 편집된 JSON 사용
```

### 시나리오 3: 실시간 조정
```bash
# 1. 기본 분석 실행
cd whisper-analyzer
uv run whisper_to_json.py ../audio.wav

# 2. 실시간 편집
# timing-helper.html에서 미세 조정
```

## 🛠️ 도구별 상세 가이드

### 🎬 subtitle-chat.html (메인 뷰어)
**기능**: 최종 자막 시청용 메인 애플리케이션
- ✅ 슬라이딩 말풍선 (최대 2개만 표시)
- ✅ 실시간 타이핑 애니메이션
- ✅ 화자별 색상 구분 (인간: 파랑, AI: 핑크)
- ✅ 시간 순서 자동 정렬
- ✅ 아코디언 파일 업로드 UI

**사용법**:
1. 브라우저에서 파일 열기
2. 설정 섹션에서 파일 업로드 (또는 자동 로드)
3. 화자 이름 커스터마이징
4. 오디오 재생하여 자막 확인

### ⏱️ timing-helper.html (편집 도구)
**기능**: 화자 지정 및 타이밍 수동 편집
- ✅ 실시간 타이밍 모드
- ✅ 화자 드롭다운 선택 (👤인간/🤖AI)
- ✅ 클릭으로 시간 설정
- ✅ 키보드 단축키 (Space: 재생, 1/2: 화자 변경)
- ✅ JSON 내보내기

**사용법**:
1. 오디오 파일 로드
2. 각 텍스트의 화자 선택
3. "실시간 타이밍 모드" 활성화
4. 오디오 재생하며 텍스트 클릭으로 타이밍 설정
5. JSON 생성 및 다운로드

### 🤖 whisper_to_json.py (AI 분석)
**기능**: OpenAI Whisper를 사용한 자동 음성 인식
- ✅ 정확한 한국어 인식
- ✅ 자동 화자 분리
- ✅ 무음 구간 기반 그룹화
- ✅ 시간 기반 분할
- ✅ 채팅 앱 형식 JSON 생성

**사용법**:
```bash
# 기본 사용
uv run whisper_to_json.py audio.wav

# 고급 옵션
uv run whisper_to_json.py audio.wav -m medium --min-gap 3.0 -o custom.json
```

**옵션**:
- `-m, --model`: Whisper 모델 크기 (tiny/base/small/medium/large)
- `--min-gap`: 화자 변경 최소 간격 (초)
- `-o, --output`: 출력 파일명

## 📊 JSON 데이터 형식

```json
[
  {
    "speaker": 1,
    "segments": [
      {
        "text": "나와 한 가지 주제로 깊이 있는 대화를 해보자.",
        "startTime": 0,
        "endTime": 2.9
      }
    ]
  },
  {
    "speaker": 2,
    "segments": [
      {
        "text": "프롬프트 엔지니어링. 흥미롭네요.",
        "startTime": 15.8,
        "endTime": 18.8
      }
    ]  
  }
]
```

**필드 설명**:
- `speaker`: 화자 번호 (1: 인간, 2: AI)
- `text`: 발언 내용
- `startTime`: 시작 시간 (초)
- `endTime`: 종료 시간 (초)

## 🎨 화자 커스터마이징

### 기본 화자 설정
- **화자 1**: 👤 인간 (파란색 말풍선)
- **화자 2**: 🤖 AI (핑크색 말풍선)

### 이름 변경
1. subtitle-chat.html의 설정 섹션
2. "👥 화자 이름 설정"에서 수정
3. 실시간으로 UI에 반영

## ⚙️ 고급 기능

### 시간 순서 자동 정렬
화자별로 그룹화된 잘못된 JSON도 자동으로 시간 순서로 정렬:
```javascript
// 자동 정렬 예시
// 잘못된 순서: 화자1 전체 → 화자2 전체
// 올바른 순서: 시간순으로 화자1 → 화자2 → 화자1 → 화자2...
```

### 스마트 그룹화
- 연속된 같은 화자 발언 자동 결합
- 2초 이상 간격 시 새로운 그룹 생성
- 자연스러운 대화 흐름 유지

### 슬라이딩 UI 로직
- 현재 화자와 이전 화자만 표시
- 메모리 효율적인 DOM 관리
- 부드러운 슬라이드 애니메이션

## 🔧 개발 정보

### 기술 스택
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: OpenAI Whisper
- **Python**: uv 패키지 매니저
- **Audio**: Web Audio API

### 브라우저 호환성
- ✅ Chrome/Edge (추천)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE 미지원

### 성능 최적화
- 메모리 효율적인 슬라이딩 UI
- 필요시에만 DOM 업데이트
- 타이밍 기반 지연 로딩

## 🐛 문제 해결

### 일반적인 문제

**Q: 화자2가 나타나지 않아요**
- JSON 파일의 시간 순서 확인
- timing-helper.html에서 화자 재지정
- whisper_to_json.py로 재분석

**Q: 타이핑 애니메이션이 이상해요**
- 브라우저 새로고침
- JSON 파일의 시간 겹침 확인
- 오디오 파일 포맷 확인

**Q: Whisper 분석이 안돼요**
```bash
# uv 환경 확인
cd whisper-analyzer
uv sync

# 오디오 파일 경로 확인
uv run whisper_to_json.py ../audio.wav
```

### 디버깅 팁
1. 브라우저 개발자 도구 콘솔 확인
2. JSON 파일 구조 검증
3. 오디오 파일 재생 가능 여부 확인

## 🤝 기여하기

### 개발 환경 설정
```bash
# 프로젝트 클론
git clone <repository-url>
cd vibe

# Python 환경 설정 (Whisper용)
cd whisper-analyzer
uv sync
```

### 기여 방법
1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 Issue를 생성해 주세요.

---

**Made with ❤️ for AI Podcast Lovers**

🎙️ **AI 팟캐스트를 더욱 몰입감 있게 즐겨보세요!**