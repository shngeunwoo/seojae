# 서재

영어와 한국어를 한자리에서 외우는 단어장입니다. 카드, 퀴즈, 받아쓰기, 듣기, 짝맞추기를 지원하고, 복습 날짜는 기억한 정도에 따라 늘어납니다.

단어는 이 브라우저에만 저장됩니다. 계정은 없고, 서버로 전송되지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 개발 서버 주소를 엽니다. 처음 열면 샘플 단어장 세 개(하루의 말, 일의 말, 마음의 말)가 들어 있습니다.

```bash
npm run lint
npm run build
```

GitHub Pages용 정적 사이트는 이렇게 만듭니다.

```bash
GITHUB_PAGES=true npm run build
```

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
- 카드에서 다시 / 어려움 / 기억함 / 쉬움. 다음 복습 간격이 바뀝니다
- 객관식, 받아쓰기(한 글자 차이는 알려 줌), 듣기, 짝맞추기
- 화면 언어 한국어·English, 밝게·어둡게·기기 설정
- 발음 듣기, 하루 목표, 연속 학습, 16주 기록
- 단축키: 학습 중 `Space` 뒤집기, `1`–`4` 평가, `S` 발음, `F` 즐겨찾기, `Esc` 나가기. `?` 는 안내

진행 중인 학습은 탭을 닫아도 이어서 할 수 있습니다.

## 글꼴

화면 글꼴은 [Pretendard](https://github.com/orioncactus/pretendard)입니다. SIL Open Font License 1.1. 라이선스 원문은 `public/fonts/OFL.txt`에 있습니다. 한글은 jsDelivr의 가변 서브셋으로 불러오고, 영문 제목에는 Fraunces를 씁니다.
