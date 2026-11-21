// ============================================================================
// ҰБТ 140 / 140 ФИЗМАТ — КӨРСЕТКІШТЕР МЕН БІЛІКТІЛІК ЖҮЙЕСІ (ACADEMIC MILESTONES)
// ============================================================================

window.UBT_ACHIEVEMENTS = [
  {
    id: "ach-1",
    code: "01",
    title: "Бастапқы қадам",
    desc: "Платформаны ашып, 1-ші оқу күнінің бағдарламасын бастау",
    category: "Бастама",
    xp: 50,
    check: (state) => (state.streak >= 1) || (state.completedDays && Object.keys(state.completedDays).length >= 1)
  },
  {
    id: "ach-2",
    code: "02",
    title: "Тұрақты ырғақ (3 күн)",
    desc: "3 күн қатарынан оқу бағдарламасын толық орындау",
    category: "Тәртіп",
    xp: 100,
    check: (state) => (state.streak || 0) >= 3
  },
  {
    id: "ach-3",
    code: "03",
    title: "Жүйелі дайындық (7 күн)",
    desc: "1 апта бойы үзіліссіз сабақ кестесін сақтау",
    category: "Тәртіп",
    xp: 250,
    check: (state) => (state.streak || 0) >= 7
  },
  {
    id: "ach-4",
    code: "04",
    title: "Академиялық марафон (30 күн)",
    desc: "1 ай бойы үздіксіз күнделікті оқу режимін сақтау",
    category: "Тәртіп",
    xp: 1000,
    check: (state) => (state.streak || 0) >= 30
  },
  {
    id: "ach-5",
    code: "05",
    title: "Фокус-сессия (100 минут)",
    desc: "Помодоро таймерімен кемінде 100 минут таза шоғырлану",
    category: "Фокус",
    xp: 100,
    check: (state) => (state.totalFocusMinutes || 0) >= 100
  },
  {
    id: "ach-6",
    code: "06",
    title: "Терең шоғырлану (500 минут)",
    desc: "Помодоро таймерімен 500 минуттан астам фокусталу",
    category: "Фокус",
    xp: 350,
    check: (state) => (state.totalFocusMinutes || 0) >= 500
  },
  {
    id: "ach-7",
    code: "07",
    title: "Физика: Базалық курс (5 тақырып)",
    desc: "Физика пәнінің кемінде 5 тақырыбын толық меңгеру",
    category: "Физика",
    xp: 150,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('phys')).length;
      return done >= 5;
    }
  },
  {
    id: "ach-8",
    code: "08",
    title: "Физика: Толық курс (25 тақырып)",
    desc: "Физиканың барлық 25 ресми тақырыбын 100% аяқтау",
    category: "Физика",
    xp: 600,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('phys')).length;
      return done >= 25;
    }
  },
  {
    id: "ach-9",
    code: "09",
    title: "Математика: Базалық курс (5 тақырып)",
    desc: "Математика пәнінің кемінде 5 тақырыбын аяқтау",
    category: "Математика",
    xp: 150,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('math')).length;
      return done >= 5;
    }
  },
  {
    id: "ach-10",
    code: "10",
    title: "Математика: Толық курс (18 тақырып)",
    desc: "Математиканың барлық 18 тақырыбын толық меңгеру",
    category: "Математика",
    xp: 600,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('math')).length;
      return done >= 18;
    }
  },
  {
    id: "ach-11",
    code: "11",
    title: "Қазақстан тарихы: Бастапқы кезең (10 тақырып)",
    desc: "Қазақстан тарихының кемінде 10 тақырыбын меңгеру",
    category: "Тарих",
    xp: 150,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('hist')).length;
      return done >= 10;
    }
  },
  {
    id: "ach-12",
    code: "12",
    title: "Қазақстан тарихы: Толық курс (55 тақырып)",
    desc: "Қазақстан тарихының барлық 55 тақырыбын толық бітіру",
    category: "Тарих",
    xp: 800,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('hist')).length;
      return done >= 55;
    }
  },
  {
    id: "ach-13",
    code: "13",
    title: "Мат. сауаттылық: Толық курс (10 тақырып)",
    desc: "Математикалық сауаттылықтың барлық 10 тақырыбын аяқтау",
    category: "МатСауат",
    xp: 300,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('msl')).length;
      return done >= 10;
    }
  },
  {
    id: "ach-14",
    code: "14",
    title: "Quizizz практикумы (10 квиз)",
    desc: "Кемінде 10 интерактивті Quizizz тестін аяқтау",
    category: "Quizizz",
    xp: 150,
    check: (state) => Object.keys(state.completedQuizizz || {}).length >= 10
  },
  {
    id: "ach-15",
    code: "15",
    title: "Quizizz шеберлігі (50 квиз)",
    desc: "Кемінде 50 Quizizz тестін сәтті тапсырып бітіру",
    category: "Quizizz",
    xp: 500,
    check: (state) => Object.keys(state.completedQuizizz || {}).length >= 50
  },
  {
    id: "ach-16",
    code: "16",
    title: "Қателерді түзету (1-3-7-21)",
    desc: "1-3-7-21 қате банкіндегі кемінде 3 тапсырманы қайталап орындау",
    category: "Қатемен жұмыс",
    xp: 150,
    check: (state) => {
      const bank = state.errorBank || [];
      return bank.filter(e => e.stage >= 2).length >= 3;
    }
  },
  {
    id: "ach-17",
    code: "17",
    title: "Сенімді шек (100+ балл)",
    desc: "ҰБТ сынама симуляторында 100 баллдан асу",
    category: "Сынама",
    xp: 350,
    check: (state) => {
      const hist = state.testHistory || [];
      return hist.some(t => t.score >= 100);
    }
  },
  {
    id: "ach-18",
    code: "18",
    title: "130/130 ҰБТ Максимумы",
    desc: "ҰБТ сынамасында 130 балл жинау және 108 тақырыпты меңгеру",
    category: "Финал",
    xp: 2000,
    check: (state) => {
      const hist = state.testHistory || [];
      return hist.some(t => t.score >= 130);
    }
  }
];
