import React, { useState, useEffect } from 'react';
import { 
  auth, db, handleFirestoreError, OperationType 
} from '../utils/firebase';
import { 
  signInAnonymously, updateProfile, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged, User as FirebaseUser,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { 
  collection, doc, setDoc, updateDoc, onSnapshot, 
  query, where, getDocs, limit, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { 
  Globe, LogIn, UserPlus, LogOut, Sparkles, Trophy, 
  Users, RefreshCw, Cpu, CheckCircle2, AlertCircle, PlusCircle, Trash2 
} from 'lucide-react';
import { TeamTheme, TEAMS } from '../data/teams';
import { initializeUserStats } from '../utils/stats';

interface OnlineLobbyProps {
  onMatchConnected: (matchId: string, isHost: boolean, myTeam: 'Siyah' | 'Beyaz', activeTheme: TeamTheme, opponentTheme: TeamTheme) => void;
  teamATheme: TeamTheme;
  teamBTheme: TeamTheme;
  setTeamATheme: (theme: TeamTheme) => void;
  setTeamBTheme: (theme: TeamTheme) => void;
}

export default function OnlineLobby({
  onMatchConnected,
  teamATheme,
  teamBTheme,
  setTeamATheme,
  setTeamBTheme
}: OnlineLobbyProps) {
  // Auth states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Matchmaking states
  const [lobbyList, setLobbyList] = useState<any[]>([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [hostTeamColor, setHostTeamColor] = useState<'Siyah' | 'Beyaz'>('Siyah');
  const [hostSelectedTheme, setHostSelectedTheme] = useState<TeamTheme>(TEAMS[0]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [matchStatusMsg, setMatchStatusMsg] = useState<string | null>(null);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user && user.displayName) {
        setNickname(user.displayName);
      }
    });
    return unsubscribe;
  }, []);

  // Listen to open lobbies (waiting status)
  useEffect(() => {
    if (!currentUser) return;
    setLobbiesLoading(true);
    const q = query(
      collection(db, 'matches'),
      where('status', '==', 'waiting'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLobbyList(list);
      setLobbiesLoading(false);
    }, (error) => {
      console.error(error);
      setLobbiesLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Handle Quick Auth (Anonymous)
  const handleAnonymousAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || nickname.trim().length < 3) {
      setAuthError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    setAuthError(null);
    setIsActionLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, {
        displayName: nickname.trim()
      });
      // Save profile to users collection
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        userId: cred.user.uid,
        username: nickname.trim(),
        email: 'anonymous@kafadantaktik.com',
        createdAt: serverTimestamp()
      });
      // Initialize statistics
      await initializeUserStats(cred.user.uid);
    } catch (err: any) {
      setAuthError(err.message || 'Giriş yapılamadı.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Google Auth
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsActionLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const username = cred.user.displayName || cred.user.email?.split('@')[0] || 'Kafadan Taktikçi';
      
      // Save profile to users collection
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        userId: cred.user.uid,
        username: username,
        email: cred.user.email || 'google@kafadantaktik.com',
        createdAt: serverTimestamp()
      }, { merge: true });

      // Initialize statistics
      await initializeUserStats(cred.user.uid);
    } catch (err: any) {
      setAuthError(err.message || 'Google ile giriş yapılamadı.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Email Auth (Sign In / Register)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() && isSignUp) {
      setAuthError('Kullanıcı adı giriniz.');
      return;
    }
    if (!email || !password) {
      setAuthError('Lütfen tüm alanları doldurun.');
      return;
    }
    setAuthError(null);
    setIsActionLoading(true);
    try {
      if (isSignUp) {
        // Register
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
        // Initialize statistics
        await initializeUserStats(cred.user.uid);
      } else {
        // Login
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setNickname(cred.user.displayName || '');
        // Initialize statistics
        await initializeUserStats(cred.user.uid);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Kimlik doğrulama hatası.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Create match room
  const handleCreateMatch = async () => {
    if (!currentUser) return;
    setIsActionLoading(true);
    const matchId = 'match_' + Math.random().toString(36).substring(2, 10);
    setMatchStatusMsg('Online oda kuruluyor, rakip bekleniyor...');
    
    try {
      const matchRef = doc(db, 'matches', matchId);
      await setDoc(matchRef, {
        matchId,
        hostId: currentUser.uid,
        hostUsername: currentUser.displayName || 'Ev Sahibi',
        hostTeam: hostTeamColor,
        hostThemeId: hostSelectedTheme.id,
        guestId: null,
        guestUsername: null,
        guestTeam: null,
        guestThemeId: null,
        status: 'waiting',
        phase: 'PLACEMENT', // Start at drafting/placement syncing
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveMatchId(matchId);
      
      // Setup dynamic listener for this room to watch if opponent joins
      const unsub = onSnapshot(matchRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.guestId) {
            unsub(); // stop listening
            setMatchStatusMsg('Rakip bağlandı! Maç başlatılıyor...');
            
            // Sync host & guest themes
            const hostThemeObj = TEAMS.find(t => t.id === data.hostThemeId) || TEAMS[0];
            const guestThemeObj = TEAMS.find(t => t.id === data.guestThemeId) || TEAMS[2];
            
            setTeamATheme(hostThemeObj);
            setTeamBTheme(guestThemeObj);

            setTimeout(() => {
              onMatchConnected(
                matchId, 
                true, // isHost
                data.hostTeam, // myTeam
                hostThemeObj, 
                guestThemeObj
              );
            }, 1000);
          }
        }
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `matches/${matchId}`);
      setMatchStatusMsg('Oda kurulamadı: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Join existing match room
  const handleJoinMatch = async (match: any) => {
    if (!currentUser) return;
    setIsActionLoading(true);
    setMatchStatusMsg('Odaya bağlanılıyor...');
    
    const assignedGuestTeam = match.hostTeam === 'Siyah' ? 'Beyaz' : 'Siyah';
    // Decide automatic opponent theme (not chosen by host)
    const hostThemeObj = TEAMS.find(t => t.id === match.hostThemeId) || TEAMS[0];
    const guestThemeObj = TEAMS.find(t => t.id !== match.hostThemeId) || TEAMS[2];

    try {
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        guestId: currentUser.uid,
        guestUsername: currentUser.displayName || 'Deplasman',
        guestTeam: assignedGuestTeam,
        guestThemeId: guestThemeObj.id,
        status: 'playing',
        updatedAt: serverTimestamp()
      });

      setTeamATheme(hostThemeObj);
      setTeamBTheme(guestThemeObj);
      setMatchStatusMsg('Bağlantı başarılı! Saniye sayıyor...');

      setTimeout(() => {
        onMatchConnected(
          match.id, 
          false, // isHost
          assignedGuestTeam, // myTeam
          guestThemeObj, 
          hostThemeObj
        );
      }, 1000);

    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `matches/${match.id}`);
      setMatchStatusMsg('Odaya katılım başarısız oldu: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancel hosting (delete room)
  const handleCancelHosting = async () => {
    if (!activeMatchId) return;
    try {
      await deleteDoc(doc(db, 'matches', activeMatchId));
      setActiveMatchId(null);
      setMatchStatusMsg(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Render Auth screen
  if (authLoading) {
    return (
      <div className="p-12 text-center bg-[#FAF7EE] rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-[#0C251C]/10 min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-[#E75A51] animate-spin" />
        <span className="text-xs text-[#0C251C]/60 font-bold uppercase tracking-wider font-mono">Sunucuya bağlanıyor...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 md:p-8 bg-[#FAF7EE]/50 rounded-xl border-2 border-[#0C251C] flex flex-col gap-6 max-w-md mx-auto my-6 animate-fade-in shadow-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 border-2 border-[#0C251C]">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-[#0C251C] mt-3 uppercase tracking-tight">ONLINE MULTIPLAYER</h2>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            Türkiye 2026 veri kanunlarına tam uyumlu, KVKK güvenceli ve gerçek zamanlı d20 online karşılaşma odaları!
          </p>
        </div>

        {authError && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs leading-normal">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Auth form options wrapper */}
        <div className="space-y-4">
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg border-2 border-slate-200 active:scale-98 transition-all cursor-pointer shadow-sm"
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
            <span className="px-3">VEYA RUMUZ İLE</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <form onSubmit={handleAnonymousAuth} className="p-4 bg-white rounded-lg border border-[#0C251C]/10 space-y-3 shadow-inner">
            <span className="bg-emerald-900/10 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono">
              Hızlı Giriş (Önerilen)
            </span>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-black text-slate-500 font-mono">Kullanıcı Rumuz:</label>
              <input
                type="text"
                placeholder="Rumuzunuzu yazın (örn: FutbolUstasi)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={16}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border-2 border-[#0C251C]/10 rounded-lg focus:outline-none focus:border-[#E75A51]"
              />
            </div>
            <button
              type="submit"
              disabled={isActionLoading}
              className="w-full bg-[#0C251C] text-[#FAF7EE] text-xs font-black uppercase tracking-wider py-2.5 rounded-lg active:scale-98 hover:brightness-110 cursor-pointer disabled:opacity-50"
            >
              Hemen Hızlı Katıl ➔
            </button>
          </form>

          {/* Spacer */}
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="px-3">VEYA ŞİFRELİ HESAP</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="p-4 bg-white rounded-lg border border-[#0C251C]/10 space-y-3.5 shadow-inner">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">Kullanıcı Rumuz:</label>
                <input
                  type="text"
                  placeholder="Rumuz girin"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-[#0C251C]/10 rounded focus:outline-none"
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
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-[#0C251C]/10 rounded focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">Şifre:</label>
              <input
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-[#0C251C]/10 rounded focus:outline-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={isActionLoading}
              className="w-full bg-[#E75A51] hover:bg-[#d64a41] text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSignUp ? 'KAYIT OL' : 'KULLANICI GİRİŞİ'}
            </button>

            <div className="text-center pt-1.5">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] text-blue-700 font-bold underline cursor-pointer"
              >
                {isSignUp ? 'İçeride hesabım var, Giriş Yap' : 'Şifreli Yeni Hesap Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Active Lobby Screen (Joined / Authenticated User dashboard)
  return (
    <div className="p-6 bg-[#FAF7EE] rounded-xl border-2 border-[#0C251C] flex flex-col gap-6 max-w-3xl mx-auto my-6 animate-fade-in shadow-xl text-[#0C251C]">
      
      {/* Profile HUD Row */}
      <div className="flex items-center justify-between bg-white border border-[#0C251C]/10 p-4 rounded-xl shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold border-2 border-[#0C251C]">
            ⚽
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Aktif Sporcu Profil</span>
            <span className="text-sm font-black font-sans text-[#0C251C]">{currentUser.displayName || 'Kafadan Taktikçi'}</span>
          </div>
        </div>

        <button
          onClick={() => {
            signOut(auth);
            setActiveMatchId(null);
            setMatchStatusMsg(null);
          }}
          className="flex items-center gap-1.5 py-1 px-3 bg-slate-100 hover:bg-slate-200 border-2 border-transparent hover:border-slate-300 rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer text-slate-600 transition-all active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          Oturumu Kapat
        </button>
      </div>

      {matchStatusMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
            <span className="text-xs font-black text-emerald-800 leading-none">{matchStatusMsg}</span>
          </div>
          {activeMatchId && (
            <button
              onClick={handleCancelHosting}
              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold uppercase rounded border border-red-300 transition-all"
            >
              İptal Et
            </button>
          )}
        </div>
      )}

      {/* Main Interactive Action Box Grid */}
      {!activeMatchId ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Host Side (5 cols) */}
          <div className="md:col-span-5 bg-white p-5 rounded-xl border border-[#0C251C]/10 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <span className="bg-orange-100 text-orange-850 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-orange-250 font-mono inline-block">
                1. ODA KUR (EV SAHİBİ)
              </span>
              <p className="text-[11px] text-slate-550 leading-relaxed font-sans">
                Yeni bir kura oyun masası açıp, dilediğiniz formasyon renklerini alın. Rakipler odanızı görüp bağlanabilirler.
              </p>

              {/* Form Team/Theme Selection */}
              <div className="space-y-2 pt-2">
                <label className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Takım Sürümü:</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {TEAMS.map(theme => (
                    <button
                      key={`lobby-theme-${theme.id}`}
                      type="button"
                      onClick={() => setHostSelectedTheme(theme)}
                      className={`p-2 rounded text-[10.5px] font-black border transition-all text-left flex items-center gap-1.5 cursor-pointer
                        ${hostSelectedTheme.id === theme.id 
                          ? 'bg-amber-50 border-[#E75A51] ring-2 ring-[#E75A51]' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                        }
                      `}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.primaryBg }}></span>
                      <span className="truncate">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Color Assignment (Siyah vs Beyaz starting rolls) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Kura Başlangıç Grubu:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHostTeamColor('Siyah')}
                    className={`flex-1 py-1.5 text-center text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer
                      ${hostTeamColor === 'Siyah' ? 'bg-slate-900 border-black text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
                    `}
                  >
                    Siyah Renk
                  </button>
                  <button
                    type="button"
                    onClick={() => setHostTeamColor('Beyaz')}
                    className={`flex-1 py-1.5 text-center text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer
                      ${hostTeamColor === 'Beyaz' ? 'bg-slate-300 border-slate-400 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
                    `}
                  >
                    Beyaz Renk
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateMatch}
              disabled={isActionLoading}
              className="w-full bg-[#E75A51] hover:bg-[#d64a41] text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              Odayı Kur & Başlat
            </button>
          </div>

          {/* Lobby Lists (7 cols) */}
          <div className="md:col-span-7 bg-white p-5 rounded-xl border border-[#0C251C]/10 space-y-3 shadow-sm flex flex-col justify-between min-h-[300px]">
            <div className="space-y-3.5 w-full">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="bg-sky-100 text-sky-850 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-sky-250 font-mono inline-block">
                  2. LOBİ ADRESİ (ODAYA KATIL)
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  {lobbyList.length} Aktif Oda
                </span>
              </div>

              {lobbiesLoading ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
                  <span className="text-[10px] font-bold text-slate-400">Canlı lobi taranıyor...</span>
                </div>
              ) : lobbyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1.5">
                  <Globe className="w-8 h-8 mx-auto stroke-[1.5] text-slate-300" />
                  <p className="text-[11px] font-bold uppercase tracking-wider font-mono">Şu an bekleyen aktif maç yok.</p>
                  <p className="text-[10px] px-4 font-medium">İlk odayı kurmak için sol tarafı kullanın ya da sayfanın bağlanmasını bekleyin!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {lobbyList.map((lobby) => {
                    const lTheme = TEAMS.find(t => t.id === lobby.hostThemeId) || TEAMS[0];
                    return (
                      <div 
                        key={lobby.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-4 pl-3.5 pr-2.5 hover:border-sky-500 transition-all hover:shadow-xs group"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-black flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lTheme.primaryBg, border: `1px solid ${lTheme.secondaryBg}` }}></span>
                            <span>{lobby.hostUsername}</span>
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded-full py-0.2 font-mono">
                              {lTheme.name}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-sans font-semibold">
                            Kura Rengi: <strong className="text-slate-800">{lobby.hostTeam === 'Siyah' ? 'Siyah' : 'Beyaz'}</strong>
                          </p>
                        </div>

                        <button
                          onClick={() => handleJoinMatch(lobby)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-black/10 flex items-center gap-1 cursor-pointer scale-100 group-hover:scale-102 transition-all active:scale-98 shadow disabled:opacity-50"
                        >
                          Maça Katıl ➔
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 font-mono text-center pt-2.5 border-t w-full">
              Canlı veri akışı ve real-time eşleşme odası.
            </div>
          </div>

        </div>
      ) : (
        <div className="py-12 bg-white/40 border border-dashed border-[#0C251C]/15 rounded-xl text-center space-y-4">
          <RefreshCw className="w-8 h-8 mx-auto text-[#E75A51] animate-spin" />
          <h3 className="text-lg font-black uppercase">Rakip Oyuncu Bekleniyor...</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto px-4">
            Odanız online kurallara uygun olarak sunucu hafızasında listelendi. Diğer oyuncu katıldığı anda kura atışı ve oyuncu draf sekansı otomatik olarak ekranda canlanacaktır.
          </p>
        </div>
      )}

    </div>
  );
}
