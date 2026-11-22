// Vercel Serverless Function: /api/books
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const books = [
    { name: "369 формула (Е. Жұмаділов) — Физика барлық формулалар жинағы", relPath: "369 формула.pdf", folder: "Физика • Формулалар", sizeMB: "4.09", pagesCount: 69, isEmpty: false },
    { name: "Физика ЕНТ 1-бөлім (LETS Жұмыс дәптері — Теория + Есептер)", relPath: "Физика ЕНТ 1 болим каз-1.pdf", folder: "Физика • Оқулық", sizeMB: "9.12", pagesCount: 152, isEmpty: false },
    { name: "ҰБТ-да келетін 11-сынып Физикасының Теориясы (М. Харун)", relPath: "ҰБТ_да_келетін_11_сынып_Физикасының_Теориясы.pdf", folder: "Физика • Теория", sizeMB: "4.91", pagesCount: 22, isEmpty: false },
    { name: "А-ТОК Физика есептер жинағы 7–11 сынып (Барат А.Ж.)", relPath: "физика есептер (8).pdf", folder: "Физика • Есептер жинағы", sizeMB: "5.42", pagesCount: 332, isEmpty: false },
    { name: "Juz40 Физика формулалар мен шпаргалка жинағы", relPath: "Phisic_formula_juz40.pdf", folder: "Физика • Формулалар", sizeMB: "2.18", pagesCount: 24, isEmpty: false },
    { name: "1-нұсқа Физика ҰБТ-2024 сынама жинағы", relPath: "1 нұсқа Физика ҰБТ 2024.pdf", folder: "Физика • Нұсқалар", sizeMB: "0.68", pagesCount: 9, isEmpty: false },
    { name: "ҰБТ-2024 Физика жаңа нұсқалар жинағы", relPath: "ҰБТ 2024 жаңа.pdf", folder: "Физика • Нұсқалар", sizeMB: "2.94", pagesCount: 11, isEmpty: false },
    { name: "НЗМ Математикадан формулалар жинағы (Арифметика, Алгебра, 3D Геометрия, Анализ)", relPath: "Математика_формулалар_жинағы_каз_1.pdf", folder: "Математика • Формулалар", sizeMB: "18.16", pagesCount: 176, isEmpty: false },
    { name: "И.П. Рустюмова — Математикадан ҰБТ-ға дайындалуға арналған тренажер (Толық 490 бет)", relPath: "Рустюмова қазақша.pdf", folder: "Математика • Тренажер", sizeMB: "18.80", pagesCount: 490, isEmpty: false },
    { name: "Е.М. Рабинович — 7–9 сынып Геометрия (Дайын сызбалардағы есептер)", relPath: "Рабинович 7-9 кл.pdf", folder: "Математика • Планиметрия", sizeMB: "1.18", pagesCount: 56, isEmpty: false },
    { name: "Математикалық сауаттылық Формулалар жинағы (Чек-лист)", relPath: "МС ФОРМУЛА ЖИНАҒЫ.pdf", folder: "Мат. сауаттылық • Формулалар", sizeMB: "4.31", pagesCount: 21, isEmpty: false },
    { name: "Математикалық сауаттылық Тренді (37 тақырыптық тест жинағы)", relPath: "MS-matematika_trendi.pdf", folder: "Мат. сауаттылық • Тренажер", sizeMB: "4.97", pagesCount: 58, isEmpty: false },
    { name: "Математикалық сауаттылық — Дайын кітап (Теория және 237 беттік есептер)", relPath: "Дайын кітап_210902_144231.pdf", folder: "Мат. сауаттылық • Оқулық", sizeMB: "14.23", pagesCount: 237, isEmpty: false },
    { name: "Қазақстан тарихы ҰБТ Сұрақ-жауап кітапшасы (Testcenter бекіткен база)", relPath: "Тарих 11 сынып.pdf", folder: "Қазақстан тарихы • Оқулық", sizeMB: "16.69", pagesCount: 55, isEmpty: false },
    { name: "11 Физика — ҰБТ-2026 ресми тест спецификациясы", relPath: "11_Физика_каз.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.12", pagesCount: 2, isEmpty: false },
    { name: "09 Математика — ҰБТ-2026 ресми тест спецификациясы", relPath: "09_Математика_каз.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.11", pagesCount: 2, isEmpty: false },
    { name: "07 Математикалық сауаттылық — ҰБТ-2026 ресми тест спецификациясы", relPath: "07_Математикалық-сауаттылық.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.10", pagesCount: 2, isEmpty: false },
    { name: "22 Қазақстан тарихы — ҰБТ-2026 ресми тест спецификациясы (55 тақырып)", relPath: "22_Қазақстан-тарихы.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.15", pagesCount: 4, isEmpty: false },
    { name: "Физика пәні бойынша ұсынылатын ресми оқулықтар тізбесі", relPath: "Физика-1.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.10", pagesCount: 2, isEmpty: false },
    { name: "Математика және Мат. сауаттылық бойынша ұсынылатын оқулықтар тізбесі", relPath: "Математикалық-сауаттылық-және-математика.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.12", pagesCount: 5, isEmpty: false },
    { name: "Қазақстан тарихы бойынша ұсынылатын ресми оқулықтар тізбесі", relPath: "Қазақстан-тарихы-2.pdf", folder: "Ресми 2026 Спецификация", sizeMB: "0.11", pagesCount: 2, isEmpty: false }
  ];
  res.status(200).json({ baseDir: "public/books", books });
}
