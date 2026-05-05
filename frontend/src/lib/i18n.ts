export type Lang = 'tr' | 'en';

export type Translations = {
  connecting: string;
  connectingToServer: string;
  youWin: string;
  gameOver: string;
  draw: string;
  wins: string;
  finalScores: string;
  backToLobby: string;
  words: (n: number) => string;
  syllable: string;
  correct: string;
  players: string;
  name: string;
  wordsHeader: string;
  lives: string;
  yourLetters: string;
  chat: string;
  noMessages: string;
  chatPlaceholder: string;
  yourTurn: string;
  typeWord: string;
  waitingTurn: string;
  send: string;
  tagline: string;
  nickname: string;
  enterName: string;
  avatar: string;
  turnDuration: string;
  fixed: string;
  range: string;
  seconds: string;
  min: string;
  max: string;
  startNewRoom: string;
  creating: string;
  orJoin: string;
  roomCode: string;
  join: string;
  settings: string;
  dictionary: string;
  roomCodeLabel: string;
  shareCode: string;
  host: string;
  ready: string;
  notReady: string;
  readyCheck: string;
  readyUp: string;
  startGame: string;
  enterNickname: string;
  notConnected: string;
  fixedTimeError: string;
  rangeError: string;
  serverNoResponse: string;
  enterRoomCode: string;
  failedCreate: string;
  failedJoin: string;
  back: string;
  dictionaryTitle: string;
  loading: string;
  turkishWords: (n: string) => string;
  escHint: string;
  searchPlaceholder: string;
  matchesSuffix: (n: number) => string;
  totalWordsSuffix: string;
  pageLabel: string;
  noWords: string;
  clear: string;
  noWordsFoundFor: (s: string) => string;
  noWordsFound: string;
  prev: string;
  next: string;
  letterWords: (n: string) => string;
  settingsTitle: string;
  configureExp: string;
  soundEffects: string;
  soundDesc: string;
  language: string;
  langDesc: string;
  landingHeadline: string;
  landingSubline: string;
  landingNoBadge: string;
  landingCta: string;
  landingHowTitle: string;
  landingStep1Title: string;
  landingStep1Desc: string;
  landingStep2Title: string;
  landingStep2Desc: string;
  landingStep3Title: string;
  landingStep3Desc: string;
  landingFeatTitle: string;
  landingFeat1: string;
  landingFeat2: string;
  landingFeat3: string;
  landingFeat4: string;
  landingStartBtn: string;
  landingDictBtn: string;
  landingFooterTag: string;
};

export const translations: Record<Lang, Translations> = {
  en: {
    connecting: 'Connecting…',
    connectingToServer: 'Connecting to server…',
    youWin: 'You Win!',
    gameOver: 'Game Over',
    draw: 'Draw',
    wins: 'wins!',
    finalScores: 'Final scores',
    backToLobby: 'Back to Lobby',
    words: (n) => `${n} word${n !== 1 ? 's' : ''}`,
    syllable: 'syllable',
    correct: '✓ Correct!',
    players: 'Players',
    name: 'Name',
    wordsHeader: 'Words',
    lives: 'Lives',
    yourLetters: 'Your letters',
    chat: 'Chat',
    noMessages: 'No messages yet…',
    chatPlaceholder: 'Chat…',
    yourTurn: 'Your Turn',
    typeWord: 'Type a word…',
    waitingTurn: 'Waiting for your turn…',
    send: 'Send',
    tagline: 'Type words containing the syllable before the bomb explodes!',
    nickname: 'Nickname',
    enterName: 'Enter your name…',
    avatar: 'Avatar',
    turnDuration: 'Turn Duration',
    fixed: 'Fixed',
    range: 'Range',
    seconds: 'seconds',
    min: 'Min',
    max: 'Max',
    startNewRoom: '💣 Start a New Room',
    creating: 'Creating…',
    orJoin: 'or join existing',
    roomCode: 'Room code',
    join: 'Join',
    settings: '⚙ Settings',
    dictionary: '📖 Dictionary',
    roomCodeLabel: 'Room Code',
    shareCode: 'Share this code to invite friends',
    host: 'host',
    ready: 'Ready',
    notReady: 'Not ready',
    readyCheck: '✓ Ready',
    readyUp: 'Ready Up',
    startGame: 'Start Game',
    enterNickname: 'Please enter a nickname',
    notConnected: 'Not connected',
    fixedTimeError: 'Fixed time must be 3–60 seconds',
    rangeError: 'Range must be 3–60 s and min ≤ max',
    serverNoResponse: 'Server did not respond. Is the backend running?',
    enterRoomCode: 'Enter a room code',
    failedCreate: 'Failed to create room',
    failedJoin: 'Failed to join room',
    back: '← Back',
    dictionaryTitle: 'Dictionary',
    loading: 'Loading…',
    turkishWords: (n) => `${n} Turkish words`,
    escHint: 'ESC to go back',
    searchPlaceholder: 'Search all words…',
    matchesSuffix: (n) => (n !== 1 ? 'matches' : 'match'),
    totalWordsSuffix: 'total words',
    pageLabel: 'page',
    noWords: 'No words',
    clear: '✕ Clear',
    noWordsFoundFor: (s) => `No words found for "${s}"`,
    noWordsFound: 'No words found',
    prev: '‹ Prev',
    next: 'Next ›',
    letterWords: (n) => `${n} words`,
    settingsTitle: 'Settings',
    configureExp: 'Configure your experience',
    soundEffects: 'Sound Effects',
    soundDesc: 'Tick sounds and word feedback',
    language: 'Language',
    langDesc: 'Switch between Turkish and English',
    landingHeadline: 'Find the Word Before the Bomb Explodes — Now',
    landingSubline: 'In BombParty, every second counts. Each turn you must type a word containing the displayed syllable — or the bomb goes off. Play live with friends, test your Turkish vocabulary, and be the last one standing.',
    landingNoBadge: 'No sign-up required',
    landingCta: 'Play Now',
    landingHowTitle: 'How It Works',
    landingStep1Title: 'Start Your Turn',
    landingStep1Desc: 'Create a room or share the link — friends join instantly, no account needed.',
    landingStep2Title: 'Type a Word',
    landingStep2Desc: 'Write a Turkish word that contains the displayed syllable before the timer runs out.',
    landingStep3Title: 'Score or Explode',
    landingStep3Desc: 'Correct words push you ahead. Run out of time and you lose a life. Last one standing wins.',
    landingFeatTitle: 'Why BombParty?',
    landingFeat1: '2–12 players, real-time multiplayer',
    landingFeat2: 'No sign-up — runs entirely in your browser',
    landingFeat3: 'Turkish alphabet bonus (all 29 letters)',
    landingFeat4: 'Completely free',
    landingStartBtn: 'Start Playing',
    landingDictBtn: 'Browse Dictionary',
    landingFooterTag: 'Find your word before the bomb goes off.',
  },
  tr: {
    connecting: 'Bağlanıyor…',
    connectingToServer: 'Sunucuya bağlanıyor…',
    youWin: 'Kazandın!',
    gameOver: 'Oyun Bitti',
    draw: 'Beraberlik',
    wins: 'kazandı!',
    finalScores: 'Son Puanlar',
    backToLobby: 'Lobiye Dön',
    words: (n) => `${n} kelime`,
    syllable: 'hece',
    correct: '✓ Doğru!',
    players: 'Oyuncular',
    name: 'İsim',
    wordsHeader: 'Kelimeler',
    lives: 'Can',
    yourLetters: 'Harflerin',
    chat: 'Sohbet',
    noMessages: 'Henüz mesaj yok…',
    chatPlaceholder: 'Sohbet…',
    yourTurn: 'Senin Sıran',
    typeWord: 'Bir kelime yaz…',
    waitingTurn: 'Sıranı bekle…',
    send: 'Gönder',
    tagline: 'Bomba patlamadan önce heceyi içeren kelimeler yaz!',
    nickname: 'Takma Ad',
    enterName: 'Adını gir…',
    avatar: 'Karakter',
    turnDuration: 'Tur Süresi',
    fixed: 'Sabit',
    range: 'Aralık',
    seconds: 'saniye',
    min: 'Min',
    max: 'Maks',
    startNewRoom: '💣 Yeni Oda Oluştur',
    creating: 'Oluşturuluyor…',
    orJoin: 'veya mevcut odaya katıl',
    roomCode: 'Oda kodu',
    join: 'Katıl',
    settings: '⚙ Ayarlar',
    dictionary: '📖 Sözlük',
    roomCodeLabel: 'Oda Kodu',
    shareCode: 'Bu kodu arkadaşlarınla paylaş',
    host: 'ev sahibi',
    ready: 'Hazır',
    notReady: 'Hazır değil',
    readyCheck: '✓ Hazır',
    readyUp: 'Hazır Ol',
    startGame: 'Oyunu Başlat',
    enterNickname: 'Lütfen bir takma ad gir',
    notConnected: 'Bağlantı yok',
    fixedTimeError: 'Sabit süre 3–60 saniye arasında olmalı',
    rangeError: 'Aralık 3–60 s arasında olmalı ve min ≤ maks',
    serverNoResponse: 'Sunucu yanıt vermedi. Backend çalışıyor mu?',
    enterRoomCode: 'Oda kodunu gir',
    failedCreate: 'Oda oluşturulamadı',
    failedJoin: 'Odaya katılınamadı',
    back: '← Geri',
    dictionaryTitle: 'Sözlük',
    loading: 'Yükleniyor…',
    turkishWords: (n) => `${n} Türkçe kelime`,
    escHint: 'Geri dönmek için ESC',
    searchPlaceholder: 'Tüm kelimeleri ara…',
    matchesSuffix: () => 'eşleşme',
    totalWordsSuffix: 'toplam kelime',
    pageLabel: 'sayfa',
    noWords: 'Kelime yok',
    clear: '✕ Temizle',
    noWordsFoundFor: (s) => `"${s}" için kelime bulunamadı`,
    noWordsFound: 'Kelime bulunamadı',
    prev: '‹ Önceki',
    next: 'Sonraki ›',
    letterWords: (n) => `${n} kelime`,
    settingsTitle: 'Ayarlar',
    configureExp: 'Deneyimini yapılandır',
    soundEffects: 'Ses Efektleri',
    soundDesc: 'Tık sesleri ve kelime geri bildirimi',
    language: 'Dil',
    langDesc: 'Türkçe ve İngilizce arasında geçiş yap',
    landingHeadline: 'Bombayı Patlatmadan Kelime Bul — Şimdi',
    landingSubline: "BombParty'de saniyeler sayılı. Her tur yeni bir heceyi yazmanız gerekiyor, yoksa bomba patlar. Arkadaşlarınızla canlı oynayın, Türkçe bilginizi test edin ve son kalan oyuncu kazansın.",
    landingNoBadge: 'Kayıt gerekmez',
    landingCta: 'Hemen Oyna',
    landingHowTitle: 'Nasıl Oynanır?',
    landingStep1Title: 'Sıra Başla',
    landingStep1Desc: 'Oda oluştur ya da bağlantıyı paylaş — arkadaşların hesap açmadan anında katılır.',
    landingStep2Title: 'Sözcük Yaz',
    landingStep2Desc: 'Gösterilen heceyi içeren Türkçe bir kelime yaz, süre dolmadan gönder.',
    landingStep3Title: 'Puan Kazan veya Bomba Patla',
    landingStep3Desc: 'Doğru kelimeler seni öne geçirir. Süre dolarsa bir can kaybedersin. Son kalan kazanır.',
    landingFeatTitle: 'Neden BombParty?',
    landingFeat1: '2–12 oyuncu, gerçek zamanlı çok oyunculu',
    landingFeat2: 'Kayıt yok — tamamen tarayıcında çalışır',
    landingFeat3: 'Türkçe alfabe bonusu (tüm 29 harf)',
    landingFeat4: 'Tamamen ücretsiz',
    landingStartBtn: 'Oyuna Başla',
    landingDictBtn: 'Sözlüğü Gözat',
    landingFooterTag: 'Bomba patlamadan önce kelimeni bul.',
  },
};
