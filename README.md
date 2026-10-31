# CiTEA Walk in Junggu, Daejeon 2026 운영 가이드

로그인·설치 없이 사용하는 한국어 / 대만 번체 / 중국 간체 도시 탐방 가이드입니다. 별도 서버, 유료 API, npm 설치 없이 동작하는 정적 웹사이트이며, GitHub 무료 기본 주소로 배포할 수 있습니다.

## 먼저 확인할 콘텐츠

현재 작업 폴더에서 공식 일정 PDF와 녹음 MP3를 찾지 못했습니다. 11월 7–10일의 상세 시간·방문 순서·집합 장소는 비워 두었으며, 오디오는 `준비 중`으로 표시합니다. 일정 원본을 확보하기 전에는 시간을 임의로 채우지 마세요. 운영진 연락처도 입력이 필요합니다. 확인되지 않은 역사적 연결, 2026년 행사·시설 운영 정보는 화면의 확인 안내와 출처를 검토한 뒤 확정해 주세요.

## 실행과 배포 파일 만들기

Node.js 22 이상을 설치한 뒤 이 README가 있는 폴더에서 실행합니다.

```sh
node scripts/dev.mjs
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다. 휴대전화로 같은 Wi-Fi에서 확인하려면 `node scripts/dev.mjs --host 0.0.0.0`으로 실행한 뒤 컴퓨터의 실제 LAN 주소로 접속합니다. 오프라인 저장 기능은 HTTPS 배포 주소 또는 localhost에서 확인하세요.

```sh
node scripts/build.mjs
node scripts/dev.mjs --dist --port 4174
```

`dist/`가 배포용 결과입니다. 빌드는 JSON 문법, 3개 언어 텍스트, 장소 ID 중복, 일정의 장소 참조와 시간 형식, 등록한 로컬 오디오·사진 파일 존재 여부를 검사합니다. 앱과 자료를 변경한 뒤에는 다시 빌드하세요. `dist/`를 직접 수정하면 다음 빌드에서 덮어씁니다.

## 운영자가 수정하는 파일

| 파일 | 수정 내용 |
| --- | --- |
| `public/data/event.json` | 행사 설명, `dates`별 일정, `notices`, `contact`, 준비물 `checklist` |
| `public/data/places.json` | 장소 이름·소개·배경·방문 목적·주소·지도·출처·오디오 |
| `public/data/locale.json` | 메뉴, 버튼 등 화면 공통 문구 |
| `public/data/site.json` | 실제 공개 주소 `publicUrl` 등 사이트 설정 |
| `public/audio/ko/`, `tw/`, `cn/` | 언어별 실제 MP3 파일 |
| `public/assets/` | 사용 허락을 확보한 사진과 안내 이미지 |

텍스트의 언어 키는 `ko`, `tw`, `cn`입니다. 예: `{"ko":"집합 안내","tw":"集合資訊","cn":"集合信息"}`. 장소의 `id`는 링크와 QR에 쓰이므로 공개 후에는 유지하세요. 주소와 시설 운영시간은 공식 출처를 확인하고, `sources`에 출처 URL을 남깁니다. 불명확한 항목은 `null`과 확인 안내를 유지합니다.

### 일정 등록

`event.json`의 해당 `dates` 항목에서 `items`에 원본 PDF와 일치하는 항목만 추가합니다. 날짜 ID는 `2026-11-07`, `2026-11-08`, `2026-11-09`, `2026-11-10`입니다.

```json
{
  "time": "09:00",
  "title": { "ko": "원본 프로그램명", "tw": "原始活動名稱", "cn": "原始活动名称" },
  "placeId": "naraegwan",
  "description": { "ko": "원본 확인 후 입력", "tw": "核對原始資料後填寫", "cn": "核对原始资料后填写" }
}
```

위 시간은 **형식 예시이며 실제 행사 일정이 아닙니다**. 원본을 대조해 시간·장소·내용을 모두 바꾸세요. 시간 범위는 `09:00–10:00` 형식을 사용할 수 있습니다. `placeId`는 `places.json`의 실제 ID와 일치해야 합니다. 원본 등록 뒤 `scheduleSource`에 파일명 또는 출처를 적고, 관련 `status`와 일정 미확정 공지도 함께 고칩니다.

### 공지·연락처

`notices`의 `title`과 `body`를 세 언어로 수정합니다. `contact.organizer`, `phone`, `email`, `emergencyMeetingPoint`에는 주최 측이 공개할 수 있는 실제 정보를 입력합니다. 집합 장소와 시간은 원본 일정과 현장 운영을 확인한 뒤 입력하세요.

### 오디오 추가

1. 저작권·초상권을 확보한 실제 MP3를 준비합니다. 경량 음성 파일을 권장하며, 한 파일이 GitHub의 파일 업로드 한도를 넘지 않도록 합니다.
2. 예를 들어 한국어 나래관 파일을 `public/audio/ko/naraegwan.mp3`로 저장합니다.
3. 해당 장소의 `audio.ko`를 아래처럼 바꿉니다. 번체는 `audio.tw`, 간체는 `audio.cn`에 각각 별도 파일을 연결합니다.
4. `node scripts/build.mjs`로 확인하고 다시 배포합니다.

```json
"audio": {
  "ko": { "src": "audio/ko/naraegwan.mp3", "title": "대전전통나래관 안내" },
  "tw": null,
  "cn": null
}
```

파일 경로 앞에 `/`를 붙이지 마세요. 그래야 `계정.github.io/저장소/` 주소에서도 작동합니다. 파일이 없는 언어는 `null`을 유지합니다. 녹음을 교체할 때는 `naraegwan-v2.mp3`처럼 파일명을 바꾸고 `src`도 갱신하면 이미 저장된 이전 녹음과 구별할 수 있습니다. 각 기기에서 사용자가 재생 버튼을 눌러 시작하며, 다른 참가자 기기와 동기화하지 않습니다. 화면 이동 중에는 사이트 하단 플레이어가 재생을 유지합니다. 외부 지도 열기, 브라우저 탭 종료, OS의 메모리·배터리 정책에 따른 지속 재생은 기기와 브라우저에 따라 달라집니다.

오디오의 기기 저장 기능은 지원 브라우저에서 사용할 수 있습니다. 행사 전에 파일을 저장한 뒤 비행기 모드로 확인하세요. 브라우저 저장소는 기기 용량이나 브라우저 정책에 따라 삭제될 수 있어, 다운로드 파일도 개인 기기에 보관하는 것을 권장합니다. 실제 MP3를 등록한 뒤 Android Chrome 및 iPhone Safari의 재생·탐색·속도·잠금화면·오프라인 동작을 반드시 확인하세요.

### 지도·사진

`naverQuery`는 실제 한글 장소명과 확인된 주소를 포함한 NAVER 지도 검색어입니다. 정확한 공식 장소 링크를 확보하면 `naverUrl`에 넣고, 확인된 길찾기 링크는 `directionsUrl`에 넣습니다. 검색 결과는 지도에서 동일 장소인지 최종 확인하세요. 좌표나 주소를 추측해 입력하지 마세요. `verified`는 자료 확인 상태를 뜻하며, 행사 방문시간이나 예약 확정을 뜻하지 않습니다. `meetingPoint`도 운영진 확정 전에는 `null`로 둡니다.

사진 파일은 용량을 줄인 WebP/JPEG 등을 사용하고 `places.json`의 `image.src`, `image.alt`, `image.source`, `image.credit`를 함께 갱신합니다. 홈 사진은 `site.json`의 `hero`에서 수정합니다. 현재 대표 이미지는 우암사적공원의 봄 자료사진이며, 화면에 촬영 계절과 출처·라이선스를 표시합니다. 사진이 없는 장소는 `사진 준비 중`으로 표시하므로 행사 전에 사용 허락을 확보한 실제 장소 사진을 추가할 수 있습니다.

## GitHub Pages 무료 배포

이 폴더의 **내용 전체**를 공개 GitHub 저장소의 루트에 올립니다. `.github/workflows/pages.yml`도 포함해야 합니다. GitHub Free의 공개 저장소에서 Pages를 사용할 수 있으며, 별도 도메인을 살 필요가 없습니다. 절차와 워크플로는 [GitHub Pages 공식 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 기준으로 구성했습니다.

1. GitHub에서 공개 저장소를 만들고, 기본 브랜치를 `main`으로 둡니다.
2. 이 폴더 내용을 커밋·푸시합니다. `dist/`는 자동으로 생성되므로 올리지 않아도 됩니다.
3. 저장소 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
4. **Actions**에서 `Deploy CiTEA Walk to GitHub Pages`의 성공을 확인합니다. 기본 브랜치가 다르면 워크플로의 `branches` 값을 바꿉니다.
5. Pages가 표시하는 실제 HTTPS 주소를 엽니다. 프로젝트 저장소의 주소는 대개 `https://계정.github.io/저장소/` 형식입니다. 표시된 실제 주소를 사용하세요.
6. `public/data/site.json`의 `publicUrl`에 그 주소를 입력하고 QR을 생성한 뒤 다시 커밋·푸시합니다.

워크플로는 `checkout@v6`, `setup-node@v7`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`를 사용하며 npm 의존성을 설치하지 않습니다. GitHub Actions의 `github-pages` 배포 환경에서 공개 주소와 배포 이력을 확인할 수 있습니다. 저장소 이름이 바뀌면 주소·QR을 다시 확인해야 합니다.

## 인쇄용 QR

공개 주소가 확정되기 전에는 QR 이미지를 만들지 않습니다. localhost·예시 도메인·임시 입력값은 생성 스크립트가 거부합니다.

```sh
node scripts/generate-qr.mjs
```

`site.json`의 `publicUrl` 대신 `--url` 뒤에 **실제 확정된 공개 HTTPS 주소**를 전달할 수도 있습니다. URL의 검색 매개변수와 해시는 넣지 마세요. 스크립트가 언어와 장소 경로를 추가합니다.

`public/qr/`에 메인 `main.png` / `main.svg`, 언어별 메인, 장소·언어별 PNG/SVG, 실제 연결 주소 목록 `manifest.json`을 생성합니다. 이미 빌드된 `dist/qr/`에도 복사합니다. 생성한 QR을 커밋하면 다음 배포에도 포함됩니다. PNG는 인쇄용 고해상도이고 SVG는 확대해도 선명합니다. 흰 여백을 자르거나 그림을 덧씌우지 말고 인쇄 전 Android·iPhone 카메라로 스캔해 공개 사이트와 해당 장소가 열리는지 확인하세요. QR 이미지 생성 자체가 URL의 접속 가능성을 보장하지는 않습니다.

## 공개 전 확인

- 원본 PDF와 4일 일정·방문 순서·집합 시간 대조
- 모든 메뉴와 장소에서 KO/TW/CN 전환 및 선택 유지
- 작은 모바일 화면, 큰 글자 설정, 키보드 사용 시 읽기·버튼 동작
- 실제 MP3 등록 후 재생·일시정지·진행바·속도·페이지 이동·오프라인 저장
- NAVER 지도 검색 결과·길찾기·정확한 집합 안내
- 체크리스트 선택 후 새로고침과 언어 전환 시 유지
- 운영진 연락처·일정 변경 공지 입력
- 실제 Pages 주소·장소별 직접 링크·QR을 휴대전화로 확인

행사 종료 후에는 `event.json`의 행사 공지와 소개를 관광 안내에 맞게 고치고 장소·오디오를 유지해 재사용할 수 있습니다. 체크리스트와 언어 선택은 각 브라우저의 로컬 저장소에 보관되며 서버에 전송하지 않습니다.
