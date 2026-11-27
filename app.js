/* ============================================================================
   Find:S 화면 렌더링
   - 보통은 이 파일을 수정할 필요가 없습니다. 학과·문구·수치는 data.js 에서 바꾸세요.
   - 구성: 1 설정 / 2 유틸 / 3 데이터 읽기 / 4 공통 조각 / 5 페이지 / 6 검색 / 7 실행 / 8 이벤트
   ========================================================================== */


/* 1. 설정 ------------------------------------------------------------------ */
const IMG_EXT = "jpg";          // 이미지 확장자 (assets/{id}/1.jpg)
const MAX_TOOLS = 3;            // TOOLS 사진은 2~4번 → 최대 3개
const MAX_CERTS = 3;            // 자격증 사진은 6~8번 → 최대 3개 (4번째부터는 사진 없이 글자만)

// 학과 폴더 안 이미지 번호 규칙 (data.js 상단 설명과 같음)
//   card·hero      : 학과 선택 카드 + 학과 상세 상단 (같은 1번 사용)
//   tool           : TOOLS 시작 번호 (2, 3, 4)
//   careerHero     : 취업 상세 상단 (대표 이미지)
//   cert           : 관련 자격증 시작 번호 (6, 7, 8)
//   job            : 주요 직무 시작 번호 (9, 10, 11, …)
const IMG_NO = { card: 1, hero: 1, tool: 2, careerHero: 5, cert: 6, job: 9 };

// 이미지 파일이 없을 때 대신 보여줄 회색 이미지
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E" +
  "%3Crect width='4' height='3' fill='%234a4a4a'/%3E%3C/svg%3E";

// 상단 메뉴: [링크, 글자, 이 메뉴가 "현재 위치"로 표시되는 페이지들]
const NAV = [
  ["departments.html", "학과", ["departments", "department-detail"]],
  ["employment.html", "취업", ["employment", "employment-detail"]],
  ["news.html", "소식", ["news"]],
  ["about.html", "대학소개", ["about"]],
];

// 검색 카테고리: [값, 드롭다운에 보이는 글자] — 첫 번째가 기본값
const SEARCH_CATS = [
  ["all", "전체"],
  ["dept", "학과"],
  ["career", "취업"],
  ["news", "소식"],
  ["about", "대학소개"],
];
const SUGGEST_LIMIT = 6;        // 검색창 아래에 바로 보여줄 결과 수

const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

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
  NEWS.forEach((n, i) => {
    if (!n.제목) console.warn(`[data.js] NEWS[${i}]: 제목 이 없습니다.`);
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
      <div class="top-right">
        <nav id="site-nav" aria-label="주 메뉴">${links}</nav>
        <button class="search-toggle" type="button" aria-label="검색 열기" aria-expanded="false" aria-controls="search-panel">${ICON_SEARCH}</button>
        <button class="menu" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="site-nav">☰</button>
      </div>
      <div class="search-panel" id="search-panel" hidden>
        ${searchForm("all", "", "panel")}
        <div class="search-suggest" aria-live="polite"></div>
      </div>
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
      ${hero(ABOUT.제목, ABOUT.소개, "assets/home/2.jpg", "about-hero")}
      <section class="about-photo">${imgTag("assets/home/3.jpg", "학교 소개")}</section>
      <section class="about-copy">${(ABOUT.본문 || []).map((p) => `<p>${esc(p)}</p>`).join("")}</section>
      ${footer()}`,
  };
}

// 소식: 글이 없으면 안내 문구, 있으면 목록
function news() {
  if (!NEWS.length) {
    return emptyPage("아직 페이지가 개설되지 않았어요!", "index.html", "이 글을 누르면 홈으로 이동합니다!");
  }
  const items = NEWS.map((n, i) => `
    <article class="news-item" id="news-${i}">
      ${n.날짜 ? `<time>${esc(n.날짜)}</time>` : ""}
      <h2>${esc(n.제목)}</h2>
      <p>${esc(n.내용)}</p>
    </article>`).join("");
  return {
    empty: true,
    html: `${header(true)}<main class="news-list"><h1>소식</h1>${items}</main>${footer()}`,
  };
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
  // 툴: "이름" 또는 "이름 | 작은 설명"
  const tools = (d.툴 || []).slice(0, MAX_TOOLS).map((line) => {
    const [name, desc] = splitPair(line);
    return name ? [name, desc] : [desc, ""];
  });
  const tags = splitList(d.태그);

  // 입시: 비어 있으면 "자료 준비 중" 5칸, 값이 있으면 SITE.입시라벨 순서대로 라벨을 붙임
  const hasAdmission = Boolean(d.입시 && d.입시.length);
  const lines = hasAdmission ? d.입시 : SITE.입시라벨.map(() => "자료 준비 중");
  const admission = lines.map((line, i) => {
    const [ownLabel, value] = splitPair(line);
    const label = ownLabel || SITE.입시라벨[i] || "";
    // 값에 | 가 있으면 앞은 큰 글씨, 뒤는 작은 글씨 (예: "28.86 | 222점")
    const [main, ...rest] = value.split("|").map((t) => t.trim());
    const sub = rest.join(" | ");
    // 라벨이 "2026 정시" 처럼 띄어쓰기가 있으면 연도(작게) + 전형(크게)로 나눠서 표시
    const [year, ...term] = label.split(" ");
    const labelHtml = term.length
      ? `<small>${esc(year)}</small><b>${esc(term.join(" "))}</b>`
      : `<b>${esc(label)}</b>`;
    return `<article class="admission-card${hasAdmission ? "" : " is-empty"}">${labelHtml}<strong>${esc(main)}</strong>${sub ? `<span class="admission-sub">${esc(sub)}</span>` : ""}</article>`;
  }).join("");

  const toolsSection = tools.length || tags.length ? `
    <section class="section tools">
      <h2>Knowledge and Skills</h2>
      ${tools.length ? `<div class="tool-grid" data-count="${tools.length}">
        ${tools.map(([name, desc], i) => `
          <article class="tool-card">
            ${imgTag(imgPath(d.id, IMG_NO.tool + i), name)}
            <span>${esc(name)}${desc ? `<small>${esc(desc)}</small>` : ""}</span>
          </article>`).join("")}
      </div>` : ""}
      <div class="tagline">${tags.map((t) => `#${esc(t)}`).join("　")}</div>
    </section>` : "";

  return `
    ${hero(d.이름, d.소개, imgPath(d.id, IMG_NO.hero))}
    <main>
      <div class="content content-tools">${toolsSection}</div>
      <section class="admission">
        <h2>입시결과</h2>
        <p>${esc(SITE.입시안내)}</p>
        <div class="admission-carousel">
          <div class="admission-track" tabindex="0" role="region" aria-label="입시 결과 목록">${admission}</div>
          <div class="admission-nav">
            <button class="admission-arrow prev" type="button" aria-label="이전 입시 결과">‹</button>
            <button class="admission-arrow next" type="button" aria-label="다음 입시 결과">›</button>
          </div>
        </div>
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
      <div class="mini-cards">
        ${certs.map((c, i) => `
          <article class="mini-card${i < MAX_CERTS ? " has-img" : ""}">
            ${i < MAX_CERTS ? imgTag(imgPath(d.id, IMG_NO.cert + i), c) : ""}<span>${esc(c)}</span>
          </article>`).join("")}
      </div>
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
    ${hero(d.슬로건 || d.이름, `${d.취업소개 || SITE.취업소개기본} ${SITE.취업안내}`, imgPath(d.id, IMG_NO.careerHero))}
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


/* 6. 검색 ------------------------------------------------------------------ */
const catLabel = (value) => (SEARCH_CATS.find(([v]) => v === value) || SEARCH_CATS[0])[1];

// 검색창 (mode: "panel" = 상단 돋보기를 누르면 펼쳐지는 것 / "page" = 검색 결과 페이지 안)
function searchForm(cat = "all", q = "", mode = "panel") {
  const options = SEARCH_CATS.map(([value, label]) =>
    `<li><button type="button" role="option" data-cat="${value}" aria-selected="${value === cat}">${label}</button></li>`).join("");
  return `
    <form class="search-form is-${mode}" role="search" action="search.html" method="get">
      <div class="search-cat">
        <button class="cat-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
          <span class="cat-name">${catLabel(cat)}</span><span aria-hidden="true">▾</span>
        </button>
        <ul class="cat-list" role="listbox" aria-label="검색 카테고리" hidden>${options}</ul>
      </div>
      <input type="search" name="q" value="${esc(q)}" placeholder="학과, 직무, 자격증, 소식 검색" autocomplete="off" aria-label="검색어">
      <input type="hidden" name="cat" value="${cat}">
      <button class="search-go" type="submit" aria-label="검색">${ICON_SEARCH}</button>
    </form>`;
}

// data.js 내용으로 검색 목록을 한 번만 만들어 둡니다.
// 항목: { cat, title(제목), label(작은 글씨), body(본문·검색 대상), url }
let searchIndex = null;
function getSearchIndex() {
  if (searchIndex) return searchIndex;
  const list = [];

  DEPARTMENTS.forEach((d) => {
    const id = encodeURIComponent(d.id);
    const ready = isReady(d);

    list.push({
      cat: "dept",
      title: d.이름,
      label: ready ? "학과" : "학과 · 준비 중",
      body: [d.슬로건, d.소개, splitList(d.태그).join(" ")].filter(Boolean).join(" "),
      url: `department-detail.html?dept=${id}`,
    });
    if (!ready) return; // 준비 중인 학과는 취업 정보가 없음

    const careerUrl = `employment-detail.html?dept=${id}`;
    list.push({
      cat: "career",
      title: `${d.이름} 취업 정보`,
      label: "취업",
      body: [d.슬로건, d.취업률, d.증감].filter(Boolean).join(" "),
      url: careerUrl,
    });
    splitList(d.자격증).forEach((cert) =>
      list.push({ cat: "career", title: cert, label: `${d.이름} · 자격증`, body: "", url: careerUrl }));
    (d.직무 || []).map(splitPair).forEach(([name, desc]) =>
      list.push({ cat: "career", title: name, label: `${d.이름} · 직무`, body: desc, url: careerUrl }));
  });

  NEWS.forEach((n, i) =>
    list.push({ cat: "news", title: n.제목, label: n.날짜 ? `소식 · ${n.날짜}` : "소식", body: n.내용 || "", url: `news.html#news-${i}` }));

  list.push({
    cat: "about",
    title: "대학소개",
    label: "숭의여자대학교",
    body: [ABOUT.제목, ABOUT.소개, ...(ABOUT.본문 || [])].join(" "),
    url: "about.html",
  });

  searchIndex = list;
  return list;
}

// 띄어쓰기로 나눈 단어가 모두 들어 있는 항목만 찾습니다 (대소문자 구분 없음)
const parseTerms = (q) => String(q).toLowerCase().split(/\s+/).filter(Boolean);

function runSearch(q, cat = "all") {
  const terms = parseTerms(q);
  if (!terms.length) return [];

  return getSearchIndex()
    .filter((item) => cat === "all" || item.cat === cat)
    .map((item, order) => {
      const title = item.title.toLowerCase();
      const label = item.label.toLowerCase();
      const body = item.body.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 3;       // 제목에 있으면 가장 위로
        else if (label.includes(term)) score += 2;
        else if (body.includes(term)) score += 1;
        else return null;                            // 한 단어라도 없으면 제외
      }
      return { ...item, score, order };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.order - b.order);
}

// 검색어를 노란색으로 표시 (글자는 안전하게 처리)
function highlight(text, terms) {
  if (!terms.length) return esc(text);
  const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return String(text)
    .split(new RegExp(`(${pattern})`, "gi"))
    .map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part)))
    .join("");
}

// 본문에서 검색어 주변만 잘라서 보여주기
function snippet(body, terms, length = 70) {
  if (!body) return "";
  const lower = body.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (hit === undefined || hit < 20) return body.length > length ? `${body.slice(0, length)}…` : body;
  const start = hit - 20;
  return `…${body.slice(start, start + length)}${start + length < body.length ? "…" : ""}`;
}

function resultItem(r, terms) {
  return `
    <a class="result" href="${esc(r.url)}">
      <span class="result-cat">${catLabel(r.cat)}</span>
      <span class="result-main">
        <strong>${highlight(r.title, terms)}</strong>
        <small>${highlight(r.label, terms)}</small>
        ${r.body ? `<em>${highlight(snippet(r.body, terms), terms)}</em>` : ""}
      </span>
    </a>`;
}

// 상단 검색창 아래 실시간 결과
function updateSuggest(form) {
  const box = form.parentElement.querySelector(".search-suggest");
  if (!box) return;
  const q = form.elements.q.value.trim();
  const cat = form.elements.cat.value;
  if (!q) { box.innerHTML = ""; return; }

  const results = runSearch(q, cat);
  const terms = parseTerms(q);
  box.innerHTML = results.length
    ? `<ul>${results.slice(0, SUGGEST_LIMIT).map((r) => `<li>${resultItem(r, terms)}</li>`).join("")}</ul>
       <a class="search-more" href="search.html?q=${encodeURIComponent(q)}&amp;cat=${cat}">${results.length}건 모두 보기 →</a>`
    : `<p class="search-none">"${esc(q)}" 검색 결과가 없어요.</p>`;
}

// 검색 결과 페이지 (search.html?q=검색어&cat=카테고리)
function searchPage() {
  const params = new URLSearchParams(location.search);
  const q = (params.get("q") || "").trim();
  let cat = params.get("cat") || "all";
  if (!SEARCH_CATS.some(([v]) => v === cat)) cat = "all";

  const terms = parseTerms(q);
  const results = runSearch(q, cat);
  document.title = q ? `"${q}" 검색 | Find:S` : "검색 | Find:S";

  let content;
  if (!q) {
    content = `<p class="search-hint">검색어를 입력해 주세요.</p>`;
  } else if (!results.length) {
    content = `<p class="search-none">"${esc(q)}"에 대한 ${cat === "all" ? "" : `${catLabel(cat)} `}검색 결과가 없어요.<br>다른 검색어나 카테고리로 찾아보세요.</p>`;
  } else {
    const groups = SEARCH_CATS.filter(([v]) => v !== "all").map(([value, label]) => {
      const items = results.filter((r) => r.cat === value);
      return items.length
        ? `<section class="result-group"><h2>${label}<span>${items.length}</span></h2>
             <ul>${items.map((r) => `<li>${resultItem(r, terms)}</li>`).join("")}</ul></section>`
        : "";
    }).join("");
    content = `<p class="result-count">${catLabel(cat)} 검색 결과 ${results.length}건</p>${groups}`;
  }

  return {
    empty: true,
    html: `${header(true)}
      <main class="search-page">
        <h1>검색</h1>
        ${searchForm(cat, q, "page")}
        ${content}
      </main>
      ${footer()}`,
  };
}


/* 7. 실행 ------------------------------------------------------------------ */
const PAGES = {
  home,
  about,
  news,
  search: searchPage,
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
  if (typeof DEPARTMENTS === "undefined" || typeof SITE === "undefined" ||
      typeof ABOUT === "undefined" || typeof NEWS === "undefined") {
    throw new Error("data.js 를 읽지 못했어요. 쉼표(,)나 따옴표(\")가 빠졌는지 확인해 주세요. (자세한 위치: 브라우저 콘솔 F12)");
  }
  checkData();
  const render = PAGES[PAGE] || news;
  const { html, empty } = render();
  if (empty) document.body.classList.add("is-empty-page");
  APP.innerHTML = html;
  // 소식 검색 결과(news.html#news-2)로 들어왔을 때 해당 글로 이동
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
} catch (err) {
  console.error(err);
  showError("페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  if (String(err.message).includes("data.js")) {
    APP.querySelector("h1").insertAdjacentHTML("afterend", `<p>${esc(err.message)}</p>`);
  }
}


/* 8. 이벤트 ---------------------------------------------------------------- */
const $ = (selector) => document.querySelector(selector);

function setMenu(open) {
  const nav = $("#site-nav");
  const button = $(".menu");
  if (!nav || !button) return;
  nav.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
}

function setSearch(open) {
  const panel = $("#search-panel");
  const button = $(".search-toggle");
  if (!panel || !button) return;
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "검색 닫기" : "검색 열기");
  if (open) {
    setMenu(false);
    panel.querySelector('input[name="q"]').focus();
  } else {
    closeCatLists();
  }
}

// 카테고리 드롭다운 닫기 (except: 이 목록은 그대로 둠)
function closeCatLists(except) {
  document.querySelectorAll(".search-cat").forEach((box) => {
    if (box === except) return;
    box.querySelector(".cat-list").hidden = true;
    box.querySelector(".cat-btn").setAttribute("aria-expanded", "false");
  });
}

function chooseCategory(option) {
  const form = option.closest("form");
  const value = option.dataset.cat;
  form.elements.cat.value = value;
  form.querySelector(".cat-name").textContent = catLabel(value);
  form.querySelectorAll(".cat-list button").forEach((b) => b.setAttribute("aria-selected", String(b === option)));
  closeCatLists();
  form.elements.q.focus();

  // 검색 결과 페이지에서는 바로 다시 검색, 상단 검색창에서는 아래 결과만 갱신
  if (form.classList.contains("is-page") && form.elements.q.value.trim()) form.requestSubmit();
  else updateSuggest(form);
}

document.addEventListener("click", (e) => {
  const target = e.target;

  // 돋보기 / 모바일 메뉴 버튼
  if (target.closest(".search-toggle")) { setSearch($("#search-panel").hidden); return; }
  if (target.closest(".menu")) {
    setMenu(!$("#site-nav").classList.contains("open"));
    setSearch(false);
    return;
  }

  // 카테고리 드롭다운
  const catBtn = target.closest(".cat-btn");
  if (catBtn) {
    const box = catBtn.closest(".search-cat");
    const list = box.querySelector(".cat-list");
    closeCatLists(box);
    list.hidden = !list.hidden;
    catBtn.setAttribute("aria-expanded", String(!list.hidden));
    return;
  }
  const option = target.closest(".cat-list button");
  if (option) { chooseCategory(option); return; }

  // 바깥을 누르면 열려 있는 것들 닫기
  if (!target.closest(".search-cat")) closeCatLists();
  if (!target.closest(".search-panel")) setSearch(false);
  const nav = $("#site-nav");
  if (nav && nav.classList.contains("open") && !target.closest("#site-nav")) setMenu(false);

  // 입시결과 좌우 버튼 (카드 한 장 + 간격만큼 이동)
  const admissionArrow = target.closest(".admission-arrow");
  if (admissionArrow) {
    const track = admissionArrow.closest(".admission-carousel").querySelector(".admission-track");
    const card = track.querySelector(".admission-card");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    const step = (card ? card.offsetWidth : 300) + gap;
    track.scrollBy({ left: admissionArrow.classList.contains("next") ? step : -step, behavior: "smooth" });
    return;
  }

  // 학과 카드 좌우 버튼 (카드 한 장 + 간격만큼 이동)
  const arrow = target.closest(".arrow");
  if (arrow) {
    const track = arrow.closest(".carousel-wrap").querySelector(".department-track");
    const card = track.querySelector(".dept-card");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 22;
    const step = (card ? card.offsetWidth : 300) + gap;
    track.scrollBy({ left: arrow.classList.contains("next") ? step : -step, behavior: "smooth" });
  }
});

// 입력할 때마다 결과 갱신
document.addEventListener("input", (e) => {
  if (e.target.matches('.search-form input[name="q"]')) updateSuggest(e.target.form);
});

document.addEventListener("keydown", (e) => {
  // Esc: 카테고리 목록 → 검색창 → 메뉴 순서로 닫기
  if (e.key === "Escape") {
    const openList = document.querySelector(".cat-list:not([hidden])");
    if (openList) {
      openList.closest(".search-cat").querySelector(".cat-btn").focus();
      closeCatLists();
    } else {
      const wasOpen = $("#search-panel") && !$("#search-panel").hidden;
      setSearch(false);
      setMenu(false);
      if (wasOpen) $(".search-toggle").focus();
    }
    return;
  }

  // ↓ ↑ 로 입력칸과 결과 목록 사이 이동
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const panel = e.target.closest(".search-panel");
  if (!panel) return;
  const links = [...panel.querySelectorAll(".search-suggest a")];
  if (!links.length) return;

  const index = links.indexOf(e.target);
  let next;
  if (e.target.matches('input[name="q"]')) next = e.key === "ArrowDown" ? links[0] : null;
  else if (e.key === "ArrowDown") next = links[Math.min(index + 1, links.length - 1)];
  else next = index > 0 ? links[index - 1] : panel.querySelector('input[name="q"]');

  if (next) { e.preventDefault(); next.focus(); }
});


/* 9. 상단 바: 내리면 숨고 올리면 나타남 ------------------------------------ */
(function stickyHeader() {
  const bar = $(".topbar");
  if (!bar) return;

  const HIDE_AFTER = 80;   // 이 높이(px)보다 위에서는 항상 보임
  const MIN_MOVE = 6;      // 이만큼 이상 움직여야 방향으로 인정 (떨림 방지)
  let lastY = window.scrollY;
  let waiting = false;

  function update() {
    waiting = false;
    const y = Math.max(0, window.scrollY); // iOS 의 위쪽 튕김(음수) 무시
    bar.classList.toggle("is-scrolled", y > 24);

    // 검색창이나 모바일 메뉴가 열려 있으면 숨기지 않음
    const pinned = !$("#search-panel").hidden || $("#site-nav").classList.contains("open");
    if (pinned || y < HIDE_AFTER) {
      bar.classList.remove("is-hidden");
      lastY = y;
      return;
    }

    const move = y - lastY;
    if (Math.abs(move) < MIN_MOVE) return; // 조금씩 움직일 때는 쌓아서 계산
    bar.classList.toggle("is-hidden", move > 0);
    lastY = y;
  }

  window.addEventListener("scroll", () => {
    if (!waiting) { waiting = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
