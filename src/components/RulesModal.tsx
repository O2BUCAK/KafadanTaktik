import { Info, ShieldAlert, Check, X, Dice5 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div id="rules-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C251C]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div id="rules-container" className="bg-[#FFFDF7] border-4 border-[#0C251C] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_#0C251C] p-6 text-[#0C251C] flex flex-col gap-6 font-display">
        
        {/* Header */}
        <div id="rules-header" className="flex items-center justify-between border-b-2 border-[#0C251C]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FAF7EE] border-2 border-[#0C251C] rounded-lg">
              <Dice5 className="w-6 h-6 text-[#E75A51]" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight italic text-[#0C251C]">
              OYUN KURALLARI & GÜVENLİK
            </h2>
          </div>
          <button 
            id="close-rules-btn"
            onClick={onClose}
            className="text-[#0C251C] hover:bg-[#FAF7EE] p-2 rounded-lg border-2 border-transparent hover:border-[#0C251C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div id="rules-content" className="flex flex-col gap-5 text-xs leading-relaxed text-[#0C251C]/90 font-medium">
          
          {/* 1. Giris */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#E75A51] flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#E75A51]"></span>
              ZAR BAZLI TAKTİKSEL MAÇ MOTORU
            </h3>
            <p className="leading-relaxed">
              Kafadan Taktik, 21x13 karelik bir strateji tahtasında (saha) oynanan, d20 (20'lik zar) mekanikli, tur bazlı bir futbol oyunudur. Her takım 25 kişilik özel kadrodan seçilen 11 yetenekli oyuncu ile sahaya çıkar.
            </p>
          </div>

          {/* 2. Yerlestirme */}
          <div className="bg-[#FAF7EE] border-2 border-[#0C251C] p-4 rounded-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0C251C] mb-2">
              🛠️ 1. Yerleştirme Aşaması
            </h3>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[#0C251C]/80 text-[11px] font-medium">
              <li>Maç öncesi yapılan <strong className="text-[#0C251C]">Kur'a Atışında (Toss)</strong> en yüksek d20 atan takım oyuna yerleşim önceliği kazanır (örn. Siyah Beyaz).</li>
              <li>Siyah Beyaz ilk olarak <strong className="text-[#0C251C]">1 Kaleci og 1 Oyuncu</strong> yerleştirir.</li>
              <li>Ardından Sarı Lacivert <strong className="text-[#0C251C]">1 Kaleci ve 2 Oyuncu</strong> yerleştirir.</li>
              <li>Sonrasında takımlar sırayla <strong className="text-[#0C251C]">1'er oyuncu</strong> yerleştirerek 11'e 11 (1 Kaleci + 10 Saha İçi) düzenlerini kurarlar.</li>
              <li>Siyah Beyaz kendi yarısahasında (0-10 kolonu), Sarı Lacivert ise kendi yarısahasında (10-20 kolonu) konuşlanmalıdır.</li>
            </ul>
          </div>

          {/* 3. Tur Yapisi */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0C251C] mb-2">
              ⚽ 2. Maç & Tur Yapısı
            </h3>
            <p className="mb-2 leading-relaxed">
              Yerleşim bittikten sonra oyun başlar, top orta noktada (10, 6) başlar:
            </p>
            <ul className="list-decimal pl-5 flex flex-col gap-1.5 text-[#0C251C]/80 text-[11px] font-medium">
              <li><strong className="text-[#0C251C]">Siyah Beyaz Taktik Belirler:</strong> Siyah Beyaz kendi oyuncularına tek tek talimat verir (Hareket et, Pas ver, Şut çek, Top Sür).</li>
              <li>Siyah Beyaz turunu bitirince, <strong className="text-[#0C251C]">Sarı Lacivert Taktik Belirler:</strong> Sarı Lacivert kendi oyuncularını hareket ettirerek yerlerini ayarlar veya top taşıyıcıyı savunmak için hamle planlar.</li>
              <li>Her iki takım da karar verdikten sonra <strong className="text-[#0C251C]">"Zarları At"</strong> butonuna basılır ve tüm hamleler oyuncu yeteneklerine göre d20 zarları ile simüle edilir!</li>
              <li><strong className="text-[#0C251C]">Gol Sonrası Reset:</strong> Gol atıldıktan sonra tüm futbolcular maç başlangıcındaki <strong className="text-[#0369a1]">ilk dizilişlerine (taktik dizilişe)</strong> göre otomatik olarak tekrar yerleşir.</li>
              <li><strong className="text-[#E75A51]">Korner ve Taç Atışları:</strong> Korner ve taç atışlarında herhangi bir pozisyon resetlemesi yapılmaz; tüm futbolcular <strong className="text-[#E75A51]">olduğu yerde kalsın</strong> prensibine uygun şekilde kaldıkları pozisyondan oynamaya devam ederler.</li>
            </ul>
          </div>

          {/* 4. Zar ve Performans */}
          <div className="bg-[#FAF7EE] border-2 border-[#0C251C] p-4 rounded-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#E75A51] mb-2.5 flex items-center gap-2">
              <Dice5 className="w-4 h-4 text-[#E75A51]" />
              d20 ZAR MATRİS PARAMETRELERİ
            </h3>
            <p className="mb-2 text-[11px] font-medium">
              Yapılan tüm aksiyonların başarı olasılığı, aksiyonu yapan oyuncunun ilgili <strong className="text-[#0C251C]">Yetenek Seviyesi + d20 Zar Atışı</strong> ile belirlenir:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px] font-black">
              <div className="bg-red-50 text-red-700 border-2 border-red-200 p-2 rounded-lg">
                <span className="block text-xs font-mono">1 - 5</span>
                Zayıf Şans
              </div>
              <div className="bg-amber-50 text-amber-700 border-2 border-amber-200 p-2 rounded-lg">
                <span className="block text-xs font-mono">6 - 10</span>
                Orta Kalite
              </div>
              <div className="bg-blue-50 text-blue-700 border-2 border-blue-200 p-2 rounded-lg">
                <span className="block text-[#0C251C] font-mono">11 - 15</span>
                Stratejik Başarı
              </div>
              <div className="bg-emerald-50 text-emerald-700 border-2 border-emerald-200 p-2 rounded-lg">
                <span className="block text-emerald-800 font-mono">16 - 20</span>
                Kritik Darbe!
              </div>
            </div>
            <p className="mt-3 text-[10px] text-[#0C251C]/70 font-mono leading-relaxed">
              *Örn: Pas atan oyuncunun Pas yeteneği (16) + Zar (15) = 31. Engelleyen rakibin Savunma yeteneği (14) + Zar (10) = 24. 31 &gt; 24 olduğu için pas başarıyla yerine ulaşır!
            </p>
          </div>

          {/* 5. Pozisyonlar ve Istatisikler */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0C251C] mb-2">
              📊 Oyuncu Rolleri ve İstatistikler
            </h3>
            <p className="mb-2 leading-relaxed">
              Her oyuncunun 6 farklı futbol yeteneği bulunur: <strong className="text-[#0C251C]">Hız, Güç, Teknik, Pas, Şut ve Savunma (1-20 arası)</strong>. Rollerine göre benzersiz dağılmıştır:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[#0C251C]/80 text-[11px] font-mono font-medium">
              <li><strong className="text-[#0C251C]">Kaleciler:</strong> Libero Kaleci (ayak yeteneği yüksek), Çizgi Kalecisi (saf refleks ve savunma).</li>
              <li><strong className="text-[#0C251C]">Bekler:</strong> Ofansif Bek (yüksek hız ve pas), Defansif Bek (yüksek savunma).</li>
              <li><strong className="text-[#0C251C]">Defans (Stoper):</strong> Hızlı Teknik (top kapma ve sürat), Ağır Pasör (hava hakimiyeti ve uzun pas).</li>
              <li><strong className="text-[#0C251C]">Kanatlar:</strong> Çizgiye inen kanat (hızlı orta açıcı), Kanat Forvet (içeri çalımlayan bitirici).</li>
              <li><strong className="text-[#0C251C]">Forvetler:</strong> Pivot Forvet (güçlü hava hakimiyeti), Fırsatçı Golcü (hızlı ve tek vuruşçu).</li>
            </ul>
          </div>

          {/* 6. KVKK ve Bilgi Guvenligi */}
          <div className="border-t-2 border-[#0C251C]/10 pt-4 mt-2 flex flex-col gap-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#E75A51] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#E75A51]" />
              Bilgi Güvenliği, Bağımsız Yazılım ve KVKK Bildirisi (2026 Mevzuatı)
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">
              Bu uygulama, 6698 Sayılı Kişisel Verilerin Korunması Kanunu (<strong>KVKK</strong>) ve 2026 yılı güncel Türk bilişim mevzuatlarına tam uyumludur. Oyunda girdiğiniz oyuncu taktikleri, maç kayıtları, takma adlar veya oyun tercihleri hiçbir şekilde uzak bir sunucuya gönderilmez veya çerezler vasıtasıyla üçüncü taraflarla paylaşılmaz. Tüm veriler tam güvenlikle sadece tarayıcınızın yerel depolama alanında (<strong>localStorage</strong>) saklanmaktadır. Oyunda gerçek parayla kumar, bahis veya herhangi bir oyun içi ödeme sistemi bulunmamaktadır; oyun %100 ücretsiz, reklamsız ve açık kaynaklıdır.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div id="rules-footer" className="border-t-2 border-[#0C251C]/10 pt-4 flex justify-end">
          <button
            id="accept-rules-btn"
            onClick={onClose}
            className="tabletop-btn-primary px-6 py-3 text-xs cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4.5 h-4.5" />
            Anladım, Oyuna Başla!
          </button>
        </div>

      </div>
    </div>
  );
}
