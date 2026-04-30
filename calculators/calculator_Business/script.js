    /* ============================================================
    Caboojoy — calculator_Business / script.js
    ============================================================ */

    'use strict';

    // ── Utility ──────────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
const gv = (id) => parseFloat(($(id)?.value || '').replace(/,/g, '')) || 0;
    const gs = (id) => $(id)?.value || '';

function formatGroupedInput(value, allowDecimal = false) {
    if (!allowDecimal) {
    const digits = value.replace(/[^\d]/g, '');
    return digits ? Number(digits).toLocaleString('ko-KR') : '';
    }

    let cleaned = value.replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    }

    const hasTrailingDot = cleaned.endsWith('.');
    const [intRaw = '', decRaw = ''] = cleaned.split('.');
    const intFormatted = intRaw ? Number(intRaw).toLocaleString('ko-KR') : '';

    if (hasTrailingDot) return (intFormatted || '0') + '.';
    if (decRaw) return (intFormatted || '0') + '.' + decRaw;
    return intFormatted;
}
    
    function setText(id, v) {
        const el = $(id);
        if (el) el.textContent = v;
    }
    
    const fmt = {
        won(n) {
        if (n === null || isNaN(n) || !isFinite(n)) return '—';
        const abs = Math.abs(n);
        const sign = n < 0 ? '−' : '';
        if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + '조원';
        if (abs >= 1e8)  return sign + (abs / 1e8).toFixed(2)  + '억원';
        if (abs >= 1e4)  return sign + Math.round(abs).toLocaleString('ko-KR') + '원';
        return sign + Math.round(abs).toLocaleString('ko-KR') + '원';
        },
        pct(n, d = 2) {
        if (n === null || isNaN(n) || !isFinite(n)) return '—';
        const sign = n < 0 ? '' : '';
        return sign + n.toFixed(d) + '%';
        },
        times(n, d = 2) {
        if (n === null || isNaN(n) || !isFinite(n)) return '—';
        return n.toFixed(d) + '배';
        },
        turns(n, d = 2) {
        if (n === null || isNaN(n) || !isFinite(n)) return '—';
        return n.toFixed(d) + '회';
        }
    };
    
    const safe = (num, den) => den ? num / den : NaN;
    const growth = (curr, prev) => prev ? (curr - prev) / prev * 100 : NaN;
    
    // ── Tab Navigation ────────────────────────────────────────────
    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            $('tab-' + btn.dataset.tab).classList.add('active');
        });
        });
    }
    
    // ── Mode Toggle Helper ────────────────────────────────────────
    function initToggle(toggleId, onChange) {
        const wrap = $(toggleId);
        if (!wrap) return;
        wrap.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            wrap.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onChange(btn.dataset.mode);
        });
        });
    }
    
    // ════════════════════════════════════════════════════════════
    //  1. 부가세
    // ════════════════════════════════════════════════════════════
    let vatMode = 'fwd';
    
    function initVAT() {
        initToggle('vatToggle', (mode) => {
        vatMode = mode;
        $('vatLbl').textContent = mode === 'fwd' ? '공급가액 (원)' : '공급대가 — 부가세 포함 금액 (원)';
        $('vatInput').value = '';
        ['vatSupply', 'vatTax', 'vatTotal'].forEach(id => setText(id, '—'));
        });
    $('vatInput').addEventListener('input', (e) => {
    const input = e.target;
    const digits = input.value.replace(/[^\d]/g, '');
    input.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
    calcVAT();
    });
    }
    
    function calcVAT() {
    const raw = $('vatInput')?.value || '';
    const v = parseFloat(raw.replace(/,/g, '')) || 0;
        if (!v) {
        ['vatSupply', 'vatTax', 'vatTotal'].forEach(id => setText(id, '—'));
        return;
        }
        let supply, tax, total;
        if (vatMode === 'fwd') {
        supply = v;  tax = v * 0.1;  total = v * 1.1;
        } else {
        total = v;  supply = v / 1.1;  tax = v - supply;
        }
        setText('vatSupply', fmt.won(supply));
        setText('vatTax',    fmt.won(tax));
        setText('vatTotal',  fmt.won(total));
    }
    
    // ════════════════════════════════════════════════════════════
    //  2. 마진·마크업
    // ════════════════════════════════════════════════════════════
    let marginMode = 'rate';
    
    function initMargin() {
        initToggle('marginToggle', (mode) => {
        marginMode = mode;
        $('mSecondLbl').textContent = mode === 'rate' ? '목표 마진율 (%)' : '판매가 (원)';
        $('mSecondInput').placeholder = mode === 'rate' ? '예: 40' : '예: 16,667';
        ['mCost','mProfit','mPrice','mMarginRate','mMarkup','mCostRate'].forEach(id => setText(id, '—'));
        });
    $('mCostInput').addEventListener('input', (e) => {
    const input = e.target;
    const digits = input.value.replace(/[^\d]/g, '');
    input.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
    calcMargin();
    });

    $('mSecondInput').addEventListener('input', (e) => {
    const input = e.target;

    if (marginMode === 'rate') {
        // 마진율 모드에서는 소수 입력 허용 (예: 33.5)
        let cleaned = input.value.replace(/[^\d.]/g, '');
        const firstDot = cleaned.indexOf('.');
        if (firstDot !== -1) {
        cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
        }
        input.value = cleaned;
    } else {
        const digits = input.value.replace(/[^\d]/g, '');
        input.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
    }
    calcMargin();
    });
    }
    
    function calcMargin() {
    const cost = parseFloat(($('mCostInput')?.value || '').replace(/,/g, '')) || 0;
    const second = parseFloat(($('mSecondInput')?.value || '').replace(/,/g, '')) || 0;
        const reset = () => ['mCost','mProfit','mPrice','mMarginRate','mMarkup','mCostRate'].forEach(id => setText(id, '—'));
    
        if (!cost || !second) { reset(); return; }
    
        let price, profit, marginRate, markupRate;
    
        if (marginMode === 'rate') {
        if (second >= 100) { setText('mPrice', '마진율은 100% 미만이어야 합니다'); return; }
        if (second <= 0)   { setText('mPrice', '마진율은 0% 초과이어야 합니다'); return; }
        price      = cost / (1 - second / 100);
        profit     = price - cost;
        marginRate = second;
        markupRate = safe(profit, cost) * 100;
        } else {
        price      = second;
        if (price <= cost) { setText('mPrice', '판매가 > 원가 조건 필요'); return; }
        profit     = price - cost;
        marginRate = safe(profit, price) * 100;
        markupRate = safe(profit, cost) * 100;
        }
    
        setText('mCost',       fmt.won(cost));
        setText('mProfit',     fmt.won(profit));
        setText('mPrice',      fmt.won(price));
        setText('mMarginRate', fmt.pct(marginRate));
        setText('mMarkup',     fmt.pct(markupRate));
        setText('mCostRate',   fmt.pct(safe(cost, price) * 100));
    }
    
    // ════════════════════════════════════════════════════════════
    //  3. 손익분기점
    // ════════════════════════════════════════════════════════════
    function initBEP() {
    ['bepFixed','bepPrice','bepVar','bepTarget'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        e.target.value = formatGroupedInput(e.target.value);
        calcBEP();
    });
    });
    }
    
    function calcBEP() {
        const fixed  = gv('bepFixed');
        const price  = gv('bepPrice');
        const varCost = gv('bepVar');
        const target  = gv('bepTarget');
        const ALL = ['bepCM','bepCMR','bepQty','bepRev','bepTQty','bepTRev','bepMOS','bepDOL'];
    
        if (!fixed || !price || varCost >= price) {
        ALL.forEach(id => setText(id, '—'));
        if (varCost >= price && price > 0) setText('bepQty', '단가 > 변동비 조건 필요');
        return;
        }
    
        const cm    = price - varCost;
        const cmr   = cm / price;
        const bepQ  = Math.ceil(fixed / cm);
        const bepR  = fixed / cmr;
    
        setText('bepCM',  fmt.won(cm));
        setText('bepCMR', fmt.pct(cmr * 100));
        setText('bepQty', bepQ.toLocaleString('ko-KR') + '개');
        setText('bepRev', fmt.won(bepR));
    
        if (target > 0) {
        const tQ      = Math.ceil((fixed + target) / cm);
        const tR      = (fixed + target) / cmr;
        const mos     = safe(tR - bepR, tR) * 100;
        const totCM   = tQ * cm;
        const opProfit = totCM - fixed;
        const dol     = opProfit > 0 ? safe(totCM, opProfit) : NaN;
    
        setText('bepTQty', tQ.toLocaleString('ko-KR') + '개');
        setText('bepTRev', fmt.won(tR));
        setText('bepMOS',  fmt.pct(mos));
        setText('bepDOL',  isNaN(dol) ? '—' : dol.toFixed(2) + '배');
        } else {
        ['bepTQty','bepTRev','bepMOS','bepDOL'].forEach(id => setText(id, '(목표이익 미입력)'));
        }
    }
    
    // ════════════════════════════════════════════════════════════
    //  4. 가산세
    // ════════════════════════════════════════════════════════════
    function initPenalty() {
        ['penAmt','penDue','penPay','penType','penTaxType','penTaxpayer'].forEach(id => {
        const el = $(id);
        if (el) { el.addEventListener('input', calcPenalty); el.addEventListener('change', calcPenalty); }
        });
    const penAmtEl = $('penAmt');
    if (penAmtEl) {
    penAmtEl.addEventListener('input', (e) => {
        e.target.value = formatGroupedInput(e.target.value);
    });
    }
        // Default pay date = today
        const today = new Date().toISOString().split('T')[0];
        $('penPay').value = today;
    }
    
    function calcPenalty() {
        const amt      = gv('penAmt');
        const type     = gs('penType');
        const due      = gs('penDue');
        const pay      = gs('penPay');
        const RESET    = ['penReport','penLate','penDays','penSum','penGrand','penRate'];
    
        if (!amt) { RESET.forEach(id => setText(id, '—')); return; }
    
        // 무·과소신고 가산세율
        const reportRates = {
        none:         0.20,
        none_unfair:  0.40,
        under:        0.10,
        under_unfair: 0.40,
        late_only:    0
        };
        const reportRate    = reportRates[type] ?? 0;
        const reportPenalty = amt * reportRate;
    
        // 납부지연 가산세 (0.022%/일, 국세기본법 §47의4)
        let delayDays   = 0;
        let latePenalty = 0;
    
        if (due && pay) {
        const d1 = new Date(due);
        const d2 = new Date(pay);
        delayDays = Math.max(0, Math.floor((d2 - d1) / 86400000));
        latePenalty = amt * delayDays * 0.00022;
        }
    
        const totalPenalty = reportPenalty + latePenalty;
        const grandTotal   = amt + totalPenalty;
        const penRate      = safe(totalPenalty, amt) * 100;
    
        const reportLabel = reportRate > 0
        ? fmt.won(reportPenalty) + ` (세액의 ${(reportRate * 100).toFixed(0)}%)`
        : '해당 없음 (납부지연만)';
    
        setText('penReport', reportLabel);
        setText('penLate',   delayDays > 0 ? fmt.won(latePenalty) : '0원 (지연 없음)');
        setText('penDays',   delayDays > 0 ? delayDays.toLocaleString('ko-KR') + '일' : '—');
        setText('penSum',    fmt.won(totalPenalty));
        setText('penGrand',  fmt.won(grandTotal));
        setText('penRate',   fmt.pct(penRate));
    }
    
    // ════════════════════════════════════════════════════════════
    //  5. 감가상각
    // ════════════════════════════════════════════════════════════
    let depMode = 'sl';
    
    // 정률법 상각률 — 한국 세법 근사 (잔존가치 = 취득원가의 10% 가정)
    // 공식: r = 1 − (0.1)^(1/n)
    function getDBRate(cost, salvage, life) {
        if (salvage > 0 && salvage < cost) {
        return 1 - Math.pow(salvage / cost, 1 / life);
        }
        // 잔존가치 없을 시 세법 표준 (10% 잔존 가정)
        return 1 - Math.pow(0.1, 1 / life);
    }
    
    function initDep() {
        initToggle('depToggle', (mode) => {
        depMode = mode;
        calcDep();
        });
    ['depCost','depSalvage'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        e.target.value = formatGroupedInput(e.target.value);
        calcDep();
    });
    });
    $('depLife').addEventListener('input', calcDep);
    }
    
    function calcDep() {
        const cost    = gv('depCost');
        const salvage = gv('depSalvage');
        const life    = Math.max(1, Math.min(50, gv('depLife') || 5));
        const tbody   = $('depBody');
    
        if (!cost) {
        ['depAnnual','depMonthly','depRate','depTotal'].forEach(id => setText(id, '—'));
        tbody.innerHTML = '<tr><td colspan="5" class="empty">취득원가를 입력하세요</td></tr>';
        return;
        }
    
        const depreciable = cost - salvage;
        let rows = '';
        let cum  = 0;
        let book = cost;
    
        if (depMode === 'sl') {
        const annual = depreciable / life;
        const rate   = (annual / cost) * 100;
        setText('depAnnual',  fmt.won(annual));
        setText('depMonthly', fmt.won(annual / 12));
        setText('depRate',    fmt.pct(rate));
        setText('depTotal',   fmt.won(depreciable));
    
        for (let y = 1; y <= Math.min(life, 30); y++) {
            const open = book;
            const dep  = Math.min(annual, book - salvage);
            cum  += dep;
            book -= dep;
            rows += buildRow(y, open, dep, cum, book);
        }
    
        } else {
        const rate = getDBRate(cost, salvage, life);
        setText('depAnnual',  '연도별 상이');
        setText('depMonthly', '연도별 상이');
        setText('depRate',    fmt.pct(rate * 100));
        setText('depTotal',   fmt.won(depreciable));
    
        for (let y = 1; y <= Math.min(life, 30); y++) {
            const open = book;
            const dep  = Math.max(0, (book - salvage) * rate);
            cum  += dep;
            book -= dep;
            rows += buildRow(y, open, dep, cum, book);
        }
        }
    
        if (life > 30) {
        rows += '<tr><td colspan="5" class="empty">30년 이후는 생략 (내용연수 ' + life + '년)</td></tr>';
        }
    
        // 합계 행
        rows += `<tr>
        <td>합계</td>
        <td>—</td>
        <td>${fmt.won(depreciable)}</td>
        <td>${fmt.won(depreciable)}</td>
        <td>${fmt.won(salvage)}</td>
        </tr>`;
    
        tbody.innerHTML = rows;
    }
    
    function buildRow(year, open, dep, cum, close) {
        return `<tr>
        <td>${year}년차</td>
        <td>${fmt.won(open)}</td>
        <td>${fmt.won(dep)}</td>
        <td>${fmt.won(cum)}</td>
        <td>${fmt.won(close)}</td>
        </tr>`;
    }
    
    // ════════════════════════════════════════════════════════════
    //  6. 재무비율 (25개 지표)
    // ════════════════════════════════════════════════════════════
    function initRatio() {
        $('ratioCalcBtn').addEventListener('click', calcRatios);
    const ratioInputIds = [
    'rSales','rCOGS','rOI','rNI','rEBITDA','rInt',
    'rTA','rEQ','rTD','rCA','rCL','rInv','rAR','rAP',
    'rPSales','rPOI','rPNI','rPTA',
    'rPrice','rEPS','rBPS','rDPS','rShares'
    ];
    ratioInputIds.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        e.target.value = formatGroupedInput(e.target.value, true);
        calcRatios();
    });
    });
    }
    
    function setRatio(id, v) {
        const el = $(id);
        if (!el) return;
        el.textContent = v;
        el.className = (v === '—') ? 'ri-val na' : 'ri-val';
    }
    
    function calcRatios() {
        // ── 손익계산서 ──
        const sales    = gv('rSales');
        const cogs     = gv('rCOGS');
        const oi       = gv('rOI');
        const ni       = gv('rNI');
        const ebitda   = gv('rEBITDA');
        const interest = gv('rInt');
    
        // ── 재무상태표 ──
        const ta   = gv('rTA');
        const eq   = gv('rEQ');
        const td   = gv('rTD');
        const ca   = gv('rCA');
        const cl   = gv('rCL');
        const inv  = gv('rInv');
        const ar   = gv('rAR');
        const ap   = gv('rAP');
    
        // ── 전기 ──
        const pSales = gv('rPSales');
        const pOI    = gv('rPOI');
        const pNI    = gv('rPNI');
        const pTA    = gv('rPTA');
    
        // ── 시장가치 ──
        const price  = gv('rPrice');
        const eps    = gv('rEPS');
        const bps    = gv('rBPS');
        const dps    = gv('rDPS');
        const shares = gv('rShares');
    
        // ── 수익성 ──────────────────────────────────
        setRatio('rROE',    eq     ? fmt.pct(safe(ni, eq) * 100)             : '—');
        setRatio('rROA',    ta     ? fmt.pct(safe(ni, ta) * 100)             : '—');
        setRatio('rGPM',    sales  ? fmt.pct(safe(sales - cogs, sales) * 100) : '—');
        setRatio('rOPM',    sales  ? fmt.pct(safe(oi, sales) * 100)          : '—');
        setRatio('rNPM',    sales  ? fmt.pct(safe(ni, sales) * 100)          : '—');
        setRatio('rEBITDAM',(sales && ebitda) ? fmt.pct(safe(ebitda, sales) * 100) : '—');
    
        // ── 안정성 ──────────────────────────────────
        setRatio('rCR',  cl          ? fmt.pct(safe(ca, cl) * 100)            : '—');
        setRatio('rQR',  cl          ? fmt.pct(safe(ca - inv, cl) * 100)      : '—');
        setRatio('rDR',  eq          ? fmt.pct(safe(td, eq) * 100)            : '—');
        setRatio('rER',  ta          ? fmt.pct(safe(eq, ta) * 100)            : '—');
        setRatio('rICR', interest    ? fmt.times(safe(oi, interest))          : '—');
    
        // ── 활동성 ──────────────────────────────────
        setRatio('rATR', ta          ? fmt.turns(safe(sales, ta))             : '—');
        setRatio('rITR', inv         ? fmt.turns(safe(cogs, inv))             : '—');
        setRatio('rRTR', ar          ? fmt.turns(safe(sales, ar))             : '—');
        setRatio('rPTR', ap          ? fmt.turns(safe(cogs, ap))              : '—');
    
        // ── 성장성 ──────────────────────────────────
        setRatio('rSGR', pSales ? fmt.pct(growth(sales, pSales)) : '—');
        setRatio('rOGR', pOI    ? fmt.pct(growth(oi,    pOI))    : '—');
        setRatio('rNGR', pNI    ? fmt.pct(growth(ni,    pNI))    : '—');
        setRatio('rAGR', pTA    ? fmt.pct(growth(ta,    pTA))    : '—');
    
        // ── 시장가치 ────────────────────────────────
        setRatio('rPER', (price && eps)  ? fmt.times(safe(price, eps))   : '—');
        setRatio('rPBR', (price && bps)  ? fmt.times(safe(price, bps))   : '—');
        setRatio('rDY',  (price && dps)  ? fmt.pct(safe(dps, price) * 100) : '—');
        setRatio('rDP',  (eps && dps)    ? fmt.pct(safe(dps, eps) * 100)   : '—');
    
        // EV/EBITDA — EV = 시가총액 + 순부채
        if (price && shares && ebitda && ebitda > 0) {
        const mktCap = price * shares;
        const ev     = mktCap + td;          // 단순화: 현금 미차감
        setRatio('rEVE', fmt.times(safe(ev, ebitda)));
        } else {
        setRatio('rEVE', '—');
        }
    }
    
    // ── DOMContentLoaded ──────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        initVAT();
        initMargin();
        initBEP();
        initPenalty();
        initDep();
        initRatio();
    });
