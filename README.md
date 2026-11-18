# Minjok Herald

news.kmla.online 신문 사이트 코드와, [Pages CMS](https://app.pagescms.org)로 편집하는 신문
콘텐츠를 함께 담은 저장소입니다. 본 사이트(kmla.online)는 `kmlaswtech/kmla-online`에 있습니다.
설계와 규칙은 [docs/DESIGN.md](docs/DESIGN.md), 작업 규칙은 [AGENTS.md](AGENTS.md)를 보세요.

## 폴더

| 폴더                | 내용                                                          |
| ------------------- | ------------------------------------------------------------- |
| `content/articles/` | 기사 (`<slug>.md`)                                            |
| `content/editions/` | 새 학기 판 (`edition-<호수>.yml`)                             |
| `content/polls/`    | 투표 (`<id>.yml`)                                             |
| `content/media/`    | 올린 사진·PDF                                                 |
| `.pages.yml`        | Pages CMS 입력 양식. 바꿀 때는 `app/`의 해석 코드도 함께 수정 |
| `app/`              | 사이트 코드 (React Router, 서버 렌더링)                       |
| `public/herald/`    | 과월호 24개 PDF·표지·디자인 이미지                            |

Pages CMS에서 저장하면 `content/`에 커밋이 남습니다. `content/`만 바뀐 커밋에서는 CI가 돌지
않습니다.

## 시작하기

Node 버전은 `.nvmrc`를 따릅니다.

```bash
npm ci
npm run dev
```

http://127.0.0.1:5174 에서 열립니다. 설정은 모두 선택이며 `.env.example`을 `.env.local`로
복사해 씁니다.

| 명령            | 하는 일                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `npm run check` | 타입, ESLint, Prettier, 단위 테스트                                          |
| `npm run e2e`   | 빌드한 사이트를 띄워 예시 콘텐츠(`test/fixtures/content/`)로 브라우저 테스트 |
| `npm run build` | `build/`에 서버·클라이언트 빌드                                              |
| `npm start`     | 빌드한 서버 실행 (포트 4174)                                                 |

## R2 동기화

`.github/workflows/sync-media-to-r2.yml`이 `content/media/`를 Cloudflare R2로 복사합니다.
저장소 설정에 변수 `R2_BUCKET`, `R2_ACCOUNT_ID`와 비밀값 `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`를 넣기 전까지는 실행되지 않습니다.

아직 배포는 설정되어 있지 않습니다.
