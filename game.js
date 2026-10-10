/* =========================================================
   КиноКадр — Угадай фильм по отрывку
   Yandex Games SDK v2: реклама (fullscreen, rewarded, sticky),
   покупки, лидерборд, облачные сохранения, GameplayAPI
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- CONFIG ---------------- */
  const CONFIG = {
    version: '1.1.0-local-video',
    roundsPerLevel: 5,
    roundTime: 20,
    endlessMinTime: 10,
    clipLength: 10,
    lives: 3,
    // Сколько ждать один источник (с учётом прероллов RUTUBE/VK) и сколько всего на раунд
    videoTimeout: 45000,
    clipTotalTimeout: 95000,
    // Локальная сборка: источники file берутся из сгенерированного clips.js
    useLocalVideos: true,
    startCoins: 150,
    freeCoinsAd: 50,
    reviveCost: 100,
    hintCost: { fifty: 30, time: 20, skip: 50 },
    levelReward: [0, 20, 35, 50],
    interstitialCooldown: 60000,
    leaderboard: 'topScore',
    daily: [50, 75, 100, 150, 200, 300, 500],
    // ID товаров нужно создать в консоли разработчика Яндекс Игр
    products: {
      coins_small: { coins: 300, icon: 'coin', fallbackPrice: '49' },
      coins_medium: { coins: 1000, icon: 'coin', fallbackPrice: '129', ribbon: 'hit' },
      coins_large: { coins: 3000, icon: 'coin', fallbackPrice: '299', ribbon: 'best' },
      no_ads: { noAds: true, icon: 'ad', fallbackPrice: '199' },
      vip: { vip: true, coins: 2000, noAds: true, icon: 'crown', fallbackPrice: '399', ribbon: 'vip' },
    },
  };

  /* ---------------- MOVIES ----------------
     Отрывки берутся из локального clips.js.
     Все видео находятся внутри ZIP: videos/<id>.mp4.
  ------------------------------------------ */
  const mv = (id, ru, en, year, sru, sen) => ({
    id, title: { ru, en }, year, scene: { ru: sru, en: sen },
  });

  // Только локальные отрывки. Никаких внешних iframe или резервного Rutube.
  const clipSources = (movie) =>
    ((window.KINOKADR_CLIPS || {})[movie.id] || []).filter((s) => s.p === 'file');

  // Случайная точка входа: у трейлеров пропускаем логотипы студий и финальный титр с названием
  const pickClipStart = (src) => {
    if (Number.isFinite(src.start)) return src.start;
    const d = Number(src.d) || 0;
    const len = CONFIG.clipLength;
    if (!d) return 0;
    let from;
    let to;
    if (src.kind === 'film') { from = d * 0.1; to = d * 0.85; }
    else if (src.kind === 'scene') { from = 1; to = d - len - 1; }
    else { from = d * 0.15; to = d * 0.7 - len; }
    if (to <= from) return Math.max(0, Math.floor(Math.min(from, d - len)));
    return Math.floor(from + Math.random() * (to - from));
  };

  const CATEGORIES = [
    {
      id: 'hits', name: { ru: 'Мировые хиты', en: 'Global Hits' }, color: '#ff3d5a', unlockStars: 0, unlockCost: 0,
      movies: [
        mv('titanic', 'Титаник', 'Titanic', 1997, 'Двое на носу огромного лайнера раскинули руки навстречу ветру', 'Two people on the bow of a giant liner spread their arms into the wind'),
        mv('matrix', 'Матрица', 'The Matrix', 1999, 'Герой в чёрном плаще уклоняется от пуль в замедленной съёмке', 'A hero in a black coat dodges bullets in slow motion'),
        mv('avatar', 'Аватар', 'Avatar', 2009, 'Синие гиганты летают на драконах над парящими горами', 'Blue giants fly on dragons over floating mountains'),
        mv('inception', 'Начало', 'Inception', 2010, 'Город складывается пополам прямо над головами героев', 'A city folds in half right above the heroes'),
        mv('interstellar', 'Интерстеллар', 'Interstellar', 2014, 'Огромные волны на планете, где час равен семи годам', 'Giant waves on a planet where one hour equals seven years'),
        mv('joker', 'Джокер', 'Joker', 2019, 'Мужчина в красном костюме танцует на длинной лестнице', 'A man in a red suit dances down a long staircase'),
        mv('forrest_gump', 'Форрест Гамп', 'Forrest Gump', 1994, 'Мужчина сидит на скамейке с коробкой конфет', 'A man sits on a bench with a box of chocolates'),
        mv('pirates', 'Пираты Карибского моря', 'Pirates of the Caribbean', 2003, 'Эксцентричный капитан входит в порт на тонущей лодке', 'An eccentric captain sails into port on a sinking boat'),
        mv('harry_potter', 'Гарри Поттер и философский камень', 'Harry Potter and the Sorcerer\'s Stone', 2001, 'Мальчик разбегается в кирпичную стену на вокзале', 'A boy runs into a brick wall at a train station'),
        mv('lotr', 'Властелин колец: Братство кольца', 'The Lord of the Rings: The Fellowship', 2001, 'Волшебник на мосту кричит огненному демону: «Ты не пройдёшь!»', 'A wizard on a bridge shouts at a fire demon: "You shall not pass!"'),
      ],
    },
    {
      id: 'action', name: { ru: 'Боевики', en: 'Action' }, color: '#ff9a3c', unlockStars: 3, unlockCost: 300,
      movies: [
        mv('terminator2', 'Терминатор 2', 'Terminator 2', 1991, 'Киборг на мотоцикле с дробовиком в руке', 'A cyborg on a motorcycle holding a shotgun'),
        mv('die_hard', 'Крепкий орешек', 'Die Hard', 1988, 'Босой полицейский против террористов в небоскрёбе', 'A barefoot cop against terrorists in a skyscraper'),
        mv('mission_impossible', 'Миссия невыполнима', 'Mission: Impossible', 1996, 'Агент висит на тросах над белым полом хранилища', 'An agent hangs on wires above a white vault floor'),
        mv('mad_max', 'Безумный Макс: Дорога ярости', 'Mad Max: Fury Road', 2015, 'Гитарист с огнемётом на грузовике в песчаной буре', 'A guitarist with a flamethrower on a truck in a sandstorm'),
        mv('john_wick', 'Джон Уик', 'John Wick', 2014, 'Наёмник мстит за убитую собаку', 'A hitman takes revenge for his murdered dog'),
        mv('fast_furious', 'Форсаж', 'The Fast and the Furious', 2001, 'Ночные уличные гонки на тюнингованных машинах', 'Night street races in tuned cars'),
        mv('gladiator', 'Гладиатор', 'Gladiator', 2000, 'Генерал проводит рукой по колосьям пшеницы', 'A general runs his hand through wheat fields'),
        mv('dark_knight', 'Тёмный рыцарь', 'The Dark Knight', 2008, 'Злодей в гриме медленно хлопает в тюремной камере', 'A villain in makeup slowly claps in a jail cell'),
        mv('fifth_element', 'Пятый элемент', 'The Fifth Element', 2008, 'Девушка с оранжевыми волосами падает в летающее такси', 'A girl with orange hair falls into a flying taxi'),
        mv('top_gun', 'Топ Ган: Мэверик', 'Top Gun: Maverick', 2022, 'Пилот в солнечных очках разгоняет мотоцикл рядом с истребителем', 'A pilot in sunglasses races a motorcycle next to a fighter jet'),
      ],
    },
    {
      id: 'animation', name: { ru: 'Мультфильмы', en: 'Animation' }, color: '#22d3a5', unlockStars: 6, unlockCost: 400,
      movies: [
        mv('lion_king', 'Король Лев', 'The Lion King', 1994, 'Обезьяна поднимает львёнка над скалой перед всеми зверями', 'A monkey lifts a lion cub above a cliff before all the animals'),
        mv('shrek', 'Шрэк', 'Shrek', 2001, 'Зелёный великан выходит из деревянного туалета на болоте', 'A green ogre walks out of a wooden outhouse in a swamp'),
        mv('frozen', 'Холодное сердце', 'Frozen', 2013, 'Королева поёт и строит ледяной замок в горах', 'A queen sings and builds an ice castle in the mountains'),
        mv('toy_story', 'История игрушек', 'Toy Story', 1995, 'Космический рейнджер пытается «полететь» с кровати', 'A space ranger tries to "fly" off a bed'),
        mv('finding_nemo', 'В поисках Немо', 'Finding Nemo', 2003, 'Рыба-клоун и забывчивая синяя рыбка ищут сына в океане', 'A clownfish and a forgetful blue fish search the ocean for a son'),
        mv('wall_e', 'ВАЛЛ-И', 'WALL-E', 2008, 'Маленький робот собирает мусор на пустой Земле', 'A little robot collects trash on an empty Earth'),
        mv('coco', 'Тайна Коко', 'Coco', 2017, 'Мальчик с гитарой попадает в яркий мир мёртвых', 'A boy with a guitar enters the colorful land of the dead'),
        mv('inside_out', 'Головоломка', 'Inside Out', 2015, 'Эмоции управляют пультом в голове девочки', 'Emotions control a console inside a girl\'s head'),
        mv('ice_age', 'Ледниковый период', 'Ice Age', 2002, 'Белка гоняется за жёлудем и раскалывает ледник', 'A squirrel chases an acorn and cracks a glacier'),
        mv('ratatouille', 'Рататуй', 'Ratatouille', 2007, 'Крыса управляет поваром, дёргая его за волосы', 'A rat controls a cook by pulling his hair'),
      ],
    },
    {
      id: 'soviet', name: { ru: 'Советское кино', en: 'Soviet Classics' }, color: '#e84a5f', unlockStars: 10, unlockCost: 500,
      movies: [
        mv('ironiya', 'Ирония судьбы, или С лёгким паром!', 'The Irony of Fate', 1975, 'Друзья в бане в канун Нового года, один улетает в Ленинград', 'Friends at a bathhouse on New Year\'s Eve, one flies to Leningrad'),
        mv('ivan_vasilievich', 'Иван Васильевич меняет профессию', 'Ivan Vasilievich Changes Profession', 1973, 'Царь в московской квартире изобретателя машины времени', 'A tsar in a Moscow apartment of a time machine inventor'),
        mv('brilliant_hand', 'Бриллиантовая рука', 'The Diamond Arm', 1968, 'Турист с гипсом поскальзывается: «Чёрт побери!»', 'A tourist with a cast slips and falls on the street'),
        mv('kavkazskaya', 'Кавказская пленница', 'Kidnapping, Caucasian Style', 1967, 'Трое похитителей и фольклорист на горной дороге', 'Three kidnappers and a folklorist on a mountain road'),
        mv('operation_y', 'Операция «Ы» и другие приключения Шурика', 'Operation Y', 1965, 'Студент перевоспитывает хулигана на стройке', 'A student re-educates a hooligan at a construction site'),
        mv('gentlemen', 'Джентльмены удачи', 'Gentlemen of Fortune', 1971, 'Заведующий детсадом притворяется вором в законе', 'A kindergarten director pretends to be a crime boss'),
        mv('moscow_tears', 'Москва слезам не верит', 'Moscow Does Not Believe in Tears', 1979, 'Слесарь Гоша знакомится с героиней в электричке', 'A mechanic named Gosha meets the heroine on a train'),
        mv('office_romance', 'Служебный роман', 'Office Romance', 1977, 'Строгая начальница учится ходить «от бедра»', 'A strict boss learns to walk gracefully'),
        mv('white_sun', 'Белое солнце пустыни', 'White Sun of the Desert', 1970, 'Красноармеец идёт через пустыню и охраняет гарем', 'A Red Army soldier crosses the desert and guards a harem'),
        mv('love_doves', 'Любовь и голуби', 'Love and Pigeons', 1984, 'Мужчина из деревни держит голубятню и уезжает на курорт', 'A village man keeps pigeons and goes to a resort'),
      ],
    },
    {
      id: 'russian', name: { ru: 'Российское кино', en: 'Russian Cinema' }, color: '#5c8cff', unlockStars: 14, unlockCost: 600,
      movies: [
        mv('brat', 'Брат', 'Brother', 1997, 'Парень в свитере бродит по Петербургу с плеером', 'A guy in a sweater wanders Saint Petersburg with a player'),
        mv('brat2', 'Брат 2', 'Brother 2', 2000, '«В чём сила, брат?» — спрашивают в Америке', '"Where is the power, brother?" they ask in America'),
        mv('dvizhenie', 'Движение вверх', 'Going Vertical', 2017, 'Финальные три секунды баскетбольного матча на Олимпиаде', 'The final three seconds of an Olympic basketball game'),
        mv('t34', 'Т-34', 'T-34', 2018, 'Пленные танкисты прорываются через немецкий городок', 'Captured tankmen break through a German town'),
        mv('legend17', 'Легенда №17', 'Legend No. 17', 2013, 'Хоккеист из СССР против канадцев в суперсерии', 'A Soviet hockey player against Canada in the Summit Series'),
        mv('kholop', 'Холоп', 'Serf', 2019, 'Избалованный мажор просыпается крепостным в XIX веке', 'A spoiled rich kid wakes up as a serf in the 19th century'),
        mv('ekipazh', 'Экипаж', 'The Crew', 2016, 'Пилоты спасают людей с острова во время извержения', 'Pilots rescue people from an island during an eruption'),
        mv('yolki', 'Ёлки', 'Yolki', 2010, 'Новогодняя цепочка добрых дел по всей стране', 'A New Year chain of good deeds across the country'),
        mv('cheburashka', 'Чебурашка', 'Cheburashka', 2023, 'Пушистый зверёк с большими ушами объедается апельсинами', 'A fluffy creature with big ears gorges on oranges'),
        mv('major_grom', 'Майор Гром: Чумной Доктор', 'Major Grom: Plague Doctor', 2021, 'Питерский полицейский против мстителя в маске', 'A Saint Petersburg cop against a masked vigilante'),
      ],
    },
    {
      id: 'scifi', name: { ru: 'Фантастика', en: 'Sci-Fi' }, color: '#a45cff', unlockStars: 18, unlockCost: 700,
      movies: [
        mv('star_wars', 'Звёздные войны: Новая надежда', 'Star Wars: A New Hope', 1977, 'Фермер смотрит на два заходящих солнца', 'A farm boy watches two setting suns'),
        mv('back_to_future', 'Назад в будущее', 'Back to the Future', 1985, 'Машина разгоняется до 88 миль в час и исчезает в огне', 'A car hits 88 mph and vanishes in fire trails'),
        mv('alien', 'Чужой', 'Alien', 1979, 'Существо вырывается из груди члена экипажа за столом', 'A creature bursts from a crew member\'s chest at dinner'),
        mv('blade_runner', 'Бегущий по лезвию 2049', 'Blade Runner 2049', 2017, 'Офицер в плаще идёт по оранжевому пустынному городу', 'An officer in a coat walks through an orange desert city'),
        mv('dune', 'Дюна', 'Dune', 2021, 'Огромный песчаный червь поднимается из дюн', 'A gigantic sandworm rises from the dunes'),
        mv('jurassic_park', 'Парк Юрского периода', 'Jurassic Park', 1993, 'Вода в стакане дрожит от шагов огромного хищника', 'Water in a cup ripples from a giant predator\'s steps'),
        mv('martian', 'Марсианин', 'The Martian', 2015, 'Астронавт выращивает картошку на красной планете', 'An astronaut grows potatoes on the red planet'),
        mv('gravity', 'Гравитация', 'Gravity', 2013, 'Астронавтка кувыркается в открытом космосе после аварии', 'An astronaut tumbles in open space after a crash'),
        mv('mib', 'Люди в чёрном', 'Men in Black', 1997, 'Агенты в костюмах стирают память вспышкой', 'Agents in suits erase memories with a flash'),
        mv('arrival', 'Прибытие', 'Arrival', 2016, 'Лингвист общается с пришельцами через круглые символы', 'A linguist talks to aliens through circular symbols'),
      ],
    },
  ];

  const ALL_MOVIES = CATEGORIES.flatMap((c) => c.movies.map((m) => ({ ...m, cat: c.id })));
  const LEVELS = [];
  CATEGORIES.forEach((cat) => {
    for (let i = 0; i < cat.movies.length; i += CONFIG.roundsPerLevel) {
      LEVELS.push({
        key: `${cat.id}-${i / CONFIG.roundsPerLevel}`,
        cat,
        num: i / CONFIG.roundsPerLevel + 1,
        movies: cat.movies.slice(i, i + CONFIG.roundsPerLevel).map((m) => ({ ...m, cat: cat.id })),
      });
    }
  });

  /* ---------------- I18N ---------------- */
  const I18N = {
    ru: {
      loading: 'Загрузка...', tagline: 'Угадай фильм по отрывку', play: 'Играть', endless: 'Марафон', best: 'Рекорд',
      levels: 'Уровни', freeCoins: 'Бесплатные монеты', shop: 'Магазин', leaders: 'Рейтинг', daily: 'Бонус',
      shortcut: 'Ярлык', settings: 'Настройки', scene: 'Сцена из фильма', score: 'Очки', sec: 'сек', skip: 'Пропуск',
      question: 'Из какого фильма этот отрывок?', correct: 'Верно', reward: 'Награда', doubleReward: 'Удвоить награду',
      menu: 'Меню', retry: 'Ещё раз', next: 'Дальше', outOfLives: 'Жизни закончились',
      reviveText: 'Продолжить игру и сохранить прогресс?', reviveAd: 'Продолжить за рекламу', reviveCoins: 'Продолжить за',
      giveUp: 'Завершить', noCoins: 'Не хватает монет', hintForAd: 'Подсказка за рекламу', toShop: 'В магазин',
      pause: 'Пауза', exitText: 'Выйти в меню? Прогресс раунда будет потерян.', exit: 'Выйти', resume: 'Продолжить',
      leadersSub: 'Лучшие игроки в режиме «Марафон»', login: 'Войти, чтобы попасть в рейтинг',
      dailyTitle: 'Ежедневный бонус', dailySub: 'Заходи каждый день — награда растёт!', claimX2: 'Забрать x2', claim: 'Забрать',
      sound: 'Звук', vibro: 'Вибрация', language: 'Язык', testAd: 'Тестовая реклама',
      levelN: 'Уровень {n}', roundN: 'Кадр {n}', levelDone: 'Уровень пройден!', levelFail: 'Не получилось',
      levelFailSub: 'Попробуй ещё раз — у тебя получится!', perfect: 'Идеально! Без единой ошибки',
      good: 'Отличный результат!', endlessOver: 'Марафон окончен', newRecord: 'Новый рекорд!',
      bestIs: 'Ваш рекорд: {n}', ok: 'Верно!', wrong: 'Неверно', timeout: 'Время вышло', skipped: 'Пропущено',
      combo: 'Комбо x{n}', needCoins: 'Нужно {n} монет. Посмотри рекламу или пополни баланс.',
      gotCoins: '+{n} монет!', adUnavailable: 'Реклама сейчас недоступна, попробуйте позже',
      purchaseOk: 'Покупка успешна!', purchaseFail: 'Покупка не завершена', owned: 'Куплено',
      unlockStars: 'Нужно {n} звёзд', unlockFor: 'Открыть за', unlocked: 'Категория открыта!',
      continueLvl: '{cat} · {lvl}', allDone: 'Все уровни пройдены', starsOf: '{a} из {b}',
      day: 'День {n}', claimed: 'Получено', comeTomorrow: 'Возвращайся завтра!', loginFirst: 'Войдите, чтобы увидеть рейтинг',
      lbEmpty: 'Пока пусто — стань первым!', you: 'Вы', shortcutOk: 'Ярлык добавлен! +{n} монет',
      products: {
        coins_small: ['Горсть монет', '300 монет'], coins_medium: ['Мешок монет', '1000 монет'],
        coins_large: ['Сундук монет', '3000 монет'], no_ads: ['Без рекламы', 'Убирает баннер и рекламу между уровнями'],
        vip: ['Кинопропуск VIP', 'Все категории + 2000 монет + без рекламы'],
      },
      ribbons: { hit: 'Хит', best: 'Выгодно', vip: 'Всё включено' },
    },
    en: {
      loading: 'Loading...', tagline: 'Guess the movie by the clip', play: 'Play', endless: 'Marathon', best: 'Best',
      levels: 'Levels', freeCoins: 'Free coins', shop: 'Shop', leaders: 'Leaders', daily: 'Bonus',
      shortcut: 'Shortcut', settings: 'Settings', scene: 'Movie scene', score: 'Score', sec: 'sec', skip: 'Skip',
      question: 'Which movie is this clip from?', correct: 'Correct', reward: 'Reward', doubleReward: 'Double reward',
      menu: 'Menu', retry: 'Retry', next: 'Next', outOfLives: 'Out of lives',
      reviveText: 'Continue and keep your progress?', reviveAd: 'Continue for an ad', reviveCoins: 'Continue for',
      giveUp: 'Give up', noCoins: 'Not enough coins', hintForAd: 'Hint for an ad', toShop: 'Go to shop',
      pause: 'Paused', exitText: 'Exit to menu? Round progress will be lost.', exit: 'Exit', resume: 'Resume',
      leadersSub: 'Top players in Marathon mode', login: 'Log in to join the leaderboard',
      dailyTitle: 'Daily bonus', dailySub: 'Come back every day — rewards grow!', claimX2: 'Claim x2', claim: 'Claim',
      sound: 'Sound', vibro: 'Vibration', language: 'Language', testAd: 'Test ad',
      levelN: 'Level {n}', roundN: 'Clip {n}', levelDone: 'Level complete!', levelFail: 'Not this time',
      levelFailSub: 'Try again — you can do it!', perfect: 'Perfect! No mistakes',
      good: 'Great result!', endlessOver: 'Marathon over', newRecord: 'New record!',
      bestIs: 'Your best: {n}', ok: 'Correct!', wrong: 'Wrong', timeout: 'Time is up', skipped: 'Skipped',
      combo: 'Combo x{n}', needCoins: 'You need {n} coins. Watch an ad or top up.',
      gotCoins: '+{n} coins!', adUnavailable: 'Ad is not available right now, try later',
      purchaseOk: 'Purchase successful!', purchaseFail: 'Purchase not completed', owned: 'Owned',
      unlockStars: 'Need {n} stars', unlockFor: 'Unlock for', unlocked: 'Category unlocked!',
      continueLvl: '{cat} · {lvl}', allDone: 'All levels completed', starsOf: '{a} of {b}',
      day: 'Day {n}', claimed: 'Claimed', comeTomorrow: 'Come back tomorrow!', loginFirst: 'Log in to see the leaderboard',
      lbEmpty: 'Empty so far — be the first!', you: 'You', shortcutOk: 'Shortcut added! +{n} coins',
      products: {
        coins_small: ['Handful of coins', '300 coins'], coins_medium: ['Bag of coins', '1000 coins'],
        coins_large: ['Chest of coins', '3000 coins'], no_ads: ['No ads', 'Removes banner and interstitial ads'],
        vip: ['VIP Cinema Pass', 'All categories + 2000 coins + no ads'],
      },
      ribbons: { hit: 'Hit', best: 'Best value', vip: 'All-in' },
    },
  };

  let lang = 'ru';
  const t = (key, vars) => {
    let s = I18N[lang][key] ?? I18N.ru[key] ?? key;
    if (vars && typeof s === 'string') Object.keys(vars).forEach((k) => { s = s.replace(`{${k}}`, vars[k]); });
    return s;
  };
  const tr = (obj) => (obj ? obj[lang] || obj.ru : '');

  /* ---------------- HELPERS ---------------- */
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const icon = (name, cls = '') => `<svg class="i ${cls}"><use href="#i-${name}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

  /* ---------------- SAVE ---------------- */
  const SAVE_KEY = 'kinokadr_save_v1';
  const DEFAULT_SAVE = {
    coins: CONFIG.startCoins, stars: {}, best: 0, bought: [], noAds: false, vip: false,
    sound: true, vibro: true, lang: null, daily: { last: -1, streak: 0 },
    shortcut: false, reviewed: false, wins: 0, updated: 0,
  };
  let save = { ...DEFAULT_SAVE };
  let saveTimer = null;

  function persist(immediate = false) {
    save.updated = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage unavailable */ }
    clearTimeout(saveTimer);
    const push = () => SDK.saveData(save);
    if (immediate) push(); else saveTimer = setTimeout(push, 1200);
  }

  async function loadSave() {
    let local = null;
    try { local = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { local = null; }
    const cloud = await SDK.loadData();
    const pick = [local, cloud].filter(Boolean).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    save = { ...DEFAULT_SAVE, ...(pick || {}), daily: { ...DEFAULT_SAVE.daily, ...((pick && pick.daily) || {}) } };
  }

  /* ---------------- SDK WRAPPER (VK + YANDEX) ---------------- */
  const isVK = window.location.search.includes('api_url') || window.location.search.includes('vk_access_token');
  const isYandex = window.location.hostname.includes('yandex');

  const SDK = {
    ysdk: null, player: null, payments: null, mock: true, catalog: [], lastInterstitial: 0, adOpen: false, vkInitialized: false,

    async init() {
      if (isVK) {
         try {
             await vkBridge.send('VKWebAppInit');
             this.vkInitialized = true;
             this.mock = false;
             // Подписываемся на события сворачивания/разворачивания
             vkBridge.subscribe((e) => {
                 if (e.detail.type === 'VKWebAppViewHide') Game.pause('sdk');
                 if (e.detail.type === 'VKWebAppViewRestore') Game.resume('sdk');
             });
         } catch (e) {
             this.mock = true;
         }
         return;
      }
      if (typeof window.YaGames === 'undefined') return;
      try {
        this.ysdk = await window.YaGames.init();
        this.mock = false;
        this.ysdk.on?.('game_api_pause', () => Game.pause('sdk'));
        this.ysdk.on?.('game_api_resume', () => Game.resume('sdk'));
      } catch (e) { this.ysdk = null; this.mock = true; return; }
      await Promise.allSettled([this.initPlayer(), this.initPayments()]);
    },

    async initPlayer() {
      if (isVK) return;
      try { this.player = await this.ysdk.getPlayer({ scopes: false }); } catch (e) { this.player = null; }
    },

    async initPayments() {
      if (isVK) return;
      try {
        this.payments = this.ysdk.payments || (await this.ysdk.getPayments({ signed: false }));
        const catalog = await this.payments.getCatalog();
        this.catalog = catalog || [];
      } catch (e) { this.payments = null; }
    },

    isAuthorized() {
      if (isVK) return true; // В ВК игрок всегда авторизован
      if (!this.player) return false;
      if (typeof this.player.isAuthorized === 'function') return this.player.isAuthorized();
      return this.player.getMode?.() !== 'lite';
    },

    lang() {
      if (isVK) return 'ru';
      const l = this.ysdk?.environment?.i18n?.lang || (navigator.language || 'ru').slice(0, 2);
      return ['ru', 'be', 'kk', 'uk', 'uz'].includes(l) ? 'ru' : 'en';
    },

    ready() { 
      if (isVK) return;
      try { this.ysdk?.features?.LoadingAPI?.ready(); } catch (e) { /* noop */ } 
    },
    gameplayStart() { 
      if (isVK) return;
      try { this.ysdk?.features?.GameplayAPI?.start(); } catch (e) { /* noop */ } 
    },
    gameplayStop() { 
      if (isVK) return;
      try { this.ysdk?.features?.GameplayAPI?.stop(); } catch (e) { /* noop */ } 
    },

    async loadData() {
      if (isVK) {
         try {
            const data = await vkBridge.send('VKWebAppStorageGet', { keys: ['kinokadr_save'] });
            if (data.keys && data.keys[0] && data.keys[0].value) {
                return JSON.parse(data.keys[0].value);
            }
            return null;
         } catch(e) { return null; }
      }
      if (!this.player) return null;
      try { const d = await this.player.getData(); return d && Object.keys(d).length ? d : null; } catch (e) { return null; }
    },
    saveData(data) { 
      if (isVK) {
         try { vkBridge.send('VKWebAppStorageSet', { key: 'kinokadr_save', value: JSON.stringify(data) }); } catch(e) {}
         return;
      }
      try { this.player?.setData(data, true); } catch (e) { /* noop */ } 
    },

    showBanner() { 
      if (isVK) {
         try { vkBridge.send('VKWebAppShowBannerAd', { banner_location: 'bottom' }); } catch(e) {}
         return;
      }
      if (!save.noAds) try { this.ysdk?.adv?.showBannerAdv?.(); } catch (e) { /* noop */ } 
    },
    hideBanner() { 
      if (isVK) {
         try { vkBridge.send('VKWebAppHideBannerAd'); } catch(e) {}
         return;
      }
      try { this.ysdk?.adv?.hideBannerAdv?.(); } catch (e) { /* noop */ } 
    },

    showFullscreen() {
      return new Promise((resolve) => {
        if (save.noAds || Date.now() - this.lastInterstitial < CONFIG.interstitialCooldown) return resolve(false);
        this.lastInterstitial = Date.now();
        
        if (isVK && this.vkInitialized) {
            this.adOpen = true; Game.pause('ad');
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
              .then(() => { this.adOpen = false; Game.resume('ad'); resolve(true); })
              .catch(() => { this.adOpen = false; Game.resume('ad'); resolve(false); });
            return;
        }

        if (!this.ysdk) return resolve(false);
        try {
          this.ysdk.adv.showFullscreenAdv({
            callbacks: {
              onOpen: () => { this.adOpen = true; Game.pause('ad'); },
              onClose: (wasShown) => { this.adOpen = false; Game.resume('ad'); resolve(wasShown); },
              onError: () => { this.adOpen = false; Game.resume('ad'); resolve(false); },
              onOffline: () => { this.adOpen = false; Game.resume('ad'); resolve(false); },
            },
          });
        } catch (e) { resolve(false); }
      });
    },

    showRewarded() {
      return new Promise((resolve) => {
        if (isVK && this.vkInitialized) {
            this.adOpen = true; Game.pause('ad');
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
              .then((data) => {
                  this.adOpen = false; Game.resume('ad');
                  if (data.result) resolve(true);
                  else resolve(false);
              })
              .catch(() => {
                  this.adOpen = false; Game.resume('ad');
                  toast(t('adUnavailable'));
                  resolve(false);
              });
            return;
        }

        if (!this.ysdk) return mockAd().then(resolve);
        let rewarded = false;
        try {
          this.ysdk.adv.showRewardedVideo({
            callbacks: {
              onOpen: () => { this.adOpen = true; Game.pause('ad'); },
              onRewarded: () => { rewarded = true; },
              onClose: () => { this.adOpen = false; Game.resume('ad'); resolve(rewarded); },
              onError: () => { this.adOpen = false; Game.resume('ad'); toast(t('adUnavailable')); resolve(false); },
            },
          });
        } catch (e) { toast(t('adUnavailable')); resolve(false); }
      });
    },

    getProduct(id) { 
        if (isVK) return null; // Покупки для VK в этом примере можно опустить или реализовать через VK Pay
        return this.catalog.find((p) => p.id === id); 
    },

    async purchase(id) {
      if (isVK) {
          toast("Покупки в данной версии временно недоступны");
          return false;
      }
      if (!this.payments) {
        if (!this.mock) { toast(t('purchaseFail')); return false; }
        grantProduct(id);
        return true;
      }
      try {
        Game.pause('purchase');
        const purchase = await this.payments.purchase({ id });

        grantProduct(purchase.productID);
        if (isConsumable(purchase.productID)) await this.payments.consumePurchase(purchase.purchaseToken);
        return true;
      } catch (e) {
        toast(t('purchaseFail'));
        return false;
      } finally { Game.resume('purchase'); }
    },

    async restorePurchases() {
      if (!this.payments) return;
      try {
        const purchases = await this.payments.getPurchases();
        for (const p of purchases) {
          if (isConsumable(p.productID)) {
            grantProduct(p.productID, true);
            await this.payments.consumePurchase(p.purchaseToken);
          } else {
            applyPermanent(p.productID);
          }
        }
        persist(true);
      } catch (e) { /* noop */ }
    },

    async setScore(score) {
      if (!this.ysdk || !this.isAuthorized()) return;
      try {
        if (this.ysdk.leaderboards?.setScore) await this.ysdk.leaderboards.setScore(CONFIG.leaderboard, score);
        else { const lb = await this.ysdk.getLeaderboards(); await lb.setLeaderboardScore(CONFIG.leaderboard, score); }
      } catch (e) { /* noop */ }
    },

    async getEntries() {
      if (!this.ysdk) return null;
      const opts = { quantityTop: 10, includeUser: this.isAuthorized(), quantityAround: 3 };
      try {
        if (this.ysdk.leaderboards?.getEntries) return await this.ysdk.leaderboards.getEntries(CONFIG.leaderboard, opts);
        const lb = await this.ysdk.getLeaderboards();
        return await lb.getLeaderboardEntries(CONFIG.leaderboard, opts);
      } catch (e) { return null; }
    },

    async auth() {
      try { await this.ysdk.auth.openAuthDialog(); await this.initPlayer(); return true; } catch (e) { return false; }
    },

    async canShortcut() {
      try { const r = await this.ysdk?.shortcut?.canShowPrompt(); return !!r?.canShow; } catch (e) { return false; }
    },
    async showShortcut() {
      try { const r = await this.ysdk.shortcut.showPrompt(); return r?.outcome === 'accepted'; } catch (e) { return false; }
    },

    async requestReview() {
      try {
        const { value } = await this.ysdk.feedback.canReview();
        if (value) { Game.pause('review'); await this.ysdk.feedback.requestReview(); Game.resume('review'); }
      } catch (e) { Game.resume('review'); }
    },
  };

  function mockAd() {
    return new Promise((resolve) => {
      const box = $('ad-mock');
      const counter = $('ad-mock-count');
      let n = 3;
      counter.textContent = n;
      box.hidden = false;
      Game.pause('ad');
      const iv = setInterval(() => {
        n -= 1;
        counter.textContent = n;
        if (n <= 0) { clearInterval(iv); box.hidden = true; Game.resume('ad'); resolve(true); }
      }, 700);
    });
  }

  /* ---------------- PRODUCTS ---------------- */
  const isConsumable = (id) => !!CONFIG.products[id] && !CONFIG.products[id].noAds && !CONFIG.products[id].vip;

  function applyPermanent(id) {
    const p = CONFIG.products[id];
    if (!p) return;
    if (!save.bought.includes(id)) save.bought.push(id);
    if (p.noAds) { save.noAds = true; SDK.hideBanner(); }
    if (p.vip) save.vip = true;
  }

  function grantProduct(id, silent = false) {
    const p = CONFIG.products[id];
    if (!p) return;
    const firstTime = !save.bought.includes(id);
    if (p.noAds || p.vip) applyPermanent(id);
    if (p.coins && (isConsumable(id) || firstTime)) addCoins(p.coins);
    persist(true);
    if (!silent) { Sound.play('win'); toast(t('purchaseOk')); }
    UI.refresh();
    if (!$('modal-shop').hidden) UI.renderShop();
  }

  /* ---------------- SOUND ---------------- */
  const Sound = {
    ctx: null,
    ensure() {
      if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (this.ctx.state === 'suspended' && !Game.isHardPaused()) this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    },
    play(name) {
      if (!save.sound || Game.isHardPaused()) return;
      switch (name) {
        case 'click': this.tone(660, 0.08, 'triangle', 0.08); break;
        case 'ok': this.tone(660, 0.12, 'triangle'); this.tone(990, 0.2, 'triangle', 0.15, 0.1); break;
        case 'bad': this.tone(220, 0.25, 'sawtooth', 0.08); this.tone(160, 0.3, 'sawtooth', 0.08, 0.12); break;
        case 'tick': this.tone(1200, 0.05, 'square', 0.04); break;
        case 'coin': this.tone(1320, 0.08, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0.07); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.13, i * 0.1)); break;
        case 'lose': [392, 330, 262].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.15)); break;
        default: break;
      }
    },
    suspend() { try { this.ctx?.suspend(); } catch (e) { /* noop */ } },
    resume() { try { if (save.sound) this.ctx?.resume(); } catch (e) { /* noop */ } },
  };

  const vibrate = (p) => { if (save.vibro && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* noop */ } };

  /* ---------------- COINS / STARS ---------------- */
  function addCoins(n, fromEl) {
    save.coins = Math.max(0, save.coins + n);
    if (n > 0) {
      Sound.play('coin');
      $$('.pill').forEach((p) => { if (p.querySelector('.coins-value')) { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } });
      if (fromEl) flyCoins(fromEl);
    }
    UI.refreshCoins();
  }

  function spendCoins(n) {
    if (save.coins < n) return false;
    save.coins -= n;
    UI.refreshCoins();
    persist();
    return true;
  }

  function flyCoins(fromEl) {
    const target = [...$$('.screen.active .coins-value')][0];
    if (!target) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      c.setAttribute('class', 'coin-fly');
      c.innerHTML = '<use href="#i-coin"/>';
      c.style.left = `${a.left + a.width / 2 - 13 + (Math.random() * 40 - 20)}px`;
      c.style.top = `${a.top + a.height / 2 - 13}px`;
      document.body.appendChild(c);
      requestAnimationFrame(() => {
        setTimeout(() => {
          c.style.transform = `translate(${b.left - a.left - a.width / 2 + 10}px, ${b.top - a.top - a.height / 2}px) scale(0.6)`;
          c.style.opacity = '0.2';
        }, i * 60);
      });
      setTimeout(() => c.remove(), 1200 + i * 60);
    }
  }

  const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
  const isCatUnlocked = (cat) => save.vip || totalStars() >= cat.unlockStars || save.bought.includes(`cat_${cat.id}`);

  /* ---------------- UI ---------------- */
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  const UI = {
    current: 'loader',
    openModals: [],

    show(name) {
      $$('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
      this.current = name;
      if (name === 'menu') this.renderMenu();
      if (name === 'levels') this.renderLevels();
    },

    applyI18n() {
      document.documentElement.lang = lang;
      $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
      $$('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
      $$('.free-coins-amount').forEach((el) => { el.textContent = CONFIG.freeCoinsAd; });
      $('hint-fifty').querySelector('.cost').textContent = CONFIG.hintCost.fifty;
      $('hint-time').querySelector('.cost').textContent = CONFIG.hintCost.time;
      $('hint-skip').querySelector('.cost').textContent = CONFIG.hintCost.skip;
      $('revive-cost').textContent = CONFIG.reviveCost;
      $('settings-version').textContent = `v${CONFIG.version}`;
    },

    refreshCoins() { $$('.coins-value').forEach((el) => { el.textContent = save.coins; }); },

    refresh() {
      this.refreshCoins();
      $$('.stars-value').forEach((el) => { el.textContent = totalStars(); });
      $('best-score').textContent = save.best;
      $('daily-badge').hidden = !Daily.available();
      if (this.current === 'menu') this.renderMenu();
      if (this.current === 'levels') this.renderLevels();
    },

    renderMenu() {
      this.refreshCoins();
      $$('.stars-value').forEach((el) => { el.textContent = totalStars(); });
      $('best-score').textContent = save.best;
      $('daily-badge').hidden = !Daily.available();
      const next = nextLevel();
      $('play-sub').textContent = next ? t('continueLvl', { cat: tr(next.cat.name), lvl: t('levelN', { n: next.num }) }) : t('allDone');
      $('levels-sub').textContent = t('starsOf', { a: totalStars(), b: LEVELS.length * 3 });
    },

    renderLevels() {
      const list = $('categories-list');
      const stars = totalStars();
      list.innerHTML = CATEGORIES.map((cat) => {
        const unlocked = isCatUnlocked(cat);
        const levels = LEVELS.filter((l) => l.cat.id === cat.id);
        const got = levels.reduce((a, l) => a + (save.stars[l.key] || 0), 0);
        const lvls = levels.map((l) => {
          const s = save.stars[l.key] || 0;
          return `<button class="lvl-btn ${s ? 'done' : ''}" data-level="${l.key}" ${unlocked ? '' : 'disabled'} aria-label="${esc(t('levelN', { n: l.num }))}">
            ${l.num}<span class="lvl-stars">${[1, 2, 3].map((i) => icon('star', i <= s ? 'on' : '')).join('')}</span></button>`;
        }).join('');
        const lock = unlocked ? '' : `<div class="cat-lock">
            <p>${icon('lock')} ${esc(t('unlockStars', { n: cat.unlockStars }))} (${stars}/${cat.unlockStars})</p>
            <button class="btn btn-primary" data-unlock="${cat.id}">${esc(t('unlockFor'))} <span class="tag">${icon('coin', 'i-sm')}${cat.unlockCost}</span></button>
          </div>`;
        return `<article class="cat-card ${unlocked ? '' : 'locked'}" style="--cat-color:${cat.color}">
          <div class="cat-head"><h3 class="cat-name">${esc(tr(cat.name))}</h3>
          <span class="cat-meta">${icon('star')} ${got}/${levels.length * 3}</span></div>
          ${lock}<div class="cat-levels">${lvls}</div></article>`;
      }).join('');
    },

    openModal(id) {
      const m = $(id);
      if (!m.hidden) return;
      m.hidden = false;
      $('modal-backdrop').hidden = false;
      this.openModals.push(id);
      Game.pause('modal');
    },

    closeModal(id) {
      const m = $(id);
      if (m.hidden) return;
      m.hidden = true;
      this.openModals = this.openModals.filter((x) => x !== id);
      if (!this.openModals.length) { $('modal-backdrop').hidden = true; Game.resume('modal'); }
    },

    closeAll() { [...this.openModals].forEach((id) => this.closeModal(id)); },

    renderShop() {
      const order = ['vip', 'coins_small', 'coins_medium', 'coins_large', 'no_ads'];
      $('shop-list').innerHTML = order.map((id) => {
        const cfg = CONFIG.products[id];
        const [title, desc] = t('products')[id];
        const product = SDK.getProduct(id);
        const owned = !isConsumable(id) && save.bought.includes(id);
        let price = `${cfg.fallbackPrice} YAN`;
        if (product) {
          const img = product.getPriceCurrencyImage ? product.getPriceCurrencyImage('small') : '';
          price = img ? `${esc(product.priceValue)} <img src="${esc(img)}" alt="${esc(product.priceCurrencyCode || '')}">` : esc(product.price);
        }
        const wide = id === 'vip' || id === 'no_ads';
        const ribbon = cfg.ribbon ? `<span class="product-ribbon">${esc(t('ribbons')[cfg.ribbon])}</span>` : '';
        const iconCls = cfg.icon === 'crown' ? 'star-c' : '';
        return `<button class="product ${wide ? 'wide' : ''} ${id === 'vip' ? 'featured' : ''} ${owned ? 'owned' : ''}" data-product="${id}" ${owned ? 'disabled' : ''}>
          ${ribbon}<span class="product-icon">${icon(cfg.icon, iconCls)}</span>
          <span class="product-info"><span class="product-title">${esc(title)}</span><span class="product-desc">${esc(desc)}</span></span>
          <span class="product-price">${owned ? esc(t('owned')) : price}</span></button>`;
      }).join('');
      this.refreshCoins();
    },

    async renderLeaders() {
      const list = $('leaders-list');
      const authBtn = $('btn-auth');
      list.innerHTML = '<div class="spinner-wrap" style="position:relative;padding:30px"><div class="spinner"></div></div>';
      authBtn.hidden = SDK.mock || SDK.isAuthorized();
      const data = await SDK.getEntries();
      if (!data || !data.entries || !data.entries.length) {
        list.innerHTML = `<div class="leader me"><span class="leader-rank">-</span><span class="leader-name">${esc(t('you'))}</span><span class="leader-score">${save.best}</span></div>
          <p class="leaders-empty">${esc(SDK.mock ? t('lbEmpty') : (SDK.isAuthorized() ? t('lbEmpty') : t('loginFirst')))}</p>`;
        return;
      }
      const myRank = data.userRank;
      list.innerHTML = data.entries.map((e) => {
        const name = e.player?.publicName || '—';
        const ava = e.player?.getAvatarSrc ? e.player.getAvatarSrc('small') : '';
        return `<div class="leader ${e.rank === myRank ? 'me' : ''}"><span class="leader-rank">${e.rank}</span>
          ${ava ? `<img class="leader-ava" src="${esc(ava)}" alt="">` : '<span class="leader-ava"></span>'}
          <span class="leader-name">${esc(name)}</span><span class="leader-score">${e.score}</span></div>`;
      }).join('');
    },
  };

  function nextLevel() {
    return LEVELS.find((l) => isCatUnlocked(l.cat) && !save.stars[l.key]) || null;
  }

  /* ---------------- DAILY ---------------- */
  const Daily = {
    available() { return save.daily.last !== dayNumber(); },
    streakIndex() {
      const today = dayNumber();
      if (save.daily.last === today) return (save.daily.streak - 1 + 7) % 7;
      if (save.daily.last === today - 1) return save.daily.streak % 7;
      return 0;
    },
    render() {
      const idx = this.streakIndex();
      const avail = this.available();
      $('daily-grid').innerHTML = CONFIG.daily.map((r, i) => {
        const cls = i < idx || (!avail && i === idx) ? 'claimed' : i === idx && avail ? 'today' : '';
        return `<div class="day ${cls} ${i === 6 ? 'big' : ''}"><span>${esc(t('day', { n: i + 1 }))}</span><b>${icon('coin', 'i-sm')}${r}</b></div>`;
      }).join('');
      $('btn-daily-claim').disabled = !avail;
      $('btn-daily-x2').disabled = !avail;
      $('btn-daily-claim').textContent = avail ? t('claim') : t('comeTomorrow');
    },
    claim(mult, el) {
      if (!this.available()) return;
      const idx = this.streakIndex();
      const today = dayNumber();
      save.daily.streak = save.daily.last === today - 1 ? save.daily.streak + 1 : 1;
      save.daily.last = today;
      const amount = CONFIG.daily[idx] * mult;
      addCoins(amount, el);
      toast(t('gotCoins', { n: amount }));
      persist(true);
      this.render();
      UI.refresh();
    },
  };

  /* ---------------- GAME ---------------- */
  const pauseReasons = new Set();
  const HARD_PAUSE = ['ad', 'sdk', 'hidden', 'purchase', 'review'];
  let run = null;
  let clipToken = 0;
  let tickTimer = null;
  let lastTick = 0;
  let nextRoundTimer = null;
  let player = null;
  let lastSeekAt = 0;

  const destroyPlayer = () => {
    if (player) { player.destroy(); player = null; }
    const host = $('clip-host');
    host.classList.remove('ready');
    host.replaceChildren();
  };

  const Game = {
    isPaused() { return pauseReasons.size > 0; },
    isHardPaused() { return HARD_PAUSE.some((r) => pauseReasons.has(r)); },

    pause(reason) {
      const was = this.isPaused();
      pauseReasons.add(reason);
      if (HARD_PAUSE.includes(reason)) Sound.suspend();
      if (!was) {
        if (player) player.pause();
        if (run && run.active) SDK.gameplayStop();
      }
    },

    resume(reason) {
      pauseReasons.delete(reason);
      if (!this.isHardPaused()) Sound.resume();
      if (this.isPaused()) return;
      if (run && run.active && UI.current === 'game') {
        SDK.gameplayStart();
        if (!run.answered && player) player.play();
        lastTick = performance.now();
      }
    },

    startLevel(level) {
      run = {
        mode: 'level', level, queue: shuffle(level.movies), index: 0, lives: CONFIG.lives,
        score: 0, streak: 0, mistakes: 0, correct: 0, coinsEarned: 0, revived: false, results: [],
      };
      this.begin();
    },

    startEndless() {
      const pool = ALL_MOVIES.filter((m) => isCatUnlocked(CATEGORIES.find((c) => c.id === m.cat)));
      run = {
        mode: 'endless', pool, queue: shuffle(pool), index: 0, lives: CONFIG.lives,
        score: 0, streak: 0, mistakes: 0, correct: 0, coinsEarned: 0, revived: false, results: [],
      };
      this.begin();
    },

    begin() {
      run.active = true;
      UI.closeAll();
      UI.show('game');
      $('hud-title').textContent = run.mode === 'level' ? `${tr(run.level.cat.name)} · ${t('levelN', { n: run.level.num })}` : t('endless');
      this.renderLives();
      this.renderScore();
      SDK.gameplayStart();
      this.nextRound();
    },

    roundTime() {
      if (run.mode !== 'endless') return CONFIG.roundTime;
      return Math.max(CONFIG.endlessMinTime, CONFIG.roundTime - Math.floor(run.index / 5) * 1.5);
    },

    nextRound() {
      clearTimeout(nextRoundTimer);
      if (!run || !run.active) return;
      if (run.mode === 'level' && run.index >= run.queue.length) { this.finish(true); return; }
      if (run.mode === 'endless' && run.index >= run.queue.length) run.queue = run.queue.concat(shuffle(run.pool));

      const movie = run.queue[run.index];
      run.current = movie;
      run.answered = false;
      run.clipReady = false;
      run.hints = {};
      run.timeLeft = this.roundTime();
      run.timeTotal = run.timeLeft;
      run.lastTickSec = Math.ceil(run.timeLeft);

      const pool = ALL_MOVIES.filter((m) => m.id !== movie.id);
      const sameCat = shuffle(pool.filter((m) => m.cat === movie.cat));
      const others = shuffle(pool.filter((m) => m.cat !== movie.cat));
      const distractors = sameCat.slice(0, 2).concat(others).slice(0, 3);
      run.options = shuffle([movie, ...distractors]);

      this.renderOptions();
      this.renderDots();
      this.updateHints();
      this.renderTimer();
      $('reveal').hidden = true;
      $('combo-badge').hidden = run.streak < 2;
      if (run.streak >= 2) $('combo-badge').textContent = t('combo', { n: this.multiplier().toFixed(2).replace(/\.?0+$/, '') });
      this.loadClip(movie);
    },

    async loadClip(movie) {
      this.stopTimer();
      const token = ++clipToken;
      destroyPlayer();
      $('clip-fallback').hidden = true;
      $('clip-spinner').hidden = false;
      $('clip-progress').style.width = '0%';
      run.clipStart = 0;

      const deadline = performance.now() + CONFIG.clipTotalTimeout;
      const host = $('clip-host');
      const KP = window.KinoPlayer;

      for (const src of clipSources(movie)) {
        const left = deadline - performance.now();
        if (!KP || left < 2000) break;
        const start = pickClipStart(src);
        const ctrl = KP.create(host, src, {
          start,
          muted: !save.sound,
          timeout: Math.min(CONFIG.videoTimeout, left),
          onTime: (time) => { if (token === clipToken) this.onTimeUpdate(time); },
        });
        player = ctrl;
        if (this.isPaused()) ctrl.pause();
        // eslint-disable-next-line no-await-in-loop
        const ok = await ctrl.ready;
        if (token !== clipToken || !run) { ctrl.destroy(); return; }
        if (ok) {
          run.clipStart = start;
          run.clipReady = true;
          lastSeekAt = performance.now();
          host.classList.add('ready');
          $('clip-spinner').hidden = true;
          if (this.isPaused()) ctrl.pause();
          this.startTimer();
          return;
        }
        console.warn('[КиноКадр] Источник не запустился', { movie: movie.id, source: src });
        destroyPlayer();
      }

      if (token !== clipToken || !run) return;
      destroyPlayer();
      $('clip-spinner').hidden = true;
      $('fallback-text').textContent = tr(movie.scene);
      $('fallback-year').textContent = movie.year;
      $('clip-fallback').hidden = false;
      console.warn('[КиноКадр] Все попытки завершились без видео',
        movie.id, window.KinoPlayer?.getDiagnostics());
      run.clipReady = false;
      this.startTimer();
    },

    replay() {
      if (!run || !run.clipReady || !player) return;
      Sound.play('click');
      lastSeekAt = performance.now();
      player.seek(run.clipStart);
      if (!this.isPaused()) player.play();
    },

    onTimeUpdate(time) {
      if (!run || !run.current || !run.clipReady || !player) return;
      const rel = time - run.clipStart;
      const sinceSeek = performance.now() - lastSeekAt;
      // Зацикливаем отрывок; после перемотки плеер ещё мгновение шлёт старое время — игнорируем
      if ((rel >= CONFIG.clipLength || rel < -2) && sinceSeek > 1200) {
        lastSeekAt = performance.now();
        player.seek(run.clipStart);
        if (!this.isPaused()) player.play();
        return;
      }
      $('clip-progress').style.width = `${Math.max(0, Math.min(100, (rel / CONFIG.clipLength) * 100))}%`;
    },

    startTimer() {
      clearInterval(tickTimer);
      lastTick = performance.now();
      tickTimer = setInterval(() => this.tick(), 100);
    },

    stopTimer() { clearInterval(tickTimer); tickTimer = null; },

    tick() {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      if (!run || run.answered || this.isPaused()) return;
      run.timeLeft = Math.max(0, run.timeLeft - dt);
      const sec = Math.ceil(run.timeLeft);
      if (sec !== run.lastTickSec) {
        run.lastTickSec = sec;
        if (sec <= 5 && sec > 0) Sound.play('tick');
      }
      this.renderTimer();
      if (run.timeLeft <= 0) this.answer(-1);
    },

    renderTimer() {
      const ratio = run ? run.timeLeft / run.timeTotal : 1;
      $('timer-circle').style.strokeDashoffset = `${125.66 * (1 - ratio)}`;
      $('timer-text').textContent = run ? Math.ceil(run.timeLeft) : CONFIG.roundTime;
      const timer = $('timer-text').parentElement;
      timer.classList.toggle('warn', ratio <= 0.5 && ratio > 0.25);
      timer.classList.toggle('danger', ratio <= 0.25);
    },

    multiplier() { return 1 + 0.25 * Math.min(run.streak, 4); },

    renderOptions() {
      const keys = ['A', 'B', 'C', 'D'];
      $('options').innerHTML = run.options.map((m, i) =>
        `<button class="opt" data-opt="${i}"><span class="opt-key">${keys[i]}</span><span>${esc(tr(m.title))}</span></button>`).join('');
    },

    renderDots() {
      const dots = $('round-dots');
      if (run.mode === 'endless') {
        dots.innerHTML = `<span class="round-count">${esc(t('roundN', { n: run.index + 1 }))}</span>`;
        return;
      }
      dots.innerHTML = run.queue.map((_, i) => {
        const r = run.results[i];
        return `<i class="${r || (i === run.index ? 'cur' : '')}"></i>`;
      }).join('');
    },

    renderLives(popIndex = -1) {
      const max = Math.max(CONFIG.lives, run.lives);
      $('hud-lives').innerHTML = Array.from({ length: max }, (_, i) =>
        icon('heart', `${i >= run.lives ? 'lost' : ''} ${i === popIndex ? 'pop' : ''}`)).join('');
    },

    renderScore() { $('hud-score').textContent = run.score; },

    updateHints() {
      const locked = !run || run.answered;
      $('hint-fifty').disabled = locked || !!run.hints.fifty;
      $('hint-time').disabled = locked || !!run.hints.time;
      $('hint-skip').disabled = locked;
    },

    answer(idx) {
      if (!run || run.answered) return;
      run.answered = true;
      clipToken += 1; // Отменить незавершённую загрузку этого раунда.
      if (player) player.pause();
      this.stopTimer();
      const correctIdx = run.options.findIndex((m) => m.id === run.current.id);
      const buttons = [...$('options').children];
      buttons.forEach((b) => { b.disabled = true; });
      buttons[correctIdx].classList.add('correct');
      const isSkip = idx === -2;
      const ok = idx === correctIdx;

      let status = 'bad';
      if (ok) {
        status = 'ok';
        run.streak += 1;
        run.correct += 1;
        const pts = Math.round((100 + Math.ceil(run.timeLeft) * 5) * this.multiplier());
        run.score += pts;
        const coins = 5 + Math.floor(run.timeLeft / 4);
        run.coinsEarned += coins;
        Sound.play('ok');
        vibrate(30);
      } else if (isSkip) {
        status = 'skip';
        run.streak = 0;
      } else {
        if (idx >= 0) buttons[idx].classList.add('wrong');
        run.streak = 0;
        run.mistakes += 1;
        run.lives -= 1;
        this.renderLives(run.lives);
        Sound.play('bad');
        vibrate([60, 40, 60]);
        const wrap = $('video-wrap');
        wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
      }
      run.results[run.index] = status;
      this.renderScore();
      this.renderDots();
      this.updateHints();

      const rs = $('reveal-status');
      rs.className = `reveal-status ${status}`;
      rs.textContent = status === 'ok' ? t('ok') : status === 'skip' ? t('skipped') : idx === -1 ? t('timeout') : t('wrong');
      $('reveal-title').textContent = tr(run.current.title);
      $('reveal-year').textContent = run.current.year;
      $('reveal').hidden = false;

      run.index += 1;
      nextRoundTimer = setTimeout(() => {
        if (!run || !run.active) return;
        if (run.lives <= 0) this.outOfLives();
        else this.nextRound();
      }, 1700);
    },

    useHint(type, viaAd = false) {
      if (!run || run.answered) return;
      if (type !== 'skip' && run.hints[type]) return;
      if (!viaAd) {
        const cost = CONFIG.hintCost[type];
        if (!spendCoins(cost)) {
          run.pendingHint = type;
          $('nocoins-text').textContent = t('needCoins', { n: cost });
          UI.openModal('modal-nocoins');
          return;
        }
      }
      Sound.play('click');
      run.hints[type] = true;
      if (type === 'fifty') {
        const correctIdx = run.options.findIndex((m) => m.id === run.current.id);
        const wrong = shuffle(run.options.map((_, i) => i).filter((i) => i !== correctIdx)).slice(0, 2);
        wrong.forEach((i) => { const b = $('options').children[i]; b.classList.add('removed'); b.disabled = true; });
      } else if (type === 'time') {
        run.timeLeft += 10;
        run.timeTotal = Math.max(run.timeTotal, run.timeLeft);
        this.renderTimer();
      } else if (type === 'skip') {
        this.answer(-2);
      }
      this.updateHints();
    },

    outOfLives() {
      SDK.gameplayStop();
      clipToken += 1;
      destroyPlayer();
      Sound.play('lose');
      $('btn-revive-ad').hidden = run.revived;
      $('btn-revive-coins').disabled = save.coins < CONFIG.reviveCost;
      UI.openModal('modal-revive');
    },

    revive() {
      run.revived = true;
      run.lives = 2;
      this.renderLives();
      UI.closeModal('modal-revive');
      this.nextRound();
    },

    finish(win) {
      if (!run) return;
      run.active = false;
      this.stopTimer();
      clearTimeout(nextRoundTimer);
      SDK.gameplayStop();
      clipToken += 1;
      destroyPlayer();

      let stars = 0;
      let reward = run.coinsEarned;
      let title = '';
      let sub = '';
      let newRecord = false;

      if (run.mode === 'level') {
        if (win) {
          stars = run.mistakes === 0 ? 3 : run.mistakes === 1 ? 2 : 1;
          const prev = save.stars[run.level.key] || 0;
          if (stars > prev) save.stars[run.level.key] = stars;
          reward += CONFIG.levelReward[stars];
          save.wins += 1;
          title = t('levelDone');
          sub = stars === 3 ? t('perfect') : t('good');
          Sound.play('win');
        } else {
          title = t('levelFail');
          sub = t('levelFailSub');
          reward = Math.floor(reward / 2);
        }
      } else {
        title = t('endlessOver');
        if (run.score > save.best) { save.best = run.score; newRecord = true; SDK.setScore(save.best); }
        sub = newRecord ? `<span class="new-record">${esc(t('newRecord'))}</span>` : esc(t('bestIs', { n: save.best }));
        stars = run.correct >= 15 ? 3 : run.correct >= 8 ? 2 : run.correct >= 3 ? 1 : 0;
        if (newRecord) Sound.play('win');
      }

      run.reward = reward;
      run.win = win;
      addCoins(reward);
      persist(true);

      $('result-stars').innerHTML = [1, 2, 3].map((i) => icon('star', i <= stars ? 'on' : '')).join('');
      $('result-title').textContent = title;
      $('result-sub').innerHTML = run.mode === 'level' ? esc(sub) : sub;
      $('result-score').textContent = run.score;
      $('result-correct').textContent = run.mode === 'level' ? `${run.correct}/${run.queue.length}` : run.correct;
      $('result-coins').textContent = reward;
      $('btn-double').hidden = reward <= 0;
      $('btn-double').disabled = false;
      const hasNext = run.mode === 'level' && win && !!this.levelAfter(run.level);
      $('btn-result-next').hidden = !hasNext;
      $('btn-result-retry').hidden = hasNext && stars === 3;
      UI.openModal('modal-result');

      if (run.mode === 'level' && win && save.wins === 3 && !save.reviewed) {
        save.reviewed = true; persist();
        setTimeout(() => SDK.requestReview(), 1500);
      }
    },

    levelAfter(level) {
      const i = LEVELS.indexOf(level);
      const next = LEVELS[i + 1];
      return next && isCatUnlocked(next.cat) ? next : null;
    },

    exitToMenu() {
      if (run) run.active = false;
      this.stopTimer();
      clearTimeout(nextRoundTimer);
      clipToken += 1;
      SDK.gameplayStop();
      destroyPlayer();
      run = null;
      UI.closeAll();
      UI.show('menu');
    },
  };

  /* ---------------- EVENTS ---------------- */
  function bind() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? Game.pause('hidden') : Game.resume('hidden')));

    document.addEventListener('click', async (e) => {
      const el = e.target.closest('[data-action], [data-close], [data-level], [data-unlock], [data-product], [data-opt], [data-lang]');
      if (!el) return;
      if (el.dataset.close !== undefined) { Sound.play('click'); UI.closeModal(el.closest('.modal').id); return; }
      if (el.dataset.opt !== undefined) { Game.answer(Number(el.dataset.opt)); return; }
      if (el.dataset.level) {
        Sound.play('click');
        const lvl = LEVELS.find((l) => l.key === el.dataset.level);
        if (lvl) Game.startLevel(lvl);
        return;
      }
      if (el.dataset.unlock) {
        const cat = CATEGORIES.find((c) => c.id === el.dataset.unlock);
        if (!cat) return;
        if (spendCoins(cat.unlockCost)) {
          save.bought.push(`cat_${cat.id}`);
          persist(true);
          Sound.play('win');
          toast(t('unlocked'));
          UI.refresh();
        } else {
          toast(t('needCoins', { n: cat.unlockCost }));
          UI.renderShop();
          UI.openModal('modal-shop');
        }
        return;
      }
      if (el.dataset.product) { Sound.play('click'); await SDK.purchase(el.dataset.product); return; }
      if (el.dataset.lang) {
        lang = el.dataset.lang; save.lang = lang; persist();
        UI.applyI18n(); UI.refresh(); UI.renderShop();
        return;
      }
      Sound.play('click');
      switch (el.dataset.action) {
        case 'shop': UI.renderShop(); UI.openModal('modal-shop'); break;
        case 'leaders': UI.openModal('modal-leaders'); UI.renderLeaders(); break;
        case 'daily': Daily.render(); UI.openModal('modal-daily'); break;
        case 'settings':
          $('set-sound').checked = save.sound;
          $('set-vibro').checked = save.vibro;
          UI.openModal('modal-settings');
          break;
        default: break;
      }
    });

    $('btn-play').addEventListener('click', () => {
      Sound.play('click');
      const lvl = nextLevel();
      if (lvl) Game.startLevel(lvl); else UI.show('levels');
    });
    $('btn-endless').addEventListener('click', () => { Sound.play('click'); Game.startEndless(); });
    $('btn-levels').addEventListener('click', () => { Sound.play('click'); UI.show('levels'); });
    $('btn-levels-back').addEventListener('click', () => { Sound.play('click'); UI.show('menu'); });

    const freeCoins = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const ok = await SDK.showRewarded();
      btn.disabled = false;
      if (ok) { addCoins(CONFIG.freeCoinsAd, btn); toast(t('gotCoins', { n: CONFIG.freeCoinsAd })); persist(); }
    };
    $('btn-free-coins').addEventListener('click', freeCoins);
    $('btn-shop-free').addEventListener('click', freeCoins);

    $('btn-shortcut').addEventListener('click', async () => {
      const ok = await SDK.showShortcut();
      if (ok && !save.shortcut) {
        save.shortcut = true;
        addCoins(100);
        toast(t('shortcutOk', { n: 100 }));
        persist(true);
      }
      $('btn-shortcut').hidden = true;
    });

    // Game
    $('btn-game-back').addEventListener('click', () => { Sound.play('click'); UI.openModal('modal-exit'); });
    $('btn-exit-yes').addEventListener('click', async () => { Game.exitToMenu(); await SDK.showFullscreen(); });
    $('btn-replay').addEventListener('click', () => Game.replay());
    $('hint-fifty').addEventListener('click', () => Game.useHint('fifty'));
    $('hint-time').addEventListener('click', () => Game.useHint('time'));
    $('hint-skip').addEventListener('click', () => Game.useHint('skip'));

    document.addEventListener('keydown', (e) => {
      if (UI.current !== 'game' || UI.openModals.length) return;
      const n = ['1', '2', '3', '4'].indexOf(e.key);
      const k = ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase());
      const idx = n >= 0 ? n : k;
      if (idx >= 0) { const b = $('options').children[idx]; if (b && !b.disabled) Game.answer(idx); }
      if (e.key === ' ') { e.preventDefault(); Game.replay(); }
    });

    $('btn-nocoins-ad').addEventListener('click', async () => {
      const type = run && run.pendingHint;
      UI.closeModal('modal-nocoins');
      const ok = await SDK.showRewarded();
      if (ok && type) Game.useHint(type, true);
    });
    $('btn-nocoins-shop').addEventListener('click', () => {
      UI.closeModal('modal-nocoins');
      UI.renderShop();
      UI.openModal('modal-shop');
    });

    // Revive
    $('btn-revive-ad').addEventListener('click', async () => {
      const ok = await SDK.showRewarded();
      if (ok) Game.revive();
    });
    $('btn-revive-coins').addEventListener('click', () => {
      if (spendCoins(CONFIG.reviveCost)) { Game.revive(); persist(); }
    });
    $('btn-revive-no').addEventListener('click', () => {
      UI.closeModal('modal-revive');
      Game.finish(run.mode === 'endless');
    });

    // Result
    $('btn-double').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const ok = await SDK.showRewarded();
      if (ok && run) {
        addCoins(run.reward, btn);
        $('result-coins').textContent = run.reward * 2;
        persist(true);
        btn.hidden = true;
      } else btn.disabled = false;
    });

    const afterResult = async (action) => {
      const prev = run;
      UI.closeModal('modal-result');
      await SDK.showFullscreen();
      if (action === 'menu' || !prev) { Game.exitToMenu(); return; }
      if (action === 'retry') { prev.mode === 'level' ? Game.startLevel(prev.level) : Game.startEndless(); return; }
      if (action === 'next') {
        const next = Game.levelAfter(prev.level);
        if (next) Game.startLevel(next); else { Game.exitToMenu(); UI.show('levels'); }
      }
    };
    $('btn-result-menu').addEventListener('click', () => afterResult('menu'));
    $('btn-result-retry').addEventListener('click', () => afterResult('retry'));
    $('btn-result-next').addEventListener('click', () => afterResult('next'));

    // Daily
    $('btn-daily-claim').addEventListener('click', (e) => Daily.claim(1, e.currentTarget));
    $('btn-daily-x2').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const ok = await SDK.showRewarded();
      if (ok) Daily.claim(2, btn);
    });

    // Leaders auth
    $('btn-auth').addEventListener('click', async () => {
      const ok = await SDK.auth();
      if (ok) {
        const cloud = await SDK.loadData();
        if (cloud && (cloud.updated || 0) > save.updated) save = { ...DEFAULT_SAVE, ...cloud };
        if (save.best) SDK.setScore(save.best);
        persist(true);
        UI.refresh();
        UI.renderLeaders();
      }
    });

    // Settings
    $('set-sound').addEventListener('change', (e) => {
      save.sound = e.target.checked;
      if (player) player.setMuted(!save.sound);
      persist();
    });
    $('set-vibro').addEventListener('change', (e) => { save.vibro = e.target.checked; persist(); });
  }

  /* ---------------- BOOT ---------------- */
  async function boot() {
    const bar = $('loader-bar');
    bar.style.width = '15%';
    await SDK.init();
    bar.style.width = '50%';
    await loadSave();
    lang = save.lang || SDK.lang();
    bar.style.width = '75%';
    UI.applyI18n();
    bind();
    await SDK.restorePurchases();
    bar.style.width = '100%';
    await sleep(350);

    UI.show('menu');
    UI.refresh();
    SDK.ready();
    SDK.showBanner();
    SDK.showFullscreen();

    if (Daily.available()) setTimeout(() => { if (UI.current === 'menu' && !UI.openModals.length) { Daily.render(); UI.openModal('modal-daily'); } }, 900);
    if (!save.shortcut && (await SDK.canShortcut())) $('btn-shortcut').hidden = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
