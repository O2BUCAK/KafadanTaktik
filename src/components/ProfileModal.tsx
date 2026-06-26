import React, { useState } from 'react';
import { 
  Trophy, LogOut, ShieldCheck, Mail, User, Lock, 
  ArrowRight, Activity, Percent, Goal, Swords, Eye, EyeOff, Loader2, X 
} from 'lucide-react';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, 
  signInAnonymously, updateProfile, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeUserStats, UserStats } from '../utils/stats';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  userStats: UserStats | null;
  onStatsUpdate: (stats: UserStats) => void;
}

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  userStats,
  onStatsUpdate 
}: ProfileModalProps) {
  const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const username = cred.user.displayName || cred.user.email?.split('@')[0] || 'Kafadan Taktikçi';
      
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        userId: cred.user.uid,
        username: username,
        email: cred.user.email || 'google@kafadantaktik.com',
        createdAt: serverTimestamp()
      }, { merge: true });

      const stats = await initializeUserStats(cred.user.uid);
      onStatsUpdate(stats);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google ile giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Anonymous Login
  const handleAnonymousAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || nickname.trim().length < 3) {
      setError('Kullanıcı rumuzu en az 3 karakter olmalıdır.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, {
        displayName: nickname.trim()
      });
      
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        userId: cred.user.uid,
        username: nickname.trim(),
        email: 'anonymous@kafadantaktik.com',
        createdAt: serverTimestamp()
      });

      const stats = await initializeUserStats(cred.user.uid);
      onStatsUpdate(stats);
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Email and Password Login / Signup
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (isSignUp && (!nickname.trim() || nickname.trim().length < 3)) {
      setError('Rumuz en az 3 karakter olmalıdır.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, {
          displayName: nickname.trim()
        });
        
        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, {
          userId: cred.user.uid,
          username: nickname.trim(),
          email: email,
          createdAt: serverTimestamp()
        });
        
        const stats = await initializeUserStats(cred.user.uid);
        onStatsUpdate(stats);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const stats = await initializeUserStats(cred.user.uid);
        onStatsUpdate(stats);
      }
    } catch (err: any) {
      setError(err.message || 'Kimlik doğrulama hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError('Çıkış yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats values
  const played = userStats?.matchesPlayed || 0;
  const wins = userStats?.wins || 0;
  const draws = userStats?.draws || 0;
  const losses = userStats?.losses || 0;
  const scored = userStats?.goalsScored || 0;
  const conceded = userStats?.goalsConceded || 0;
  const diff = scored - conceded;
  const winRatio = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <div id="profile-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7EE] border-4 border-[#0C251C] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0C251C] text-[#FAF7EE] p-4 flex items-center justify-between border-b-2 border-[#FAF7EE]/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
            <h3 className="font-extrabold text-base uppercase tracking-wider font-display">Taktikçi Profil Kartı</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-[#FAF7EE]/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {currentUser ? (
            /* --- LOGGED IN USER INTERFACE --- */
            <div className="space-y-6">
              {/* Profile Card HUD */}
              <div className="bg-white border-2 border-[#0C251C] p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 border-2 border-[#0C251C] rounded-full flex items-center justify-center text-xl font-bold">
                    🛡️
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">TAKTiKÇi SPORCU</span>
                    <h4 className="text-base font-black text-[#0C251C]">{currentUser.displayName || 'Anonim Oyuncu'}</h4>
                    <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px]">
                      {currentUser.email || 'Hızlı Misafir Girişi'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  Çıkış Yap
                </button>
              </div>

              {/* Bento Board Statistics Grid */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-[#0C251C]/60 font-mono">TAKTiKSEL KARNE VE SKORLAR</h5>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Top Row Overview */}
                  <div className="bg-white border border-[#0C251C]/15 p-3 rounded-xl shadow-xs text-center flex flex-col justify-center">
                    <Activity className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                    <span className="text-lg font-black text-slate-800 leading-none">{played}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Oynanan Maç</span>
                  </div>

                  <div className="bg-white border border-[#0C251C]/15 p-3 rounded-xl shadow-xs text-center flex flex-col justify-center">
                    <Trophy className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                    <span className="text-lg font-black text-emerald-700 leading-none">{wins}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Galibiyet</span>
                  </div>

                  <div className="bg-white border border-[#0C251C]/15 p-3 rounded-xl shadow-xs text-center flex flex-col justify-center">
                    <Percent className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <span className="text-lg font-black text-slate-800 leading-none">%{winRatio}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Kazanma Oranı</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Bottom Row - Goals vs Conceded */}
                  <div className="bg-white border border-[#0C251C]/15 p-3.5 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Gol Karnesi</span>
                      <Goal className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div className="text-sm font-black text-emerald-700">{scored}</div>
                        <div className="text-[9px] text-slate-500">Atılan Gol</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-rose-700">{conceded}</div>
                        <div className="text-[9px] text-slate-500">Yenilen Gol</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#0C251C]/15 p-3.5 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Karşılaşmalar</span>
                      <Swords className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <div className="text-xs font-black text-emerald-600">{wins}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase">G</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-500">{draws}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase">B</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-rose-500">{losses}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase">M</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar ratio visualization */}
                <div className="bg-white border border-[#0C251C]/15 p-4 rounded-xl shadow-xs space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Averaj Analizi:</span>
                    <span className={diff >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      {diff > 0 ? `+${diff}` : diff} Averaj
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full transition-all duration-500 ${diff >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(10, 50 + diff * 10))}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] leading-normal text-slate-400 font-semibold font-mono">
                    *İstatistikleriniz hem Yapay Zekaya (AI) karşı oynadığınız maçlarda, hem de Online karşılaşmalarda "Maçı Bitir" butonuna bastığınızda otomatik olarak güncellenir.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* --- NOT LOGGED IN USER INTERFACE (AUTH OPTIONS) --- */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-lg">🏆</span>
                <h4 className="text-sm font-black text-[#0C251C] uppercase tracking-tight">İSTATİSTİKLERİNİZİ KAYDEDİN</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed max-w-xs mx-auto">
                  Maç skorlarınızı, kazanma oranlarınızı ve taktiksel performansınızı güvenle takip etmek için hemen ücretsiz giriş yapın.
                </p>
              </div>

              {/* Google login Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl border-2 border-slate-200 shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google ile Giriş Yap
              </button>

              <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold uppercase tracking-widest font-mono">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="px-3">VEYA RUMUZ / E-POSTA</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {!isEmailFormOpen ? (
                /* Standard fast nickname auth option */
                <form onSubmit={handleAnonymousAuth} className="bg-white p-4 rounded-xl border border-[#0C251C]/15 space-y-3 shadow-inner">
                  <span className="bg-emerald-900/10 text-emerald-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded font-mono">
                    Hızlı Misafir Girişi
                  </span>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">Kullanıcı Rumuz:</label>
                    <input
                      type="text"
                      placeholder="Rumuzunuzu girin (örn: GolMakinesi)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={16}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0C251C] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0C251C] text-[#FAF7EE] text-xs font-black uppercase tracking-wider py-2 rounded-lg active:scale-98 transition-all hover:brightness-110 cursor-pointer disabled:opacity-50"
                  >
                    Hızlı Rumuz ile Gir ➔
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmailFormOpen(true)}
                    className="w-full text-[10px] text-blue-700 font-bold underline text-center block cursor-pointer"
                  >
                    E-Posta ve Şifre ile Kaydol / Giriş Yap
                  </button>
                </form>
              ) : (
                /* Traditional Email/Password Form */
                <form onSubmit={handleEmailAuth} className="bg-white p-4 rounded-xl border border-[#0C251C]/15 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="bg-amber-100 text-amber-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded font-mono">
                      {isSignUp ? 'Hesap Oluştur' : 'E-Posta Girişi'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEmailFormOpen(false)}
                      className="text-[9px] text-slate-500 font-black uppercase tracking-wider hover:underline"
                    >
                      ‹ Rumuz Seçimine Dön
                    </button>
                  </div>

                  {isSignUp && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">Oyuncu Rumuzu:</label>
                      <input
                        type="text"
                        placeholder="Rumuz girin"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">E-Posta:</label>
                    <input
                      type="email"
                      placeholder="ornek@eposta.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">Şifre:</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-6.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#E75A51] hover:bg-[#d64a41] text-white text-xs font-black uppercase tracking-wider py-2 rounded-lg active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSignUp ? 'Hesap Aç ve Giriş Yap' : 'Giriş Yap'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[10px] text-blue-700 font-bold underline cursor-pointer"
                    >
                      {isSignUp ? 'Zaten hesabım var, Giriş Yap' : 'Şifreli Yeni Hesap Oluştur'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* KVKK / Data Protection compliant professional footer disclaimer - 2026 Yasaları ve KVKK standardı */}
        <div className="bg-slate-100 p-3 border-t-2 border-[#0C251C]/10 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-[8px] text-slate-500 leading-normal font-medium font-sans">
            <strong>KVKK BİLGİLENDİRMESİ &amp; 2026 STANDARTLARI:</strong> Verileriniz, 6698 Sayılı Kişisel Verilerin Korunması Kanunu ve 2026 Türkiye Cumhuriyeti veri koruma tebliğlerine tam uyumlu olarak Türkiye ve Firebase EMEA sunucularında şifrelenmiş olarak saklanır. İstatistikleriniz sadece oyun içi karne gösterimi amacıyla işlenir, reklam veya 3. şahıslara satış amacıyla asla paylaşılamaz. İstediğiniz an profilinizi silme hakkına sahipsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
