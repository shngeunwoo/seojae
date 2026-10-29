# 서재

영어와 한국어를 한자리에서 외우는 단어장입니다. 카드, 퀴즈, 받아쓰기, 듣기, 짝맞추기를 지원하고, 복습 날짜는 기억한 정도에 따라 늘어납니다.

단어는 이 브라우저에만 저장됩니다. 계정은 없고, 서버로 전송되지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 개발 서버 주소를 엽니다. 처음 열면 일상 표현 세 장과 함께 2022 개정 공통영어2(능률 오선영) 1–4과·특별과, 학평·수능 빈출 모의고사 단어장이 들어 있습니다. 이미 쓰던 브라우저에도 같은 단어장이 자동으로 붙습니다.

```bash
npm run lint
npm run build
```

GitHub Pages용 정적 사이트는 이렇게 만듭니다.

```bash
GITHUB_PAGES=true npm run build
```

## 안드로이드 앱

웹 앱을 Capacitor로 감싼 네이티브 패키지입니다. 단어는 예전처럼 기기 안에만 남습니다.

필요한 것: Node.js 20+, JDK 21, 약 8GB 디스크. Linux나 macOS에서는 아래 스크립트가 Android SDK와 `seojae` 가상 기기를 같이 깔아 줍니다. 이 환경에는 KVM이 있어야 에뮬레이터가 빠릅니다.

```bash
npm install
npm run android:setup
npm run android:run
```

`android:setup`은 SDK를 `~/Android/Sdk`에 받고 API 35 가상 기기 `seojae`를 만듭니다. `android:run`은 정적 페이지를 빌드하고, 에뮬레이터를 켠 다음 디버그 APK를 설치해 서재를 실행합니다. 같은 APK는 `dist/seojae-debug.apk`로도 복사되니 실제 폰에는 이렇게 올리면 됩니다.

```bash
adb install -r dist/seojae-debug.apk
```

Android Studio가 있으면 웹을 맞춘 뒤 프로젝트를 열 수 있습니다.

```bash
npm run android:sync
npx cap open android
```

이미 SDK가 있다면 `ANDROID_SDK_ROOT`(또는 `ANDROID_HOME`)를 가리킨 채로 `source scripts/android-env.sh`만 하면 됩니다.

## 주소

- 저장소: https://github.com/shngeunwoo/seojae
- GitHub Pages: https://shngeunwoo.github.io/seojae/

`main`에 푸시하면 GitHub Actions가 사이트를 빌드해 `gh-pages` 브랜치에 올립니다. 처음 한 번은 저장소 **Settings → Pages → Source**를 **Deploy from a branch**, Branch는 **gh-pages**로 고르면 됩니다.

## 할 수 있는 일

- 단어장 만들기, 이름과 색 바꾸기, 지우기
- 단어 추가와 수정. 품사, 예문, 해석, 태그, 메모, 즐겨찾기
- 영어와 한국어를 어느 쪽에나 두기. 비슷한 뜻은 `/` 로 나눕니다
- 여러 줄 붙여넣기. `단어 - 뜻`, 탭, `|` 를 읽습니다
- JSON 백업과 CSV 가져오기, 내보내기
- 오늘 복습, 새 단어, 약한 단어, 즐겨찾기, 전체
- 방향: 단어→뜻, 뜻→단어, 섞기
- 카드에서 다시(1분) / 어려움(10분) / 보통(1시간) / 기억함(6시간) / 쉬움(12시간) / 완벽함(4일)
- 객관식, 받아쓰기(한 글자 차이는 알려 줌), 듣기, 짝맞추기
- 화면 언어 한국어·English, 밝게·어둡게·기기 설정
- 발음 듣기, 하루 목표, 연속 학습, 16주 기록
- 공통영어2 능률 오선영(2022 개정) 단원별 어휘, 모의고사 빈출 어휘
- 단축키: 학습 중 `Space` 앞·뒤 뒤집기, `1`–`6` 평가, `S` 발음, `F` 즐겨찾기, `Esc` 나가기. `?` 는 안내

진행 중인 학습은 탭을 닫아도 이어서 할 수 있습니다.

## 글꼴

화면 글꼴은 [Pretendard](https://github.com/orioncactus/pretendard)입니다. SIL Open Font License 1.1. 라이선스 원문은 `public/fonts/OFL.txt`에 있습니다. 한글은 jsDelivr의 가변 서브셋으로 불러오고, 영문 제목에는 Fraunces를 씁니다.
