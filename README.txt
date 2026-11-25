Find:S 웹사이트

실행: 압축을 푼 뒤 index.html 을 브라우저에서 열면 됩니다. (서버 불필요)

파일 구성
  data.js   학과·문구·수치 (여기만 수정하면 됩니다. 맨 위 설명 참고)
  app.js    화면을 그리는 코드
  style.css 디자인
  assets/   이미지 (assets/{학과id}/1.jpg ~ 8.jpg, 규칙은 data.js 맨 위 설명 참고)

페이지
  index.html(메인), departments.html(학과 선택), department-detail.html?dept=software(학과 상세),
  employment.html(취업 선택), employment-detail.html?dept=software(취업 상세), about.html, news.html

학과 추가: data.js 의 학과 블록을 복사해 붙여넣고 값만 바꾼 뒤, assets/{id}/ 폴더에 이미지를 넣으세요.
실제 운영 전 입시/취업 수치와 학과 정보를 학교 공식 자료로 검증해 교체하세요.
