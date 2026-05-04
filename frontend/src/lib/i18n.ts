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
  },
};
