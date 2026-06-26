/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player } from '../types';

export const createSquad = (teamColor: 'Siyah' | 'Beyaz'): Player[] => {
  const isSiyah = teamColor === 'Siyah';
  
  // Custom prefix names to give authentic Turkish football flavor
  const blackNames = [
    "Volkan 'Panter' Çelik", "Alperen 'Duvar' Demir", "Caner 'Rüzgar' Kaya", "Hakan 'Usta' Kurt",
    "Umut 'Kalkan' Can", "Barış 'Dinamo' Yıldız", "Mert 'Sihirbaz' Yılmaz", "Kerem 'Füze' Şahin",
    "Onur 'Vezir' Aslan", "Gökhan 'Zırh' Yiğit", "Serkan 'Durağan' Kara", "Yiğit 'Kuzey' Yıldırım",
    "Doruk 'Güneyli' Koç", "Efe 'Jet' Bulut", "Oğuzhan 'Tank' Aksoy", "Semih 'Akrep' Şen",
    "Kaan 'Ahtapot' Özer", "Arda 'Dahi' Özkan", "Burak 'Ok' Çetin", "Cenk 'Kral' Tosun",
    "Sinan 'Kondor' Solak", "Yusuf 'Sürat' Şen", "Tolga 'General' Avcı", "Tuna 'Kule' Öztürk",
    "Eren 'Fırtına' Aydın"
  ];

  const whiteNames = [
    "Rüştü 'Çelik' Reçber", "Sabri 'Terminatör' Sarı", "Servet 'Ayıboğan' Çetin", "Alpay 'Beton' Özalan",
    "Hakan 'Kral' Şükür", "Nihat 'Bombacı' Kahveci", "Emre 'Orkestra' Belöz", "Arda 'Elmas' Güler",
    "Tugay 'Şerif' Kerimoğlu", "Ümit 'Savaşçı' Karan", "Gökhan 'Gönül' Ak", "Caner 'Fişek' Erkin",
    "Egemen 'Korkusuz' Korkmaz", "Olcay 'Karınca' Şahan", "Ceyhun 'Çapa' Eriş", "Selçuk 'Xavi' İnan",
    "Tuncay 'Sanlı' Şanlı", "Burak 'Yılmaz' Golcü", "Semih 'Nöbetçi' Şentürk", "Fatih 'İmparator' Tekke",
    "Volkan 'Demirden' Şen", "Mehmet 'Topuz' Güç", "Necip 'Vefakar' Uysal", "Ozan 'Tufan' Kasırga",
    "Gökdeniz 'Karadeniz' Karadeniz"
  ];

  const nameList = (isSiyah ? blackNames : whiteNames).map(n => n.replace(/\s*['"].*?['"]\s*/g, ' ').trim());

  return [
    // --- KALECİLER (2) ---
    {
      id: `${teamColor}-GK-1`,
      name: nameList[0],
      number: 1,
      positionGroup: 'GK',
      role: 'Kaleci (Libero)',
      stats: { hiz: 15, guc: 12, teknik: 16, pas: 16, sut: 8, savunma: 14 },
      description: "Hızlı, kalesini terk edip savunmaya yardım edebilen ve ayağı çok düzgün bir modern kaleci."
    },
    {
      id: `${teamColor}-GK-2`,
      name: nameList[1],
      number: 99,
      positionGroup: 'GK',
      role: 'Kaleci (Çizgi)',
      stats: { hiz: 8, guc: 17, teknik: 10, pas: 10, sut: 6, savunma: 19 },
      description: "Refleksleri mükemmel, kale çizgisinde adeta devleşen ve yakın mesafeli şutlarda geçit vermeyen klasik kaleci."
    },

    // --- SAĞ BEKLER (2) ---
    {
      id: `${teamColor}-DF-1`,
      name: nameList[2],
      number: 2,
      positionGroup: 'DF',
      role: 'Sağ Bek (Defansif)',
      stats: { hiz: 12, guc: 16, teknik: 11, pas: 12, sut: 9, savunma: 17 },
      description: "Kendi koridorunu kapatan, fiziksel mücadelelerde üstün ve top geçirmeyen sağ bek."
    },
    {
      id: `${teamColor}-DF-2`,
      name: nameList[3],
      number: 77,
      positionGroup: 'DF',
      role: 'Sağ Bek (Ofansif)',
      stats: { hiz: 18, guc: 11, teknik: 15, pas: 16, sut: 12, savunma: 11 },
      description: "Hızlı bindirmeleri, isabetli ortaları ve yüksek tekniğiyle sağ kanadı hallaç pamuğu gibi atan bek."
    },

    // --- SOL BEKLER (2) ---
    {
      id: `${teamColor}-DF-3`,
      name: nameList[4],
      number: 3,
      positionGroup: 'DF',
      role: 'Sol Bek (Defansif)',
      stats: { hiz: 11, guc: 15, teknik: 12, pas: 11, sut: 10, savunma: 18 },
      description: "Alan daraltan, rakip kanatları bezdiren ve savunma disiplininden asla taviz vermeyen sol bek."
    },
    {
      id: `${teamColor}-DF-4`,
      name: nameList[5],
      number: 88,
      positionGroup: 'DF',
      role: 'Sol Bek (Ofansif)',
      stats: { hiz: 17, guc: 12, teknik: 14, pas: 17, sut: 11, savunma: 12 },
      description: "Çizgiyi mükemmel kullanan, hücuma katılarak ekstra bir oyun kurucu gibi performans gösteren sol bek."
    },

    // --- DEFANSLAR (5) ---
    {
      id: `${teamColor}-DF-5`,
      name: nameList[6],
      number: 4,
      positionGroup: 'DF',
      role: 'Defans (Hızlı Teknik)',
      stats: { hiz: 17, guc: 13, teknik: 15, pas: 14, sut: 8, savunma: 16 },
      description: "Hızlı forvetlerin korkulu rüyası; topla çıkabilen, teknik kapasitesi yüksek akıllı stoper."
    },
    {
      id: `${teamColor}-DF-6`,
      name: nameList[7],
      number: 5,
      positionGroup: 'DF',
      role: 'Defans (Ağır Pasör)',
      stats: { hiz: 8, guc: 18, teknik: 12, pas: 18, sut: 10, savunma: 16 },
      description: "Geriden oyunu maestro gibi kuran, adrese teslim uzun toplar atan ağır ama çok güçlü stoper."
    },
    {
      id: `${teamColor}-DF-7`,
      name: nameList[8],
      number: 14,
      positionGroup: 'DF',
      role: 'Defans (Hızlı Teknik)',
      stats: { hiz: 16, guc: 12, teknik: 16, pas: 15, sut: 7, savunma: 15 },
      description: "Temiz müdahaleleri olan, oyun görüşü geniş ve savunmayı öne çıkarabilen elit stoper."
    },
    {
      id: `${teamColor}-DF-8`,
      name: nameList[9],
      number: 15,
      positionGroup: 'DF',
      role: 'Defans (Ağır Pasör)',
      stats: { hiz: 7, guc: 19, teknik: 11, pas: 17, sut: 12, savunma: 17 },
      description: "Hava toplarında tamamen aşılmaz bir kale duvarı. Fiziksel olarak rakipleri ezer."
    },
    {
      id: `${teamColor}-DF-9`,
      name: nameList[10],
      number: 22,
      positionGroup: 'DF',
      role: 'Defans (Dengeli)',
      stats: { hiz: 13, guc: 15, teknik: 13, pas: 13, sut: 11, savunma: 16 },
      description: "Hız ve güç dengesi mükemmel, oyun içi kararları stabil ve hatasız oynayan güvenilir stoper."
    },

    // --- ORTA SAHALAR (6) ---
    {
      id: `${teamColor}-MF-1`,
      name: nameList[11],
      number: 6,
      positionGroup: 'MF',
      role: 'Defansif Orta Saha',
      stats: { hiz: 12, guc: 18, teknik: 12, pas: 15, sut: 11, savunma: 18 },
      description: "Orta sahada adeta bir elektrik süpürgesi; topları keser, ikili mücadeleleri kazanır ve basit pasla başlatır."
    },
    {
      id: `${teamColor}-MF-2`,
      name: nameList[12],
      number: 16,
      positionGroup: 'MF',
      role: 'Defansif Orta Saha',
      stats: { hiz: 11, guc: 17, teknik: 13, pas: 16, sut: 12, savunma: 17 },
      description: "Ciğersiz bir pres gücü olan, sert hırslı oyunuyla orta sahanın direncini tavan yaptıran ön libero."
    },
    {
      id: `${teamColor}-MF-3`,
      name: nameList[13],
      number: 8,
      positionGroup: 'MF',
      role: 'Merkez Orta Saha',
      stats: { hiz: 14, guc: 14, teknik: 16, pas: 17, sut: 13, savunma: 14 },
      description: "Oyunun her iki yönünü de akıcı oynayabilen, temposu ve pas kalitesiyle takımı yönlendiren çift yönlü orta saha."
    },
    {
      id: `${teamColor}-MF-4`,
      name: nameList[14],
      number: 18,
      positionGroup: 'MF',
      role: 'Merkez Orta Saha',
      stats: { hiz: 13, guc: 15, teknik: 15, pas: 16, sut: 14, savunma: 13 },
      description: "Kritik anlarda ceza sahasına sızan, akıllı pasları ve dayanıklılığı ile maestro."
    },
    {
      id: `${teamColor}-MF-5`,
      name: nameList[15],
      number: 10,
      positionGroup: 'MF',
      role: 'Ofansif Orta Saha',
      stats: { hiz: 14, guc: 10, teknik: 19, pas: 19, sut: 16, savunma: 8 },
      description: "Gerçek bir 10 numara. Müthiş bir oyun zekası, öldürücü paslar ve ölümcül uzaktan şutlar sunar."
    },
    {
      id: `${teamColor}-MF-6`,
      name: nameList[16],
      number: 21,
      positionGroup: 'MF',
      role: 'Ofansif Orta Saha',
      stats: { hiz: 15, guc: 12, teknik: 18, pas: 17, sut: 15, savunma: 9 },
      description: "Kıvrak çalımları, oyun sıkıştığında kilidi açan yaratıcı vizyonu ve serbest vuruş ustalığı."
    },

    // --- KANATLAR (4) ---
    {
      id: `${teamColor}-FW-1`,
      name: nameList[17],
      number: 7,
      positionGroup: 'FW',
      role: 'Sol Kanat (Çizgiye İnen)',
      stats: { hiz: 19, guc: 11, teknik: 16, pas: 18, sut: 12, savunma: 10 },
      description: "Çizgiden fişek gibi akıp giden, sıfıra inip forvete milimetrik ortalar kesen klasik sol açık."
    },
    {
      id: `${teamColor}-FW-2`,
      name: nameList[18],
      number: 11,
      positionGroup: 'FW',
      role: 'Sol Kanat (İçeri Giren)',
      stats: { hiz: 18, guc: 13, teknik: 18, pas: 14, sut: 17, savunma: 8 },
      description: "Sağ ayağıyla sol kanattan içeri kat edip, uzak köşeye plase şutlar bırakan golcü kanat oyuncusu."
    },
    {
      id: `${teamColor}-FW-3`,
      name: nameList[19],
      number: 17,
      positionGroup: 'FW',
      role: 'Sağ Kanat (Çizgiye İnen)',
      stats: { hiz: 19, guc: 12, teknik: 15, pas: 17, sut: 13, savunma: 10 },
      description: "Muazzam süratiyle sağ çizgiyi otoban gibi kullanan, asist canavarı sağ kanat."
    },
    {
      id: `${teamColor}-FW-4`,
      name: nameList[20],
      number: 19,
      positionGroup: 'FW',
      role: 'Sağ Kanat (İçeri Giren)',
      stats: { hiz: 17, guc: 14, teknik: 17, pas: 13, sut: 18, savunma: 8 },
      description: "Ters ayakla sağda başlayıp içeri sızan, bir forvet kadar gol koklayan bitirici sağ kanat."
    },

    // --- FORVETLER (4) ---
    {
      id: `${teamColor}-FW-5`,
      name: nameList[21],
      number: 9,
      positionGroup: 'FW',
      role: 'Pivot Forvet',
      stats: { hiz: 9, guc: 20, teknik: 12, pas: 14, sut: 18, savunma: 11 },
      description: "Boyu ve fiziksel gücüyle defansı yıpratan, havadan atılan her topu indiren golcü kule."
    },
    {
      id: `${teamColor}-FW-6`,
      name: nameList[22],
      number: 10,
      positionGroup: 'FW',
      role: 'Fırsatçı Golcü',
      stats: { hiz: 18, guc: 11, teknik: 14, pas: 10, sut: 19, savunma: 7 },
      description: "Ofsayt çizgisinde yaşayan, savunmanın arkasına sızıp en ufak hatayı golle cezalandıran bitirici."
    },
    {
      id: `${teamColor}-FW-7`,
      name: nameList[23],
      number: 11,
      positionGroup: 'FW',
      role: 'Sahte 9',
      stats: { hiz: 14, guc: 13, teknik: 18, pas: 18, sut: 15, savunma: 10 },
      description: "Orta sahaya kadar gelip derin pas istasyonları oluşturan, takım arkadaşlarını gol pozisyonuna sokan akıl küpü."
    },
    {
      id: `${teamColor}-FW-8`,
      name: nameList[24],
      number: 22,
      positionGroup: 'FW',
      role: 'Komple Forvet',
      stats: { hiz: 16, guc: 16, teknik: 17, pas: 15, sut: 17, savunma: 10 },
      description: "Hızlı, güçlü, teknik ve bitirici. Modern futbolun tüm gereksinimlerini karşılayan süper yıldız."
    }
  ];
};
