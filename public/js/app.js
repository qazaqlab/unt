// ============================================================================
// ҰБТ 130/130 ФИЗМАТ — НЕГІЗГІ ИНТЕРАКТИВТІ ПЛАТФОРМА ЛОГИКАСЫ (SPA)
// ============================================================================

const App = {
  state: null,
  books: [],
  activeTab: "dashboard",
  selectedSubject: "phys",
  selectedTopicCode: "PHYS-01",
  topicSubTab: "theory",
  selectedMonth: 1,
  selectedWeek: 1,
  // Pomodoro state
  timerInterval: null,
  timerSeconds: 50 * 60,
  timerMode: "50/10",
  timerRunning: false,
  // Active Quiz / Exam state
  activeExam: null,
  // Quizizz state (5-11 grades history + physics + math + msl)
  quizizzSubj: "hist",
  quizizzCategory: "all",
  quizizzSearch: "",

  async init() {
    await this.loadState();
    await this.loadBooks();
    this.checkStreak();
    this.bindNav();
    this.renderAll();
  },

  async loadState() {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("Server status " + res.status);
      this.state = await res.json();
      try { localStorage.setItem("ubt130_state_backup", JSON.stringify(this.state)); } catch (e) {}
    } catch (e) {
      console.warn("Using localStorage fallback for state:", e);
      let cached = null;
      try {
        const raw = localStorage.getItem("ubt130_state_backup");
        if (raw) cached = JSON.parse(raw);
      } catch (err) {}
      this.state = cached || {
        studentName: "Болашақ Грант Иегері (ФизМат)",
        targetScore: 130,
        streak: 1,
        totalFocusMinutes: 0,
        currentMonth: 1,
        currentWeek: 1,
        currentDay: 1,
        completedDays: {},
        completedBlocks: {},
        homeworkChecks: {},
        testHistory: [
          {
            id: "diag-0",
            date: "2026-11-01",
            type: "diagnostic",
            title: "Бастапқы диагностика (Старт)",
            score: 78,
            maxScore: 130,
            breakdown: { phys: 28, math: 26, hist: 15, msl: 9 }
          }
        ],
        errorBank: [],
        customQuestions: [],
        completedQuizizz: {}
      };
    }
    this.selectedMonth = this.state.currentMonth || 1;
    this.selectedWeek = this.state.currentWeek || 1;
    if (this.state.customQuestions && this.state.customQuestions.length > 0) {
      const existingIds = new Set(window.UBT_QUESTIONS.map(q => q.id));
      for (const cq of this.state.customQuestions) {
        if (!existingIds.has(cq.id)) {
          window.UBT_QUESTIONS.push(cq);
        }
      }
    }
  },

  async saveState(patch = {}) {
    this.state = { ...this.state, ...patch };
    try {
      localStorage.setItem("ubt130_state_backup", JSON.stringify(this.state));
    } catch (e) {}
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.state)
      });
    } catch (e) {
      console.warn("Saved to localStorage (offline mode):", e);
    }
    this.updateHeaderStats();
  },

  async loadBooks() {
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      this.books = data.books || [];
    } catch (e) {
      console.error("Books load error:", e);
      this.books = [];
    }
  },

  checkStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.lastActiveDate !== today) {
      const last = new Date(this.state.lastActiveDate || today);
      const curr = new Date(today);
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
      let newStreak = this.state.streak || 1;
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
      this.saveState({ lastActiveDate: today, streak: newStreak });
    }
  },

  bindNav() {
    document.querySelectorAll("[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.switchTab(btn.getAttribute("data-nav"));
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll("[data-nav]").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-nav") === tabId);
    });
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.toggle("active", sec.id === `view-${tabId}`);
    });
    this.renderActiveTab();
  },

  renderAll() {
    this.updateHeaderStats();
    this.renderDashboard();
    this.renderPlanView();
    this.renderCurriculumView();
    this.renderQuizizzView();
    this.renderAchievementsView();
    this.renderTestCenter();
    this.renderLibrary();
    this.renderParserView();
    this.renderMathInElement(document.body);
  },

  renderActiveTab() {
    if (this.activeTab === "dashboard") this.renderDashboard();
    else if (this.activeTab === "plan") this.renderPlanView();
    else if (this.activeTab === "curriculum") this.renderCurriculumView();
    else if (this.activeTab === "quizizz") this.renderQuizizzView();
    else if (this.activeTab === "achievements") this.renderAchievementsView();
    else if (this.activeTab === "tests") this.renderTestCenter();
    else if (this.activeTab === "library") this.renderLibrary();
    else if (this.activeTab === "parser") this.renderParserView();
    this.renderMathInElement(document.body);
  },

  renderMathInElement(el) {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    }
  },

  updateHeaderStats() {
    const streakEl = document.getElementById("hdr-streak");
    const dayEl = document.getElementById("hdr-day");
    const focusEl = document.getElementById("hdr-focus");
    const errEl = document.getElementById("hdr-errors");
    if (streakEl) streakEl.textContent = `${this.state.streak || 1} күн`;
    if (dayEl) dayEl.textContent = `${this.state.currentDay || 1} / 140 күн`;
    if (focusEl) focusEl.textContent = `${this.state.totalFocusMinutes || 0} мин`;
    if (errEl) errEl.textContent = `${(this.state.errorBank || []).length}`;
  },

  getTopicByCode(code) {
    for (const subj of ["phys", "math", "hist", "msl"]) {
      const found = window.UBT_CURRICULUM.topics[subj].find(t => t.code === code);
      if (found) return { ...found, subjectId: subj };
    }
    return null;
  },

  // ==========================================================================
  // 1. БАСТЫ БЕТ (DASHBOARD)
  // ==========================================================================
  renderDashboard() {
    const container = document.getElementById("dashboard-content");
    if (!container) return;

    const curDayNum = this.state.currentDay || 1;
    const dayObj = window.UBT_CURRICULUM.days[curDayNum - 1] || window.UBT_CURRICULUM.days[0];
    const completedDaysCount = Object.keys(this.state.completedDays || {}).filter(k => this.state.completedDays[k]).length;
    const progressPct = Math.round((completedDaysCount / 140) * 100);

    const lastTest = (this.state.testHistory || [])[this.state.testHistory.length - 1] || {
      score: 78, maxScore: 130, breakdown: { phys: 28, math: 26, hist: 15, msl: 9 }
    };

    const physTopic = this.getTopicByCode(dayObj.topics.phys);
    const mathTopic = this.getTopicByCode(dayObj.topics.math);
    const histTopic = this.getTopicByCode(dayObj.topics.hist);
    const mslTopic  = this.getTopicByCode(dayObj.topics.msl);

    container.innerHTML = `
      <!-- Top KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card accent-blue">
          <div class="kpi-label">Ағымдағы нәтиже / Мақсат</div>
          <div class="kpi-value">${lastTest.score} <span class="kpi-sub">/ 130 балл</span></div>
          <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${Math.round((lastTest.score/130)*100)}%;background:#38bdf8;"></div></div>
          <div class="kpi-foot">Физ: ${lastTest.breakdown?.phys||0}/50 • Мат: ${lastTest.breakdown?.math||0}/50 • Тар: ${lastTest.breakdown?.hist||0}/20 • МС: ${lastTest.breakdown?.msl||0}/10</div>
        </div>

        <div class="kpi-card accent-indigo">
          <div class="kpi-label">5 Айлық Прогресс (140 күн)</div>
          <div class="kpi-value">${completedDaysCount} <span class="kpi-sub">/ 140 күн (${progressPct}%)</span></div>
          <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${progressPct}%;background:#818cf8;"></div></div>
          <div class="kpi-foot">${dayObj.month}-ай • ${dayObj.week}-апта • Күн #${dayObj.day} (${dayObj.dayOfWeekName})</div>
        </div>

        <div class="kpi-card accent-amber">
          <div class="kpi-label">Дисциплина және оқу режимі</div>
          <div class="kpi-value">${this.state.streak || 1} күн <span class="kpi-sub">үздіксіз стрик</span></div>
          <div class="kpi-foot" style="margin-top:8px;">
            Фокус уақыты: <b>${this.state.totalFocusMinutes || 0} мин</b> • Қатемен жұмыс кезегі: <b>${(this.state.errorBank || []).length} сұрақ</b>
          </div>
        </div>
      </div>

      <div class="dash-two-col">
        <!-- Left: Today's Mission & Time-Blocking -->
        <div class="card">
          <div class="card-header">
            <div>
              <span class="badge badge-blue">${dayObj.month}-АЙ • ${dayObj.week}-АПТА</span>
              <h3 style="margin:6px 0 2px;">Бүгінгі оқу мақсаты: ${dayObj.title}</h3>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn btn-sm btn-outline" onclick="App.changeCurrentDay(-1)">◀ Алдыңғы</button>
              <button class="btn btn-sm btn-outline" onclick="App.changeCurrentDay(1)">Келесі ▶</button>
            </div>
          </div>

          <!-- Today's 4 Subject Topic Pills -->
          <div class="today-topics-grid">
            <div class="topic-pill phys" onclick="App.openTopicDirect('${physTopic.code}')">
              <div class="tp-head">Физика (50 б)</div>
              <div class="tp-title">${physTopic.title}</div>
              <div class="tp-link">Түсіндірме + PDF беттерін ашу →</div>
            </div>
            <div class="topic-pill math" onclick="App.openTopicDirect('${mathTopic.code}')">
              <div class="tp-head">Математика (50 б)</div>
              <div class="tp-title">${mathTopic.title}</div>
              <div class="tp-link">Түсіндірме + PDF беттерін ашу →</div>
            </div>
            <div class="topic-pill hist" onclick="App.openTopicDirect('${histTopic.code}')">
              <div class="tp-head">Қазақстан тарихы (20 б)</div>
              <div class="tp-title">${histTopic.title}</div>
              <div class="tp-link">Даталар мен тұлғаларды ашу →</div>
            </div>
            <div class="topic-pill msl" onclick="App.openTopicDirect('${mslTopic.code}')">
              <div class="tp-head">Мат. сауаттылық (10 б)</div>
              <div class="tp-title">${mslTopic.title}</div>
              <div class="tp-link">Логикалық лайфхактарды ашу →</div>
            </div>
          </div>

          <h4 style="margin:16px 0 8px;">Бүгінгі сабақ кестесі (тайм-блокинг) (Күйіп кетпеу режимі: ${dayObj.isWeekend ? 'Демалыс 4–4.5 сағ' : 'Жұмыс күні 3–3.5 сағ'}):</h4>
          <div class="schedule-list">
            ${dayObj.blocks.map(b => {
              const key = `d${dayObj.day}_${b.id}`;
              const checked = !!(this.state.completedBlocks && this.state.completedBlocks[key]);
              return `
                <label class="schedule-item ${checked ? 'done' : ''} ${b.type === 'break' ? 'is-break' : ''}">
                  <input type="checkbox" ${checked ? 'checked' : ''} onchange="App.toggleBlock('${key}', this.checked)" />
                  <span class="sch-time">${b.time}</span>
                  <span class="sch-title">${b.title}</span>
                </label>
              `;
            }).join("")}
          </div>

          <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <button class="btn btn-primary" onclick="App.completeCurrentDay(${dayObj.day})">
              ${this.state.completedDays?.[dayObj.day] ? 'Бүгінгі күн орындалды (Келесі күнге өту)' : 'Бүгінгі күнді аяқтау және сақтау'}
            </button>
            <button class="btn btn-accent" onclick="App.startDailyQuiz(${dayObj.day})">
              Бүгінгі тақырыптар бойынша сынақты бастау
            </button>
          </div>
        </div>

        <!-- Right: Pomodoro Timer & Anti-Burnout Rules -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card pomodoro-card">
            <div class="card-header">
              <h3 style="margin:0;">Фокус-Таймер (Помодоро)</h3>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-xs ${this.timerMode==='50/10'?'btn-primary':'btn-outline'}" onclick="App.setTimerMode('50/10', 50)">50/10 Терең фокус</button>
                <button class="btn btn-xs ${this.timerMode==='25/5'?'btn-primary':'btn-outline'}" onclick="App.setTimerMode('25/5', 25)">25/5 Жеңіл старт</button>
                <button class="btn btn-xs ${this.timerMode==='break'?'btn-primary':'btn-outline'}" onclick="App.setTimerMode('break', 10)">10 мин Демалыс</button>
              </div>
            </div>
            <div class="timer-display" id="pomodoro-digits">${this.formatSeconds(this.timerSeconds)}</div>
            <div style="display:flex;justify-content:center;gap:10px;margin-top:10px;">
              <button class="btn btn-primary" id="btn-timer-toggle" onclick="App.toggleTimer()">
                ${this.timerRunning ? 'Кідірту' : 'Бастау'}
              </button>
              <button class="btn btn-outline" onclick="App.resetTimer()">Қайта орнату</button>
            </div>
            <p class="timer-hint">Ереже: Таймер жүріп жатқанда телефонды басқа бөлмеге қой. 50 минутта тек 1 пәнмен жұмыс істе!</p>
          </div>

          <div class="card">
            <h3 style="margin:0 0 10px;">Академиялық тиімділіктің 5 қағидасы</h3>
            <ul class="anti-burnout-list">
              <li><b>1. Уақытпен емес, блокпен оқы:</b> Күніне 10 сағат шаршап отырғаннан гөрі, телефонсыз таза <b>3 сағат (3х50 мин)</b> оқу 3 есе көп балл береді.</li>
              <li><b>2. «2 минут ережесі»:</b> Сабақ бастауға ерінсең, таймерді 25 минутқа қойып, тек 2 оңай есеп шығарудан баста. Ми өзі іске қосылады.</li>
              <li><b>3. 1-3-7-21 Қатемен жұмыс:</b> ҰБТ-да баллды жаңа тақырып емес, <b>қате кеткен есепті қайта шығару</b> өсіреді.</li>
              <li><b>4. Түнгі 23:00-ден кейін оқыма:</b> Формулалар мен тарих даталары тек 7–8 сағаттық ұйқы кезінде ұзақ мерзімді жадыға жазылады.</li>
              <li><b>5. Жексенбі — жеңіл күн:</b> Жексенбіде жаңа ауыр теория алма, тек қателер банкін тазалап, миыңды тынықтыр.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  changeCurrentDay(delta) {
    let next = (this.state.currentDay || 1) + delta;
    if (next < 1) next = 1;
    if (next > 140) next = 140;
    const dayObj = window.UBT_CURRICULUM.days[next - 1];
    this.saveState({
      currentDay: next,
      currentWeek: dayObj.week,
      currentMonth: dayObj.month
    });
    this.renderDashboard();
    this.renderMathInElement(document.body);
  },

  toggleBlock(key, checked) {
    const completedBlocks = { ...(this.state.completedBlocks || {}), [key]: checked };
    this.saveState({ completedBlocks });
    this.renderDashboard();
    this.renderMathInElement(document.body);
  },

  completeCurrentDay(dayNum) {
    const completedDays = { ...(this.state.completedDays || {}), [dayNum]: true };
    const nextDay = dayNum < 140 ? dayNum + 1 : 140;
    const dayObj = window.UBT_CURRICULUM.days[nextDay - 1];
    this.saveState({
      completedDays,
      currentDay: nextDay,
      currentWeek: dayObj.week,
      currentMonth: dayObj.month
    });
    this.renderDashboard();
    this.renderMathInElement(document.body);
  },

  openTopicDirect(code) {
    const t = this.getTopicByCode(code);
    if (!t) return;
    this.selectedSubject = t.subjectId;
    this.selectedTopicCode = code;
    this.topicSubTab = "theory";
    this.switchTab("curriculum");
  },

  // Pomodoro methods
  formatSeconds(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  },

  setTimerMode(mode, minutes) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerRunning = false;
    this.timerMode = mode;
    this.timerSeconds = minutes * 60;
    this.renderDashboard();
  },

  toggleTimer() {
    if (this.timerRunning) {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      this.renderDashboard();
      return;
    }
    this.timerRunning = true;
    const btn = document.getElementById("btn-timer-toggle");
    if (btn) btn.textContent = "Кідірту";
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        const disp = document.getElementById("pomodoro-digits");
        if (disp) disp.textContent = this.formatSeconds(this.timerSeconds);
        if (this.timerSeconds % 60 === 0 && this.timerMode !== "break") {
          this.saveState({ totalFocusMinutes: (this.state.totalFocusMinutes || 0) + 1 });
        }
      } else {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        alert("Таймер уақыты аяқталды. 10 минут тынығып, көзіңізді демалдырыңыз.");
        this.renderDashboard();
      }
    }, 1000);
  },

  resetTimer() {
    const mins = this.timerMode === "50/10" ? 50 : this.timerMode === "25/5" ? 25 : 10;
    this.setTimerMode(this.timerMode, mins);
  },

  // ==========================================================================
  // 2. 5 АЙ / 20 АПТА / 140 КҮН ЖОСПАРЫ (PLAN VIEW)
  // ==========================================================================
  renderPlanView() {
    const container = document.getElementById("plan-content");
    if (!container) return;

    const months = window.UBT_CURRICULUM.months;
    const weeks = window.UBT_CURRICULUM.weeks.filter(w => w.month === this.selectedMonth);
    const days = window.UBT_CURRICULUM.days.filter(d => d.week === this.selectedWeek);

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin:0 0 12px;">5 айлық оқу бағдарламасы (Қараша 2026 — Наурыз 2027)</h3>
        <div class="months-grid">
          ${months.map(m => `
            <div class="month-card ${this.selectedMonth === m.month ? 'active' : ''}" onclick="App.selectMonth(${m.month})">
              <div class="mc-top">
                <span class="badge badge-blue">${m.month}-АЙ</span>
                <span class="mc-score">${m.goalScore}</span>
              </div>
              <div class="mc-title">${m.name}</div>
              <div class="mc-desc">${m.description}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="dash-two-col">
        <div class="card">
          <h3 style="margin:0 0 12px;">${this.selectedMonth}-айдың апталары (${weeks[0].week}–${weeks[weeks.length-1].week} апталар)</h3>
          <div class="weeks-list">
            ${weeks.map(w => `
              <div class="week-item ${this.selectedWeek === w.week ? 'active' : ''}" onclick="App.selectWeek(${w.week})">
                <div style="font-weight:700;color:#f8fafc;">${w.title}</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
                  Физ: ${w.phys.join(", ")} • Мат: ${w.math.join(", ")} • Тар: ${w.hist.join(", ")} • МС: ${w.msl.join(", ")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px;">${this.selectedWeek}-аптаның күнделікті жоспары (7 күн)</h3>
          <div class="days-list">
            ${days.map(d => {
              const isDone = !!(this.state.completedDays && this.state.completedDays[d.day]);
              const isCurrent = this.state.currentDay === d.day;
              return `
                <div class="day-row ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
                  <div>
                    <div style="font-weight:600;color:#f1f5f9;">
                      ${isDone ? '[Орындалды] ' : isCurrent ? '[Ағымдағы] ' : ''}${d.title}
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:3px;">
                      Тақырыптар:
                      <a href="javascript:void(0)" onclick="App.openTopicDirect('${d.topics.phys}')">${d.topics.phys}</a>,
                      <a href="javascript:void(0)" onclick="App.openTopicDirect('${d.topics.math}')">${d.topics.math}</a>,
                      <a href="javascript:void(0)" onclick="App.openTopicDirect('${d.topics.hist}')">${d.topics.hist}</a>,
                      <a href="javascript:void(0)" onclick="App.openTopicDirect('${d.topics.msl}')">${d.topics.msl}</a>
                    </div>
                  </div>
                  <button class="btn btn-xs ${isCurrent ? 'btn-primary' : 'btn-outline'}" onclick="App.jumpToDay(${d.day})">
                    ${isCurrent ? 'Белсенді күн' : 'Осы күнге өту'}
                  </button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  },

  selectMonth(m) {
    this.selectedMonth = m;
    const firstWeek = window.UBT_CURRICULUM.weeks.find(w => w.month === m);
    if (firstWeek) this.selectedWeek = firstWeek.week;
    this.renderPlanView();
  },

  selectWeek(w) {
    this.selectedWeek = w;
    this.renderPlanView();
  },

  jumpToDay(dayNum) {
    const dayObj = window.UBT_CURRICULUM.days[dayNum - 1];
    this.saveState({
      currentDay: dayNum,
      currentWeek: dayObj.week,
      currentMonth: dayObj.month
    });
    this.switchTab("dashboard");
  },

  // ==========================================================================
  // 3. ОҚУ БАҒДАРЛАМАСЫ ЖӘНЕ 108 ТАҚЫРЫП (CURRICULUM VIEW)
  // ==========================================================================
  renderCurriculumView() {
    const container = document.getElementById("curriculum-content");
    if (!container) return;

    const subjects = window.UBT_CURRICULUM.meta.subjects;
    const topicsList = window.UBT_CURRICULUM.topics[this.selectedSubject] || [];
    let activeTopic = topicsList.find(t => t.code === this.selectedTopicCode);
    if (!activeTopic) {
      activeTopic = topicsList[0];
      this.selectedTopicCode = activeTopic.code;
    }

    const topicQuestions = window.UBT_QUESTIONS.filter(q => q.topic === activeTopic.code || q.subject === this.selectedSubject);

    container.innerHTML = `
      <!-- Subject Switcher -->
      <div class="subject-tabs">
        ${subjects.map(s => `
          <button class="subj-tab ${this.selectedSubject === s.id ? 'active' : ''}" onclick="App.selectSubject('${s.id}')">
            <span>${s.name}</span>
            <span class="subj-badge">${s.maxPoints} балл • ${window.UBT_CURRICULUM.topics[s.id].length} модуль</span>
          </button>
        `).join("")}
      </div>

      <div class="curriculum-layout">
        <!-- Sidebar: Topics list -->
        <div class="topics-sidebar card">
          <h4 style="margin:0 0 10px;">Ресми 2026 тақырыптар тізімі</h4>
          <div class="topics-scroll">
            ${topicsList.map(t => `
              <div class="topic-nav-item ${t.code === activeTopic.code ? 'active' : ''}" onclick="App.selectTopic('${t.code}')">
                <div class="tni-meta">${t.code} • ${t.week}-апта • ${t.grade}</div>
                <div class="tni-title">${t.title}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Main Topic Content -->
        <div class="topic-detail card">
          <div class="td-header">
            <div>
              <span class="badge badge-blue">${activeTopic.section}</span>
              <span class="badge badge-amber">${activeTopic.importance}</span>
              <span class="badge badge-green">${activeTopic.week}-апта (${activeTopic.grade})</span>
              <h2 style="margin:8px 0 4px;">${activeTopic.title}</h2>
            </div>
          </div>

          <!-- 5 Sub-tabs inside Topic -->
          <div class="sub-tabs">
            <button class="sub-tab ${this.topicSubTab==='theory'?'active':''}" onclick="App.setTopicSubTab('theory')">
              1. Негізгі тұжырымдама мен формулалар
            </button>
            <button class="sub-tab ${this.topicSubTab==='books'?'active':''}" onclick="App.setTopicSubTab('books')">
              2. Оқулықтар мен сілтемелер (${activeTopic.books.length})
            </button>
            <button class="sub-tab ${this.topicSubTab==='examples'?'active':''}" onclick="App.setTopicSubTab('examples')">
              3. Типтік есептерді талдау
            </button>
            <button class="sub-tab ${this.topicSubTab==='quiz'?'active':''}" onclick="App.setTopicSubTab('quiz')">
              4. Тақырыптық тест
            </button>
            <button class="sub-tab ${this.topicSubTab==='quizizz'?'active':''}" onclick="App.setTopicSubTab('quizizz')">
              5. Quizizz тапсырмалары (${((window.UBT_QUIZIZZ && window.UBT_QUIZIZZ[this.selectedSubject]) || []).filter(q => q.topicCode === activeTopic.code || (activeTopic.section && q.category && q.category.toLowerCase().includes(activeTopic.section.toLowerCase()))).length})
            </button>
          </div>

          <div class="sub-tab-body">
            ${this.renderTopicSubTabContent(activeTopic, topicQuestions)}
          </div>
        </div>
      </div>
    `;
    this.renderMathInElement(container);
  },

  selectSubject(subjId) {
    this.selectedSubject = subjId;
    this.selectedTopicCode = window.UBT_CURRICULUM.topics[subjId][0].code;
    this.topicSubTab = "theory";
    this.renderCurriculumView();
  },

  selectTopic(code) {
    this.selectedTopicCode = code;
    this.renderCurriculumView();
  },

  setTopicSubTab(tab) {
    this.topicSubTab = tab;
    this.renderCurriculumView();
  },

  renderTopicSubTabContent(topic, topicQuestions) {
    if (this.topicSubTab === "theory") {
      return `
        <div class="easy-explanation-box">
          ${topic.easyExplanation}
        </div>
        <h4 style="margin:18px 0 10px;">Негізгі формулалар мен заңдылықтар:</h4>
        <div class="formulas-grid">
          ${topic.formulas.map(f => `<div class="formula-box">$$${f}$$</div>`).join("")}
        </div>
      `;
    }

    if (this.topicSubTab === "books") {
      return `
        <p style="color:#94a3b8;margin-top:0;">
          Төмендегі батырманы бассаң, жұмыс үстеліндегі (<code>C:\\Users\\user\\Desktop\\ҰБТ</code>) кітаптың <b>дәл осы тақырыпқа сәйкес беті</b> платформаның ішінде бірден ашылады:
        </p>
        <div class="book-links-grid">
          ${topic.books.map(b => `
            <div class="book-link-card">
              <div>
                <div style="font-weight:700;color:#f8fafc;font-size:15px;">${b.title}</div>
                <div style="color:#38bdf8;font-size:13px;margin-top:4px;">Оқитын беттер: <b>${b.pages}</b></div>
                <div style="color:#64748b;font-size:12px;margin-top:2px;">Файл: ${b.file}</div>
              </div>
              <button class="btn btn-primary" onclick="App.openPdfModal('${b.file.replace(/'/g, "\\'")}', ${b.startPage || 1}, '${b.title.replace(/'/g, "\\'")}')">
                ${b.startPage || 1}-беттен ашу
              </button>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (this.topicSubTab === "examples") {
      return `
        <h4 style="margin:0 0 12px;">Типтік ҰБТ есептерін қадамдап талдау:</h4>
        <div class="examples-list">
          ${topic.examples.map((ex, i) => `
            <div class="example-card">
              <div class="ex-prob"><b>${i + 1}-мысал:</b> ${ex.problem}</div>
              <div class="ex-sol"><b>Шешу жолы:</b> ${ex.solution}</div>
              <div class="ex-ans">Жауабы: <b>${ex.answer}</b></div>
            </div>
          `).join("")}
        </div>

        <h4 style="margin:20px 0 10px;">Өз бетінше орындайтын тапсырмалар:</h4>
        <div class="schedule-list">
          ${topic.homework.map((hw, i) => {
            const hwKey = `${topic.code}_hw_${i}`;
            const done = !!(this.state.homeworkChecks && this.state.homeworkChecks[hwKey]);
            return `
              <label class="schedule-item ${done ? 'done' : ''}">
                <input type="checkbox" ${done ? 'checked' : ''} onchange="App.toggleHomework('${hwKey}', this.checked)" />
                <span class="sch-title">${hw}</span>
              </label>
            `;
          }).join("")}
        </div>
      `;
    }

    if (this.topicSubTab === "quiz") {
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <h4 style="margin:0;">«${topic.title}» бойынша бекіту сынағы</h4>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Қателескен сұрақтар автоматты түрде «Қатемен жұмыс (1-3-7-21)» банкіне түседі.</p>
          </div>
          <button class="btn btn-accent" onclick="App.startTopicQuiz('${topic.code}')">
            Толық экранда тест тапсыру
          </button>
        </div>
        <div class="examples-list">
          ${topicQuestions.slice(0, 6).map((q, idx) => `
            <div class="example-card">
              <div style="font-size:12px;color:#38bdf8;margin-bottom:4px;">#${idx+1} • ${q.source || 'ҰБТ Базасы'} • ${q.points} балл</div>
              <div class="ex-prob">${q.question}</div>
              <details style="margin-top:8px;cursor:pointer;color:#94a3b8;">
                <summary>Жауабы мен талдауын көру</summary>
                <div style="margin-top:8px;padding:10px;background:#0f172a;border-radius:8px;color:#e2e8f0;">
                  ${q.explanation}
                </div>
              </details>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (this.topicSubTab === "quizizz") {
      const topicQuizizz = ((window.UBT_QUIZIZZ && window.UBT_QUIZIZZ[this.selectedSubject]) || []).filter(q => {
        return q.topicCode === topic.code || (topic.section && q.category && q.category.toLowerCase().includes(topic.section.toLowerCase()));
      });

      if (topicQuizizz.length === 0) {
        return `
          <div style="padding:20px;text-align:center;color:#94a3b8;">
            <p>Бұл нақты тақырыпқа арналған жеке Quizizz тесті табылмады.</p>
            <button class="btn btn-primary btn-sm" onclick="App.switchTab('quizizz')">
              Барлық 238 Quizizz тесттерін қарау
            </button>
          </div>
        `;
      }

      const completedMap = this.state.completedQuizizz || {};

      return `
        <div style="margin-bottom:14px;">
          <h4 style="margin:0 0 6px;">«${topic.title}» бойынша Quizizz жаттығулары (${topicQuizizz.length}):</h4>
          <p style="color:#94a3b8;font-size:13px;margin:0;">Сілтемені басып, Quizizz-те ойнап, біліміңізді тексеріңіз. Орындаған соң чекбоксты белгілеңіз:</p>
        </div>
        <div class="book-links-grid">
          ${topicQuizizz.map(qz => {
            const isDone = !!completedMap[qz.id];
            return `
              <div class="book-link-card" style="border-left: 4px solid ${isDone ? '#34d399' : '#818cf8'};">
                <div>
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span class="badge badge-blue">${qz.grade || qz.category}</span>
                    <span class="badge badge-green">${qz.category}</span>
                  </div>
                  <div style="font-weight:700;color:#f8fafc;font-size:15px;">${qz.title}</div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;user-select:none;">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onchange="App.toggleQuizizzComplete('${qz.id}', this.checked)" />
                    <span style="color:${isDone ? '#34d399' : '#94a3b8'};font-weight:600;">${isDone ? 'Орындалды' : 'Белгілеу'}</span>
                  </label>
                  <a href="${qz.url}" target="_blank" class="btn btn-sm btn-primary" style="text-decoration:none;">
                    Quizizz ашу
                  </a>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }
  },

  toggleHomework(hwKey, checked) {
    const homeworkChecks = { ...(this.state.homeworkChecks || {}), [hwKey]: checked };
    this.saveState({ homeworkChecks });
    this.renderCurriculumView();
  },

  // ==========================================================================
  // 4. ТЕСТ ОРТАЛЫҒЫ & 130 БАЛДЫҚ ҰБТ СИМУЛЯТОРЫ & ҚАТЕМЕН ЖҰМЫС
  // ==========================================================================
  renderTestCenter() {
    const container = document.getElementById("tests-content");
    if (!container) return;

    if (this.activeExam) {
      this.renderActiveExam(container);
      return;
    }

    const errors = this.state.errorBank || [];
    const history = (this.state.testHistory || []).slice().reverse();

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="card test-mode-card">
          <div class="badge badge-blue">КҮНДЕЛІКТІ ПРАКТИКА</div>
          <h3>Күнделікті экспресс-тест (15 сұрақ)</h3>
          <p>Бүгінгі оқыған Физика, Математика, Тарих және МС тақырыптары бойынша жылдам тексеру (20 минут).</p>
          <button class="btn btn-primary" onclick="App.startDailyQuiz(${this.state.currentDay || 1})">Экспресс-тестті бастау</button>
        </div>

        <div class="card test-mode-card">
          <div class="badge badge-amber">ТОЛЫҚ ЕМТИХАН (130 БАЛЛ)</div>
          <h3>Ресми ҰБТ сынамасы (4 пән, 130 балл)</h3>
          <p>Ресми Testcenter форматы: Бір жауапты (1 б), Контекст (1 б), Сәйкестендіру (2 б) және Көп жауапты (2 б). Таймер: 240 мин.</p>
          <button class="btn btn-accent" onclick="App.startFullUbtSimulation()">130 балдық сынаманы бастау</button>
        </div>

        <div class="card test-mode-card">
          <div class="badge badge-red">SPACED REPETITION (1-3-7-21)</div>
          <h3>Қатемен жұмыс банкі (${errors.length} сұрақ)</h3>
          <p>Бұрын қателескен сұрақтарыңды қайта тапсырып, 100% меңгергенше жаттық.</p>
          <button class="btn btn-outline" ${errors.length === 0 ? 'disabled' : ''} onclick="App.startErrorBankQuiz()">
            Қателерді қайта талдау (${errors.length})
          </button>
        </div>
      </div>

      <div class="dash-two-col" style="margin-top:16px;">
        <div class="card">
          <h3 style="margin:0 0 12px;">Сынамалар нәтижесі және үлгерім динамикасы</h3>
          <div class="days-list">
            ${history.map(h => `
              <div class="day-row">
                <div>
                  <div style="font-weight:700;color:#f8fafc;">${h.title}</div>
                  <div style="font-size:12px;color:#94a3b8;">Күні: ${h.date} • Түрі: ${h.type}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:18px;font-weight:800;color:#38bdf8;">${h.score} / ${h.maxScore} балл</div>
                  <div style="font-size:11px;color:#94a3b8;">${Math.round((h.score / h.maxScore) * 100)}% дәлдік</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px;">Қателер банкіндегі сұрақтар (${errors.length})</h3>
          ${errors.length === 0 ? `
            <div style="padding:24px;text-align:center;color:#34d399;background:rgba(52,211,153,0.08);border-radius:10px;">
              Қателер банкі таза. Барлық сұрақтар меңгерілген.
            </div>
          ` : `
            <div class="days-list">
              ${errors.map(qId => {
                const q = window.UBT_QUESTIONS.find(x => x.id === qId);
                if (!q) return "";
                return `
                  <div class="example-card">
                    <div style="display:flex;justify-content:space-between;">
                      <span class="badge badge-red">${q.topic}</span>
                      <button class="btn btn-xs btn-outline" onclick="App.removeError('${q.id}')">Меңгерілді (Өшіру)</button>
                    </div>
                    <div style="margin-top:6px;font-weight:600;">${q.question}</div>
                    <div style="margin-top:6px;font-size:13px;color:#34d399;">Талдау: ${q.explanation}</div>
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>
      </div>
    `;
    this.renderMathInElement(container);
  },

  startDailyQuiz(dayNum) {
    const dayObj = window.UBT_CURRICULUM.days[(dayNum || 1) - 1];
    const codes = Object.values(dayObj.topics);
    let pool = window.UBT_QUESTIONS.filter(q => codes.includes(q.topic));
    if (pool.length < 8) {
      pool = window.UBT_QUESTIONS.slice(0, 12);
    }
    this.launchExam(`Күнделікті Блиц-Тест (Күн #${dayNum})`, "daily", pool);
  },

  startTopicQuiz(topicCode) {
    let pool = window.UBT_QUESTIONS.filter(q => q.topic === topicCode);
    if (pool.length < 4) {
      const subj = topicCode.split("-")[0].toLowerCase();
      pool = window.UBT_QUESTIONS.filter(q => q.subject === subj);
    }
    this.launchExam(`${topicCode} Тақырыптық Тесті`, "topic", pool);
  },

  startErrorBankQuiz() {
    const errIds = this.state.errorBank || [];
    const pool = window.UBT_QUESTIONS.filter(q => errIds.includes(q.id));
    if (pool.length === 0) return;
    this.launchExam("Қатемен жұмыс (1-3-7-21)", "error-review", pool);
  },

  startFullUbtSimulation() {
    this.launchExam("Толық ҰБТ сынамасы (4 пән: Физ + Мат + Тарих + МС)", "ubt-sim", window.UBT_QUESTIONS);
  },

  launchExam(title, type, questions) {
    this.activeExam = {
      title,
      type,
      questions,
      answers: {},
      submitted: false,
      result: null
    };
    this.switchTab("tests");
  },

  renderActiveExam(container) {
    const ex = this.activeExam;
    const totalMaxPoints = ex.questions.reduce((acc, q) => acc + (q.points || 1), 0);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <span class="badge badge-amber">ТЕСТ РЕЖИМІ • ${ex.questions.length} ТАПСЫРМА • МАКСИМУМ ${totalMaxPoints} БАЛЛ</span>
            <h2 style="margin:6px 0 0;">${ex.title}</h2>
          </div>
          <button class="btn btn-outline" onclick="App.closeExam()">Тесттен шығу</button>
        </div>

        ${ex.submitted ? `
          <div class="exam-result-banner">
            <h3>Сынақ нәтижесі: ${ex.result.earned} / ${ex.result.max} балл (${Math.round((ex.result.earned/ex.result.max)*100)}%)</h3>
            <p>Экранды төмен айналдырып, әр есептің толық шығарылу жолын (талдау мен түсіндірмесін) қарап шық. Қате кеткен сұрақтар автоматты түрде «Қатемен жұмыс» банкіне сақталды!</p>
          </div>
        ` : ""}

        <div class="exam-questions-list">
          ${ex.questions.map((q, idx) => this.renderExamQuestionCard(q, idx, ex)).join("")}
        </div>

        ${!ex.submitted ? `
          <div style="margin-top:20px;display:flex;justify-content:flex-end;">
            <button class="btn btn-accent btn-lg" onclick="App.submitExam()">
              Тестті аяқтау және баллды есептеу
            </button>
          </div>
        ` : ""}
      </div>
    `;
    this.renderMathInElement(container);
  },

  renderExamQuestionCard(q, idx, ex) {
    const userAns = ex.answers[q.id];
    let statusBadge = "";
    if (ex.submitted) {
      const pts = this.scoreQuestion(q, userAns);
      statusBadge = pts === q.points
        ? `<span class="badge badge-green">Дұрыс (+${pts}/${q.points} балл)</span>`
        : pts > 0
          ? `<span class="badge badge-amber">◐ Жартылай (+${pts}/${q.points} балл)</span>`
          : `<span class="badge badge-red">Қате (0/${q.points} балл)</span>`;
    }

    let bodyHtml = "";
    if (q.type === "single" || q.type === "context") {
      bodyHtml = `
        ${q.contextText ? `<div class="context-box">${q.contextText}</div>` : ""}
        <div class="q-options">
          ${q.options.map((opt, oIdx) => {
            const selected = Array.isArray(userAns) && userAns.includes(oIdx);
            const isCorrect = ex.submitted && q.correct.includes(oIdx);
            const isWrong = ex.submitted && selected && !q.correct.includes(oIdx);
            return `
              <label class="q-opt ${selected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}">
                <input type="radio" name="q_${q.id}" ${ex.submitted ? 'disabled' : ''} ${selected ? 'checked' : ''}
                  onchange="App.setSingleAnswer('${q.id}', ${oIdx})" />
                <span>${opt}</span>
              </label>
            `;
          }).join("")}
        </div>
      `;
    } else if (q.type === "multiple") {
      bodyHtml = `
        <div style="font-size:12px;color:#fbbf24;margin-bottom:8px;">Көп жауапты тапсырма (3 дұрыс жауапқа дейін таңдаңыз — 2 балл):</div>
        <div class="q-options">
          ${q.options.map((opt, oIdx) => {
            const selected = Array.isArray(userAns) && userAns.includes(oIdx);
            const isCorrect = ex.submitted && q.correct.includes(oIdx);
            const isWrong = ex.submitted && selected && !q.correct.includes(oIdx);
            return `
              <label class="q-opt ${selected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}">
                <input type="checkbox" ${ex.submitted ? 'disabled' : ''} ${selected ? 'checked' : ''}
                  onchange="App.toggleMultiAnswer('${q.id}', ${oIdx})" />
                <span>${opt}</span>
              </label>
            `;
          }).join("")}
        </div>
      `;
    } else if (q.type === "matching") {
      const pairAns = Array.isArray(userAns) ? userAns : [-1, -1];
      bodyHtml = `
        <div style="font-size:12px;color:#38bdf8;margin-bottom:8px;">Сәйкестендіру тапсырмасы (Әр жұпқа сәйкес жауапты таңдаңыз — 2 балл):</div>
        <div class="matching-box">
          ${q.leftItems.map((leftText, lIdx) => `
            <div class="match-row">
              <div class="match-left">${leftText}</div>
              <select class="match-select" ${ex.submitted ? 'disabled' : ''} onchange="App.setMatchAnswer('${q.id}', ${lIdx}, this.value)">
                <option value="-1">— Таңдаңыз —</option>
                ${q.rightOptions.map((ro, rIdx) => `
                  <option value="${rIdx}" ${pairAns[lIdx] === rIdx ? 'selected' : ''}>${ro}</option>
                `).join("")}
              </select>
            </div>
          `).join("")}
        </div>
      `;
    }

    return `
      <div class="exam-q-card">
        <div class="eq-top">
          <div>
            <span class="badge badge-blue">#${idx + 1} • ${q.topic}</span>
            <span style="font-size:12px;color:#94a3b8;margin-left:6px;">${q.source || ''} (${q.points} балл)</span>
          </div>
          ${statusBadge}
        </div>
        <div class="eq-question">${q.question}</div>
        ${bodyHtml}
        ${ex.submitted ? `
          <div class="eq-explanation">
            <b>Талдау және түсіндірме:</b> ${q.explanation}
          </div>
        ` : ""}
      </div>
    `;
  },

  setSingleAnswer(qId, optIdx) {
    if (!this.activeExam || this.activeExam.submitted) return;
    this.activeExam.answers[qId] = [optIdx];
  },

  toggleMultiAnswer(qId, optIdx) {
    if (!this.activeExam || this.activeExam.submitted) return;
    const cur = new Set(this.activeExam.answers[qId] || []);
    if (cur.has(optIdx)) cur.delete(optIdx);
    else if (cur.size < 3) cur.add(optIdx);
    this.activeExam.answers[qId] = Array.from(cur);
  },

  setMatchAnswer(qId, leftIdx, rightVal) {
    if (!this.activeExam || this.activeExam.submitted) return;
    const cur = Array.isArray(this.activeExam.answers[qId]) ? [...this.activeExam.answers[qId]] : [-1, -1];
    cur[leftIdx] = parseInt(rightVal, 10);
    this.activeExam.answers[qId] = cur;
  },

  // Official Testcenter scoring algorithm (1pt & 2pt rules)
  scoreQuestion(q, userAns) {
    if (!userAns) return 0;
    if (q.type === "single" || q.type === "context") {
      return userAns[0] === q.correct[0] ? 1 : 0;
    }
    if (q.type === "matching") {
      let matches = 0;
      for (let i = 0; i < q.correctPairs.length; i++) {
        if (userAns[i] === q.correctPairs[i]) matches++;
      }
      return matches; // 2 pairs = 2 pts, 1 pair = 1 pt, 0 = 0 pt
    }
    if (q.type === "multiple") {
      const correctSet = new Set(q.correct);
      const userSet = new Set(userAns);
      let mistakes = 0;
      for (const c of correctSet) {
        if (!userSet.has(c)) mistakes++;
      }
      for (const u of userSet) {
        if (!correctSet.has(u)) mistakes++;
      }
      if (mistakes === 0) return 2;
      if (mistakes === 1) return 1;
      return 0;
    }
    return 0;
  },

  submitExam() {
    if (!this.activeExam || this.activeExam.submitted) return;
    let earned = 0;
    let max = 0;
    const errorSet = new Set(this.state.errorBank || []);

    for (const q of this.activeExam.questions) {
      const pts = this.scoreQuestion(q, this.activeExam.answers[q.id]);
      earned += pts;
      max += q.points || 1;
      if (pts < (q.points || 1)) {
        errorSet.add(q.id);
      } else if (this.activeExam.type === "error-review") {
        errorSet.delete(q.id);
      }
    }

    this.activeExam.submitted = true;
    this.activeExam.result = { earned, max };

    const scaled130 = Math.round((earned / max) * 130);
    const historyItem = {
      id: "test-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: this.activeExam.type,
      title: this.activeExam.title,
      score: this.activeExam.type === "ubt-sim" ? scaled130 : earned,
      maxScore: this.activeExam.type === "ubt-sim" ? 130 : max,
      breakdown: {
        phys: Math.round((earned / max) * 50),
        math: Math.round((earned / max) * 50),
        hist: Math.round((earned / max) * 20),
        msl: Math.round((earned / max) * 10)
      }
    };

    const testHistory = [...(this.state.testHistory || []), historyItem];
    this.saveState({
      errorBank: Array.from(errorSet),
      testHistory
    });

    this.renderTestCenter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  closeExam() {
    this.activeExam = null;
    this.renderTestCenter();
  },

  removeError(qId) {
    const errorBank = (this.state.errorBank || []).filter(id => id !== qId);
    this.saveState({ errorBank });
    this.renderTestCenter();
  },

  // ==========================================================================
  // 5. КІТАПХАНА & PDF РИДЕР (LIBRARY VIEW)
  // ==========================================================================
  renderLibrary() {
    const container = document.getElementById("library-content");
    if (!container) return;

    const validBooks = this.books.filter(b => !b.isEmpty);
    const emptyBooks = this.books.filter(b => b.isEmpty);

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div class="card-header">
          <div>
            <h3 style="margin:0;">Оқулықтар мен әдебиеттер қоры (<code>C:\\Users\\user\\Desktop\\ҰБТ</code>)</h3>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">
              Табылған PDF кітаптар: <b>${this.books.length}</b> (Толық жұмыс істейтін: <b>${validBooks.length}</b>, 0-байт бос файлдар: <b>${emptyBooks.length}</b>)
            </p>
          </div>
        </div>

        <div class="library-grid">
          ${validBooks.map(b => `
            <div class="lib-card">
              <div>
                <span class="badge badge-blue">${b.folder}</span>
                <div class="lib-title">${b.name}</div>
                <div class="lib-meta">Көлемі: ${b.sizeMB} МБ</div>
              </div>
              <div style="display:flex;gap:6px;margin-top:10px;">
                <button class="btn btn-sm btn-primary" onclick="App.openPdfModal('${b.relPath.replace(/'/g, "\\'")}', 1, '${b.name.replace(/'/g, "\\'")}')">
                  Оқулықты ашу
                </button>
              </div>
            </div>
          `).join("")}
        </div>

        ${emptyBooks.length > 0 ? `
          <div style="margin-top:20px;padding:14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;">
            <h4 style="margin:0 0 6px;color:#fbbf24;">Ескерту: Бос файлдар (бос) PDF файлдар (${emptyBooks.length}):</h4>
            <p style="margin:0 0 8px;font-size:13px;color:#cbd5e1;">
              Төмендегі файлдар компьютерге жүктелгенде 0 КБ болып бос сақталған. Сондықтан біз Қазақстан тарихының 7–10 сынып оқулықтарындағы <b>барлық 55 тақырыптың теориясын, даталарын, хандарын және мәдениетін</b> платформаның «Оқу бағдарламасы → Қазақстан тарихы» бөліміне толық енгізіп қойдық!
            </p>
            <div style="font-size:12px;color:#94a3b8;">
              ${emptyBooks.map(eb => `<code>${eb.relPath} (0 КБ)</code>`).join(" • ")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  },

  openPdfModal(relPath, page = 1, title = "PDF Кітап") {
    const modal = document.getElementById("pdf-modal");
    const iframe = document.getElementById("pdf-iframe");
    const titleEl = document.getElementById("pdf-modal-title");
    const pageInput = document.getElementById("pdf-page-input");
    const extLink = document.getElementById("pdf-external-link");
    if (!modal || !iframe) return;

    this.currentPdfFile = relPath;
    if (titleEl) titleEl.textContent = `${title} (${relPath})`;
    if (pageInput) pageInput.value = page;
    const pdfUrl = `/api/pdf?file=${encodeURIComponent(relPath)}#page=${page}`;
    iframe.src = pdfUrl;
    if (extLink) extLink.href = pdfUrl;
    modal.classList.add("open");
  },

  jumpPdfPage() {
    const pageInput = document.getElementById("pdf-page-input");
    const iframe = document.getElementById("pdf-iframe");
    const extLink = document.getElementById("pdf-external-link");
    if (!this.currentPdfFile || !pageInput || !iframe) return;
    const p = parseInt(pageInput.value, 10) || 1;
    const pdfUrl = `/api/pdf?file=${encodeURIComponent(this.currentPdfFile)}#page=${p}`;
    if (extLink) extLink.href = pdfUrl;
    // Reset src briefly to force PDF viewer page navigation
    iframe.src = "about:blank";
    setTimeout(() => {
      iframe.src = pdfUrl;
    }, 60);
  },

  closePdfModal() {
    const modal = document.getElementById("pdf-modal");
    const iframe = document.getElementById("pdf-iframe");
    if (modal) modal.classList.remove("open");
    if (iframe) iframe.src = "about:blank";
  },

  // ==========================================================================
  // 5B. МУЛЬТИ-ГАДЖЕТ ЖӘНЕ ОНЛАЙН САЙТ МОДАЛІ (ТЕЛЕФОН / ПЛАНШЕТ / НОУТБУК)
  // ==========================================================================
  async openDeviceModal() {
    const modal = document.getElementById("device-modal");
    if (!modal) return;
    modal.classList.add("open");
    await this.refreshNetworkInfo();
  },

  closeDeviceModal() {
    const modal = document.getElementById("device-modal");
    if (modal) modal.classList.remove("open");
  },

  async refreshNetworkInfo() {
    const body = document.getElementById("device-modal-body");
    if (!body) return;

    let net = {
      lanIp: "10.181.183.37",
      lanUrl: "http://10.181.183.37:3140",
      localUrl: window.location.origin,
      publicUrl: null,
      tunnelStatus: "connecting"
    };

    try {
      const res = await fetch("/api/network");
      if (res.ok) net = await res.json();
    } catch (e) {}

    const primaryUrl = net.publicUrl || net.lanUrl || window.location.origin;
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=0d1322&color=38bdf8&data=${encodeURIComponent(primaryUrl)}`;

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;background:#0d1322;border:1px solid #1e293b;padding:16px;border-radius:12px;margin-bottom:14px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span class="badge ${net.publicUrl ? 'badge-green' : 'badge-amber'}">
              ${net.publicUrl ? 'ОНЛАЙН РЕЖИМ БЕЛСЕНДІ' : 'ҚОСЫЛУ ЖҮРГІЗІЛУДЕ...'}
            </span>
            <span style="font-size:12px;color:#94a3b8;">4G / 5G / Кез келген Wi-Fi</span>
          </div>
          <div style="font-weight:800;font-size:15px;color:#38bdf8;word-break:break-all;margin-bottom:8px;">
            ${net.publicUrl ? `<a href="${net.publicUrl}" target="_blank" style="color:#38bdf8;text-decoration:underline;">${net.publicUrl}</a>` : 'Генерациялануда (3–5 сек)... «Жаңарту» батырмасын бас'}
          </div>
          <p style="font-size:12.5px;color:#cbd5e1;margin:0 0 10px;">
            Осы сілтеме арқылы <b>телефоннан (iPhone/Android), планшеттен немесе басқа ноутбуктен</b> кез келген жерден (тіпті мобильді интернетпен 4G/5G) кіре аласың! Барлық прогресің, тесттерің және PDF кітаптарың тікелей синхрондалады.
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${net.publicUrl ? `
              <button class="btn btn-xs btn-primary" onclick="App.copyText('${net.publicUrl}')">Онлайн сілтемені көшіру</button>
            ` : ''}
            <button class="btn btn-xs btn-outline" onclick="App.refreshNetworkInfo()">Мәртебені жаңарту</button>
            <button class="btn btn-xs btn-outline" onclick="App.reconnectTunnel()">Жаңа сілтеме генерациялау</button>
          </div>
        </div>
        <div style="text-align:center;">
          <img src="${qrApi}" alt="QR Code" style="width:140px;height:140px;border-radius:10px;border:2px solid #38bdf8;padding:4px;background:#0d1322;" />
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Телефон камерасымен сканерле</div>
        </div>
      </div>

      <div style="background:#0d1322;border:1px solid #1e293b;padding:14px 16px;border-radius:12px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <span class="badge badge-blue">ЖЕРГІЛІКТІ WI-FI БАЙЛАНЫСЫ</span>
            <div style="font-weight:800;font-size:15px;color:#f8fafc;margin-top:6px;">
              <a href="${net.lanUrl}" target="_blank" style="color:#34d399;">${net.lanUrl}</a>
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-top:2px;">
              Егер телефоның мен ноутбугің бір Wi-Fi-ға (немесе телефоннан таратылған Hotspot-қа) қосылып тұрса, осы сілтеме интернетсіз де найзағайдай жылдам ашылады!
            </div>
          </div>
          <button class="btn btn-xs btn-accent" onclick="App.copyText('${net.lanUrl}')">Wi-Fi сілтемесін көшіру</button>
        </div>
      </div>

      <div style="background:rgba(56,189,248,0.07);border-left:4px solid #38bdf8;padding:12px 14px;border-radius:8px;font-size:13px;color:#cbd5e1;">
        <b style="color:#f8fafc;">Смартфон экранына қосымша ретінде сақтау:</b>
        <ul style="margin:6px 0 0;padding-left:18px;">
          <li><b>iPhone (Safari):</b> Жоғарыдағы сілтемені аш → төмендегі <b>«Бөлісу» (Поделиться)</b> батырмасын бас → <b>«Басты экранға қосу» (На экран «Домой»)</b> таңда.</li>
          <li><b>Android (Chrome):</b> Сілтемені аш → оң жақ жоғарыдағы <b>⋮ (Үш нүкте)</b> → <b>«Қосымшаны орнату» (Установить приложение / Добавить на гл. экран)</b>.</li>
        </ul>
      </div>
    `;
  },

  async reconnectTunnel() {
    try {
      await fetch("/api/network", { method: "POST" });
      setTimeout(() => this.refreshNetworkInfo(), 3500);
    } catch (e) {}
  },

  copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert("Сілтеме көшірілді: " + text);
    } else {
      prompt("Сілтемені көшіріп алыңыз:", text);
    }
  },

  // ==========================================================================
  // 6. БАЗА & TELEGRAM / TESTCENTER ПАРСЕРІ (t.me/hanahaki_laoshi/8)
  // ==========================================================================
  renderParserView() {
    const container = document.getElementById("parser-content");
    if (!container) return;

    const customList = this.state.customQuestions || [];

    container.innerHTML = `
      <div class="dash-two-col">
        <div class="card">
          <span class="badge badge-blue">АВТО-ПАРСЕР • TELEGRAM & TESTCENTER</span>
          <h3 style="margin:8px 0;">Жаңа тапсырмалар мен сұрақтарды базаға енгізу</h3>
          <p style="color:#94a3b8;font-size:13px;">
            <b>Telegram</b> каналынан (<a href="https://t.me/hanahaki_laoshi/8" target="_blank" style="color:#38bdf8;">t.me/hanahaki_laoshi/8</a>) немесе Testcenter нұсқаларынан көшіріп алған есептерді төменгі өріске қой. Парсер оларды автоматты түрде интерактивті тестке айналдырып, базаңа сақтайды!
          </p>

          <div class="form-group">
            <label>Пәнді және Тақырыпты таңда:</label>
            <div style="display:flex;gap:10px;">
              <select id="parser-subj" class="input-control">
                <option value="phys">Физика</option>
                <option value="math">Математика</option>
                <option value="hist">Қазақстан тарихы</option>
                <option value="msl">Математикалық сауаттылық</option>
              </select>
              <input id="parser-topic" class="input-control" value="PHYS-01" placeholder="Тақырып коды (мысалы: PHYS-01)" />
            </div>
          </div>

          <div class="form-group">
            <label>Сұрақ мәтіні мен нұсқалары (Бірінші нұсқаны немесе * белгісі бар нұсқаны дұрыс жауап ретінде таниды):</label>
            <textarea id="parser-raw" rows="8" class="input-control" placeholder="Мысалы:
Массасы 4 кг денеге 12 Н күш әсер етеді. Дененің үдеуін табыңыз.
*A) 3 м/с²
B) 48 м/с²
C) 0.33 м/с²
D) 8 м/с²
Талдау: Ньютонның ІІ заңы бойынша a = F/m = 12/4 = 3 м/с²."></textarea>
          </div>

          <button class="btn btn-primary" onclick="App.parseAndSaveQuestion()">
            Сұрақты өңдеп, базаға сақтау
          </button>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px;">Қолданушы қосқан сұрақтар қоры (${customList.length})</h3>
          ${customList.length === 0 ? `
            <p style="color:#94a3b8;font-size:13px;">Әзірге қолмен қосылған сұрақтар жоқ. Сол жақтағы форма арқылы Telegram-дағы кез келген слив сұрақты 5 секундта қоса аласың!</p>
          ` : `
            <div class="days-list">
              ${customList.map(cq => `
                <div class="example-card">
                  <div style="font-size:12px;color:#38bdf8;">${cq.topic} • ${cq.source}</div>
                  <div style="font-weight:600;margin-top:4px;">${cq.question}</div>
                  <div style="font-size:12px;color:#34d399;margin-top:4px;">Дұрыс жауабы: ${cq.options[cq.correct[0]]}</div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    `;
  },

  parseAndSaveQuestion() {
    const subj = document.getElementById("parser-subj").value;
    const topic = document.getElementById("parser-topic").value.trim() || "PHYS-01";
    const raw = document.getElementById("parser-raw").value.trim();
    if (!raw) {
      alert("Сұрақ мәтінін енгізіңіз!");
      return;
    }

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let questionText = "";
    const options = [];
    let correctIdx = 0;
    let explanation = "Өздігінен қосылған ҰБТ/Telegram слив есебі.";

    for (const line of lines) {
      if (/^(Талдау|Шешуі|Түсіндірме)\s*:/i.test(line)) {
        explanation = line.replace(/^(Талдау|Шешуі|Түсіндірме)\s*:\s*/i, "");
      } else if (/^(\*)?[A-FА-Е1-4][\)\.]\s+/i.test(line)) {
        const isStar = line.startsWith("*");
        const cleanOpt = line.replace(/^(\*)?[A-FА-Е1-4][\)\.]\s+/i, "");
        if (isStar) correctIdx = options.length;
        options.push(cleanOpt);
      } else if (options.length === 0) {
        questionText += (questionText ? " " : "") + line;
      }
    }

    if (options.length < 2) {
      alert("Кемінде 2 жауап нұсқасын A) ... B) ... форматында жазыңыз!");
      return;
    }

    const newQ = {
      id: "custom-" + Date.now(),
      subject: subj,
      topic,
      type: "single",
      points: 1,
      source: "Telegram / Жеке слив",
      question: questionText,
      options,
      correct: [correctIdx],
      explanation
    };

    window.UBT_QUESTIONS.push(newQ);
    const customQuestions = [...(this.state.customQuestions || []), newQ];
    this.saveState({ customQuestions });
    document.getElementById("parser-raw").value = "";
    this.renderParserView();
    alert("Сұрақ базаға сәтті қосылды.");
  },

  // ==========================================================================
  // 7. ИНТЕРАКТИВТІ QUIZIZZ ОНЛАЙН БАЗАСЫ (238 ТЕСТ: 5-11 ТАРИХ + ФИЗМАТ)
  // ==========================================================================
  renderQuizizzView() {
    const container = document.getElementById("quizizz-content");
    if (!container) return;

    const data = window.UBT_QUIZIZZ || { hist: [], phys: [], math: [], msl: [] };
    const currentSubj = this.quizizzSubj || 'hist';
    const list = data[currentSubj] || [];

    // Distinct categories
    const categories = ['all', ...Array.from(new Set(list.map(q => q.category)))];

    // Filter by category and search
    const filtered = list.filter(q => {
      const matchCat = (this.quizizzCategory === 'all' || !this.quizizzCategory) ? true : q.category === this.quizizzCategory;
      const matchSearch = (!this.quizizzSearch) ? true : (
        q.title.toLowerCase().includes(this.quizizzSearch.toLowerCase()) ||
        (q.grade && q.grade.toLowerCase().includes(this.quizizzSearch.toLowerCase())) ||
        (q.category && q.category.toLowerCase().includes(this.quizizzSearch.toLowerCase()))
      );
      return matchCat && matchSearch;
    });

    const completedMap = this.state.completedQuizizz || {};
    const totalCompletedInSubj = list.filter(q => completedMap[q.id]).length;
    const grandTotal = (data.hist.length + data.phys.length + data.math.length + data.msl.length);
    const grandCompleted = Object.keys(completedMap).filter(k => completedMap[k]).length;

    container.innerHTML = `
      <!-- Top banner with stats -->
      <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg, rgba(56,189,248,0.12), rgba(129,140,248,0.12));border-color:rgba(56,189,248,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <span class="badge badge-blue">ИНТЕРАКТИВТІ QUIZIZZ БАЗАСЫ (238 ТЕСТ)</span>
            <h2 style="margin:6px 0 4px;">ҰБТ Quizizz жаттығулары (5–11 сынып + ФизМат)</h2>
            <p style="color:#cbd5e1;font-size:13.5px;margin:0;">
              Word құжаттағы <b>159 тарих куизизі (5–11 сынып)</b> + интернеттен жинақталған <b>Физика (34), Математика (26), Мат. сауаттылық (19)</b> куизиздері! Тікелей ойнап, біліміңді пысықта.
            </p>
          </div>
          <div style="background:#0d1322;padding:12px 18px;border-radius:12px;border:1px solid #1e293b;text-align:center;">
            <div style="font-size:26px;font-weight:900;color:#38bdf8;">${grandCompleted} / ${grandTotal}</div>
            <div style="font-size:12px;color:#94a3b8;">Орындалған куизиздер</div>
          </div>
        </div>
      </div>

      <!-- Subject Tabs -->
      <div class="subject-tabs">
        <button class="subj-tab ${currentSubj === 'hist' ? 'active' : ''}" onclick="App.selectQuizizzSubj('hist')">
          <span>Қазақстан тарихы</span>
          <span class="subj-badge">${data.hist.length} тест (5-11 сынып)</span>
        </button>
        <button class="subj-tab ${currentSubj === 'phys' ? 'active' : ''}" onclick="App.selectQuizizzSubj('phys')">
          <span>Физика</span>
          <span class="subj-badge">${data.phys.length} тест</span>
        </button>
        <button class="subj-tab ${currentSubj === 'math' ? 'active' : ''}" onclick="App.selectQuizizzSubj('math')">
          <span>Математика</span>
          <span class="subj-badge">${data.math.length} тест</span>
        </button>
        <button class="subj-tab ${currentSubj === 'msl' ? 'active' : ''}" onclick="App.selectQuizizzSubj('msl')">
          <span>Математикалық сауаттылық</span>
          <span class="subj-badge">${data.msl.length} тест</span>
        </button>
      </div>

      <!-- Controls: Category Pills & Search Input -->
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${categories.map(c => `
              <button class="btn btn-xs ${this.quizizzCategory === c || (!this.quizizzCategory && c === 'all') ? 'btn-primary' : 'btn-outline'}" onclick="App.selectQuizizzCategory('${c}')">
                ${c === 'all' ? 'Барлығы (' + list.length + ')' : c}
              </button>
            `).join("")}
          </div>
          <div style="min-width:260px;">
            <input type="text" class="input-control" placeholder="Тақырып немесе бөлім атауын іздеу..." value="${this.quizizzSearch || ''}" oninput="App.onQuizizzSearch(this.value)" />
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-size:13px;color:#94a3b8;">Табылғаны: <b>${filtered.length} тест</b> • Орындалғаны: <b>${totalCompletedInSubj}/${list.length}</b></span>
        </div>

        <!-- Quizzes Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:12px;">
          ${filtered.length === 0 ? `
            <div style="grid-column:1/-1;text-align:center;padding:30px;color:#94a3b8;">
              Іздеу сұранысы бойынша тест табылмады. Басқа сөз жазып көріңіз немесе категорияны өзгертіңіз.
            </div>
          ` : filtered.map(q => {
            const isDone = !!completedMap[q.id];
            return `
              <div class="example-card" style="display:flex;flex-direction:column;justify-content:space-between;border-left:4px solid ${isDone ? '#34d399' : '#38bdf8'};background:#0d1322;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span class="badge badge-blue">${q.grade || q.category}</span>
                    <span style="font-size:11.5px;color:#94a3b8;">${q.category}</span>
                  </div>
                  <div style="font-weight:700;font-size:14.5px;color:#f8fafc;margin-bottom:8px;line-height:1.4;">
                    ${q.title}
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid #1e293b;">
                  <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;user-select:none;">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onchange="App.toggleQuizizzComplete('${q.id}', this.checked)" />
                    <span style="color:${isDone ? '#34d399' : '#94a3b8'};font-weight:600;">${isDone ? 'Орындалды' : 'Орындау'}</span>
                  </label>
                  <a href="${q.url}" target="_blank" class="btn btn-xs btn-primary" style="text-decoration:none;display:flex;align-items:center;gap:4px;">
                    Quizizz ашу
                  </a>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  selectQuizizzSubj(s) {
    this.quizizzSubj = s;
    this.quizizzCategory = 'all';
    this.renderQuizizzView();
  },

  selectQuizizzCategory(c) {
    this.quizizzCategory = c;
    this.renderQuizizzView();
  },

  onQuizizzSearch(val) {
    this.quizizzSearch = val;
    this.renderQuizizzView();
  },

  toggleQuizizzComplete(id, checked) {
    const completedQuizizz = { ...(this.state.completedQuizizz || {}) };
    if (checked) completedQuizizz[id] = true;
    else delete completedQuizizz[id];
    this.saveState({ completedQuizizz });
    if (this.activeTab === "quizizz") this.renderQuizizzView();
    else if (this.activeTab === "curriculum") this.renderCurriculumView();
    else if (this.activeTab === "achievements") this.renderAchievementsView();
  },

  // ==========================================================================
  // 8. АЧИВКАЛАР, ЖЕТІСТІКТЕР ЖӘНЕ ДЕҢГЕЙЛЕР (GAMIFICATION)
  // ==========================================================================
  getRankAndXP() {
    const list = window.UBT_ACHIEVEMENTS || [];
    let unlockedCount = 0;
    let earnedXP = 0;

    list.forEach(a => {
      if (a.check(this.state)) {
        unlockedCount++;
        earnedXP += a.xp;
      }
    });

    // Additional XP from focus time, homework, and quizizz
    earnedXP += (this.state.totalFocusMinutes || 0);
    earnedXP += Object.keys(this.state.homeworkChecks || {}).filter(k => this.state.homeworkChecks[k]).length * 10;
    earnedXP += Object.keys(this.state.completedQuizizz || {}).filter(k => this.state.completedQuizizz[k]).length * 15;

    let rank = "Талапкер (I деңгей)";
    let level = 1;
    let minXP = 0;
    let nextLevelXP = 250;

    if (earnedXP >= 3500) {
      rank = "Грант иегері (V деңгей • 130/130)";
      level = 5;
      minXP = 3500;
      nextLevelXP = 6000;
    } else if (earnedXP >= 1800) {
      rank = "ФизМат үміткері (IV деңгей)";
      level = 4;
      minXP = 1800;
      nextLevelXP = 3500;
    } else if (earnedXP >= 800) {
      rank = "Білікті талапкер (III деңгей)";
      level = 3;
      minXP = 800;
      nextLevelXP = 1800;
    } else if (earnedXP >= 250) {
      rank = "Ізденуші (II деңгей)";
      level = 2;
      minXP = 250;
      nextLevelXP = 800;
    }

    const levelProgress = Math.min(100, Math.round(((earnedXP - minXP) / (nextLevelXP - minXP)) * 100));

    return {
      earnedXP,
      unlockedCount,
      total: list.length,
      rank,
      level,
      minXP,
      nextLevelXP,
      levelProgress
    };
  },

  renderAchievementsView() {
    const container = document.getElementById("achievements-content");
    if (!container) return;

    const rankInfo = this.getRankAndXP();
    const list = window.UBT_ACHIEVEMENTS || [];
    const activeCat = this.achFilterCategory || "all";

    const categories = ["all", "Тәртіп", "Фокус", "Физика", "Математика", "Тарих", "МатСауат", "Quizizz", "Сынама"];

    const filtered = list.filter(a => {
      if (activeCat === "all") return true;
      return a.category === activeCat;
    });

    container.innerHTML = `
      <!-- Level and Rank Hero Banner -->
      <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg, rgba(251,191,36,0.12), rgba(129,140,248,0.12));border:1px solid rgba(251,191,36,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="badge badge-amber">${rankInfo.level}-ДЕҢГЕЙ</span>
              <span style="font-size:13px;color:#94a3b8;">${rankInfo.rank}</span>
            </div>
            <h2 style="margin:8px 0 6px;color:#f8fafc;">Оқу көрсеткіштері және біліктілік дәрежелері</h2>
            <p style="color:#cbd5e1;font-size:13.5px;margin:0;">
              Әрбір өткен сабақ, орындалған Quizizz және фокус минуты үшін XP жинап, <b>130/130 жоғары көрсеткішіне</b> дейін сапалы дайындал!
            </p>
          </div>
          <div style="background:#0d1322;padding:14px 20px;border-radius:12px;border:1px solid #1e293b;text-align:center;min-width:180px;">
            <div style="font-size:30px;font-weight:900;color:#fbbf24;">${rankInfo.earnedXP} XP</div>
            <div style="font-size:12px;color:#94a3b8;">Келесі деңгейге: ${rankInfo.nextLevelXP} XP</div>
            <div class="kpi-bar" style="margin-top:8px;">
              <div class="kpi-bar-fill" style="width:${rankInfo.levelProgress}%;background:#fbbf24;"></div>
            </div>
            <div style="font-size:11.5px;color:#34d399;margin-top:4px;">Ашылғаны: ${rankInfo.unlockedCount} / ${rankInfo.total} ачивка</div>
          </div>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${categories.map(c => `
              <button class="btn btn-xs ${activeCat === c ? 'btn-accent' : 'btn-outline'}" onclick="App.selectAchievementCategory('${c}')">
                ${c === 'all' ? 'Барлық ачивкалар (' + list.length + ')' : c}
              </button>
            `).join("")}
          </div>
          <button class="btn btn-xs btn-outline" onclick="App.openSyncModal()">
            Прогресті телефонмен синхрондау
          </button>
        </div>

        <!-- Achievements Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:12px;">
          ${filtered.map(ach => {
            const unlocked = ach.check(this.state);
            return `
              <div class="example-card" style="display:flex;gap:12px;align-items:flex-start;background:#0d1322;border:1px solid ${unlocked ? '#34d399' : '#1e293b'};${unlocked ? 'box-shadow:0 0 15px rgba(52,211,153,0.12);' : 'opacity:0.65;'}">
                <div style="min-width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;letter-spacing:0.5px;background:${unlocked ? 'rgba(16,185,129,0.12)' : '#111827'};color:${unlocked ? '#34d399' : '#94a3b8'};border-radius:8px;border:1px solid ${unlocked ? '#10b981' : '#334155'};">
                  ${ach.code || 'ACH'}
                </div>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:700;color:${unlocked ? '#34d399' : '#94a3b8'};">
                      ${unlocked ? 'ҚОЛ ЖЕТКІЗІЛДІ' : 'ҚҰЛЫПТАУЛЫ'}
                    </span>
                    <span class="badge ${unlocked ? 'badge-green' : 'badge-blue'}">+${ach.xp} XP</span>
                  </div>
                  <div style="font-weight:700;font-size:14.5px;color:#f8fafc;margin-bottom:4px;">${ach.title}</div>
                  <div style="font-size:12px;color:#94a3b8;line-height:1.4;">${ach.desc}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  selectAchievementCategory(cat) {
    this.achFilterCategory = cat;
    this.renderAchievementsView();
  },

  // ==========================================================================
  // 9. CROSS-DEVICE SYNC (ТЕЛЕФОН ↔ НОУТБУК БҰЛТТЫҚ ЖӘНЕ ЛОКАЛДЫ СИНХРОНДАУ)
  // ==========================================================================
  openSyncModal() {
    const modal = document.getElementById("sync-modal");
    if (modal) modal.classList.add("open");
  },

  closeSyncModal() {
    const modal = document.getElementById("sync-modal");
    if (modal) modal.classList.remove("open");
  },

  copySyncData() {
    const jsonStr = JSON.stringify(this.state);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      alert("Синхрондау коды көшірілді. Енді телефондағы сайтты ашып, «Синхрондау → 2-қадам» өрісіне қойыңыз.");
    } else {
      prompt("Синхрондау кодын көшіріп алыңыз:", jsonStr);
    }
  },

  downloadSyncFile() {
    const jsonStr = JSON.stringify(this.state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ubt_progress_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importSyncData() {
    const area = document.getElementById("sync-input-area");
    if (!area || !area.value.trim()) {
      alert("Синхрондау кодын енгізіңіз!");
      return;
    }
    try {
      const incoming = JSON.parse(area.value.trim());
      this.state = { ...this.state, ...incoming };
      try { localStorage.setItem("ubt130_state_backup", JSON.stringify(this.state)); } catch (e) {}
      this.saveState(this.state);
      this.closeSyncModal();
      this.renderAll();
      alert("Прогресс және барлық нәтижелер сәтті жаңартылды.");
    } catch (err) {
      alert("Қате: Код дұрыс емес форматында. Қайта көшіріп көріңіз!");
    }
  },

  onSyncFileSelected(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const incoming = JSON.parse(e.target.result);
        this.state = { ...this.state, ...incoming };
        try { localStorage.setItem("ubt130_state_backup", JSON.stringify(this.state)); } catch (err) {}
        this.saveState(this.state);
        this.closeSyncModal();
        this.renderAll();
        alert("Прогресс файлдан сәтті жүктелді.");
      } catch (err) {
        alert("Файлды оқу мүмкін болмады: " + err.message);
      }
    };
    reader.readAsText(file);
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
