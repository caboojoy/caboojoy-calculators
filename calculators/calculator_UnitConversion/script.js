    /* ===================================================
    단위 변환 계산기 - script.js
    =================================================== */

    // ── 단위 데이터 정의 ──────────────────────────────────
    const CATEGORIES = {
        length: {
        name: '길이', icon: '📏',
        base: 'm',
        units: {
            nm:    { name: '나노미터',      symbol: 'nm',  factor: 1e-9 },
            um:    { name: '마이크로미터',  symbol: 'μm',  factor: 1e-6 },
            mm:    { name: '밀리미터',      symbol: 'mm',  factor: 0.001 },
            cm:    { name: '센티미터',      symbol: 'cm',  factor: 0.01 },
            m:     { name: '미터',          symbol: 'm',   factor: 1 },
            km:    { name: '킬로미터',      symbol: 'km',  factor: 1000 },
            inch:  { name: '인치',          symbol: 'in',  factor: 0.0254 },
            feet:  { name: '피트',          symbol: 'ft',  factor: 0.30480 },
            yard:  { name: '야드',          symbol: 'yd',  factor: 0.9144 },
            mile:  { name: '마일',          symbol: 'mi',  factor: 1609.344 },
            nmi:   { name: '해리',          symbol: 'nmi', factor: 1852 },
            ja:    { name: '자 (한국)',      symbol: '자',  factor: 0.30303 },
            ri:    { name: '리 (한국)',      symbol: '리',  factor: 392.7 },
        }
        },
    
        weight: {
        name: '무게', icon: '⚖️',
        base: 'g',
        units: {
            mcg:   { name: '마이크로그램',  symbol: 'μg',  factor: 0.000001 },
            mg:    { name: '밀리그램',      symbol: 'mg',  factor: 0.001 },
            g:     { name: '그램',          symbol: 'g',   factor: 1 },
            kg:    { name: '킬로그램',      symbol: 'kg',  factor: 1000 },
            t:     { name: '톤',            symbol: 't',   factor: 1000000 },
            oz:    { name: '온스',          symbol: 'oz',  factor: 28.3495 },
            lb:    { name: '파운드',        symbol: 'lb',  factor: 453.592 },
            st:    { name: '스톤',          symbol: 'st',  factor: 6350.29318 },
            ct:    { name: '캐럿',          symbol: 'ct',  factor: 0.2 },
            grain: { name: '그레인',        symbol: 'gr',  factor: 0.06480 },
            don:   { name: '돈 (한국)',      symbol: '돈',  factor: 3.75 },
            geun:  { name: '근 (한국)',      symbol: '근',  factor: 600 },
            gwan:  { name: '관 (한국)',      symbol: '관',  factor: 3750 },
        }
        },
    
        temperature: {
        name: '온도', icon: '🌡️',
        special: 'temp',
        units: {
            c: { name: '섭씨',  symbol: '°C' },
            f: { name: '화씨',  symbol: '°F' },
            k: { name: '켈빈',  symbol: 'K'  },
            r: { name: '랭킨',  symbol: '°R' },
        }
        },
    
        area: {
        name: '넓이', icon: '⬜',
        base: 'm2',
        units: {
            mm2:     { name: '제곱밀리미터', symbol: 'mm²', factor: 0.000001 },
            cm2:     { name: '제곱센티미터', symbol: 'cm²', factor: 0.0001 },
            m2:      { name: '제곱미터',     symbol: 'm²',  factor: 1 },
            km2:     { name: '제곱킬로미터', symbol: 'km²', factor: 1000000 },
            in2:     { name: '제곱인치',     symbol: 'in²', factor: 0.00064516 },
            ft2:     { name: '제곱피트',     symbol: 'ft²', factor: 0.09290304 },
            yd2:     { name: '제곱야드',     symbol: 'yd²', factor: 0.83612736 },
            pyeong:  { name: '평 (한국)',     symbol: '평',  factor: 3.30579 },
            hectare: { name: '헥타르',       symbol: 'ha',  factor: 10000 },
            acre:    { name: '에이커',       symbol: 'ac',  factor: 4046.856 },
        }
        },
    
        volume: {
        name: '부피', icon: '🧪',
        base: 'ml',
        units: {
            ml:     { name: '밀리리터',      symbol: 'mL',    factor: 1 },
            cc:     { name: '세제곱센티미터', symbol: 'cc',    factor: 1 },
            l:      { name: '리터',          symbol: 'L',     factor: 1000 },
            m3:     { name: '세제곱미터',    symbol: 'm³',    factor: 1000000 },
            gallon: { name: '갤런 (US)',      symbol: 'gal',   factor: 3785.41 },
            quart:  { name: '쿼트 (US)',      symbol: 'qt',    factor: 946.352946 },
            pint:   { name: '파인트 (US)',    symbol: 'pt',    factor: 473.176473 },
            cup:    { name: '컵 (미국)',      symbol: 'cup',   factor: 236.588 },
            tbsp:   { name: '테이블스푼',     symbol: 'tbsp',  factor: 14.78676478125 },
            tsp:    { name: '티스푼',         symbol: 'tsp',   factor: 4.92892159375 },
            floz:   { name: '플루이드 온스', symbol: 'fl oz', factor: 29.5735 },
            hop:    { name: '홉 (한국)',      symbol: '홉',    factor: 180.39 },
            doe:    { name: '되 (한국)',      symbol: '되',    factor: 1803.9 },
            mal:    { name: '말 (한국)',      symbol: '말',    factor: 18039 },
        }
        },
    
        speed: {
        name: '속도', icon: '💨',
        base: 'ms',
        units: {
            cms:  { name: '센티미터/초',  symbol: 'cm/s', factor: 0.01 },
            ms:   { name: '미터/초',     symbol: 'm/s',  factor: 1 },
            mh:   { name: '미터/시',     symbol: 'm/h',  factor: 1 / 3600 },
            ins:  { name: '인치/초',     symbol: 'in/s', factor: 0.0254 },
            inh:  { name: '인치/시',     symbol: 'in/h', factor: 0.0254 / 3600 },
            fts:  { name: '피트/초',     symbol: 'ft/s', factor: 0.3048 },
            fth:  { name: '피트/시',     symbol: 'ft/h', factor: 0.3048 / 3600 },
            mis:  { name: '마일/초',     symbol: 'mi/s', factor: 1609.344 },
            mih:  { name: '마일/시',     symbol: 'mi/h', factor: 0.44704 },
            kms:  { name: '킬로미터/초', symbol: 'km/s', factor: 1000 },
            kmh:  { name: '킬로미터/시', symbol: 'km/h', factor: 0.27778 },
            mph:  { name: '마일/시',     symbol: 'mph',  factor: 0.44704 },
            knot: { name: '노트',        symbol: 'kn',   factor: 0.514444 },
            mach: { name: '마하 (해면)', symbol: 'Mach', factor: 340.29 },
        }
        },
    
        pressure: {
        name: '압력', icon: '🔴',
        base: 'pa',
        units: {
            pa:     { name: '파스칼',          symbol: 'Pa',      factor: 1 },
            hpa:    { name: '헥토파스칼',      symbol: 'hPa',     factor: 100 },
            kpa:    { name: '킬로파스칼',      symbol: 'kPa',     factor: 1000 },
            mpa:    { name: '메가파스칼',      symbol: 'MPa',     factor: 1000000 },
            bar:    { name: '바',              symbol: 'bar',     factor: 100000 },
            mbar:   { name: '밀리바',          symbol: 'mbar',    factor: 100 },
            atm:    { name: '기압',            symbol: 'atm',     factor: 101325 },
            psi:    { name: '프사이',          symbol: 'psi',     factor: 6894.757 },
            mmhg:   { name: '수은주밀리미터',  symbol: 'mmHg',    factor: 133.322 },
            torr:   { name: '토르',            symbol: 'Torr',    factor: 133.322368 },
            inhg:   { name: '수은주 in',       symbol: 'inHg',    factor: 3386.389 },
            mmh2o:  { name: '수주 mm',         symbol: 'mmH₂O',   factor: 9.80665 },
            kgfcm2: { name: 'kgf/cm²',        symbol: 'kgf/cm²', factor: 98066.5 },
        }
        },
    
        fuel: {
        name: '연비', icon: '⛽',
        special: 'fuel',
        units: {
            kmL:   { name: '킬로미터/리터',  symbol: 'km/L'    },
            lp100: { name: '리터/100km',     symbol: 'L/100km' },
            mpgUS: { name: '마일/갤런 (US)', symbol: 'mpg(US)' },
            mpgUK: { name: '마일/갤런 (UK)', symbol: 'mpg(UK)' },
        }
        },
    
        energy: {
        name: '에너지', icon: '⚡',
        base: 'j',
        units: {
            j:    { name: '줄',         symbol: 'J',    factor: 1 },
            kj:   { name: '킬로줄',     symbol: 'kJ',   factor: 1000 },
            mj:   { name: '메가줄',     symbol: 'MJ',   factor: 1000000 },
            cal:  { name: '칼로리',     symbol: 'cal',  factor: 4.184 },
            kcal: { name: '킬로칼로리', symbol: 'kcal', factor: 4184 },
            wh:   { name: '와트시',     symbol: 'Wh',   factor: 3600 },
            kwh:  { name: '킬로와트시', symbol: 'kWh',  factor: 3600000 },
            btu:  { name: 'BTU',        symbol: 'BTU',  factor: 1055.06 },
            ev:   { name: '전자볼트',   symbol: 'eV',   factor: 1.60218e-19 },
        }
        },
    
        angle: {
        name: '각도', icon: '📐',
        base: 'deg',
        units: {
            deg:  { name: '도',       symbol: '°',    factor: 1 },
            rad:  { name: '라디안',   symbol: 'rad',  factor: 180 / Math.PI },
            grad: { name: '그레이드', symbol: 'grad', factor: 0.9 },
            min:  { name: '분 (′)',   symbol: '′',    factor: 1 / 60 },
            sec:  { name: '초 (″)',   symbol: '″',    factor: 1 / 3600 },
            turn: { name: '회전',     symbol: 'turn', factor: 360 },
        }
        },
    
        data: {
        name: '데이터', icon: '💾',
        base: 'b',
        units: {
            bit: { name: '비트',       symbol: 'bit', factor: 0.125 },
            b:  { name: '바이트',     symbol: 'B',  factor: 1 },
            kb: { name: '킬로바이트', symbol: 'KB', factor: 1024 },
            mb: { name: '메가바이트', symbol: 'MB', factor: 1048576 },
            gb: { name: '기가바이트', symbol: 'GB', factor: 1073741824 },
            tb: { name: '테라바이트', symbol: 'TB', factor: 1099511627776 },
            pb: { name: '페타바이트', symbol: 'PB', factor: 1125899906842624 },
            eb: { name: '엑사바이트', symbol: 'EB', factor: 1024 ** 6 },
        }
        },
    
        time: {
        name: '시간', icon: '⏱️',
        base: 's',
        units: {
            usec: { name: '마이크로초', symbol: 'μs',  factor: 0.000001 },
            msec: { name: '밀리초', symbol: 'ms',  factor: 0.001 },
            s:    { name: '초',     symbol: 's',   factor: 1 },
            min:  { name: '분',     symbol: 'min', factor: 60 },
            h:    { name: '시간',   symbol: 'h',   factor: 3600 },
            d:    { name: '일',     symbol: '일',  factor: 86400 },
            w:    { name: '주',     symbol: '주',  factor: 604800 },
            mo:   { name: '월',     symbol: '월',  factor: 2592000 },
            y:    { name: '년',     symbol: '년',  factor: 31536000 },
        }
        },
    };
    
    // ── 상태 ─────────────────────────────────────────────
    let state = {
        category: 'length',
        fromUnit: 'm',
        inputValue: '',
    };
    
    // ── 특수 변환: 온도 ───────────────────────────────────
    function convertTemp(value, from, to) {
        let c;
        if (from === 'c') c = value;
        else if (from === 'f') c = (value - 32) * 5 / 9;
        else if (from === 'k') c = value - 273.15;
    else if (from === 'r') c = (value - 491.67) * 5 / 9;
        if (to === 'c') return c;
        if (to === 'f') return c * 9 / 5 + 32;
        if (to === 'k') return c + 273.15;
    if (to === 'r') return (c + 273.15) * 9 / 5;
    }
    
    // ── 특수 변환: 연비 ───────────────────────────────────
    function toKmL(value, unit) {
        if (unit === 'kmL')   return value;
        if (unit === 'lp100') return value === 0 ? Infinity : 100 / value;
        if (unit === 'mpgUS') return value * 0.425144;
        if (unit === 'mpgUK') return value * 0.354006;
    }
    function fromKmL(kmL, unit) {
        if (unit === 'kmL')   return kmL;
        if (unit === 'lp100') return kmL === 0 ? Infinity : 100 / kmL;
        if (unit === 'mpgUS') return kmL / 0.425144;
        if (unit === 'mpgUK') return kmL / 0.354006;
    }
    function convertFuel(value, from, to) {
        return fromKmL(toKmL(value, from), to);
    }
    
    // ── 숫자 포맷 ─────────────────────────────────────────
    function formatNumber(num) {
        if (!isFinite(num)) return '∞';
        const abs = Math.abs(num);
        if (abs === 0) return '0';
        if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) {
        return num.toExponential(6).replace(/\.?0+e/, 'e');
        }
        if (abs >= 1000) {
        return parseFloat(num.toPrecision(10)).toLocaleString('ko-KR');
        }
        if (abs >= 1) {
        return parseFloat(num.toPrecision(8))
            .toLocaleString('ko-KR', { maximumFractionDigits: 8 });
        }
        return parseFloat(num.toPrecision(6)).toString();
    }
    
    // ── DOM 초기화 ────────────────────────────────────────
    function init() {
        buildCategoryNav();
        buildUnitSelect();
        bindEvents();
        render();
    }
    
    function buildCategoryNav() {
        const nav = document.getElementById('categoryNav');
        nav.innerHTML = '';
        Object.entries(CATEGORIES).forEach(([key, cat]) => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn' + (key === state.category ? ' active' : '');
        btn.dataset.cat = key;
        btn.innerHTML = '<span class="cat-icon">' + cat.icon + '</span>' + cat.name;
        nav.appendChild(btn);
        });
    }
    
    function buildUnitSelect() {
        const cat = CATEGORIES[state.category];
        const sel = document.getElementById('fromUnit');
        sel.innerHTML = '';
        Object.entries(cat.units).forEach(([key, unit]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = unit.name + ' (' + unit.symbol + ')';
        if (key === state.fromUnit) opt.selected = true;
        sel.appendChild(opt);
        });
    }
    
    // ── 이벤트 바인딩 ─────────────────────────────────────
    function bindEvents() {
        document.getElementById('categoryNav').addEventListener('click', function(e) {
        const btn = e.target.closest('.cat-btn');
        if (!btn) return;
        const cat = btn.dataset.cat;
        if (cat === state.category) return;
        state.category = cat;
        state.fromUnit = Object.keys(CATEGORIES[cat].units)[0];
        buildCategoryNav();
        buildUnitSelect();
        render();
        });
    
        document.getElementById('inputValue').addEventListener('input', function(e) {
        state.inputValue = e.target.value;
        render();
        });
    
        document.getElementById('fromUnit').addEventListener('change', function(e) {
        state.fromUnit = e.target.value;
        render();
        });
    
        document.getElementById('swapBtn').addEventListener('click', function() {
        showToast('역변환: 결과 카드를 클릭하세요 👆');
        });
    }
    
    // ── 변환 로직 ─────────────────────────────────────────
    function convert(value, catKey, fromKey, toKey) {
        const catData = CATEGORIES[catKey];
        if (catData.special === 'temp') return convertTemp(value, fromKey, toKey);
        if (catData.special === 'fuel') return convertFuel(value, fromKey, toKey);
        const fromFactor = catData.units[fromKey].factor;
        const toFactor   = catData.units[toKey].factor;
        return value * fromFactor / toFactor;
    }
    
    // ── 렌더링 ────────────────────────────────────────────
    function render() {
        const grid          = document.getElementById('resultsGrid');
        const emptyState    = document.getElementById('emptyState');
        const resultsHeader = document.getElementById('resultsHeader');
        const resultsTitle  = document.getElementById('resultsTitle');
    
        const val      = parseFloat(state.inputValue);
        const hasValue = state.inputValue !== '' && !isNaN(val);
    
        grid.innerHTML = '';
    
        if (!hasValue) {
        emptyState.style.display = 'block';
        resultsHeader.style.display = 'none';
        return;
        }
    
        emptyState.style.display = 'none';
        resultsHeader.style.display = 'flex';
    
        const cat          = CATEGORIES[state.category];
        const fromUnitData = cat.units[state.fromUnit];
        resultsTitle.textContent =
        formatNumber(val) + ' ' + fromUnitData.symbol + ' → 전체 단위 변환';
    
        Object.entries(cat.units).forEach(function([key, unit]) {
        const converted = convert(val, state.category, state.fromUnit, key);
    
        const card = document.createElement('div');
        card.className = 'result-card' + (key === state.fromUnit ? ' active-unit' : '');
        card.innerHTML =
            '<div class="result-unit-name">' + unit.name + '</div>' +
            '<div class="result-bottom">' +
            '<span class="result-value' + (converted === 0 ? ' zero' : '') + '">' +
                formatNumber(converted) +
            '</span>' +
            '<span class="result-symbol">' + unit.symbol + '</span>' +
            '</div>' +
            '<div class="copy-hint">클릭하여 복사 · 역변환</div>';
    
        card.addEventListener('click', function() {
            const formatted = formatNumber(converted);
            if (navigator.clipboard) navigator.clipboard.writeText(formatted).catch(function(){});
            state.fromUnit   = key;
            state.inputValue = String(converted);
            document.getElementById('inputValue').value = converted;
            buildUnitSelect();
            render();
            showToast(formatted + ' ' + unit.symbol + ' 복사됨');
        });
    
        grid.appendChild(card);
        });
    }
    
    // ── 토스트 ────────────────────────────────────────────
    var toastTimer = null;
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2000);
    }
    
    // ── 실행 ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);

