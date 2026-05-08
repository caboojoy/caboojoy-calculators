  /**
   * app.js
   * 칼로리 & 다이어트 계산기 v3
   * ─────────────────────────────────────────
   * 변경 사항 (v3)
   *  - AI 사진 분석 기능 제거
   *  - 식품의약품안전처 식품영양성분DB OpenAPI 연동
   *  - 오프라인 내장 DB 폴백 유지
   *
   * 구조
   *  1. FallbackDB   – 오프라인/API 오류 시 사용하는 내장 DB
   *  2. AppState     – 전역 상태 (확장 가능)
   *  3. Calc         – 순수 계산 함수
   *  4. Validate     – 입력 유효성 검사
   *  5. FoodAPI      – 식약처 API 모듈
   *  6. MealUI       – 식단 기록 UI
   *  7. UI           – 결과 카드 / 차트 렌더링
   *  8. compute()    – 계산 파이프라인
   *  9. bindEvents() – 이벤트 바인딩
   * 10. init()       – 초기화
   */

  /* ================================================================
    1. 오프라인 폴백 DB
    – 식약처 API 미연결 또는 오류 시 사용
    – API 연결 시 이 DB는 비활성화됨
  ================================================================ */
  const FallbackDB = [
    /* 밥류 */
    { name: '흰밥',              kcal: 312, emoji: '🍚', cat: '밥류',    serving: '210g' },
    { name: '현미밥',            kcal: 295, emoji: '🍚', cat: '밥류',    serving: '210g' },
    { name: '잡곡밥',            kcal: 300, emoji: '🍚', cat: '밥류',    serving: '210g' },
    { name: '비빔밥',            kcal: 560, emoji: '🥗', cat: '밥류',    serving: '500g' },
    { name: '볶음밥',            kcal: 480, emoji: '🍳', cat: '밥류',    serving: '300g' },
    { name: '김밥 (1줄)',        kcal: 330, emoji: '🌀', cat: '밥류',    serving: '250g' },
    { name: '오므라이스',        kcal: 520, emoji: '🍳', cat: '밥류',    serving: '350g' },
    { name: '덮밥 (불고기)',     kcal: 590, emoji: '🍚', cat: '밥류',    serving: '400g' },
    /* 국·찌개 */
    { name: '된장찌개',          kcal: 100, emoji: '🍲', cat: '국·찌개', serving: '300g' },
    { name: '김치찌개',          kcal: 120, emoji: '🍲', cat: '국·찌개', serving: '300g' },
    { name: '순두부찌개',        kcal: 130, emoji: '🍲', cat: '국·찌개', serving: '300g' },
    { name: '미역국',            kcal:  50, emoji: '🥣', cat: '국·찌개', serving: '300g' },
    { name: '설렁탕',            kcal: 300, emoji: '🍜', cat: '국·찌개', serving: '400g' },
    { name: '부대찌개',          kcal: 480, emoji: '🍲', cat: '국·찌개', serving: '400g' },
    /* 메인 */
    { name: '삼겹살 (200g)',     kcal: 620, emoji: '🥩', cat: '메인',    serving: '200g' },
    { name: '불고기 (200g)',     kcal: 380, emoji: '🥩', cat: '메인',    serving: '200g' },
    { name: '닭가슴살 (150g)',  kcal: 165, emoji: '🍗', cat: '메인',    serving: '150g' },
    { name: '닭볶음탕',          kcal: 450, emoji: '🍗', cat: '메인',    serving: '350g' },
    { name: '제육볶음',          kcal: 420, emoji: '🥩', cat: '메인',    serving: '300g' },
    { name: '계란후라이 (2개)', kcal: 180, emoji: '🍳', cat: '메인',    serving: '100g' },
    { name: '두부조림',          kcal: 200, emoji: '🟡', cat: '메인',    serving: '200g' },
    { name: '고등어구이',        kcal: 280, emoji: '🐟', cat: '메인',    serving: '150g' },
    { name: '갈비찜',            kcal: 550, emoji: '🥩', cat: '메인',    serving: '350g' },
    /* 면·분식 */
    { name: '라면 (1봉)',        kcal: 500, emoji: '🍜', cat: '면·분식', serving: '130g' },
    { name: '냉면',              kcal: 450, emoji: '🍜', cat: '면·분식', serving: '400g' },
    { name: '자장면',            kcal: 680, emoji: '🍜', cat: '면·분식', serving: '500g' },
    { name: '짬뽕',              kcal: 620, emoji: '🍜', cat: '면·분식', serving: '500g' },
    { name: '떡볶이',            kcal: 380, emoji: '🍢', cat: '면·분식', serving: '300g' },
    { name: '칼국수',            kcal: 440, emoji: '🍜', cat: '면·분식', serving: '450g' },
    /* 양식 */
    { name: '파스타 (크림)',     kcal: 650, emoji: '🍝', cat: '양식',    serving: '400g' },
    { name: '파스타 (토마토)',   kcal: 480, emoji: '🍝', cat: '양식',    serving: '400g' },
    { name: '피자 (2조각)',      kcal: 560, emoji: '🍕', cat: '양식',    serving: '200g' },
    { name: '햄버거',            kcal: 540, emoji: '🍔', cat: '양식',    serving: '220g' },
    { name: '샌드위치',          kcal: 380, emoji: '🥪', cat: '양식',    serving: '200g' },
    { name: '샐러드 (시저)',     kcal: 280, emoji: '🥗', cat: '양식',    serving: '250g' },
    /* 간식·음료 */
    { name: '아메리카노',        kcal:   5, emoji: '☕', cat: '간식·음료', serving: '350ml' },
    { name: '라떼 (톨)',         kcal: 190, emoji: '☕', cat: '간식·음료', serving: '355ml' },
    { name: '요거트 (플레인)',   kcal: 100, emoji: '🥛', cat: '간식·음료', serving: '150g' },
    { name: '아이스크림',        kcal: 220, emoji: '🍦', cat: '간식·음료', serving: '100g' },
    { name: '초콜릿 (50g)',      kcal: 270, emoji: '🍫', cat: '간식·음료', serving: '50g' },
    { name: '아몬드 (30g)',      kcal: 180, emoji: '🌰', cat: '간식·음료', serving: '30g' },
    /* 과일·채소 */
    { name: '바나나 (1개)',      kcal:  90, emoji: '🍌', cat: '과일·채소', serving: '120g' },
    { name: '사과 (1개)',        kcal:  80, emoji: '🍎', cat: '과일·채소', serving: '200g' },
    { name: '오렌지 (1개)',      kcal:  60, emoji: '🍊', cat: '과일·채소', serving: '150g' },
    { name: '고구마 (100g)',     kcal: 130, emoji: '🍠', cat: '과일·채소', serving: '100g' },
    { name: '아보카도 (1/2)',    kcal: 120, emoji: '🥑', cat: '과일·채소', serving: '75g'  },
    { name: '방울토마토 (10개)', kcal:  30, emoji: '🍅', cat: '과일·채소', serving: '100g' },
  ];

  /* ================================================================
    2. 앱 상태 (전역)
  ================================================================ */
  const AppState = {
    user: {
      gender:   'male',
      age:      null,
      height:   null,
      weight:   null,
      activity: 1.375,
      goal:     'maintain',
    },
    today: {
      meals: {
        breakfast: [],   // [{ name, kcal, emoji, serving, src }, ...]
        lunch:     [],
        dinner:    [],
        snack:     [],
      },
    },
    results: { bmr: null, tdee: null, target: null },
    history: [],          // 확장 슬롯: [{ date, totalKcal, weight }, ...]
    ui: {
      currentMeal: 'breakfast',
      currentCat:  '',
      apiKey:      CONFIG.MFDS_API_KEY,  // config.js에서 로드
      apiMode:     true,                  // 시작부터 API 모드
    },
  };

  /* ================================================================
    3. 계산 로직 (순수 함수)
  ================================================================ */
  const Calc = {
    /** BMR (Mifflin-St Jeor) */
    bmr(gender, weight, height, age) {
      const base = 10 * weight + 6.25 * height - 5 * age;
      return gender === 'male' ? base + 5 : base - 161;
    },
    /** TDEE = BMR × 활동계수 */
    tdee(bmr, factor)  { return bmr * factor; },
    /** 목표 칼로리 — 최소 500 kcal 보장 (극소체형 음수 방지) */
    targetCalories(tdee, goal) {
      const r   = Math.round;
      const MIN = 500;  // 생리적 안전 최솟값
      if (goal === 'loss') return { target: Math.max(MIN, r(tdee - 500)) };
      if (goal === 'gain') return { target: Math.max(MIN, r(tdee + 400)) };
      return { target: Math.max(MIN, r(tdee)) };
    },
    /** 권장 매크로 (탄 50 / 단 25 / 지 25%) */
    macros(kcal) {
      return {
        protein: Math.round((kcal * 0.25) / 4),
        carb:    Math.round((kcal * 0.50) / 4),
        fat:     Math.round((kcal * 0.25) / 9),
      };
    },
    mealTotal(key)  { return AppState.today.meals[key].reduce((s, f) => s + f.kcal, 0); },
    dailyTotal()    { return ['breakfast','lunch','dinner','snack'].reduce((s,k) => s + Calc.mealTotal(k), 0); },
    intakePct(i, t) { return Math.round((i / t) * 100); },
  };

  /* ================================================================
    4. 유효성 검사
  ================================================================ */
  const Validate = {
    rules: {
      age:    { min: 1,  max: 120 },
      height: { min: 50, max: 250 },
      weight: { min: 20, max: 300 },
    },
    field(id, raw) {
      const rule  = this.rules[id]; if (!rule) return true;
      const input = document.getElementById(id);
      const err   = document.getElementById('err-' + id);
      const empty = (raw === '' || raw === null || raw === undefined);
      const valid = empty || (Number(raw) >= rule.min && Number(raw) <= rule.max);
      input.classList.toggle('error', !valid);
      err.classList.toggle('show',   !valid);
      return valid;
    },
    all() {
      const { age, height, weight } = AppState.user;
      if (!age || !height || !weight) return false;
      return this.field('age', age) && this.field('height', height) && this.field('weight', weight);
    },
  };

  /* ================================================================
    5. 식약처 식품영양성분DB API 모듈
    endpoint : https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02
                (구 FoodNtrIrdntInfoService1 는 2023년 폐기됨)
    인증키   : 공공데이터포털 Decoding 키 사용 (fetch가 자동으로 URL 인코딩 처리)
  ================================================================ */
  const FoodAPI = {

    BASE_URL: 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02',

    /**
     * 식품명으로 검색
     * @param {string} query    - 검색어 (한글 식품명)
     * @param {number} rows     - 결과 수 (기본 15)
     * @returns {Promise<Array>} 정규화된 음식 배열
     */
    async search(query, rows = 15) {
      const key = AppState.ui.apiKey;
      if (!key) throw new Error('API_KEY_MISSING');

      const url = new URL(this.BASE_URL);
      url.searchParams.set('serviceKey', key);  // Decoding 키 → fetch가 자동 인코딩
      url.searchParams.set('pageNo',     '1');
      url.searchParams.set('numOfRows',  String(rows));
      url.searchParams.set('FOOD_NM_KR', query);
      url.searchParams.set('type',       'json');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      const resultCode = json?.header?.resultCode
                      || json?.response?.header?.resultCode
                      || json?.body?.resultCode;

      if (resultCode && resultCode !== '00' && resultCode !== '0000') {
        const msg = json?.header?.resultMsg
                || json?.response?.header?.resultMsg
                || resultCode;
        throw new Error(`API_ERROR: ${msg}`);
      }

      const items = json?.body?.items ?? json?.items ?? [];

      /* items 정규화
      *  - 신규 API(FoodNtrCpntDbInfo02)는 items 가 배열
      *  - 구형 응답을 만날 경우 { item: ... } 도 처리
      */
      let normalizedItems;
      if (Array.isArray(items)) {
        normalizedItems = items;
      } else if (items && typeof items === 'object') {
        const inner = items.item;
        if (!inner) return [];
        normalizedItems = Array.isArray(inner) ? inner : [inner];
      } else {
        return [];
      }

      if (!normalizedItems.length) return [];

      /* 응답 필드 → 앱 구조로 정규화
      * FoodNtrCpntDbInfo02 API 실제 필드명:
      *   FOOD_NM_KR    : 식품명(한글)
      *   AMT_NUM1      : 에너지(kcal) — 기준량(SERVING_SIZE) 당
      *   SERVING_SIZE  : 영양성분 함량 기준량 (예: "100g")
      *   FOOD_CAT1_NM  : 식품대분류명
      *   MAKER_NM      : 업체명 (가공식품/외식)
      */
      return normalizedItems
        .filter(item => item.FOOD_NM_KR && Number(item.AMT_NUM1) > 0)
        .map(item => ({
          name:    item.FOOD_NM_KR,
          kcal:    Math.round(Number(item.AMT_NUM1)),
          serving: item.SERVING_SIZE || '1인분',
          maker:   item.MAKER_NM     || '',
          group:   item.FOOD_CAT1_NM || '',
          emoji:   FoodAPI._emoji(item.FOOD_CAT1_NM || item.FOOD_NM_KR),
          cat:     item.FOOD_CAT1_NM || '기타',
          src:     'MFDS',   // Ministry of Food and Drug Safety
        }));
    },

    /**
     * 식품군 / 식품명 기준 이모지 매핑
     * @param {string} text
     * @returns {string} 이모지
     */
    _emoji(text) {
      const t = text || '';
      if (/밥|죽|rice/i.test(t))           return '🍚';
      if (/국|탕|찌개|stew/i.test(t))       return '🍲';
      if (/면|noodle|파스타|라면/i.test(t)) return '🍜';
      if (/빵|bread|베이커리/i.test(t))      return '🍞';
      if (/케이크|cake|디저트/i.test(t))     return '🍰';
      if (/닭|chicken|가금/i.test(t))        return '🍗';
      if (/소고기|돼지|육류|삼겹/i.test(t)) return '🥩';
      if (/생선|어류|fish|해산/i.test(t))    return '🐟';
      if (/채소|나물|salad/i.test(t))        return '🥗';
      if (/과일|fruit/i.test(t))             return '🍎';
      if (/우유|유제품|dairy|치즈/i.test(t)) return '🥛';
      if (/음료|coffee|tea|주스/i.test(t))   return '☕';
      if (/과자|snack|chip/i.test(t))        return '🍟';
      if (/아이스크림|ice cream/i.test(t))   return '🍦';
      if (/달걀|계란|egg/i.test(t))          return '🍳';
      if (/두부|콩|bean/i.test(t))           return '🫘';
      if (/김치/i.test(t))                   return '🥬';
      return '🍽️';
    },

    /**
     * 연결 테스트 (저장 버튼 클릭 시 호출)
     * @returns {Promise<boolean>}
     */
    async testConnection() {
      try {
        const results = await this.search('밥', 1);
        return results.length > 0;  // Bug Fix 2: >= 0은 항상 true → > 0으로 수정
      } catch {
        return false;
      }
    },
  };

  /* ================================================================
    디바운스 유틸
  ================================================================ */
  let _searchTimer = null;
  function debounce(fn, ms) {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(fn, ms);
  }

  /* ================================================================
    HTML 이스케이프 유틸
    ─ innerHTML 로 렌더할 때 따옴표/꺾쇠로 인한 파서 오류를 방지
  ================================================================ */
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(str) { return escapeHtml(str); }

  /* ================================================================
    6. 식단 UI
  ================================================================ */
  const MealUI = {

    mealLabels: { breakfast:'아침', lunch:'점심', dinner:'저녁', snack:'간식' },

    /* ── 탭 전환 ── */
    switchTab(mealKey) {
      AppState.ui.currentMeal = mealKey;
      document.querySelectorAll('.meal-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.meal === mealKey)
      );
      document.getElementById('ms-meal-name').textContent =
        this.mealLabels[mealKey] + ' 소계';
      document.getElementById('food-search').value = '';
      document.getElementById('autocomplete-list').classList.remove('show');
      this.renderFoodList();
      this.updateSubtotal();
    },

    /* ── 카테고리 필터 ── */
    filterCat(cat) {
      AppState.ui.currentCat = cat;
      document.querySelectorAll('.cat-btn').forEach(b => {
        const isAll = (cat === '' && b.textContent.includes('전체'));
        b.classList.toggle('active', isAll || (cat && b.textContent.includes(cat)));
      });
      // 카테고리명을 검색창에 채워 API 검색 실행
      if (cat) {
        const input = document.getElementById('food-search');
        input.value = cat;
        input.focus();
        this._doSearch(cat);
      } else {
        this.showFallbackResults(document.getElementById('food-search').value);
      }
    },

    /* ── API 키 저장 & 연결 테스트 — config.js 방식으로 변경, UI 입력 불필요 ── */
    // (제거됨: saveApiKey, toggleKeyVisibility)

    /* ── 검색 (API 우선, 실패 시 폴백 DB) ── */
    _doSearch(q) {
      if (q.trim().length >= 1) {
        this._searchAPI(q);   // config.js 키로 항상 API 검색
      } else {
        this.showFallbackResults(q);
      }
    },

    /* ── 식약처 API 검색 ── */
    async _searchAPI(q) {
      const icon = document.getElementById('search-icon');
      const list = document.getElementById('autocomplete-list');

      // 로딩 상태
      icon.className      = 'food-search-icon loading';
      icon.textContent    = '';
      list.innerHTML      = '<div class="autocomplete-msg">🔍 식약처 DB 검색 중…</div>';
      list.classList.add('show');

      try {
        const items = await FoodAPI.search(q, 15);
        icon.className   = 'food-search-icon';
        icon.textContent = '🔍';

        if (!items.length) {
          list.innerHTML = `<div class="autocomplete-msg">
            검색 결과가 없습니다. 다른 키워드를 시도해 보세요.
          </div>`;
          return;
        }

        list.innerHTML = items.map(f => `
          <div class="autocomplete-item"
              data-name="${escapeAttr(f.name)}"
              data-kcal="${f.kcal}"
              data-emoji="${escapeAttr(f.emoji)}"
              data-serving="${escapeAttr(f.serving)}"
              data-src="MFDS">
            <div class="ai-left">
              <span class="ai-name">${f.emoji} ${escapeHtml(f.name)}</span>
              <span class="ai-meta">${f.maker ? escapeHtml(f.maker) + ' · ' : ''}${escapeHtml(f.group)}</span>
            </div>
            <div class="ai-right">
              <span class="ai-kcal">${f.kcal} kcal</span>
              <span class="ai-serving">${escapeHtml(f.serving)} 기준</span>
            </div>
          </div>`).join('');

      } catch (err) {
        icon.className   = 'food-search-icon';
        icon.textContent = '🔍';
        list.innerHTML   = `
          <div class="autocomplete-msg error">
            API 오류: ${err.message}<br>내장 DB로 전환합니다.
          </div>`;
        // 잠시 후 폴백 DB 표시
        setTimeout(() => this.showFallbackResults(q), 1000);
      }
    },

    /* ── 폴백 DB 검색 ── */
    showFallbackResults(q) {
      const list = document.getElementById('autocomplete-list');
      const cat  = AppState.ui.currentCat;

      let items = FallbackDB;
      if (cat)      items = items.filter(f => f.cat === cat);
      if (q.trim()) items = items.filter(f =>
        f.name.toLowerCase().includes(q.toLowerCase())
      );

      if (!items.length) {
        list.innerHTML = '<div class="autocomplete-msg">검색 결과가 없습니다.</div>';
        list.classList.add('show');
        return;
      }

      list.innerHTML = items.slice(0, 10).map(f => `
        <div class="autocomplete-item"
            data-name="${escapeAttr(f.name)}"
            data-kcal="${f.kcal}"
            data-emoji="${escapeAttr(f.emoji)}"
            data-serving="${escapeAttr(f.serving)}"
            data-src="local">
          <div class="ai-left">
            <span class="ai-name">${f.emoji} ${escapeHtml(f.name)}</span>
            <span class="ai-meta">${escapeHtml(f.cat)}</span>
          </div>
          <div class="ai-right">
            <span class="ai-kcal">${f.kcal} kcal</span>
            <span class="ai-serving">${escapeHtml(f.serving)} 기준</span>
          </div>
        </div>`).join('');

      list.classList.add('show');
    },

    /* ── 음식 추가 ── */
    addFood(name, kcal, emoji, serving, src) {
      const meal = AppState.ui.currentMeal;
      AppState.today.meals[meal].push({ name, kcal, emoji, serving, src });

      document.getElementById('food-search').value = '';
      document.getElementById('autocomplete-list').classList.remove('show');

      this.renderFoodList();
      this.updateSubtotal();
      this.updateDailySummary();
      this.updateBadge(meal);
      compute();
    },

    /* ── 음식 삭제 ── */
    removeFood(meal, idx) {
      AppState.today.meals[meal].splice(idx, 1);
      this.renderFoodList();
      this.updateSubtotal();
      this.updateDailySummary();
      this.updateBadge(meal);
      compute();
    },

    /* ── 음식 목록 렌더링 ── */
    renderFoodList() {
      const meal  = AppState.ui.currentMeal;
      const items = AppState.today.meals[meal];
      const list  = document.getElementById('food-list');

      if (!items.length) {
        list.innerHTML = `
          <div style="text-align:center;padding:20px;color:var(--t3);font-size:13px;">
            아직 추가된 음식이 없습니다.
          </div>`;
        return;
      }

      list.innerHTML = items.map((f, i) => `
        <div class="food-item">
          <div class="fi-left">
            <span class="fi-emoji">${f.emoji}</span>
            <div>
              <div class="fi-name">${f.name}</div>
              <div class="fi-meta">
                ${f.serving} 기준
                <span class="src-tag ${f.src === 'MFDS' ? 'mfds' : 'local'}">
                  ${f.src === 'MFDS' ? '식약처' : '내장DB'}
                </span>
              </div>
            </div>
          </div>
          <div class="fi-right">
            <span class="fi-kcal">${f.kcal} kcal</span>
            <button class="fi-del"
                    onclick="MealUI.removeFood('${meal}', ${i})">✕</button>
          </div>
        </div>`).join('');
    },

    /* ── 소계 업데이트 ── */
    updateSubtotal() {
      document.getElementById('ms-val').textContent =
        Calc.mealTotal(AppState.ui.currentMeal).toLocaleString();
    },

    /* ── 탭 배지 ── */
    updateBadge(meal) {
      const cnt = AppState.today.meals[meal].length;
      const b   = document.getElementById('badge-' + meal);
      b.textContent = cnt;
      b.classList.toggle('show', cnt > 0);
    },

    /* ── 오늘 합계 배너 ── */
    updateDailySummary() {
      const total = Calc.dailyTotal();
      document.getElementById('ds-total').innerHTML =
        total.toLocaleString() +
        ' <span style="font-size:1rem;color:var(--t2)">kcal</span>';
      ['breakfast','lunch','dinner','snack'].forEach(k => {
        document.getElementById('dm-' + k).textContent = Calc.mealTotal(k);
      });
    },
  };

  /* ================================================================
    7. UI 렌더링 (결과 카드 / 차트)
  ================================================================ */
  let barChart = null;

  const UI = {

    renderResults() {
      const { bmr, tdee, target } = AppState.results;
      const { goal }              = AppState.user;
      const intake                = Calc.dailyTotal();
      const macros                = Calc.macros(target);

      const goalMeta = {
        loss:     { label: '🔥 체중 감량', cls: 'loss',     desc: 'TDEE 대비 -500 kcal 적자' },
        maintain: { label: '⚖️ 체중 유지', cls: 'maintain', desc: 'TDEE와 동일한 칼로리 유지' },
        gain:     { label: '💪 근육 증량', cls: 'gain',     desc: 'TDEE 대비 +300~500 kcal 흑자' },
      };
      const gm = goalMeta[goal];

      let intakeHTML = '';
      if (intake > 0) {
        const pct    = Calc.intakePct(intake, target);
        const barCls = pct > 110 ? 'over' : (pct < 80 ? 'warn' : 'ok');
        const barW   = Math.max(0, Math.min(pct, 100));  // Bug Fix 6: 음수 방지
        const remain = target - intake;
        const remainTxt = remain >= 0
          ? `<span style="color:var(--accent)">+${remain.toLocaleString()} kcal 남음</span>`
          : `<span style="color:var(--danger)">${Math.abs(remain).toLocaleString()} kcal 초과</span>`;

        intakeHTML = `
          <div class="intake-section">
            <div class="intake-label-row">
              <span>오늘 식단 합계 ${remainTxt}</span>
              <strong>${intake.toLocaleString()} kcal</strong>
            </div>
            <div class="progress-wrap">
              <div class="progress-bar ${barCls}" style="width:${barW}%"></div>
            </div>
            <div class="progress-pct">
              목표 대비 <span>${pct}%</span> ${pct > 100 ? '⚠️ 초과' : '달성'}
            </div>
          </div>`;
      }

      document.getElementById('result-body').innerHTML = `
        <div class="anim-pop">
          <div style="margin-bottom:18px;">
            <span class="goal-badge ${gm.cls}">${gm.label}</span>
            <span style="font-size:12px;color:var(--t2);margin-left:8px;">${gm.desc}</span>
          </div>
          <div class="result-grid">
            <div class="result-item">
              <div class="ri-label">기초대사량 BMR</div>
              <div class="ri-value">${bmr.toLocaleString()}</div>
              <div class="ri-unit">kcal / day</div>
            </div>
            <div class="result-item">
              <div class="ri-label">활동 소비량 TDEE</div>
              <div class="ri-value">${Math.round(tdee).toLocaleString()}</div>
              <div class="ri-unit">kcal / day</div>
            </div>
            <div class="result-item highlight">
              <div class="ri-label">목표 칼로리</div>
              <div class="ri-value">${target.toLocaleString()}</div>
              <div class="ri-unit">kcal / day</div>
            </div>
          </div>
          ${intakeHTML}
          <div style="font-size:11px;color:var(--t3);letter-spacing:.12em;
                      text-transform:uppercase;margin-top:24px;margin-bottom:12px;">
            권장 매크로 (탄 50 / 단 25 / 지 25%)
          </div>
          <div class="macro-row">
            <div class="macro-item protein">
              <div class="m-name">단백질</div>
              <div class="m-val">${macros.protein}</div>
              <div class="m-unit">g</div>
            </div>
            <div class="macro-item carb">
              <div class="m-name">탄수화물</div>
              <div class="m-val">${macros.carb}</div>
              <div class="m-unit">g</div>
            </div>
            <div class="macro-item fat">
              <div class="m-name">지방</div>
              <div class="m-val">${macros.fat}</div>
              <div class="m-unit">g</div>
            </div>
          </div>
        </div>`;
    },

    renderChart() {
      const { target } = AppState.results;
      const intake     = Calc.dailyTotal();

      const cs       = getComputedStyle(document.documentElement);
      const cardBg   = cs.getPropertyValue('--card').trim();
      const text1    = cs.getPropertyValue('--t1').trim();
      const text2    = cs.getPropertyValue('--t2').trim();
      const borderCl = cs.getPropertyValue('--border').trim();

      const hasIntake    = intake > 0;
      const labels       = hasIntake ? ['목표 칼로리', '섭취 칼로리'] : ['목표 칼로리'];
      const dataVals     = hasIntake ? [target, intake]              : [target];

      let iBg = 'rgba(45,168,216,0.6)', iBd = 'rgba(45,168,216,1)';
      if (hasIntake) {
        const pct = Calc.intakePct(intake, target);
        if      (pct > 110) { iBg = 'rgba(224,92,114,0.6)';  iBd = 'rgba(224,92,114,1)'; }
        else if (pct < 80)  { iBg = 'rgba(232,156,56,0.6)';  iBd = 'rgba(232,156,56,1)'; }
      }

      const bgColors     = hasIntake ? ['rgba(58,159,214,0.25)', iBg] : ['rgba(58,159,214,0.25)'];
      const borderColors = hasIntake ? ['rgba(58,159,214,1)',    iBd] : ['rgba(58,159,214,1)'];

      document.getElementById('chart-body').innerHTML =
        '<div class="chart-wrap"><canvas id="myChart"></canvas></div>';
      if (barChart) { barChart.destroy(); barChart = null; }

      barChart = new Chart(
        document.getElementById('myChart').getContext('2d'),
        {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'kcal', data: dataVals,
              backgroundColor: bgColors, borderColor: borderColors,
              borderWidth: 2, borderRadius: 8, borderSkipped: false,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: c => ' ' + c.parsed.y.toLocaleString() + ' kcal' },
                backgroundColor: cardBg, titleColor: text1, bodyColor: text2,
                borderColor: borderCl, borderWidth: 1, padding: 12,
              },
            },
            scales: {
              x: {
                ticks:  { color: text2, font: { family: 'Noto Sans KR', size: 12 } },
                grid:   { display: false },
                border: { color: borderCl },
              },
              y: {
                ticks: {
                  color: text2, font: { family: 'Noto Sans KR', size: 11 },
                  callback: v => v.toLocaleString(),
                },
                grid:   { color: 'rgba(189,216,242,.55)' },
                border: { color: borderCl, dash: [4, 4] },
                beginAtZero: true,
              },
            },
          },
        }
      );
    },

    showPlaceholder() {
      document.getElementById('result-body').innerHTML = `
        <div class="placeholder-msg">
          <span class="icon">📊</span>
          신체 정보를 모두 입력하면 결과가 여기에 표시됩니다.
        </div>`;
      document.getElementById('chart-body').innerHTML = `
        <div class="placeholder-msg">
          <span class="icon">📈</span>
          계산 후 그래프가 표시됩니다.
        </div>`;
      if (barChart) { barChart.destroy(); barChart = null; }
    },
  };

  /* ================================================================
    8. 계산 파이프라인
  ================================================================ */
  function compute() {
    const { gender, age, height, weight, activity, goal } = AppState.user;
    if (!Validate.all()) { UI.showPlaceholder(); return; }

    const bmr        = Math.round(Calc.bmr(gender, weight, height, age));
    const tdee       = Calc.tdee(bmr, activity);
    const { target } = Calc.targetCalories(tdee, goal);

    AppState.results.bmr    = bmr;
    AppState.results.tdee   = tdee;
    AppState.results.target = target;

    UI.renderResults();
    UI.renderChart();
  }

  /* ================================================================
    9. 이벤트 바인딩
  ================================================================ */
  function bindEvents() {

    /* 신체 정보 */
    ['age', 'height', 'weight'].forEach(id => {
      document.getElementById(id).addEventListener('input', e => {
        AppState.user[id] = e.target.value === '' ? null : Number(e.target.value);
        Validate.field(id, e.target.value);
        compute();
      });
    });

    /* 성별 */
    document.querySelectorAll('input[name="gender"]').forEach(r => {
      r.addEventListener('change', e => { AppState.user.gender = e.target.value; compute(); });
    });

    /* 활동 수준 */
    document.getElementById('activity').addEventListener('change', e => {
      AppState.user.activity = Number(e.target.value); compute();
    });

    /* 목표 */
    document.querySelectorAll('input[name="goal"]').forEach(r => {
      r.addEventListener('change', e => { AppState.user.goal = e.target.value; compute(); });
    });

    /* 음식 검색 — 디바운스 400ms */
    const searchInput = document.getElementById('food-search');

    searchInput.addEventListener('input', e => {
      const q = e.target.value;
      debounce(() => MealUI._doSearch(q), 400);
    });

    searchInput.addEventListener('focus', e => {
      if (!e.target.value) MealUI.showFallbackResults('');
    });

    /* 검색창 외부 클릭 → 드롭다운 닫기 */
    document.addEventListener('click', e => {
      if (!e.target.closest('.food-search-wrap')) {
        document.getElementById('autocomplete-list').classList.remove('show');
      }
    });

    /* 자동완성 항목 클릭 — 이벤트 위임 (data-* 속성에서 값 읽어 addFood 호출) */
    document.getElementById('autocomplete-list').addEventListener('click', e => {
      const el = e.target.closest('.autocomplete-item');
      if (!el) return;
      MealUI.addFood(
        el.dataset.name,
        Number(el.dataset.kcal),
        el.dataset.emoji,
        el.dataset.serving,
        el.dataset.src
      );
    });
  }

  /* ================================================================
    10. 초기화
  ================================================================ */
  (function init() {

    /* 시작 시 API 연결 테스트 — 실패 시 폴백 DB로 자동 전환 */
    const badgeEl = document.getElementById('data-source-badge');

    FoodAPI.testConnection().then(ok => {
      if (ok) {
        badgeEl.textContent = '🏛️ 식약처 영양성분 DB 연동 중 · 수만 종 검색 가능';
        badgeEl.className   = 'data-source-badge api-mode';
        document.getElementById('cat-scroll').style.display = 'none';
      } else {
        // config.js 키가 유효하지 않으면 폴백 DB 모드로 전환
        AppState.ui.apiMode = false;
        badgeEl.textContent = '⚠️ API 연결 실패 · 내장 DB 사용 중 (config.js 키를 확인하세요)';
        console.warn('[CalorieApp] 식약처 API 연결 실패. config.js의 MFDS_API_KEY를 확인하세요.');
      }
    });

    bindEvents();
    MealUI.renderFoodList();
  })();
