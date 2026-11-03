// ============================================================================
// ҰБТ 130/130 ФИЗМАТ — АЧИВКАЛАР МЕН ЖЕТІСТІКТЕР ЖҮЙЕСІ (GAMIFICATION)
// ============================================================================

window.UBT_ACHIEVEMENTS = [
  {
    id: "ach-1",
    title: "Алғашқы қадам",
    desc: "Платформаны ашып, 1-ші оқу күнін сәтті бастау",
    icon: "🌱",
    category: "Бастама",
    xp: 50,
    check: (state) => (state.streak >= 1) || (state.completedDays && Object.keys(state.completedDays).length >= 1)
  },
  {
    id: "ach-2",
    title: "Оттай жалындаған Стрик",
    desc: "3 күн қатарынан тоқтаусыз сабақ оқу",
    icon: "🔥",
    category: "Тәртіп",
    xp: 100,
    check: (state) => (state.streak || 0) >= 3
  },
  {
    id: "ach-3",
    title: "Темір Тәртіп (7 күн)",
    desc: "1 апта бойы үзіліссіз дайындалу",
    icon: "⚡",
    category: "Тәртіп",
    xp: 250,
    check: (state) => (state.streak || 0) >= 7
  },
  {
    id: "ach-4",
    title: "ҰБТ Гладиаторы (30 күн)",
    desc: "1 ай бойы үздіксіз күнделікті оқу режимін сақтау",
    icon: "👑",
    category: "Тәртіп",
    xp: 1000,
    check: (state) => (state.streak || 0) >= 30
  },
  {
    id: "ach-5",
    title: "Фокус Шебері (100 минут)",
    desc: "Помодоро таймерімен кемінде 100 минут таза шоғырлану",
    icon: "⏱️",
    category: "Фокус",
    xp: 100,
    check: (state) => (state.totalFocusMinutes || 0) >= 100
  },
  {
    id: "ach-6",
    title: "Гипер-Концентрация (500 мин)",
    desc: "Помодоро таймерімен 500 минуттан астам фокусталу",
    icon: "🚀",
    category: "Фокус",
    xp: 350,
    check: (state) => (state.totalFocusMinutes || 0) >= 500
  },
  {
    id: "ach-7",
    title: "Физика Сұңқары (5 тақырып)",
    desc: "Физика пәнінің кемінде 5 тақырыбын меңгеру",
    icon: "⚡",
    category: "Физика",
    xp: 150,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('phys')).length;
      return done >= 5;
    }
  },
  {
    id: "ach-8",
    title: "Ньютон Мұрагері (25 тақырып)",
    desc: "Физиканың барлық 25 ресми тақырыбын 100% аяқтау",
    icon: "🍎",
    category: "Физика",
    xp: 600,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('phys')).length;
      return done >= 25;
    }
  },
  {
    id: "ach-9",
    title: "Математика Данышпаны (5 тақырып)",
    desc: "Математика пәнінің кемінде 5 тақырыбын аяқтау",
    icon: "📐",
    category: "Математика",
    xp: 150,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('math')).length;
      return done >= 5;
    }
  },
  {
    id: "ach-10",
    title: "Эйлердің Жолдасы (18 тақырып)",
    desc: "Математиканың барлық 18 тақырыбын толық меңгеру",
    icon: "🧮",
    category: "Математика",
    xp: 600,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('math')).length;
      return done >= 18;
    }
  },
  {
    id: "ach-11",
    title: "Тарих Сардары (10 тақырып)",
    desc: "Қазақстан тарихының кемінде 10 тақырыбын меңгеру",
    icon: "🏛️",
    category: "Тарих",
    xp: 150,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('hist')).length;
      return done >= 10;
    }
  },
  {
    id: "ach-12",
    title: "Қазақ Елінің Шежіресі (55 тақырып)",
    desc: "Қазақстан тарихының барлық 55 тақырыбын толық бітіру",
    icon: "🇰🇿",
    category: "Тарих",
    xp: 800,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('hist')).length;
      return done >= 55;
    }
  },
  {
    id: "ach-13",
    title: "Логика Шебері (10 тақырып)",
    desc: "Математикалық сауаттылықтың барлық 10 тақырыбын аяқтау",
    icon: "🧠",
    category: "МатСауат",
    xp: 300,
    check: (state) => {
      const done = Object.keys(state.completedBlocks || {}).filter(k => k.startsWith('msl')).length;
      return done >= 10;
    }
  },
  {
    id: "ach-14",
    title: "Quizizz Жұлдызы (10 квиз)",
    desc: "Кемінде 10 интерактивті Quizizz тестін аяқтау",
    icon: "🎮",
    category: "Quizizz",
    xp: 150,
    check: (state) => Object.keys(state.completedQuizizz || {}).length >= 10
  },
  {
    id: "ach-15",
    title: "Quizizz Магистрі (50 квиз)",
    desc: "Кемінде 50 Quizizz тестін сәтті тапсырып бітіру",
    icon: "🏆",
    category: "Quizizz",
    xp: 500,
    check: (state) => Object.keys(state.completedQuizizz || {}).length >= 50
  },
  {
    id: "ach-16",
    title: "Қателіктерді Жоюшы",
    desc: "1-3-7-21 қате банкіндегі кемінде 3 қатені қайталап, түзету",
    icon: "🛡️",
    category: "Қатемен жұмыс",
    xp: 150,
    check: (state) => {
      const bank = state.errorBank || [];
      return bank.filter(e => e.stage >= 2).length >= 3;
    }
  },
  {
    id: "ach-17",
    title: "Сенімді 100+ Балл",
    desc: "ҰБТ сынама симуляторынан 100 баллдан асу",
    icon: "💯",
    category: "Сынама",
    xp: 350,
    check: (state) => {
      const hist = state.testHistory || [];
      return hist.some(t => t.score >= 100);
    }
  },
  {
    id: "ach-18",
    title: "130 / 130 Мемлекеттік Грант",
    desc: "ҰБТ сынамасында 130 балл жинау және барлық 108 тақырыпты меңгеру!",
    icon: "🎓",
    category: "Финал",
    xp: 2000,
    check: (state) => {
      const hist = state.testHistory || [];
      return hist.some(t => t.score >= 130);
    }
  }
];
