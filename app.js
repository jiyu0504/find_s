/* ============================================================================
   Find:S 화면 렌더링
   - 보통은 이 파일을 수정할 필요가 없습니다. 학과·문구·수치는 data.js 에서 바꾸세요.
   - 구성: 1 설정 / 2 유틸 / 3 데이터 읽기 / 4 공통 조각 / 5 페이지 / 6 실행 / 7 이벤트
   ========================================================================== */


/* 1. 설정 ------------------------------------------------------------------ */
const IMG_EXT = "jpg";          // 이미지 확장자 (assets/{id}/1.jpg)
const MAX_TOOLS = 3;            // TOOLS 사진은 3~5번 → 최대 3개

// 학과 폴더 안 이미지 번호 규칙 (data.js 상단 설명과 같음)
const IMG_NO = { card: 1, hero: 2, tool: 3, job: 6 };

// 이미지 파일이 없을 때 대신 보여줄 회색 이미지
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E" +
  "%3Crect width='4' height='3' fill='%23bbb'/%3E%3C/svg%3E";

// 상단 메뉴: [링크, 글자, 이 메뉴가 "현재 위치"로 표시되는 페이지들]
const NAV = [
  ["departments.html", "학과", ["departments", "department-detail"]],
  ["employment.html", "취업", ["employment", "employment-detail"]],
  ["news.html", "소식", ["news"]],
  ["about.html", "대학소개", ["about"]],
];

const PAGE = document.body.dataset.page;
const APP = document.querySelector("#app");


/* 2. 유틸 ------------------------------------------------------------------ */
// 글자를 화면에 안전하게 넣기 (<, &, " 등이 있어도 깨지지 않게)
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// "a, b, c" → ["a", "b", "c"]
const splitList = (s) => String(s ?? "").split(",").map((t) => t.trim()).filter(Boolean);

// "이름 | 설명" → ["이름", "설명"]   ( | 가 없으면 ["", 전체] )
const splitPair = (line) => {
  const i = String(line).indexOf("|");
  return i < 0 ? ["", String(line).trim()] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
};

// 이미지 경로: assets/{학과id}/{번호}.jpg
const imgPath = (folder, no) => `assets/${folder}/${no}.${IMG_EXT}`;

// 이미지 태그 (첫 화면 밖 이미지는 늦게 불러오기)
const imgTag = (src, alt = "") => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;


/* 3. 데이터 읽기 ----------------------------------------------------------- */
// 소개가 채워져 있으면 "공개", 비어 있으면 "준비 중"
const isReady = (d) => Boolean(String(d.소개 ?? "").trim());

const findDept = (id) => DEPARTMENTS.find((d) => d.id === id);

// data.js 를 쓰다 생기기 쉬운 실수를 콘솔(F12)에 알려줍니다
function checkData() {
  const seen = new Set();
  DEPARTMENTS.forEach((d, i) => {
    const where = `DEPARTMENTS[${i}] (${d.이름 || d.id || "이름 없음"})`;
    if (!d.id) console.warn(`[data.js] ${where}: id 가 없습니다.`);
    else if (!/^[a-z0-9-]+$/.test(d.id)) console.warn(`[data.js] ${where}: id 는 영문 소문자/숫자/-만 쓰세요. (현재: "${d.id}")`);
    if (seen.has(d.id)) console.warn(`[data.js] ${where}: id "${d.id}" 가 중복됩니다.`);
    seen.add(d.id);
    if (!d.이름) console.warn(`[data.js] ${where}: 이름 이 없습니다.`);
    if ((d.툴 || []).length > MAX_TOOLS) console.warn(`[data.js] ${where}: 툴은 ${MAX_TOOLS}개까지만 표시됩니다.`);
  });
}


/* 4. 공통 조각 ------------------------------------------------------------- */
// dark=true : 흰 배경 페이지에서 어두운 글자로 표시
function header(dark = false) {
  const links = NAV.map(([href, label, pages]) =>
    `<a href="${href}"${pages.includes(PAGE) ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `
    <header class="topbar${dark ? " dark" : ""}">
      <a class="logo" href="index.html">Find:S</a>
      <nav id="site-nav" aria-label="주 메뉴">${links}</nav>
      <button class="menu" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="site-nav">☰</button>
    </header>`;
}

function footer() {
  return `
    <footer>
      <strong>숭의여자대학교</strong>
      <span>서울시 중구 소파로2길 10(예장동)</span>
      <span>입학상담 TEL. 02)3708-9313~5</span>
    </footer>`;
}

function hero(title, sub, img, cls = "") {
  return `
    <section class="hero ${cls}" style="background-image:linear-gradient(#0006,#0006),url('${esc(img)}')">
      ${header()}
      <div class="hero-copy"><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
    </section>`;
}

// 문구만 있는 페이지 (소식, 준비 중, 학과 없음)
function emptyPage(title, linkHref, linkText) {
  return {
    empty: true,
    html: `${header(true)}
      <main class="empty"><h1>${esc(title)}</h1><a href="${linkHref}">${esc(linkText)}</a></main>
      ${footer()}`,
  };
}


/* 5. 페이지 ---------------------------------------------------------------- */
function home() {
  return {
    html: hero(
      "서울의 중심",
      "변화하는 시대를 이끌 창의적인 인재를 양성하며, 배움과 도전으로 가능성을 키우고 더 넓은 세상으로 나아갑니다.",
      "assets/home/1.jpg",
      "home-hero"
    ),
  };
}

function about() {
  return {
    html: `
      ${hero(
        "세계의 중심으로",
        "123년 역사를 지닌 여성 대학교 · 명동과 남산을 품은 숭의의 터전에서, 여성 인재들이 꿈과 희망을 펼칠 수 있도록 교육의 사명을 다합니다.",
        "assets/home/2.jpg",
        "about-hero"
      )}
      <section class="about-photo">${imgTag("assets/home/3.jpg", "학교 소개")}</section>
      <section class="about-copy">
        <p>1903년 미국 북장로회 마펫 목사의 설립으로 시작된 숭의는 여성 교육의 새로운 지평을 열고, 독립운동의 소중한 역사를 이어오며 수많은 여성 선각자와 인재를 배출한 전통의 학교입니다.</p>
        <p>하나님의 풍성한 은혜와 축복 속에서 모두가 행복을 누리며, 희망찬 미래와 더 큰 꿈을 향해 나아가기를 소망합니다.</p>
      </section>
      ${footer()}`,
  };
}

function news() {
  return emptyPage("아직 페이지가 개설되지 않았어요!", "index.html", "이 글을 누르면 홈으로 이동합니다!");
}

// 학과 선택 / 취업 선택 (카드 목록)
function cards(employment) {
  const detailPage = employment ? "employment-detail.html" : "department-detail.html";
  const items = DEPARTMENTS.map((d) => {
    const photo = imgTag(imgPath(d.id, IMG_NO.card));
    return isReady(d)
      ? `<a class="dept-card" href="${detailPage}?dept=${encodeURIComponent(d.id)}">${photo}<span>${esc(d.이름)}</span></a>`
      : `<div class="dept-card is-soon" aria-disabled="true">${photo}<span>${esc(d.이름)}</span><span class="soon-badge">준비 중</span></div>`;
  }).join("");

  return {
    empty: true, // 흰 배경 + 푸터를 화면 아래에 맞춤
    html: `
      ${header(true)}
      <main class="selection">
        <div class="selection-title">
          <p>${employment ? "CAREER" : "FIND YOUR MAJOR"}</p>
          <h1>${employment ? "취업 정보" : "학과를 찾아보세요"}</h1>
        </div>
        <div class="carousel-wrap">
          <button class="arrow prev" type="button" aria-label="이전">‹</button>
          <div class="department-track">${items}</div>
          <button class="arrow next" type="button" aria-label="다음">›</button>
        </div>
      </main>
      ${footer()}`,
  };
}

// 학과 상세 / 취업 상세 (?dept=학과id)
function detail(employment) {
  const listPage = employment ? "employment.html" : "departments.html";
  const d = findDept(new URLSearchParams(location.search).get("dept"));

  if (!d) {
    document.title = "학과를 찾을 수 없어요 | Find:S";
    return emptyPage("학과를 찾을 수 없어요", listPage, "학과 목록으로 돌아가기");
  }
  if (!isReady(d)) {
    document.title = `${d.이름} | Find:S`;
    return emptyPage(`${d.이름} 페이지는 준비 중이에요!`, listPage, "학과 목록으로 돌아가기");
  }

  document.title = `${d.이름}${employment ? " 취업 정보" : ""} | Find:S`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = d.소개;

  return { html: employment ? employmentDetail(d) : departmentDetail(d) };
}

function departmentDetail(d) {
  const tools = (d.툴 || []).slice(0, MAX_TOOLS);
  const tags = splitList(d.태그);

  // 입시: 비어 있으면 "자료 준비 중" 5칸, 값이 있으면 SITE.입시라벨 순서대로 라벨을 붙임
  const lines = d.입시 && d.입시.length ? d.입시 : SITE.입시라벨.map(() => "자료 준비 중");
  const admission = lines.map((line, i) => {
    const [ownLabel, value] = splitPair(line);
    const label = ownLabel || SITE.입시라벨[i] || "";
    return `<article class="admission-card"><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`;
  }).join("");

  const toolsSection = tools.length || tags.length ? `
    <section class="section tools">
      <h2>TOOLS</h2>
      <div class="tool-grid">
        ${tools.map((name, i) => `
          <article class="tool-card">${imgTag(imgPath(d.id, IMG_NO.tool + i), name)}<span>${esc(name)}</span></article>`).join("")}
      </div>
      <div class="tagline">${tags.map((t) => `#${esc(t)}`).join("　")}</div>
    </section>` : "";

  return `
    ${hero(d.이름, d.소개, imgPath(d.id, IMG_NO.hero))}
    <main class="content">
      ${toolsSection}
      <section class="section admission">
        <h2>입시결과</h2>
        <p>${esc(SITE.입시안내)}</p>
        <div class="admission-track">${admission}</div>
      </section>
    </main>
    ${footer()}`;
}

function employmentDetail(d) {
  const certs = splitList(d.자격증);
  const jobs = (d.직무 || []).map(splitPair);
  const hasRate = Boolean(String(d.취업률 ?? "").trim());

  const certSection = certs.length ? `
    <section class="section cert">
      <h2>관련 자격증</h2>
      <div class="mini-cards">${certs.map((c) => `<article class="mini-card"><span>${esc(c)}</span></article>`).join("")}</div>
    </section>` : "";

  const jobSection = jobs.length ? `
    <section class="section">
      <h2>주요 직무</h2>
      <div class="job-grid">
        ${jobs.map(([name, desc], i) => `
          <article class="job-card">
            ${imgTag(imgPath(d.id, IMG_NO.job + i), name)}
            <div><h3>${esc(name)}</h3><p>${esc(desc)}</p></div>
          </article>`).join("")}
      </div>
    </section>` : "";

  return `
    ${hero(d.슬로건 || d.이름, "내가 배운 기술, 어디로 이어질까? 다양한 직무와 취업 분야를 한눈에 확인해보세요!", imgPath(d.id, IMG_NO.hero))}
    <main class="content employment-detail">
      ${certSection}
      <section class="rate">
        <p>${esc(SITE.취업기준연도)}년도 취업률</p>
        <h3>${esc(d.이름)}</h3>
        <strong>${hasRate ? esc(d.취업률) : "-"}</strong>
        <p>${hasRate ? esc(d.증감) : "등록된 정보가 없어요!"}</p>
      </section>
      ${jobSection}
    </main>
    ${footer()}`;
}


/* 6. 실행 ------------------------------------------------------------------ */
const PAGES = {
  home,
  about,
  news,
  departments: () => cards(false),
  employment: () => cards(true),
  "department-detail": () => detail(false),
  "employment-detail": () => detail(true),
};

function showError(message) {
  document.body.classList.add("is-empty-page");
  APP.innerHTML = `<main class="empty"><h1>${esc(message)}</h1></main>`;
}

// 이미지 파일이 없으면 회색 기본 이미지로 교체 (error 이벤트는 위로 전달되지 않아 capture 로 받음)
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName !== "IMG" || img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.classList.add("img-missing");
  img.src = PLACEHOLDER;
}, true);

try {
  if (typeof DEPARTMENTS === "undefined" || typeof SITE === "undefined") {
    throw new Error("data.js 를 읽지 못했어요. 쉼표(,)나 따옴표(\")가 빠졌는지 확인해 주세요. (자세한 위치: 브라우저 콘솔 F12)");
  }
  checkData();
  const render = PAGES[PAGE] || news;
  const { html, empty } = render();
  if (empty) document.body.classList.add("is-empty-page");
  APP.innerHTML = html;
} catch (err) {
  console.error(err);
  showError("페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  if (String(err.message).includes("data.js")) {
    APP.querySelector("h1").insertAdjacentHTML("afterend", `<p>${esc(err.message)}</p>`);
  }
}


/* 7. 이벤트 ---------------------------------------------------------------- */
function setMenu(open) {
  const nav = document.querySelector("#site-nav");
  const button = document.querySelector(".menu");
  if (!nav || !button) return;
  nav.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
}

document.addEventListener("click", (e) => {
  const nav = document.querySelector("#site-nav");

  // 모바일 메뉴 열기/닫기
  if (e.target.closest(".menu")) {
    setMenu(!nav.classList.contains("open"));
    return;
  }
  // 메뉴 바깥을 누르면 닫기
  if (nav && nav.classList.contains("open") && !e.target.closest("#site-nav")) setMenu(false);

  // 학과 카드 좌우 버튼 (카드 한 장 + 간격만큼 이동)
  const arrow = e.target.closest(".arrow");
  if (arrow) {
    const track = arrow.closest(".carousel-wrap").querySelector(".department-track");
    const card = track.querySelector(".dept-card");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 22;
    const step = (card ? card.offsetWidth : 300) + gap;
    track.scrollBy({ left: arrow.classList.contains("next") ? step : -step, behavior: "smooth" });
  }
});

// Esc 키로 메뉴 닫기
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});
