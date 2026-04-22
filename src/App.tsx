import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  History as HistoryIcon, 
  Clover, 
  Database, 
  Users, 
  Bell, 
  LogOut,
  Plus,
  X,
  Hammer,
  Coins,
  ShoppingCart,
  ScrollText,
  CheckCircle2,
  XCircle,
  Trash2,
  Camera,
  Image as ImageIcon,
  User,
  Trophy,
  Shield,
  Calendar,
  ExternalLink,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Lock,
  ShieldCheck,
  Archive,
  Search,
  Castle,
  Volume2,
  VolumeX,
  AlertTriangle,
  ArrowLeft,
  Skull,
  Save,
  BellOff,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CPState, Player, Character, LootItem, CraftMaterial, Contribution, Sale, HistoryEntry, Item, LotteryDraw, WarehouseItem, Equipment, SiegeEvent, BossEvent, CPNotification, Fine, Tribute, Boss, DKPHistoryEntry } from './types';

const DEFAULT_CLAN_LOGO = 'https://storage.googleapis.com/multimodal-queries/queries/ais/2026-04-07/01-19-29/logo.png';
const STORAGE_KEY = 'l2-cp-manager-state';
const ADMIN_EMAIL = 'albertrodrigosp@gmail.com';

const compressImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's a video or gif, we don't compress it the same way
    if (file.type.includes('video') || file.type.includes('gif')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const INITIAL_STATE: CPState = {
  players: [
    { id: '1', name: 'BadGarota' },
    { id: '2', name: 'Colopinto' },
    { id: '3', name: 'Kezinha' },
    { id: '4', name: 'llGravell' },
    { id: '5', name: 'Malakai' },
    { id: '6', name: 'Marlboro' },
    { id: '7', name: 'Pexenea' },
    { id: '8', name: 'Vaagma' },
    { id: '9', name: 'x0PRESS0RX' },
  ],
  loot: [],
  craft: [],
  craftSlots: Array(9).fill(null),
  recipe: Array(12).fill({ name: '', quantity: '' }),
  recipeName: '',
  recipeQuantity: '',
  contributions: Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [i, Array(12).fill({ name: '', quantity: '', unitValue: '' })])
  ),
  sales: [],
  history: [],
  items: [],
  guestPlayers: [],
  lotteryHistory: [],
  warehouseItems: [],
  siegeEvents: [],
  bossEvents: [],
  notifications: [],
  currentUser: null,
  clanLogoUrl: '',
  tributes: [],
  fines: [],
  bosses: [],
  dkpHistory: [],
};

const BOSS_CATEGORIES = [
  "20-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50-54",
  "55-59",
  "60-64"
];

const formatTimeLeft = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatTargetTime = (ms: number) => {
  return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const EquipmentSlot = ({ 
  slot, 
  label, 
  player, 
  isOwner, 
  onEdit,
  className = ""
}: { 
  slot: string, 
  label: string, 
  player: Player | undefined, 
  isOwner: boolean, 
  onEdit: (slot: string, currentVal: { name: string, grade: string }) => void,
  className?: string
}) => {
  if (!player) return null;
  const item = (player.equipment as any)?.[slot] || { name: '', grade: '' };
  const value = typeof item === 'string' ? item : item.name;
  const grade = typeof item === 'string' ? '' : item.grade;
  
  return (
    <button 
      onClick={() => isOwner && onEdit(slot, typeof item === 'string' ? { name: item, grade: '' } : item)}
      className={`relative w-full aspect-square bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col items-center justify-center transition-all ${isOwner ? 'hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer' : 'cursor-default'} ${className}`}
      title={`${grade ? `[${grade}] ` : ''}${value || label}`}
    >
      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter mb-1">{label}</span>
      {value ? (
        <div className="flex flex-col items-center justify-center w-full px-1">
          {grade && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md mb-1 shadow-sm ${
              grade === 'B' ? 'bg-blue-500 text-white' :
              grade === 'C' ? 'bg-yellow-500 text-black' :
              'bg-gray-500 text-white'
            }`}>
              {grade}
            </span>
          )}
          <span className="text-[9px] font-bold text-amber-500 text-center truncate w-full">{value}</span>
        </div>
      ) : (
        <Plus size={12} className="text-gray-700 opacity-30" />
      )}
      
      {isOwner && !value && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Plus size={16} className="text-amber-500" />
        </div>
      )}
    </button>
  );
};

const migrateState = (parsed: any): CPState => {
  const state = {
    ...INITIAL_STATE,
    ...parsed,
    players: Array.isArray(parsed.players) ? parsed.players : INITIAL_STATE.players,
    loot: Array.isArray(parsed.loot) ? parsed.loot : INITIAL_STATE.loot,
    craft: Array.isArray(parsed.craft) ? parsed.craft : INITIAL_STATE.craft,
    sales: Array.isArray(parsed.sales) ? parsed.sales : INITIAL_STATE.sales,
    history: Array.isArray(parsed.history) ? parsed.history : INITIAL_STATE.history,
    items: Array.isArray(parsed.items) ? parsed.items : INITIAL_STATE.items,
    guestPlayers: Array.isArray(parsed.guestPlayers) ? parsed.guestPlayers : INITIAL_STATE.guestPlayers,
    lotteryHistory: Array.isArray(parsed.lotteryHistory) ? parsed.lotteryHistory : INITIAL_STATE.lotteryHistory || [],
    warehouseItems: Array.isArray(parsed.warehouseItems) ? parsed.warehouseItems : INITIAL_STATE.warehouseItems || [],
    siegeEvents: Array.isArray(parsed.siegeEvents) ? parsed.siegeEvents : INITIAL_STATE.siegeEvents || [],
    bossEvents: Array.isArray(parsed.bossEvents) ? parsed.bossEvents : INITIAL_STATE.bossEvents || [],
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : INITIAL_STATE.notifications || [],
    tributes: Array.isArray(parsed.tributes) ? parsed.tributes : INITIAL_STATE.tributes || [],
    fines: Array.isArray(parsed.fines) ? parsed.fines : INITIAL_STATE.fines || [],
    bosses: Array.isArray(parsed.bosses) ? parsed.bosses : INITIAL_STATE.bosses || [],
    currentUser: parsed.currentUser !== undefined ? parsed.currentUser : INITIAL_STATE.currentUser,
    clanLogoUrl: parsed.clanLogoUrl || INITIAL_STATE.clanLogoUrl || '',
  };

  // Ensure notifications have readBy array
  state.notifications = state.notifications.map((n: any) => ({
    ...n,
    readBy: Array.isArray(n.readBy) ? n.readBy : []
  }));

  // Migrate legacy sales
  state.sales = state.sales.map((s: any) => ({
    ...s,
    contributions: s.contributions || {},
    allPlayerNames: s.allPlayerNames || [],
    payments: s.payments || {},
    materials: s.materials || [],
    sellerName: s.sellerName || '',
    salePrice: s.salePrice || s.totalValue || 0
  }));

  // Migrate legacy history
  state.history = state.history.map((h: any) => ({
    ...h,
    contributions: h.contributions || {},
    allPlayerNames: h.allPlayerNames || [],
    payments: h.payments || {},
    materials: h.materials || [],
    sellerName: h.sellerName || '',
    totalValue: h.totalValue || 0
  }));

  if (!state.contributions || typeof state.contributions !== 'object') {
    state.contributions = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [i, Array(12).fill({ name: '', quantity: '', unitValue: '' })])
    );
  } else {
    // Ensure each contribution has a unitValue field
    Object.keys(state.contributions).forEach(key => {
      if (Array.isArray(state.contributions[key])) {
        state.contributions[key] = state.contributions[key].map((c: any) => ({
          ...c,
          unitValue: c.unitValue || c.value || ''
        }));
      }
    });
  }
  return state;
};

export default function App() {
  const [state, setState] = useState<CPState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return INITIAL_STATE;
      const parsed = JSON.parse(saved);
      return migrateState(parsed);
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      return INITIAL_STATE;
    }
  });

  const [selectedCP, setSelectedCP] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Craft-CP');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState(state.clanLogoUrl || '');
  const [selectedBossCategory, setSelectedBossCategory] = useState<string | null>(null);
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const [newBossName, setNewBossName] = useState('');
  const [newBossLevel, setNewBossLevel] = useState('');
  const [newBossLocation, setNewBossLocation] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [bossAlert, setBossAlert] = useState<{ name: string; id: string } | null>(null);
  const [showTodayBosses, setShowTodayBosses] = useState(false);
  const alertedBossesRef = useRef<Record<string, number>>({});
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAlertSound = () => {
    if (!isSoundEnabled) return;
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.loop = true;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play()
      .then(() => setIsAudioBlocked(false))
      .catch(e => {
        console.warn("Audio play blocked by browser policy. Interaction required.", e);
        setIsAudioBlocked(true);
      });
  };

  const stopAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Boss Alert Logic - Runs when currentTime or bosses change
  useEffect(() => {
    state.bosses?.forEach(boss => {
      if (boss.lastDeath) {
        const isHighLevel = (boss.level || 0) >= 50;
        const baseHours = isHighLevel ? 10 : 6;
        const baseRespawnTime = boss.lastDeath + (baseHours * 60 * 60 * 1000);
        const timeUntilBase = baseRespawnTime - currentTime;
        const threeMinutes = 3 * 60 * 1000;

        // If within 3 minutes and not already alerted for this specific death
        if (timeUntilBase > 0 && timeUntilBase <= threeMinutes && alertedBossesRef.current[boss.id] !== boss.lastDeath) {
          const bossNotification: CPNotification = {
            id: generateId(),
            type: 'boss',
            message: `BOSS ALERTA: ${boss.name} nasce em 3 minutos!`,
            timestamp: Date.now(),
            readBy: []
          };
          setBossAlert({ name: boss.name, id: boss.id });
          alertedBossesRef.current[boss.id] = boss.lastDeath;
          playAlertSound();
          setState(prev => ({
            ...prev,
            notifications: [bossNotification, ...(prev.notifications || [])]
          }));
        }
      }
    });
  }, [currentTime, state.bosses]);

  // Auto-unlock audio on first interaction
  useEffect(() => {
    const unlock = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setIsAudioBlocked(false);
          window.removeEventListener('click', unlock);
        }).catch(() => {});
      } else {
        const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        a.volume = 0;
        a.play().then(() => {
          setIsAudioBlocked(false);
          window.removeEventListener('click', unlock);
        }).catch(() => {});
      }
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, []);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      // Auto-reset bosses after window end
      setState(prev => {
        const hasBossToReset = prev.bosses?.some(b => {
          if (!b.lastDeath) return false;
          const isHighLevel = (b.level || 0) >= 50;
          const endHours = isHighLevel ? 11.5 : 7.5;
          return (now - b.lastDeath) > (endHours * 60 * 60 * 1000);
        });
        
        if (!hasBossToReset) return prev;
        
        return {
          ...prev,
          bosses: prev.bosses?.map(b => {
            if (!b.lastDeath) return b;
            const isHighLevel = (b.level || 0) >= 50;
            const endHours = isHighLevel ? 11.5 : 7.5;
            return (now - b.lastDeath) > (endHours * 60 * 60 * 1000)
              ? { ...b, lastDeath: undefined }
              : b;
          })
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    setNewLogoUrl(state.clanLogoUrl || '');
  }, [state.clanLogoUrl]);

  const [loginName, setLoginName] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tributeForm, setTributeForm] = useState({ playerName: '', amount: '', description: '' });
  const [fineForm, setFineForm] = useState({ playerName: '', amount: '150000', reason: '' });

  const [hasShownLoginReminder, setHasShownLoginReminder] = useState(false);

  const isAdmin = state.currentUser?.name?.toLowerCase().trim() === 'malakai';
  const isDKPManager = isAdmin;
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const player = state.players.find(p => p.name.toLowerCase() === loginName.trim().toLowerCase());
    const correctPassword = player?.password || '123456789';
    if (player && loginPass === correctPassword) {
      const loginNotification: CPNotification = {
        id: generateId(),
        type: 'info',
        message: `MEMBRO ONLINE: ${player.name} acabou de entrar no sistema!`,
        timestamp: Date.now(),
        readBy: [player.id]
      };
      setState(prev => ({ 
        ...prev, 
        currentUser: player,
        notifications: [loginNotification, ...(prev.notifications || [])]
      }));
      setLoginError('');
      setAudioUnlocked(true); // Login is a user interaction, unlock audio
      setHasShownLoginReminder(false); // Reset reminder state for new login
    } else {
      setLoginError('Nome ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveNotification(null);
    setLastNotificationId(null);
    setHasShownLoginReminder(false);
  };
  // Craft form state
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('1');
  const [newMaterialCost, setNewMaterialCost] = useState('');

  // Success Form state
  const [isSuccessFormOpen, setIsSuccessFormOpen] = useState(false);
  const [isFailureConfirmOpen, setIsFailureConfirmOpen] = useState(false);
  const [successItemName, setSuccessItemName] = useState('');
  const [successItemPrice, setSuccessItemPrice] = useState('');

  // Items tab state
  const [itemForm, setItemForm] = useState({ name: '', unitValue: '', category: 'Material' });
  const [itemSearch, setItemSearch] = useState('');
  const [itemFilter, setItemFilter] = useState('Todos');
  
  // Cla Warehouse state
  const [warehouseForm, setWarehouseForm] = useState({ name: '', quantity: '1', category: 'Material' });
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('Todos');

  // Recipe Editor state
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeMaterialsDraft, setRecipeMaterialsDraft] = useState<{ name: string, quantity: string }[]>([]);

  // DKP state
  const [dkpAmount, setDkpAmount] = useState('');
  const [dkpReason, setDkpReason] = useState('');
  const [selectedDKPPlayerId, setSelectedDKPPlayerId] = useState('');
  const [dkpSearch, setDkpSearch] = useState('');
  const [dkpHistorySearch, setDkpHistorySearch] = useState('');
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editGrade, setEditGrade] = useState<'D' | 'C' | 'B' | ''>('');

  // Profile state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Siege state
  const [siegeForm, setSiegeForm] = useState({ date: '', time: '', castle: '', description: '' });
  const [activeNotification, setActiveNotification] = useState<CPNotification | null>(null);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const [arregueiJustification, setArregueiJustification] = useState('');
  const [arregueiEventId, setArregueiEventId] = useState<string | null>(null);

  // Boss state
  const [bossForm, setBossForm] = useState({ date: '', time: '', bossName: '', description: '' });
  const [bossArregueiJustification, setBossArregueiJustification] = useState('');
  const [bossArregueiEventId, setBossArregueiEventId] = useState<string | null>(null);

  // Lottery state
  const [lotteryPrize, setLotteryPrize] = useState('');
  const [selectedLotteryPlayers, setSelectedLotteryPlayers] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lotteryWinner, setLotteryWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const categories = ['Material', 'Weapon', 'Armor', 'Recipes', 'Outro'];

  const saveToServer = async (data: CPState) => {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Falha ao salvar no servidor');
      console.log('Dados sincronizados com o servidor JSON');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(null);
      // Auto-save to server (debounced slightly via state updates)
      const timeoutId = setTimeout(() => saveToServer(state), 2000);
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
      if (error instanceof Error && (error.name === 'QuotaExceededError' || error.message.includes('quota'))) {
        setStorageError("O armazenamento local está cheio! O sistema não conseguiu salvar as alterações recentes. Por favor, exporte um backup e remova imagens pesadas.");
      }
    }
  }, [state]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: generateId(),
      name: newPlayerName.trim(),
    };
    setState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    setNewPlayerName('');
  };

  const addGuestPlayer = () => {
    if (!newGuestName.trim()) return;
    const name = newGuestName.trim();
    if (state.guestPlayers.includes(name)) return;
    
    setState(prev => {
      const newGuestPlayers = [...prev.guestPlayers, name];
      const newCraftSlots = [...prev.craftSlots];
      const firstEmptySlot = newCraftSlots.findIndex(slot => slot === null);
      if (firstEmptySlot !== -1) {
        newCraftSlots[firstEmptySlot] = name;
      }
      return { ...prev, guestPlayers: newGuestPlayers, craftSlots: newCraftSlots };
    });
    setNewGuestName('');
  };

  const removeGuestPlayer = (name: string) => {
    setState(prev => {
      const newGuestPlayers = prev.guestPlayers.filter(n => n !== name);
      const newCraftSlots = prev.craftSlots.map(slot => slot === name ? null : slot);
      return { ...prev, guestPlayers: newGuestPlayers, craftSlots: newCraftSlots };
    });
  };

  const removePlayer = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      players: prev.players.filter(p => p.id !== id),
      craftSlots: prev.craftSlots.map(slotId => slotId === id ? null : slotId),
      craft: prev.craft.filter(m => m.playerId !== id)
    }));
  };

  const updateClanLogo = () => {
    setState(prev => ({ ...prev, clanLogoUrl: newLogoUrl }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 400, 400);
        setNewLogoUrl(base64);
      } catch (err) {
        console.error('Erro ao processar logo:', err);
      }
    }
  };

  const removeLotteryDraw = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Excluir este registro de sorteio?')) return;
    setState(prev => ({
      ...prev,
      lotteryHistory: (prev.lotteryHistory || []).filter(draw => draw.id !== id)
    }));
  };

  const addWarehouseItem = () => {
    if (!warehouseForm.name.trim()) return;
    const newItem: WarehouseItem = {
      id: generateId(),
      name: warehouseForm.name,
      quantity: parseInt(warehouseForm.quantity) || 1,
      category: warehouseForm.category,
    };
    setState(prev => ({
      ...prev,
      warehouseItems: [newItem, ...(prev.warehouseItems || [])]
    }));
    setWarehouseForm({ name: '', quantity: '1', category: 'Material' });
  };

  const removeWarehouseItem = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja remover este item do armazém?')) return;
    setState(prev => ({
      ...prev,
      warehouseItems: (prev.warehouseItems || []).filter(item => item.id !== id)
    }));
  };

  const updateWarehouseItemImage = async (id: string, file: File) => {
    try {
      const base64 = await compressImage(file, 400, 400);
      setState(prev => ({
        ...prev,
        warehouseItems: (prev.warehouseItems || []).map(item => 
          item.id === id ? { ...item, imageUrl: base64 } : item
        )
      }));
    } catch (err) {
      console.error('Erro ao processar imagem do armazém:', err);
    }
  };

  const updatePlayerImage = async (id: string, file: File) => {
    try {
      const base64 = await compressImage(file, 400, 400);
      setState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === id ? { ...p, imageUrl: base64 } : p),
        currentUser: prev.currentUser?.id === id ? { ...prev.currentUser, imageUrl: base64 } : prev.currentUser
      }));
    } catch (err) {
      console.error('Erro ao processar imagem do player:', err);
    }
  };

  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const playTrumpet = () => {
    // Using Web Audio API to synthesize a "Berrante de Guerra" sound directly
    // This avoids all external loading errors and CORS issues.
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playHornBlast = (startTime: number, duration: number, frequency: number) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();
        
        // Sawtooth gives that "brassy" horn texture
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        // Slight pitch bend for realism
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.05, startTime + duration * 0.2);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.95, startTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 2, startTime);
        filter.frequency.exponentialRampToValueAtTime(frequency * 4, startTime + duration * 0.1);
        filter.frequency.exponentialRampToValueAtTime(frequency * 1.5, startTime + duration);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a sequence of deep horn blasts
      const now = context.currentTime;
      playHornBlast(now, 2.5, 55); // Deep A1
      playHornBlast(now + 0.5, 3.0, 65); // Slightly higher E2-ish
      playHornBlast(now + 1.2, 4.0, 48); // Very deep G1 for the finale
      
    } catch (error) {
      console.error("Web Audio API failed:", error);
    }
  };

  const playChickenScream = () => {
    // Using Web Audio API to synthesize a "Screaming Chicken" sound
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = context.currentTime;

      const playSquawk = (startTime: number, duration: number, baseFreq: number) => {
        const osc = context.createOscillator();
        const mod = context.createOscillator();
        const modGain = context.createGain();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        // Sawtooth for the harsh squawk texture
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        // Frantic pitch slides
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, startTime + duration * 0.3);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, startTime + duration);

        // Fast vibrato for the "trembling" scream effect
        mod.type = 'sine';
        mod.frequency.setValueAtTime(25, startTime); 
        modGain.gain.setValueAtTime(baseFreq * 0.15, startTime);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 1.5, startTime);
        filter.Q.setValueAtTime(3, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        mod.start(startTime);
        osc.start(startTime);
        mod.stop(startTime + duration);
        osc.stop(startTime + duration);
      };

      // A sequence of panicked chicken squawks
      playSquawk(now, 0.25, 900);
      playSquawk(now + 0.15, 0.35, 1100);
      playSquawk(now + 0.4, 0.5, 1300);
      playSquawk(now + 0.8, 0.2, 1000);

    } catch (error) {
      console.error("Chicken scream failed:", error);
    }
  };

  const scheduleSiege = () => {
    if (!siegeForm.date || !siegeForm.time || !siegeForm.castle) return;
    
    const newEvent: SiegeEvent = {
      id: generateId(),
      date: siegeForm.date,
      time: siegeForm.time,
      castle: siegeForm.castle,
      description: siegeForm.description,
      attendance: {},
      createdAt: Date.now()
    };

    const newNotification: CPNotification = {
      id: generateId(),
      type: 'siege',
      message: `NOVA SIEGE CONVOCADA: ${newEvent.castle.toUpperCase()}! Data: ${newEvent.date} às ${newEvent.time}`,
      timestamp: Date.now(),
      readBy: [],
      isManual: true
    };

    setState(prev => ({
      ...prev,
      siegeEvents: [newEvent, ...(prev.siegeEvents || [])],
      notifications: [newNotification, ...(prev.notifications || [])]
    }));

    setSiegeForm({ date: '', time: '', castle: '', description: '' });
    setActiveNotification(newNotification);
    playTrumpet();
  };

  const confirmAttendance = (eventId: string) => {
    if (!state.currentUser) return;
    setState(prev => ({
      ...prev,
      siegeEvents: (prev.siegeEvents || []).map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              attendance: { ...event.attendance, [state.currentUser!.id]: true },
              absences: { ...(event.absences || {}), [state.currentUser!.id]: '' } // Remove from absences if they confirm
            }
          : event
      )
    }));
    // Clean up absence if they were in that list
    setState(prev => ({
      ...prev,
      siegeEvents: (prev.siegeEvents || []).map(event => {
        if (event.id === eventId) {
          const newAbsences = { ...(event.absences || {}) };
          delete newAbsences[state.currentUser!.id];
          return { ...event, absences: newAbsences };
        }
        return event;
      })
    }));
  };

  const handleArreguei = (eventId: string) => {
    if (!state.currentUser || !arregueiJustification.trim()) return;
    
    // Play chicken scream sound
    playChickenScream();

    const event = state.siegeEvents?.find(e => e.id === eventId);
    const castleName = event?.castle || 'Siege';

    const newFine: Fine = {
      id: generateId(),
      playerName: state.currentUser.name,
      amount: 150000,
      reason: `Arregou na Siege de ${castleName}: ${arregueiJustification.trim()}`,
      date: Date.now(),
      status: 'pending',
      eventId: eventId
    };

    setState(prev => ({
      ...prev,
      fines: [newFine, ...(prev.fines || [])],
      siegeEvents: (prev.siegeEvents || []).map(event => {
        if (event.id === eventId) {
          const newAttendance = { ...event.attendance };
          delete newAttendance[state.currentUser!.id];
          
          return {
            ...event,
            attendance: newAttendance,
            absences: {
              ...(event.absences || {}),
              [state.currentUser!.id]: arregueiJustification.trim()
            }
          };
        }
        return event;
      })
    }));
    
    setArregueiJustification('');
    setArregueiEventId(null);
  };

  const payFine = (fineId: string) => {
    setState(prev => ({
      ...prev,
      fines: (prev.fines || []).map(f => f.id === fineId ? { ...f, status: 'paid' } : f)
    }));
  };

  const removeFine = (fineId: string) => {
    if (!isAdmin) return;
    setState(prev => ({
      ...prev,
      fines: (prev.fines || []).filter(f => f.id !== fineId)
    }));
  };

  const addTribute = () => {
    if (!tributeForm.playerName || !tributeForm.amount) return;
    const newTribute: Tribute = {
      id: generateId(),
      playerName: tributeForm.playerName,
      amount: parseL2Number(tributeForm.amount),
      description: tributeForm.description,
      date: Date.now(),
      status: 'pending'
    };
    setState(prev => ({
      ...prev,
      tributes: [newTribute, ...(prev.tributes || [])]
    }));
    setTributeForm({ playerName: '', amount: '', description: '' });
  };

  const BASE_GP = 10; // Valor mínimo para o CÁLCULO do PR, evitando divisão por zero
  const DECAY_RATE = 0.10; // 10% de decaimento semanal

  const addDKP = (type: 'add' | 'sub') => {
    if (!isAdmin) return;
    if (!selectedDKPPlayerId) return alert('Selecione um membro.');
    
    const amount = parseInt(dkpAmount);
    if (isNaN(amount) || amount <= 0) return alert('Quantidade inválida.');
    if (!dkpReason.trim()) return alert('Motivo obrigatório.');

    const player = state.players.find(p => p.id === selectedDKPPlayerId);
    if (!player) return;

    const pointsChange = type === 'add' ? amount : -amount;

    setState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === selectedDKPPlayerId 
          ? { ...p, dkpPoints: (p.dkpPoints || 0) + pointsChange } 
          : p
      ),
      dkpHistory: [{
        id: generateId(),
        playerId: player.id,
        playerName: player.name,
        amount: pointsChange,
        reason: dkpReason,
        timestamp: Date.now(),
        createdBy: 'Malakai',
      }, ...(prev.dkpHistory || [])]
    }));

    setDkpAmount('');
    setDkpReason('');
    alert(`Saldo de ${player.name} atualizado!`);
  };

  const distributeLootGP = (playerId: string, itemName: string, gpCost: number) => {
    if (!isAdmin) return;
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    setState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId 
          ? { ...p, dkpPoints: (p.dkpPoints || 0) - gpCost } 
          : p
      ),
      dkpHistory: [{
        id: generateId(),
        playerId: player.id,
        playerName: player.name,
        amount: -gpCost,
        reason: `LOOT: ${itemName}`,
        timestamp: Date.now(),
        createdBy: 'Malakai',
      }, ...(prev.dkpHistory || [])]
    }));
    alert(`Loot registrado para ${player.name}. -${gpCost} DKP.`);
  };

  const applyDKPDecay = () => {
    if (!isAdmin) return;
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => ({
        ...p,
        dkpPoints: Math.floor((p.dkpPoints || 0) * 0.90)
      })),
      dkpHistory: [{
        id: generateId(),
        playerId: 'system',
        playerName: 'SISTEMA',
        amount: 0,
        reason: 'Decaimento de 10% aplicado',
        timestamp: Date.now(),
        createdBy: 'Malakai',
      }, ...(prev.dkpHistory || [])]
    }));
    alert('Decaimento de 10% aplicado a todos.');
  };

  const handleBulkDKP = (amount: number, reason: string) => {
    if (!isAdmin) return;
    const newEntries = state.players.map(p => ({
      id: generateId(),
      playerId: p.id,
      playerName: p.name,
      amount: amount,
      reason: reason,
      timestamp: Date.now(),
      createdBy: 'Malakai',
    }));

    setState(prev => ({
      ...prev,
      players: prev.players.map(p => ({ ...p, dkpPoints: (p.dkpPoints || 0) + amount })),
      dkpHistory: [...newEntries, ...(prev.dkpHistory || [])]
    }));
    alert(`Bônus de ${amount} DKP aplicado a todos!`);
  };

  const payTribute = (tributeId: string) => {
    setState(prev => ({
      ...prev,
      tributes: (prev.tributes || []).map(t => t.id === tributeId ? { ...t, status: 'paid' } : t)
    }));
  };

  const removeTribute = (tributeId: string) => {
    if (!isAdmin) return;
    setState(prev => ({
      ...prev,
      tributes: (prev.tributes || []).filter(t => t.id !== tributeId)
    }));
  };

  const addManualFine = () => {
    if (!fineForm.playerName || !fineForm.amount || !fineForm.reason) return;
    const newFine: Fine = {
      id: generateId(),
      playerName: fineForm.playerName,
      amount: parseL2Number(fineForm.amount),
      reason: fineForm.reason,
      date: Date.now(),
      status: 'pending'
    };
    setState(prev => ({
      ...prev,
      fines: [newFine, ...(prev.fines || [])]
    }));
    setFineForm({ playerName: '', amount: '150000', reason: '' });
  };

  const awardEventEP = (eventId: string, type: 'siege' | 'boss', amount: number = 50) => {
    if (!isAdmin) return;
    
    const event = type === 'siege' 
      ? state.siegeEvents?.find(e => e.id === eventId)
      : (state.bossEvents || []).find(e => e.id === eventId);
      
    if (!event) return;
    
    const attendees = Object.keys(event.attendance);
    if (attendees.length === 0) {
      alert('Nenhum membro confirmou presença neste evento.');
      return;
    }

    const name = type === 'siege' ? (event as SiegeEvent).castle : (event as BossEvent).bossName;
    const eventName = type === 'siege' ? `Siege ${name}` : `Hunt ${name}`;
    
    const newHistoryEntries: DKPHistoryEntry[] = attendees.map(pid => {
      const player = state.players.find(p => p.id === pid);
      return {
        id: generateId(),
        playerId: pid,
        playerName: player?.name || 'Membro',
        amount: amount,
        reason: `Presença: ${eventName}`,
        timestamp: Date.now(),
        createdBy: 'Malakai',
      };
    });

    setState(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (attendees.includes(p.id)) {
          return { ...p, dkpPoints: (p.dkpPoints || 0) + amount };
        }
        return p;
      }),
      dkpHistory: [...newHistoryEntries, ...(prev.dkpHistory || [])]
    }));

    alert(`DKP atribuído para ${attendees.length} membros!`);
  };

  const deleteDKPEntry = (entryId: string) => {
    if (!isAdmin) return alert('Acesso Negado.');
    
    const entry = state.dkpHistory?.find(e => e.id === entryId);
    if (!entry) return;

    if (!window.confirm('Excluir este registro e reverter os pontos?')) return;

    setState(prev => {
      const h = prev.dkpHistory || [];
      const target = h.find(e => e.id === entryId);
      if (!target) return prev;

      return {
        ...prev,
        players: prev.players.map(p => 
          p.id === target.playerId 
            ? { ...p, dkpPoints: (p.dkpPoints || 0) - target.amount } 
            : p
        ),
        dkpHistory: h.filter(e => e.id !== entryId)
      };
    });
  };

  const clearDKPHistory = () => {
    if (!isAdmin) {
      alert('Acesso Negado.');
      return;
    }
    if (!window.confirm('CUIDADO: Deseja apagar TODO o histórico de DKP?')) return;
    setState(prev => ({ ...prev, dkpHistory: [] }));
  };

  const clearCraftHistory = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODO o histórico de Crafts e Vendas?')) return;
    setState(prev => ({ ...prev, history: [], sales: [] }));
  };

  const clearFinesHistory = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODO o histórico de multas?')) return;
    setState(prev => ({ ...prev, fines: [] }));
  };

  const clearTributesHistory = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODO o histórico de tributos?')) return;
    setState(prev => ({ ...prev, tributes: [] }));
  };

  const clearLotteryHistory = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODO o histórico de sorteios?')) return;
    setState(prev => ({ ...prev, lotteryHistory: [] }));
  };

  const clearNotifications = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODAS as notificações?')) return;
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const clearLoot = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODO o Loot pendente?')) return;
    setState(prev => ({ ...prev, loot: [] }));
  };

  const clearBossHistory = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODAS as hunts agendadas?')) return;
    setState(prev => ({ ...prev, bossEvents: [] }));
  };

  const clearSiegeHistory = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODAS as sieges agendadas?')) return;
    setState(prev => ({ ...prev, siegeEvents: [] }));
  };

  const clearWarehouse = () => {
    if (!isAdmin) return;
    if (!window.confirm('Deseja apagar TODO o Clan Warehouse? ESTA AÇÃO É IRREVERSÍVEL.')) return;
    setState(prev => ({ ...prev, warehouseItems: [] }));
  };

  const deleteSiegeEvent = (eventId: string) => {
    if (!isAdmin) return;
    
    setState(prev => ({
      ...prev,
      siegeEvents: (prev.siegeEvents || []).filter(event => event.id !== eventId)
    }));
  };

  const markNotificationRead = (id: string) => {
    if (!state.currentUser) return;
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => 
        n.id === id ? { ...n, readBy: [...new Set([...n.readBy, state.currentUser!.id])] } : n
      )
    }));
  };

  const addBoss = () => {
    if (!newBossName || !newBossLevel || !selectedBossCategory) return;
    const newBoss: Boss = {
      id: generateId(),
      name: newBossName,
      level: parseInt(newBossLevel),
      category: selectedBossCategory,
      location: newBossLocation
    };
    setState(prev => ({
      ...prev,
      bosses: [...(prev.bosses || []), newBoss]
    }));
    setNewBossName('');
    setNewBossLevel('');
    setNewBossLocation('');
  };

  const deleteBoss = (id: string) => {
    if (!isAdmin) return;
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).filter(b => b.id !== id)
    }));
    if (selectedBossId === id) setSelectedBossId(null);
  };

  const [manualDeathDate, setManualDeathDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDeathTime, setManualDeathTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  const markBossDead = (id: string, timestamp?: number) => {
    const timeToSet = timestamp || Date.now();
    const userName = state.currentUser?.name || 'Sistema';
    const boss = state.bosses?.find(b => b.id === id);
    
    if (boss) {
      const deathNotification: CPNotification = {
        id: generateId(),
        type: 'boss',
        message: `BOSS ABATIDO: ${boss.name} foi morto por ${userName}!`,
        timestamp: Date.now(),
        readBy: []
      };

      setState(prev => ({
        ...prev,
        bosses: (prev.bosses || []).map(b => 
          b.id === id ? { ...b, lastDeath: timeToSet, killedBy: userName } : b
        ),
        notifications: [deathNotification, ...(prev.notifications || [])]
      }));
    }
  };

  const resetBossStatus = (id: string) => {
    if (!isAdmin) return;
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => 
        b.id === id ? { ...b, lastDeath: undefined, killedBy: undefined } : b
      )
    }));
  };

  const scheduleBossHunt = () => {
    if (!bossForm.date || !bossForm.time || !bossForm.bossName) return;
    
    const newEvent: BossEvent = {
      id: generateId(),
      date: bossForm.date,
      time: bossForm.time,
      bossName: bossForm.bossName,
      description: bossForm.description,
      attendance: {},
      createdAt: Date.now()
    };

    const newNotification: CPNotification = {
      id: generateId(),
      type: 'boss',
      message: `NOVA HUNT DE BOSS: ${newEvent.bossName.toUpperCase()}! Data: ${newEvent.date} às ${newEvent.time}`,
      timestamp: Date.now(),
      readBy: [],
      isManual: true
    };

    setState(prev => ({
      ...prev,
      bossEvents: [newEvent, ...(prev.bossEvents || [])],
      notifications: [newNotification, ...(prev.notifications || [])]
    }));

    setBossForm({ date: '', time: '', bossName: '', description: '' });
    setActiveNotification(newNotification);
  };

  const confirmBossAttendance = (eventId: string) => {
    if (!state.currentUser) return;
    setState(prev => ({
      ...prev,
      bossEvents: (prev.bossEvents || []).map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              attendance: { ...event.attendance, [state.currentUser!.id]: true },
              absences: { ...(event.absences || {}), [state.currentUser!.id]: '' }
            }
          : event
      )
    }));
    setState(prev => ({
      ...prev,
      bossEvents: (prev.bossEvents || []).map(event => {
        if (event.id === eventId) {
          const newAbsences = { ...(event.absences || {}) };
          delete newAbsences[state.currentUser!.id];
          return { ...event, absences: newAbsences };
        }
        return event;
      })
    }));
  };

  const handleBossArreguei = (eventId: string) => {
    if (!state.currentUser || !bossArregueiJustification.trim()) return;
    
    setState(prev => ({
      ...prev,
      bossEvents: (prev.bossEvents || []).map(event => {
        if (event.id === eventId) {
          const newAttendance = { ...event.attendance };
          delete newAttendance[state.currentUser!.id];
          
          return {
            ...event,
            attendance: newAttendance,
            absences: {
              ...(event.absences || {}),
              [state.currentUser!.id]: bossArregueiJustification.trim()
            }
          };
        }
        return event;
      })
    }));
    
    setBossArregueiJustification('');
    setBossArregueiEventId(null);
  };

  const deleteBossEvent = (eventId: string) => {
    if (!isAdmin) return;
    
    setState(prev => ({
      ...prev,
      bossEvents: (prev.bossEvents || []).filter(event => event.id !== eventId)
    }));
  };

  // Simulate real-time notifications for the current user
  useEffect(() => {
    if (!state.currentUser) return;
    
    // Find all unread siege or boss notifications
    const unreadNotifications = (state.notifications || []).filter(n => 
      (n.type === 'siege' || n.type === 'boss') && 
      !n.readBy.includes(state.currentUser!.id)
    );

    // Only process the first one and wait for it to be cleared/read
    // This prevents infinite loops when multiple notifications exist
    // Only show pop-up for manual convocations (isManual)
    const nextNotification = unreadNotifications.find(n => n.isManual);

    if (nextNotification && nextNotification.id !== lastNotificationId) {
      setActiveNotification(nextNotification);
      setLastNotificationId(nextNotification.id);
      if (nextNotification.type === 'siege') {
        playTrumpet();
      }
    }
  }, [state.notifications, state.currentUser, lastNotificationId]);

  // Trigger notification on login if there are upcoming sieges
  useEffect(() => {
    if (state.currentUser && !hasShownLoginReminder) {
      const now = new Date();
      const upcomingSiege = state.siegeEvents?.find(e => {
        const eventDate = new Date(e.date + 'T' + e.time);
        return eventDate > now;
      });

      if (upcomingSiege) {
        setHasShownLoginReminder(true);
        // Create a reminder notification
        const reminder: CPNotification = {
          id: `login-remind-${upcomingSiege.id}`,
          type: 'siege',
          message: `CONVOCAÇÃO ATIVA: SIEGE EM ${upcomingSiege.castle.toUpperCase()}! Data: ${upcomingSiege.date} às ${upcomingSiege.time}`,
          timestamp: Date.now(),
          readBy: []
        };
        
        // Small delay to ensure UI is ready after login
        const timer = setTimeout(() => {
          setActiveNotification(reminder);
          playTrumpet();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [state.currentUser, state.siegeEvents, hasShownLoginReminder]);

  const updateCharacterSlot = (playerId: string, index: number, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id === playerId) {
          let characters = p.characters ? [...p.characters] : [];
          
          if (characters.length === 0) {
            characters = [
              {
                id: generateId(),
                class: p.class,
                level: p.level,
                notes: p.notes,
                imageUrl: p.characterImageUrl,
                equipment: p.equipment
              },
              { id: generateId() },
              { id: generateId() },
              { id: generateId() }
            ];
          }

          while (characters.length < 4) {
            characters.push({ id: generateId() });
          }

          characters[index] = {
            ...characters[index],
            ...updates
          };

          return { ...p, characters };
        }
        return p;
      })
    }));
  };

  const updateCharacterImage = async (id: string, file: File) => {
    try {
      const base64 = await compressImage(file, 800, 800);
      updateCharacterSlot(id, activeCharacterIndex, { imageUrl: base64 });
    } catch (err) {
      console.error('Erro ao processar imagem do personagem:', err);
    }
  };

  const updatePlayerInfo = (id: string, field: string, value: string) => {
    updateCharacterSlot(id, activeCharacterIndex, { [field]: value });
  };

  const updateEquipment = (playerId: string, slot: string, name: string, grade: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id === playerId) {
          let characters = p.characters ? [...p.characters] : [];
          if (characters.length === 0) {
            characters = [
              { id: generateId(), class: p.class, level: p.level, notes: p.notes, imageUrl: p.characterImageUrl, equipment: p.equipment },
              { id: generateId() }, { id: generateId() }, { id: generateId() }
            ];
          }
          while (characters.length < 4) characters.push({ id: generateId() });

          const currentEquipment = characters[activeCharacterIndex].equipment || {};
          characters[activeCharacterIndex] = {
            ...characters[activeCharacterIndex],
            equipment: {
              ...currentEquipment,
              [slot]: { name, grade }
            }
          };
          return { ...p, characters };
        }
        return p;
      })
    }));
  };

  const changePassword = () => {
    if (!state.currentUser) return;
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === state.currentUser?.id ? { ...p, password: newPassword } : p),
      currentUser: prev.currentUser ? { ...prev.currentUser, password: newPassword } : null
    }));

    setPasswordMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 3000);
  };

  const addLoot = () => {
    if (!newItemName.trim() || !newItemPrice) return;
    const newItem: LootItem = {
      id: generateId(),
      name: newItemName.trim(),
      price: parseL2Number(newItemPrice),
    };
    setState(prev => ({ ...prev, loot: [...prev.loot, newItem] }));
    setNewItemName('');
    setNewItemPrice('');
  };

  const removeLoot = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Remover este item do loot?')) return;
    setState(prev => ({ ...prev, loot: prev.loot.filter(i => i.id !== id) }));
  };

  const sendLootToSales = () => {
    if (!newItemName.trim() || !newItemPrice) {
      alert("Por favor, insira o nome do item e o preço.");
      return;
    }

    const commonId = generateId();
    const price = parseL2Number(newItemPrice);
    
    // Get all selected contributors (members and guests)
    const allPlayerNames = state.craftSlots
      .filter(slot => slot !== null)
      .map(slot => {
        const player = state.players.find(p => p.id === slot);
        if (player) return player.name;
        return slot as string;
      });

    if (allPlayerNames.length === 0) {
      alert("Selecione ao menos um contribuinte na seção ao lado.");
      return;
    }

    const historyEntry: HistoryEntry = {
      id: commonId,
      recipeName: newItemName.trim(),
      recipeQuantity: '1',
      materials: [],
      contributions: {},
      allPlayerNames,
      timestamp: Date.now(),
      totalValue: price,
      payoutPerPlayer: price / allPlayerNames.length,
      isVendaConcluida: false,
      isSold: false,
      payments: Object.fromEntries(allPlayerNames.map(name => [name, false])),
      sellerName: '',
    };

    const newSale: Sale = {
      id: commonId,
      itemName: newItemName.trim(),
      salePrice: price,
      sellerName: '',
      status: 'pending',
      createdAt: Date.now(),
      isVendaConcluida: false,
      payments: Object.fromEntries(allPlayerNames.map(name => [name, false])),
      contributions: {},
      allPlayerNames,
      materials: [],
      recipeQuantity: '1',
    };

    setState(prev => ({
      ...prev,
      history: [historyEntry, ...prev.history],
      sales: [newSale, ...prev.sales],
      loot: [],
    }));

    setNewItemName('');
    setNewItemPrice('');
    setActiveTab('Vendas');
  };

  const assignPlayerToSlot = (slotIndex: number, playerId: string | null) => {
    setState(prev => {
      const newSlots = [...prev.craftSlots];
      newSlots[slotIndex] = playerId;
      return { ...prev, craftSlots: newSlots };
    });
  };

  const addCraft = (slotIndex: number) => {
    const playerId = state.craftSlots[slotIndex];
    if (!playerId || !newMaterialName.trim() || !newMaterialCost) return;
    
    const newMaterial: CraftMaterial = {
      id: generateId(),
      name: newMaterialName.trim(),
      quantity: Number(newMaterialQuantity) || 1,
      cost: Number(newMaterialCost),
      playerId: playerId,
    };
    setState(prev => ({ ...prev, craft: [...prev.craft, newMaterial] }));
    setNewMaterialName('');
    setNewMaterialQuantity('1');
    setNewMaterialCost('');
    setSelectedSlotIndex(null);
  };

  const removeCraft = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Remover este material?')) return;
    setState(prev => ({ ...prev, craft: prev.craft.filter(m => m.id !== id) }));
  };

  const updateRecipeMaterial = (index: number, field: 'name' | 'quantity', value: string) => {
    setState(prev => {
      const newRecipe = [...prev.recipe];
      let finalValue = value;
      if (field === 'quantity') {
        finalValue = formatL2Number(value);
      }
      newRecipe[index] = { ...newRecipe[index], [field]: finalValue };
      return { ...prev, recipe: newRecipe };
    });
  };

  const updateContribution = (slotIndex: number, itemIndex: number, field: 'name' | 'quantity' | 'unitValue', value: string) => {
    setState(prev => {
      const newContributions = { ...prev.contributions };
      const slotContributions = [...newContributions[slotIndex]];
      
      let finalValue = value;
      if (field === 'quantity' || field === 'unitValue') {
        finalValue = formatL2Number(value);
      }

      // If name is updated, try to auto-fill price from items database
      if (field === 'name') {
        const trimmedValue = value.trim().toLowerCase();
        
        // Auto-correct case from Recipe list
        const recipeMatch = prev.recipe.find(r => r.name.trim().toLowerCase() === trimmedValue);
        const finalName = recipeMatch ? recipeMatch.name : value;

        const foundItem = prev.items.find(i => i.name.toLowerCase() === trimmedValue);
        if (foundItem) {
          slotContributions[itemIndex] = { 
            ...slotContributions[itemIndex], 
            name: finalName,
            unitValue: formatL2Number(foundItem.unitValue)
          };
          newContributions[slotIndex] = slotContributions;
          return { ...prev, contributions: newContributions };
        }
        
        // Even if not in items database, correct case from recipe
        if (recipeMatch) {
          slotContributions[itemIndex] = { 
            ...slotContributions[itemIndex], 
            name: finalName
          };
          newContributions[slotIndex] = slotContributions;
          return { ...prev, contributions: newContributions };
        }
      }

      slotContributions[itemIndex] = { ...slotContributions[itemIndex], [field]: finalValue };
      newContributions[slotIndex] = slotContributions;
      return { ...prev, contributions: newContributions };
    });
  };

  const parseL2Number = (val: string | number) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    // Remove dots (thousands separator) and replace comma with dot
    const clean = val.toString().replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatL2Number = (val: string | number) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'string' ? parseL2Number(val) : val;
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };

  const getRemainingQuantity = (recipeItemName: string, recipeNeeded: number) => {
    const trimmedName = recipeItemName.trim();
    if (!trimmedName || isNaN(recipeNeeded) || recipeNeeded <= 0) return recipeNeeded;
    
    let totalContributed = 0;
    (Object.values(state.contributions) as Contribution[][]).forEach(slotItems => {
      slotItems.forEach(item => {
        if (item.name.trim().toLowerCase() === trimmedName.toLowerCase()) {
          const qty = parseL2Number(item.quantity);
          totalContributed += qty;
        }
      });
    });
    
    return Math.max(0, recipeNeeded - totalContributed);
  };

  const totalLoot = state.loot.reduce((sum, item) => sum + item.price, 0) + (isSuccessFormOpen ? (Number(successItemPrice) || 0) : 0);
  
  // New financial logic based on contributions
  const getPlayerContributionTotal = (slotIndex: number) => {
    const slotItems = state.contributions[slotIndex] || [];
    return slotItems.reduce((sum, item) => {
      const qty = parseL2Number(item.quantity);
      const unitVal = parseL2Number(item.unitValue);
      return sum + (qty * unitVal);
    }, 0);
  };

  const totalContributionValue = Object.keys(state.contributions).reduce((sum, key) => {
    return sum + getPlayerContributionTotal(Number(key));
  }, 0);

  // Total to divide is Loot - Total Material Value (capped at 0)
  const totalToDivide = Math.max(0, totalLoot - totalContributionValue);
  const baseShare = state.players.length > 0 ? totalToDivide / state.players.length : 0;

  const getPlayerPayout = (playerId: string) => {
    const slotIndex = state.craftSlots.findIndex(id => id === playerId);
    const contributionRefund = slotIndex !== -1 ? getPlayerContributionTotal(slotIndex) : 0;
    
    // If total contribution exceeds loot, we might need to cap the refund
    // But per user request: "sem ultrapassar o valor total do LOOT"
    // This usually means the total payout (Share + Refund) sum equals TotalLoot.
    return baseShare + contributionRefund;
  };

  const totalCraft = state.craft.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const perPlayer = state.players.length > 0 ? totalToDivide / state.players.length : 0;

  const handleRecipeSuccess = () => {
    if (!state.recipeName.trim()) {
      console.warn("Por favor, insira o nome da arma/item no Recipe.");
      return;
    }
    setSuccessItemName(state.recipeName);
    setSuccessItemPrice('');
    setIsSuccessFormOpen(true);
  };

  const deleteHistoryEntry = (id: string) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Deseja excluir este registro do histórico permanentemente?')) return;

    setState(prev => ({
      ...prev,
      history: (prev.history || []).filter(entry => entry.id !== id),
      sales: (prev.sales || []).filter(sale => sale.id !== id)
    }));
  };

  const finalizeRecipeSuccess = () => {
    if (!successItemName.trim()) {
      console.warn("Por favor, insira o nome da arma/item.");
      return;
    }

    const commonId = generateId();
    const allPlayerNames = state.players.map(p => p.name);
    const materials = state.recipe.filter(m => m.name.trim() !== '');
    const contributions = Object.fromEntries(
      Object.entries(state.contributions).map(([slotIdx, items]) => {
        const playerId = state.craftSlots[Number(slotIdx)];
        const playerName = state.players.find(p => p.id === playerId)?.name || 
                          (state.guestPlayers.includes(playerId as string) ? playerId as string : `Slot ${Number(slotIdx) + 1}`);
        return [playerName, (items as Contribution[]).filter(item => item.name.trim() !== '')];
      }).filter(([_, items]) => (items as Contribution[]).length > 0)
    );

    const historyEntry: HistoryEntry = {
      id: commonId,
      recipeName: state.recipeName,
      recipeQuantity: state.recipeQuantity,
      materials,
      contributions,
      allPlayerNames,
      timestamp: Date.now(),
      totalValue: parseL2Number(successItemPrice) || 0,
      payoutPerPlayer: baseShare,
      isVendaConcluida: false,
      isSold: false,
      payments: Object.fromEntries(allPlayerNames.map(name => [name, false])),
      sellerName: '',
    };

    const newSale: Sale = {
      id: commonId,
      itemName: successItemName,
      salePrice: parseL2Number(successItemPrice) || 0,
      sellerName: '',
      status: 'pending',
      createdAt: Date.now(),
      isVendaConcluida: false,
      payments: Object.fromEntries(allPlayerNames.map(name => [name, false])),
      contributions,
      allPlayerNames,
      materials,
      recipeQuantity: state.recipeQuantity,
    };

    setState(prev => ({
      ...prev,
      history: [historyEntry, ...prev.history],
      sales: [newSale, ...prev.sales],
      loot: [],
      // Clear recipe and contributions
      recipe: Array(12).fill({ name: '', quantity: '' }),
      recipeName: '',
      recipeQuantity: '',
      contributions: Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [i, Array(12).fill({ name: '', quantity: '', unitValue: '' })])
      ),
    }));

    setIsSuccessFormOpen(false);
    setActiveTab('Vendas');
  };

  const handleRecipeFailure = () => {
    setIsFailureConfirmOpen(true);
  };

  const toggleLotteryPlayer = (playerName: string) => {
    setSelectedLotteryPlayers(prev => 
      prev.includes(playerName) 
        ? prev.filter(p => p !== playerName) 
        : [...prev, playerName]
    );
  };

  const spinLottery = () => {
    if (selectedLotteryPlayers.length < 2 || isSpinning) return;

    setIsSpinning(true);
    setLotteryWinner(null);

    const extraSpins = 5 + Math.random() * 5; // 5 to 10 full rotations
    const winnerIndex = Math.floor(Math.random() * selectedLotteryPlayers.length);
    const segmentAngle = 360 / selectedLotteryPlayers.length;
    
    // Calculate final rotation to land on the winner
    // We want the pointer (at the top, 0 degrees) to point to the middle of the winner's segment
    // The segments are distributed clockwise.
    // Winner index 0 is from 0 to segmentAngle.
    // To point to index 0, we need to rotate by - (segmentAngle / 2) or similar.
    // Actually, let's just use a simple random selection and animate the wheel.
    const newRotation = rotation + (extraSpins * 360) + (360 - (winnerIndex * segmentAngle) - (segmentAngle / 2));
    
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const winner = selectedLotteryPlayers[winnerIndex];
      setLotteryWinner(winner);

      // Save to history
      const newDraw: LotteryDraw = {
        id: generateId(),
        winner: winner,
        prize: lotteryPrize || 'Prêmio não definido',
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        lotteryHistory: [newDraw, ...(prev.lotteryHistory || [])]
      }));
    }, 5000); // 5 seconds spin
  };

  const finalizeRecipeFailure = () => {
    const commonId = generateId();
    const allPlayerNames = state.players.map(p => p.name);
    const materials = state.recipe.filter(m => m.name.trim() !== '');
    
    let totalLoss = 0;
    
    // Calculate loss from contributions
    const contributions = Object.fromEntries(
      Object.entries(state.contributions).map(([slotIdx, items]) => {
        const playerId = state.craftSlots[Number(slotIdx)];
        const playerName = state.players.find(p => p.id === playerId)?.name || 
                          (state.guestPlayers.includes(playerId as string) ? playerId as string : `Slot ${Number(slotIdx) + 1}`);
        
        const validItems = (items as Contribution[]).filter(item => item.name.trim() !== '');
        validItems.forEach(item => {
          totalLoss += parseL2Number(item.quantity) * parseL2Number(item.unitValue);
        });
        
        return [playerName, validItems];
      }).filter(([_, items]) => (items as Contribution[]).length > 0)
    );

    // If no contributions were recorded, try to estimate from the recipe materials
    if (totalLoss === 0) {
      materials.forEach(m => {
        const dbItem = state.items.find(i => i.name.toLowerCase() === m.name.trim().toLowerCase());
        if (dbItem) {
          totalLoss += parseL2Number(m.quantity) * dbItem.unitValue;
        }
      });
    }

    const historyEntry: HistoryEntry = {
      id: commonId,
      recipeName: state.recipeName || 'Sem Nome',
      recipeQuantity: state.recipeQuantity,
      materials,
      contributions,
      allPlayerNames,
      timestamp: Date.now(),
      isFailed: true,
      totalLoss,
    };

    setState(prev => ({
      ...prev,
      history: [historyEntry, ...prev.history],
      recipe: Array(12).fill({ name: '', quantity: '' }),
      recipeName: '',
      recipeQuantity: '',
      contributions: Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [i, Array(12).fill({ name: '', quantity: '', unitValue: '' })])
      ),
    }));

    setIsFailureConfirmOpen(false);
    setActiveTab('Histórico');
  };

  const updateSale = (id: string, field: string, value: any) => {
    setState(prev => {
      const updatedSales = prev.sales.map(s => s.id === id ? { ...s, [field]: value } : s);
      const updatedHistory = prev.history.map(h => {
        if (h.id === id) {
          const updatedH = { ...h, [field]: value };
          if (field === 'salePrice') {
            const totalLootForThis = parseL2Number(value) || 0;
            let totalContributionForThis = 0;
            Object.values(h.contributions).forEach((items) => {
              (items as Contribution[]).forEach((item) => {
                totalContributionForThis += (parseL2Number(item.quantity) * parseL2Number(item.unitValue));
              });
            });
            const totalToDivideForThis = Math.max(0, totalLootForThis - totalContributionForThis);
            updatedH.totalValue = totalLootForThis;
            const playerCount = h.allPlayerNames?.length || 0;
            updatedH.payoutPerPlayer = playerCount > 0 ? totalToDivideForThis / playerCount : 0;
          }
          return updatedH;
        }
        return h;
      });
      return { ...prev, sales: updatedSales, history: updatedHistory };
    });
  };

  const togglePayment = (saleId: string, playerName: string) => {
    setState(prev => {
      const sale = prev.sales.find(s => s.id === saleId);
      if (!sale) return prev;

      const updatedPayments = { ...sale.payments, [playerName]: !sale.payments[playerName] };
      const allPaid = Object.values(updatedPayments).every(v => v === true);

      let updatedSales = prev.sales.map(s => s.id === saleId ? { ...s, payments: updatedPayments } : s);
      
      if (allPaid) {
        updatedSales = updatedSales.filter(s => s.id !== saleId);
      }

      const updatedHistory = prev.history.map(h => {
        if (h.id === saleId) {
          return { ...h, payments: updatedPayments, isSold: allPaid };
        }
        return h;
      });

      return { ...prev, sales: updatedSales, history: updatedHistory };
    });
  };

  const concludeSale = (saleId: string) => {
    setState(prev => {
      const updatedSales = prev.sales.map(s => s.id === saleId ? { ...s, isVendaConcluida: true } : s);
      const updatedHistory = prev.history.map(h => h.id === saleId ? { ...h, isVendaConcluida: true } : h);
      return { ...prev, sales: updatedSales, history: updatedHistory };
    });
  };

  const removeSale = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Excluir esta venda permanentemente?')) return;
    setState(prev => ({ ...prev, sales: prev.sales.filter(s => s.id !== id) }));
  };

  const addItem = () => {
    if (!itemForm.name.trim()) return;
    const newItem: Item = {
      id: generateId(),
      name: itemForm.name.trim(),
      unitValue: parseL2Number(itemForm.unitValue) || 0,
      category: itemForm.category,
    };
    setState(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setItemForm({ name: '', unitValue: '', category: 'Material' });
  };

  const removeItem = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Excluir este item permanentemente?')) return;
    setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const openRecipeEditor = (item: Item) => {
    setEditingRecipeId(item.id);
    setRecipeMaterialsDraft(item.requiredMaterials || [{ name: '', quantity: '' }]);
  };

  const addRecipeMaterialRow = () => {
    setRecipeMaterialsDraft(prev => [...prev, { name: '', quantity: '' }]);
  };

  const updateRecipeMaterialDraft = (index: number, field: 'name' | 'quantity', value: string) => {
    setRecipeMaterialsDraft(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeRecipeMaterialRow = (index: number) => {
    setRecipeMaterialsDraft(prev => prev.filter((_, i) => i !== index));
  };

  const saveRecipeMaterials = () => {
    if (!editingRecipeId) return;
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === editingRecipeId 
          ? { ...item, requiredMaterials: recipeMaterialsDraft.filter(m => m.name.trim() !== '') } 
          : item
      )
    }));
    setEditingRecipeId(null);
  };

  const updateItemImage = async (id: string, file: File) => {
    try {
      const base64 = await compressImage(file, 400, 400);
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === id ? { ...item, imageUrl: base64 } : item
        )
      }));
    } catch (err) {
      console.error('Erro ao processar imagem do item:', err);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `cp-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.players && json.items) {
          const migrated = migrateState(json);
          setState(migrated);
        }
      } catch (err) {
        console.error('Erro ao importar dados:', err);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = state.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
    const matchesFilter = itemFilter === 'Todos' || item.category === itemFilter;
    return matchesSearch && matchesFilter;
  });

  if (!selectedCP) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex text-gray-200 font-sans selection:bg-amber-500/30">
        {storageError && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-2 px-4 text-center text-xs font-bold shadow-lg animate-in slide-in-from-top duration-300">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
              <AlertTriangle size={14} />
              <span>{storageError}</span>
              <button onClick={() => setStorageError(null)} className="ml-2 hover:opacity-70 underline">Fechar</button>
            </div>
          </div>
        )}
        {/* Left Sidebar - CP Selection */}
        <aside className="w-80 bg-[#151921] border-r border-gray-800 flex flex-col p-8 shadow-2xl z-20">
          <div className="mb-12">
            <h1 className="text-2xl font-black text-amber-500 tracking-tighter flex items-center gap-3">
              <Shield size={32} />
              PORTAL FURIA
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Selecione sua CP para entrar</p>
          </div>

          <nav className="flex-1 space-y-4">
            {['CP FURIA-BR', 'CP FURIA-BR01', 'CP FURIA-BR02', 'CP FURIA-BR03'].map((cp) => (
              <button
                key={cp}
                onClick={() => cp === 'CP FURIA-BR' && setSelectedCP(cp)}
                className={`w-full group relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start gap-2 ${
                  cp === 'CP FURIA-BR'
                    ? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500'
                    : 'border-gray-800 bg-gray-800/20 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-black text-lg tracking-tight ${cp === 'CP FURIA-BR' ? 'text-white' : 'text-gray-600'}`}>
                    {cp}
                  </span>
                  {cp === 'CP FURIA-BR' ? (
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                      <Plus size={18} />
                    </div>
                  ) : (
                    <Lock size={16} className="text-gray-700" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-12 rounded-full ${cp === 'CP FURIA-BR' ? 'bg-amber-500/30' : 'bg-gray-800'}`}></div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    {cp === 'CP FURIA-BR' ? 'Acesso Liberado' : 'Em Breve'}
                  </span>
                </div>
                
                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Shield size={80} />
                </div>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-800/50">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400">Comunidade FURIA</p>
                <p className="text-[10px] font-medium">Versão 3.5.0</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content - Logo Branding */}
        <main className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Logo Container */}
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-8 bg-amber-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="w-[80vw] max-w-[450px] aspect-square relative z-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">
                {/* Usando a imagem oficial fornecida pelo usuário */}
                <img 
                  src={state.clanLogoUrl || DEFAULT_CLAN_LOGO} 
                  alt="FURIA Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]"
                />
              </div>
            </div>

            <div className="mt-12 text-center space-y-2">
              <p className="text-gray-500 font-serif italic text-xl">"Onde a fúria se torna lenda."</p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="h-px w-12 bg-gray-800"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                <div className="h-px w-12 bg-gray-800"></div>
              </div>
            </div>
          </motion.div>

          {/* Animated particles or decorative elements */}
          <div className="absolute bottom-12 right-12 flex gap-4">
            <div className="p-3 rounded-full bg-gray-800/30 border border-gray-800 text-gray-600">
              <Settings size={20} />
            </div>
            <div className="p-3 rounded-full bg-gray-800/30 border border-gray-800 text-gray-600">
              <Bell size={20} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-4">
        {storageError && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-2 px-4 text-center text-xs font-bold shadow-lg animate-in slide-in-from-top duration-300">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
              <AlertTriangle size={14} />
              <span>{storageError}</span>
              <button onClick={() => setStorageError(null)} className="ml-2 hover:opacity-70 underline">Fechar</button>
            </div>
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-2xl space-y-8 relative overflow-hidden"
        >
          {/* Back to Portal Button */}
          <button 
            onClick={() => setSelectedCP(null)}
            className="absolute top-6 left-6 text-gray-500 hover:text-amber-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            <LayoutDashboard size={14} />
            Portal
          </button>

          <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
          
          <div className="text-center space-y-2">
            <div className="w-32 h-32 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 border border-amber-500/20 overflow-hidden">
              <img 
                src={state.clanLogoUrl || DEFAULT_CLAN_LOGO} 
                alt="FURIA Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <h1 className="text-3xl font-bold text-amber-500 tracking-tight">{selectedCP}</h1>
            <p className="text-gray-400">Acesso Restrito aos Membros</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Nome do Player</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  placeholder="Seu nome registrado..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Senha</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  placeholder="•••••••••"
                  required
                />
              </div>
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center font-medium bg-red-500/10 py-2 rounded-xl border border-red-500/20"
              >
                {loginError}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              ENTRAR NO SISTEMA
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-gray-500">
              Senha padrão: 123456789
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { name: 'Craft-CP', icon: LayoutDashboard },
    { name: 'Vendas', icon: ShoppingCart },
    { name: 'Itens', icon: ScrollText },
    { name: 'Histórico', icon: HistoryIcon },
    { name: 'Siege', icon: Castle },
    { name: 'Boss', icon: Skull },
    { name: 'Tributos e Multas', icon: DollarSign },
    { name: 'Loteria Furia', icon: Clover },
    { name: 'Cla Warehouse', icon: Archive },
    { name: 'Membros', icon: Users },
    { name: 'DKP', icon: Trophy },
    { name: 'Meu Perfil', icon: User },
    { name: 'Notificações', icon: Bell, badge: state.notifications?.filter(n => !n.readBy.includes(state.currentUser?.id || '')).length || 0 },
    { name: 'Admin', icon: Settings, adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 font-sans flex relative">
      {storageError && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-2 px-4 text-center text-xs font-bold shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            <span>{storageError}</span>
            <button onClick={() => setStorageError(null)} className="ml-2 hover:opacity-70 underline">Fechar</button>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 bg-[#151921] border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/10">
            <img 
              src={state.clanLogoUrl || DEFAULT_CLAN_LOGO} 
              alt="FURIA Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-1"
            />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-amber-500">FURIA BR</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.name 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-black overflow-hidden">
              {state.currentUser?.characterImageUrl ? (
                <img src={state.currentUser.characterImageUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                state.currentUser?.name?.[0] || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{state.currentUser?.name || 'Usuário'}</p>
              <p className="text-xs text-amber-500 font-medium">{isAdmin ? 'Administrador' : 'Membro'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="md:hidden p-4 bg-[#151921] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="text-amber-500 w-6 h-6" />
            <h1 className="text-lg font-bold text-amber-500">CP FURIA-BR</h1>
          </div>
          <button className="p-2 text-gray-400">
            <Bell size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {/* Dashboard View */}
          {activeTab === 'Craft-CP' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-6"
            >
              {/* Guest Players Section */}
              <section className="bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                <div className="flex items-center gap-2 mb-6 text-amber-500">
                  <User size={20} />
                  <h2 className="text-lg font-bold uppercase tracking-wider">Players Convidados</h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  {isAdmin && (
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nome do Player Convidado"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addGuestPlayer()}
                        className="flex-1 bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                      />
                      <button 
                        onClick={addGuestPlayer}
                        className="bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-xl transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-wrap gap-2 min-h-[40px] items-center">
                    {state.guestPlayers.length === 0 ? (
                      <span className="text-xs text-gray-600 italic">Nenhum player convidado adicionado</span>
                    ) : (
                      state.guestPlayers.map((name) => (
                        <div key={name} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-500">
                          <span className="text-xs font-bold">{name}</span>
                          {isAdmin && (
                            <button onClick={() => removeGuestPlayer(name)} className="hover:text-amber-400">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loot Section */}
                <section className="lg:col-span-1 bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-amber-500 justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={20} />
                      <h2 className="text-lg font-bold uppercase tracking-wider">Loot</h2>
                    </div>
                    {isAdmin && state.loot.length > 0 && (
                      <button 
                        onClick={clearLoot}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Limpar
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {isAdmin && (
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text" 
                          placeholder="Item"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Preço"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(formatL2Number(e.target.value))}
                            className="flex-1 bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                          />
                          <button 
                            onClick={addLoot}
                            className="bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-xl transition-colors"
                            title="Adicionar ao Cla Warehouse"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <button 
                          onClick={sendLootToSales}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 group"
                        >
                          <ShoppingCart size={14} className="group-hover:scale-110 transition-transform" />
                          Enviar para Vendas
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {state.loot.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-xl border border-gray-800/50">
                          <span className="text-sm">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-500 font-mono font-bold">{item.price.toLocaleString('pt-BR')}</span>
                            {isAdmin && (
                              <button onClick={() => removeLoot(item.id)} className="text-gray-500 hover:text-red-500">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipe Section */}
                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <div className="flex items-center gap-2 mb-6 text-amber-500">
                      <Database size={20} />
                      <h2 className="text-lg font-bold uppercase tracking-wider">Recipe</h2>
                    </div>

                    {/* Recipe Name and Quantity (Top Field) */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                      <input 
                        type="text" 
                        list="recipes-database-list"
                        placeholder="Nome do Recipe"
                        value={state.recipeName}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const name = e.target.value;
                          
                          setState(prev => {
                            const newState = { ...prev, recipeName: name };
                            
                            if (name.trim() === '') {
                              newState.recipe = Array(12).fill({ name: '', quantity: '' });
                              newState.contributions = Object.fromEntries(
                                Array.from({ length: 9 }, (_, i) => [i, Array(12).fill({ name: '', quantity: '', unitValue: '' })])
                              );
                              return newState;
                            }

                            const foundRecipe = prev.items.find(i => i.category === 'Recipes' && i.name.toLowerCase() === name.trim().toLowerCase());
                            if (foundRecipe && foundRecipe.requiredMaterials) {
                              const multiplier = parseL2Number(prev.recipeQuantity) || 1;
                              const newRecipe = Array(12).fill({ name: '', quantity: '' });
                              foundRecipe.requiredMaterials.forEach((m, i) => {
                                if (i < 12) {
                                  const baseQty = parseL2Number(m.quantity);
                                  newRecipe[i] = { 
                                    ...m, 
                                    quantity: (baseQty * multiplier).toString() 
                                  };
                                }
                              });
                              newState.recipe = newRecipe;
                            }
                            return newState;
                          });
                        }}
                        className={`flex-1 bg-[#0b0e14] border border-amber-500/30 rounded-lg px-3 py-2 text-sm font-bold text-amber-500 focus:outline-none focus:border-amber-500 ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                      <input 
                        type="text" 
                        placeholder="Qtd"
                        value={state.recipeQuantity}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const qtyStr = formatL2Number(e.target.value);
                          const multiplier = parseL2Number(qtyStr) || 1;
                          
                          setState(prev => {
                            const newState = { ...prev, recipeQuantity: qtyStr };
                            const foundRecipe = prev.items.find(i => i.category === 'Recipes' && i.name.toLowerCase() === prev.recipeName.trim().toLowerCase());
                            
                            if (foundRecipe && foundRecipe.requiredMaterials) {
                              const newRecipe = [...prev.recipe];
                              foundRecipe.requiredMaterials.forEach((m, i) => {
                                if (i < 12) {
                                  const baseQty = parseL2Number(m.quantity);
                                  newRecipe[i] = { 
                                    ...m, 
                                    quantity: (baseQty * multiplier).toString() 
                                  };
                                }
                              });
                              newState.recipe = newRecipe;
                            }
                            return newState;
                          });
                        }}
                        className={`w-16 bg-[#0b0e14] border border-amber-500/30 rounded-lg px-3 py-2 text-sm font-bold text-amber-500 focus:outline-none focus:border-amber-500 text-center ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {state.recipe.map((material, index) => {
                        const needed = parseL2Number(material.quantity);
                        const remaining = getRemainingQuantity(material.name, needed);
                        const isComplete = needed > 0 && remaining === 0;

                        return (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold w-4">{index + 1}</span>
                            <input 
                              type="text" 
                              placeholder="Material"
                              value={material.name}
                              disabled={!isAdmin}
                              onChange={(e) => updateRecipeMaterial(index, 'name', e.target.value)}
                              className={`flex-1 bg-[#0b0e14] border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors ${
                                isComplete ? 'border-green-500/50 text-green-400' : 'border-gray-700 focus:border-amber-500'
                              } ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                            />
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 font-bold px-1">TOTAL</span>
                                <input 
                                  type="text" 
                                  placeholder="Total"
                                  value={material.quantity}
                                  disabled={!isAdmin}
                                  onChange={(e) => updateRecipeMaterial(index, 'quantity', e.target.value)}
                                  className={`w-16 bg-[#0b0e14] border rounded-lg px-2 py-1.5 text-[10px] focus:outline-none text-center border-gray-700 focus:border-amber-500 ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-amber-500 font-bold px-1">FALTA</span>
                                <div className={`w-16 bg-[#0b0e14] border rounded-lg px-2 py-1.5 text-[10px] font-bold text-center flex items-center justify-center min-h-[29px] ${
                                  isComplete ? 'border-green-500/50 text-green-400 bg-green-500/5' : 'border-amber-500/30 text-amber-500'
                                }`}>
                                  {remaining.toLocaleString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isAdmin && (
                      <div className="flex gap-3 mt-6">
                        <button 
                          onClick={handleRecipeSuccess}
                          className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all uppercase text-sm tracking-widest shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 group"
                        >
                          <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                          Sucesso
                        </button>
                        <button 
                          onClick={handleRecipeFailure}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all uppercase text-sm tracking-widest shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group"
                        >
                          <XCircle size={18} className="group-hover:scale-110 transition-transform" />
                          Falhou
                        </button>
                      </div>
                    )}

                    <AnimatePresence>
                      {isSuccessFormOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-6 overflow-hidden"
                        >
                          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-widest mb-2">
                              <CheckCircle2 size={16} />
                              Finalizar Craft com Sucesso
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Armas/Armaduras</label>
                                <input 
                                  type="text" 
                                  placeholder="Nome do item final"
                                  value={successItemName}
                                  onChange={(e) => setSuccessItemName(e.target.value)}
                                  className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Preço de Venda</label>
                                <div className="relative">
                                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                                  <input 
                                    type="text" 
                                    placeholder="0"
                                    value={successItemPrice}
                                    onChange={(e) => setSuccessItemPrice(formatL2Number(e.target.value))}
                                    className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={() => setIsSuccessFormOpen(false)}
                                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl transition-colors text-xs uppercase"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={finalizeRecipeSuccess}
                                  className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl transition-colors text-xs uppercase flex items-center justify-center gap-2"
                                >
                                  <ShoppingCart size={14} />
                                  Enviar para área de venda
                                </button>
                              </div>

                              {/* Preview of division */}
                              <div className="mt-4 p-3 bg-[#0b0e14] rounded-xl border border-gray-800 space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                                  <span>Total Líquido:</span>
                                  <span className="text-amber-500">{totalToDivide.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                                  <span>Cada Player:</span>
                                  <span className="text-amber-500">{baseShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {isFailureConfirmOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-6 overflow-hidden"
                        >
                          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest mb-2">
                              <XCircle size={16} />
                              Confirmar Falha no Craft
                            </div>
                            
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Deseja realmente registrar a <span className="text-red-500 font-bold">FALHA</span> no craft de <span className="text-white font-bold">{state.recipeName || 'Sem Nome'}</span>? 
                              Isso criará um registro no histórico com os materiais perdidos e limpará a página atual.
                            </p>

                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={finalizeRecipeFailure}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-widest transition-colors"
                              >
                                Confirmar Falha
                              </button>
                              <button 
                                onClick={() => setIsFailureConfirmOpen(false)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-widest transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* Contribuintes Section - List format */}
                <section className="lg:col-span-1 bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-amber-500">
                    <Users size={20} />
                    <h2 className="text-lg font-bold uppercase tracking-wider">Contribuintes</h2>
                    <datalist id="current-recipe-items-list">
                      {/* Prioritize items from the current recipe */}
                      {state.recipe
                        .filter(m => m.name.trim() !== '')
                        .map((m, i) => (
                          <option key={`recipe-${i}`} value={m.name} />
                        ))
                      }
                      {/* Then show all items from database */}
                      {state.items.map((item, i) => (
                        <option key={`db-${i}`} value={item.name} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div className="space-y-3">
                    {state.craftSlots.map((slotPlayerId, index) => {
                      const player = state.players.find(p => p.id === slotPlayerId) || 
                                    (state.guestPlayers.includes(slotPlayerId as string) ? { id: slotPlayerId as string, name: slotPlayerId as string } : null);
                      const isExpanded = selectedSlotIndex === index;

                      return (
                        <div key={index} className="bg-gray-800/20 border border-gray-800/50 rounded-xl overflow-hidden transition-all">
                          <div 
                            onClick={() => setSelectedSlotIndex(isExpanded ? null : index)}
                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/40 transition-colors ${
                              isExpanded ? 'bg-amber-500/5 border-b border-gray-800' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] text-gray-500 font-bold">CONTRIBUINTE {index + 1}</span>
                              {player ? (
                                <span className="font-bold text-sm text-gray-200">{player.name}</span>
                              ) : (
                                <span className="text-sm text-gray-600 italic">Vazio</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {!player && isAdmin && (
                                <select 
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => assignPlayerToSlot(index, e.target.value)}
                                  className="bg-[#0b0e14] border border-gray-700 rounded-lg px-3 py-1 text-xs focus:outline-none"
                                  value=""
                                >
                                  <option value="" disabled>Selecionar Player</option>
                                  <optgroup label="Membros">
                                    {state.players
                                      .filter(p => !state.craftSlots.includes(p.id))
                                      .map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))
                                    }
                                  </optgroup>
                                  {state.guestPlayers.length > 0 && (
                                    <optgroup label="Convidados">
                                      {state.guestPlayers
                                        .filter(name => !state.craftSlots.includes(name))
                                        .map(name => (
                                          <option key={name} value={name}>{name}</option>
                                        ))
                                      }
                                    </optgroup>
                                  )}
                                </select>
                              )}
                              {player && isAdmin && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    assignPlayerToSlot(index, null);
                                  }}
                                  className="text-gray-500 hover:text-red-500 p-1"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && player && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-[#0b0e14]/50 flex flex-col gap-y-2">
                                  <div className="flex items-center gap-2 px-3 text-[9px] text-gray-500 font-bold uppercase">
                                    <span className="w-3">#</span>
                                    <span className="flex-1">Item</span>
                                    <span className="w-14 text-center">Qtd</span>
                                    <span className="w-20 text-center">Valor Unit.</span>
                                    <span className="w-20 text-center">Total</span>
                                  </div>
                                  {(state.contributions[index] || []).map((item, itemIdx) => {
                                    const lineTotal = parseL2Number(item.quantity) * parseL2Number(item.unitValue);
                                    const dbItem = state.items.find(i => i.name.toLowerCase() === item.name.trim().toLowerCase());

                                    return (
                                      <div key={itemIdx} className="flex items-center gap-2">
                                        <span className="text-[9px] text-gray-600 font-bold w-3">{itemIdx + 1}</span>
                                        <div className="w-6 h-6 bg-[#151921] border border-gray-800 rounded flex items-center justify-center overflow-hidden shrink-0">
                                          {dbItem?.imageUrl ? (
                                            <img src={dbItem.imageUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <Package size={10} className="text-gray-700" />
                                          )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                          <input 
                                            type="text" 
                                            list="current-recipe-items-list"
                                            placeholder="Item"
                                            value={item.name}
                                            disabled={!isAdmin}
                                            onChange={(e) => updateContribution(index, itemIdx, 'name', e.target.value)}
                                            className={`w-full bg-[#151921] border rounded-lg px-3 py-1.5 text-[11px] focus:outline-none transition-colors ${
                                              state.recipe.some(r => r.name.trim().toLowerCase() === item.name.trim().toLowerCase() && r.name.trim() !== '')
                                                ? 'border-amber-500/50 text-amber-500'
                                                : 'border-gray-800 focus:border-amber-500/50'
                                            } ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                          />
                                          {(() => {
                                            const recipeItem = state.recipe.find(r => r.name.trim().toLowerCase() === item.name.trim().toLowerCase() && r.name.trim() !== '');
                                            if (recipeItem) {
                                              const needed = parseL2Number(recipeItem.quantity);
                                              const remaining = getRemainingQuantity(recipeItem.name, needed);
                                              return (
                                                <span className={`text-[8px] font-bold px-1 mt-0.5 ${remaining === 0 ? 'text-green-500' : 'text-amber-500/70'}`}>
                                                  Falta: {remaining.toLocaleString('pt-BR')}
                                                </span>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </div>
                                        <input 
                                          type="text" 
                                          placeholder="Qtd"
                                          value={item.quantity}
                                          disabled={!isAdmin}
                                          onChange={(e) => updateContribution(index, itemIdx, 'quantity', e.target.value)}
                                          className={`w-14 bg-[#151921] border border-gray-800 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-amber-500/50 text-center ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        />
                                        <input 
                                          type="text" 
                                          placeholder="Valor Unit."
                                          value={item.unitValue}
                                          disabled={!isAdmin}
                                          onChange={(e) => updateContribution(index, itemIdx, 'unitValue', e.target.value)}
                                          className={`w-20 bg-[#151921] border border-gray-800 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-amber-500/50 text-center text-amber-500 font-bold ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        />
                                        <div className="w-20 text-center text-[10px] font-mono text-gray-400">
                                          {lineTotal > 0 ? lineTotal.toLocaleString('pt-BR') : '-'}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                  <h2 className="text-amber-500 font-bold mb-6 uppercase tracking-wider">Resumo Financeiro</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Loot Bruto:</span>
                      <span className="text-xl font-mono font-bold">{totalLoot.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Contribuições (Materiais):</span>
                      <span className="text-xl font-mono font-bold text-red-400">{totalContributionValue.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-px bg-gray-800 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-amber-500 font-bold">Total a Dividir (Líquido):</span>
                      <span className="text-2xl font-mono font-bold text-amber-500">{totalToDivide.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 italic">
                      * O valor dos materiais é reembolsado ao contribuinte e descontado dos demais membros.
                    </div>
                  </div>
                </section>

                <section className="bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                  <h2 className="text-amber-500 font-bold mb-6 uppercase tracking-wider">Divisão por Player</h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {state.players.length === 0 ? (
                      <p className="text-gray-500 text-center py-8 italic">Nenhum player adicionado</p>
                    ) : (
                      state.players.map((player) => {
                        const payout = getPlayerPayout(player.id);
                        const slotIndex = state.craftSlots.findIndex(id => id === player.id);
                        const contribution = slotIndex !== -1 ? getPlayerContributionTotal(slotIndex) : 0;
                        
                        return (
                          <div key={player.id} className="flex flex-col p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{player.name}</span>
                              <span className="font-mono font-bold text-amber-500">{payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            {contribution > 0 && (
                              <div className="flex justify-between items-center text-[10px] text-gray-500">
                                <span>(Share: {baseShare.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} + Reembolso: {contribution.toLocaleString('pt-BR')})</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
              
              <datalist id="recipes-database-list">
                {state.items.filter(i => i.category === 'Recipes').map((item, i) => (
                  <option key={i} value={item.name} />
                ))}
              </datalist>
              
              {/* Datalist for Autocomplete */}
              <datalist id="recipe-materials-list">
                {Array.from(new Set([
                  state.recipeName,
                  ...state.recipe.map(r => r.name)
                ]))
                .filter(name => name && name.trim() !== '')
                .map((name, i) => (
                  <option key={i} value={name} />
                ))}
              </datalist>
            </motion.div>
          )}

          {/* Vendas Tab */}
          {activeTab === 'Vendas' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Vendas Não Apanhadas</h1>
                  <p className="text-gray-400 mt-1">Gerencie os itens prontos para venda e seus responsáveis.</p>
                </div>
                {isAdmin && state.sales.length > 0 && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearCraftHistory();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={16} className="pointer-events-none" />
                    Limpar Histórico
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {state.sales.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#151921] rounded-2xl border border-dashed border-gray-800">
                    <ShoppingCart size={48} className="text-gray-700 mb-4" />
                    <p className="text-gray-500 font-medium italic">Nenhuma venda não apanhada no momento.</p>
                    <p className="text-gray-600 text-sm mt-2">Conclua um Recipe com sucesso para gerar uma venda.</p>
                  </div>
                ) : (
                  state.sales.map((sale) => {
                    const totalLootForThis = sale.salePrice || 0;
                    let totalContributionForThis = 0;
                    Object.values(sale.contributions).forEach((items) => {
                      (items as Contribution[]).forEach((item) => {
                        totalContributionForThis += (parseL2Number(item.quantity) * parseL2Number(item.unitValue));
                      });
                    });
                    const totalToDivideForThis = Math.max(0, totalLootForThis - totalContributionForThis);
                    const playerCount = sale.allPlayerNames.length;
                    const payoutPerPlayerForThis = playerCount > 0 ? totalToDivideForThis / playerCount : 0;

                    return (
                      <motion.div
                        key={sale.id}
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#151921] rounded-2xl border border-gray-800 shadow-xl overflow-hidden flex flex-col"
                      >
                        <div className="p-4 bg-gray-800/30 border-b border-gray-800 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                                <Package size={20} />
                              </div>
                              <div>
                                <h3 className="font-bold text-white uppercase tracking-wider">{sale.itemName} x{sale.recipeQuantity || 1}</h3>
                                <p className="text-[10px] text-gray-500 font-mono">ID: {sale.id.split('-')[0]}</p>
                              </div>
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={() => removeSale(sale.id)}
                                className="text-gray-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                title="Excluir venda"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Preço de Venda</label>
                              <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                                <input 
                                  type="text" 
                                  placeholder="0"
                                  value={formatL2Number(sale.salePrice) || ''}
                                  disabled={!isAdmin}
                                  onChange={(e) => updateSale(sale.id, 'salePrice', e.target.value)}
                                  className={`w-full bg-[#0b0e14] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Vendedor Responsável</label>
                              <select 
                                value={sale.sellerName}
                                disabled={!isAdmin}
                                onChange={(e) => updateSale(sale.id, 'sellerName', e.target.value)}
                                className={`w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                <option value="">Selecione um player</option>
                                {state.players.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-800/50">
                          <div>
                            <h4 className="text-[10px] font-bold text-amber-500 uppercase mb-3 tracking-widest">Materiais</h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                              {(sale.materials || []).map((m, i) => (
                                <div key={i} className="flex justify-between text-[11px] py-1 border-b border-gray-800/50 last:border-0">
                                  <span className="text-gray-400">{m.name}</span>
                                  <span className="text-gray-500 font-mono">x{m.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-amber-500 uppercase mb-3 tracking-widest">Contribuições</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                              {Object.entries(sale.contributions || {}).map(([playerName, items], i) => (
                                <div key={i} className="text-[10px]">
                                  <p className="font-bold text-gray-500 mb-1">{playerName}</p>
                                  {(items as Contribution[]).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-gray-600">
                                      <span>{item.name}</span>
                                      <span>x{item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-[#0b0e14]/30 flex-1">
                          {!sale.isVendaConcluida ? (
                            <div className="flex flex-col h-full justify-center">
                              <div className="flex justify-between items-center mb-6 p-4 bg-gray-800/20 rounded-xl border border-gray-800/50">
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Líquido a Dividir</p>
                                  <p className="text-2xl font-mono font-bold text-amber-500">{totalToDivideForThis.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Cada Player</p>
                                  <p className="text-xl font-mono font-bold text-white">{payoutPerPlayerForThis.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                              </div>
                              {isAdmin && (
                                <button 
                                  onClick={() => concludeSale(sale.id)}
                                  disabled={!sale.salePrice || !sale.sellerName}
                                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest shadow-lg shadow-amber-500/10"
                                >
                                  <CheckCircle2 size={20} />
                                  Venda Concluída
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="h-px flex-1 bg-gray-800"></div>
                                <h4 className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Controle de Pagamentos</h4>
                                <div className="h-px flex-1 bg-gray-800"></div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {sale.allPlayerNames.map((playerName) => {
                                  const isPaid = sale.payments[playerName];
                                  const playerContributions = sale.contributions[playerName] || [];
                                  const contributionTotal = playerContributions.reduce((sum, item) => 
                                    sum + (parseL2Number(item.quantity) * parseL2Number(item.unitValue)), 0);
                                  const totalPayout = payoutPerPlayerForThis + contributionTotal;

                                  return (
                                    <button
                                      key={playerName}
                                      onClick={() => isAdmin && togglePayment(sale.id, playerName)}
                                      disabled={!isAdmin}
                                      className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 relative overflow-hidden group ${
                                        isPaid 
                                          ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                                          : 'bg-orange-500/10 border-orange-500/50 text-orange-500'
                                      } ${!isAdmin ? 'cursor-default' : ''}`}
                                    >
                                      <span className="text-[9px] font-bold uppercase truncate w-full text-center relative z-10">{playerName}</span>
                                      <span className="font-mono font-bold text-sm relative z-10">{totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                      <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full relative z-10 ${
                                        isPaid ? 'bg-green-500/20' : 'bg-orange-500/20'
                                      }`}>
                                        {isPaid ? 'Pago' : 'Não apanhado'}
                                      </span>
                                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${
                                        isPaid ? 'bg-green-500' : 'bg-orange-500'
                                      }`}></div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* Itens Tab */}
          {activeTab === 'Itens' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Add Item Form */}
              {isAdmin && (
                <section className="bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                  <h2 className="text-amber-500 font-bold mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                    <Plus size={16} /> Adicionar Item
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-6">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome</label>
                      <input 
                        type="text" 
                        placeholder="Nome do item"
                        value={itemForm.name}
                        onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Valor Unitário</label>
                      <input 
                        type="text" 
                        placeholder="0"
                        value={itemForm.unitValue}
                        onChange={(e) => setItemForm(prev => ({ ...prev, unitValue: formatL2Number(e.target.value) }))}
                        className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                      <select 
                        value={itemForm.category}
                        onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button 
                        onClick={addItem}
                        className="w-full bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-300 font-bold py-2 rounded-xl transition-all text-sm uppercase"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Items List */}
              <section className="bg-[#151921] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-64">
                    <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Buscar item..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Todos', ...categories].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setItemFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                          itemFilter === cat 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {cat}
                        {cat !== 'Todos' && itemFilter === cat && <X size={10} onClick={(e) => { e.stopPropagation(); setItemFilter('Todos'); }} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-800/30 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="px-6 py-4 w-16">Img</th>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Valor Unit.</th>
                        <th className="px-6 py-4">Categoria</th>
                        {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center text-gray-500 italic text-sm">
                            Nenhum item cadastrado. Adicione itens acima.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map(item => (
                          <tr key={item.id} className="hover:bg-gray-800/20 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="relative w-10 h-10 bg-[#0b0e14] border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center group/img">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Package size={16} className="text-gray-700" />
                                )}
                                
                                {isAdmin && (
                                  <label className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer shadow-md border-2 border-[#0b0e14] z-10">
                                    <Plus size={12} className="text-black" />
                                    <input 
                                      type="file" 
                                      accept="image/*,video/*,.gif,.webp" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) updateItemImage(item.id, file);
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-200">
                              <div className="flex items-center gap-2">
                                {item.name}
                                {item.category === 'Recipes' && item.requiredMaterials && item.requiredMaterials.length > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-green-500" title="Materiais Configurados"></span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-amber-500 font-bold">{item.unitValue.toLocaleString('pt-BR')}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md bg-gray-800 text-[10px] font-bold text-gray-400 uppercase">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAdmin && (
                                <div className="flex items-center justify-end gap-2">
                                  {item.category === 'Recipes' && (
                                    <button 
                                      onClick={() => openRecipeEditor(item)}
                                      className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                      title="Configurar Materiais"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Recipe Editor Modal */}
              <AnimatePresence>
                {editingRecipeId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-[#151921] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                            <ScrollText size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">Configurar Recipe</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                              {state.items.find(i => i.id === editingRecipeId)?.name}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setEditingRecipeId(null)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3">
                        <div className="flex items-center gap-2 px-3 text-[10px] text-gray-500 font-bold uppercase mb-2">
                          <span className="w-6">#</span>
                          <span className="flex-1">Material</span>
                          <span className="w-24 text-center">Quantidade</span>
                          <span className="w-8"></span>
                        </div>
                        
                        {recipeMaterialsDraft.map((material, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-bold w-6">{idx + 1}</span>
                            <input 
                              type="text" 
                              list="items-database-list"
                              placeholder="Nome do material"
                              value={material.name}
                              onChange={(e) => updateRecipeMaterialDraft(idx, 'name', e.target.value)}
                              className="flex-1 bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            <input 
                              type="text" 
                              placeholder="Qtd"
                              value={material.quantity}
                              onChange={(e) => updateRecipeMaterialDraft(idx, 'quantity', e.target.value)}
                              className="w-24 bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors text-center font-mono"
                            />
                            <button 
                              onClick={() => removeRecipeMaterialRow(idx)}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        <button 
                          onClick={addRecipeMaterialRow}
                          className="w-full py-3 border border-dashed border-gray-800 rounded-xl text-gray-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase mt-4"
                        >
                          <Plus size={16} />
                           Adicionar Material
                        </button>
                      </div>

                      <div className="p-6 border-t border-gray-800 flex gap-3">
                        <button 
                          onClick={() => setEditingRecipeId(null)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors text-sm uppercase"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={saveRecipeMaterials}
                          className="flex-[2] bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-colors text-sm uppercase flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          Cadastrar Recipe
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Histórico Tab */}
          {activeTab === 'Histórico' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Histórico de Crafts</h1>
                  <p className="text-gray-400 mt-1">Relatório detalhado de todos os itens criados com sucesso.</p>
                </div>
                {isAdmin && state.history.length > 0 && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearCraftHistory();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={16} className="pointer-events-none" />
                    Limpar Histórico
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {state.history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#151921] rounded-2xl border border-dashed border-gray-800">
                    <HistoryIcon size={48} className="text-gray-700 mb-4" />
                    <p className="text-gray-500 font-medium italic">Nenhum registro no histórico.</p>
                  </div>
                ) : (
                  state.history.map((entry) => (
                    <div key={entry.id} className="bg-[#151921] rounded-2xl border border-gray-800 overflow-hidden shadow-xl relative">
                      <div className="p-4 bg-gray-800/30 border-b border-gray-800 flex items-center justify-between relative">
                        {entry.isSold && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                            <div className="flex items-center justify-center w-32 h-32 border-[12px] border-green-500/40 rounded-full -rotate-12 bg-transparent backdrop-blur-[1px]">
                              <span className="text-green-500 font-black text-[18px] uppercase leading-none text-center transform scale-150 drop-shadow-2xl tracking-tighter">VENDIDO</span>
                            </div>
                          </div>
                        )}
                        {entry.isFailed && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                            <div className="flex items-center justify-center w-32 h-32 border-[12px] border-red-500/40 rounded-full -rotate-12 bg-transparent backdrop-blur-[1px]">
                              <span className="text-red-500 font-black text-[18px] uppercase leading-none text-center transform scale-150 drop-shadow-2xl tracking-tighter">FALHOU</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.isFailed ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {entry.isFailed ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 relative">
                              <h3 className="font-bold text-white uppercase tracking-wider">{entry.recipeName} x{entry.recipeQuantity || 1}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-gray-400 font-mono">{new Date(entry.timestamp).toLocaleString('pt-BR')}</p>
                              {entry.sellerName && (
                                <>
                                  <span className="text-gray-700 text-[10px]">•</span>
                                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Vendedor: {entry.sellerName}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {!entry.isFailed && (
                              <div className="flex gap-4">
                                <div className="text-right">
                                  <p className="text-[9px] text-gray-500 uppercase font-bold">Venda</p>
                                  <p className="text-amber-500 font-mono font-bold">{(entry.totalValue || 0).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-gray-500 uppercase font-bold">Líquido</p>
                                  <p className="text-green-500 font-mono font-bold">
                                    {((entry.payoutPerPlayer || 0) * (entry.allPlayerNames?.length || Object.keys(entry.contributions).length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </p>
                                </div>
                              </div>
                            )}
                            {entry.isFailed && (
                              <div className="flex gap-4">
                                <div className="text-right">
                                  <p className="text-[9px] text-gray-500 uppercase font-bold">Prejuízo Total</p>
                                  <p className="text-red-500 font-mono font-bold">{(entry.totalLoss || 0).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="text-right px-4">
                                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">CRAFT FALHOU</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => deleteHistoryEntry(entry.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all shadow-lg"
                            title="Excluir registro"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className={`text-[10px] font-bold uppercase mb-3 tracking-widest ${entry.isFailed ? 'text-red-500' : 'text-amber-500'}`}>
                            {entry.isFailed ? 'Materiais Perdidos' : 'Materiais Utilizados'}
                          </h4>
                          <div className="space-y-1">
                            {(entry.materials || []).map((m, i) => (
                              <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                                <span className="text-gray-300">{m.name}</span>
                                <span className="text-gray-500 font-mono">x{m.quantity}</span>
                              </div>
                            ))}
                          </div>
                          {entry.isFailed && (
                            <div className="mt-4 pt-4 border-t border-gray-800/50">
                              <p className="text-[9px] text-gray-500 uppercase font-bold">Prejuízo Estimado</p>
                              <p className="text-xl text-red-500 font-mono font-bold">{(entry.totalLoss || 0).toLocaleString('pt-BR')}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-amber-500 uppercase mb-3 tracking-widest">Contribuições por Player</h4>
                          <div className="space-y-4">
                            {Object.entries(entry.contributions || {}).map(([playerName, items], i) => (
                              <div key={i} className="bg-[#0b0e14]/50 rounded-xl p-3 border border-gray-800/50">
                                <p className="text-[11px] font-bold text-gray-400 mb-2 border-b border-gray-800 pb-1">{playerName}</p>
                                <div className="space-y-1">
                                  {(items as Contribution[]).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-[10px]">
                                      <span className="text-gray-500">{item.name}</span>
                                      <span className="text-gray-400 font-mono">x{item.quantity} ({parseL2Number(item.unitValue).toLocaleString('pt-BR')} ea)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Payout Summary */}
                      {!entry.isFailed && (
                        <div className="p-6 pt-0 border-t border-gray-800/50 mt-4">
                          <h4 className="text-[10px] font-bold text-green-500 uppercase mb-4 tracking-widest text-center">
                            {entry.isSold ? 'Pagamentos Finalizados' : 'Divisão de Pagamentos'}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {(entry.allPlayerNames || Object.keys(entry.contributions)).map((playerName) => {
                              const isPaid = entry.payments?.[playerName] || entry.isSold;
                              const playerContributions = entry.contributions[playerName] || [];
                              const contributionTotal = playerContributions.reduce((sum, item) => 
                                sum + (parseL2Number(item.quantity) * parseL2Number(item.unitValue)), 0);
                              const totalPayout = (entry.payoutPerPlayer || 0) + contributionTotal;
                              
                              return (
                                <div key={playerName} className={`p-3 rounded-xl border transition-all flex flex-col items-center ${
                                  isPaid 
                                    ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                                }`}>
                                  <span className="text-[9px] text-gray-500 font-bold uppercase truncate w-full text-center mb-1">{playerName}</span>
                                  <span className="font-mono font-bold text-sm">
                                    {totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                  {entry.isVendaConcluida && (
                                    <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 ${
                                      isPaid ? 'bg-green-500/20' : 'bg-orange-500/20'
                                    }`}>
                                      {isPaid ? 'Pago' : 'Não apanhado'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Membros' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              {viewingPlayerId ? (() => {
                const viewingPlayer = state.players.find(p => p.id === viewingPlayerId);
                const activeChar = viewingPlayer ? (
                  viewingPlayer.characters && viewingPlayer.characters[activeCharacterIndex] 
                    ? viewingPlayer.characters[activeCharacterIndex]
                    : (activeCharacterIndex === 0 ? {
                        imageUrl: viewingPlayer.characterImageUrl,
                        class: viewingPlayer.class,
                        level: viewingPlayer.level,
                        notes: viewingPlayer.notes,
                        equipment: viewingPlayer.equipment
                      } : {})
                ) : null;

                return (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => {
                        setViewingPlayerId(null);
                        setActiveCharacterIndex(0);
                      }}
                      className="flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors font-bold uppercase tracking-widest text-xs"
                    >
                      <ArrowLeft size={16} />
                      Voltar para Membros
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {[0, 1, 2, 3].map(idx => (
                          <button
                            key={idx}
                            onClick={() => setActiveCharacterIndex(idx)}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition-all border ${
                              activeCharacterIndex === idx 
                                ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-amber-500/50'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                      <div className="h-4 w-[1px] bg-gray-800"></div>
                      <div className="flex items-center gap-2 text-amber-500/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Ficha {activeCharacterIndex + 1}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Character Card */}
                    <div className="lg:col-span-1 space-y-6">
                      <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                        
                        <div className="flex flex-col items-center">
                          <div className="relative group/char mb-6 w-full">
                            <div className="min-h-[300px] rounded-2xl bg-[#0b0e14] border-2 border-gray-800 overflow-hidden flex items-center justify-center shadow-2xl group-hover:border-amber-500/50 transition-all">
                              {activeChar?.imageUrl ? (
                                activeChar.imageUrl.startsWith('data:video') ? (
                                  <video 
                                    src={activeChar.imageUrl} 
                                    className="w-full h-auto"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <img 
                                    src={activeChar.imageUrl} 
                                    alt="Character" 
                                    className="w-full h-auto"
                                    referrerPolicy="no-referrer"
                                  />
                                )
                              ) : (
                                <div className="flex flex-col items-center gap-3 text-gray-600">
                                  <Camera size={40} />
                                  <div className="text-center px-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest block">Adicionar Arte</span>
                                    <span className="text-[8px] text-gray-700 mt-1 block">Slot {activeCharacterIndex + 1}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Navigation Arrows */}
                            <button 
                              onClick={() => setActiveCharacterIndex(prev => (prev - 1 + 4) % 4)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover/char:opacity-100 transition-opacity hover:bg-amber-500 hover:text-black z-20"
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <button 
                              onClick={() => setActiveCharacterIndex(prev => (prev + 1) % 4)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover/char:opacity-100 transition-opacity hover:bg-amber-500 hover:text-black z-20"
                            >
                              <ArrowLeft size={16} className="rotate-180" />
                            </button>

                            {isAdmin && (
                              <label className="absolute top-2 right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover/char:opacity-100 transition-opacity cursor-pointer shadow-lg border-2 border-[#151921] z-30">
                                <Plus size={18} className="text-black" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*,video/*,.gif,.webp" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && viewingPlayerId) updateCharacterImage(viewingPlayerId, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          <h2 className="text-3xl font-bold text-white mb-2">
                            {viewingPlayer?.name}
                          </h2>
                          <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-[0.3em] bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                            <Shield size={12} />
                            Membro da CP
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Character Sheet */}
                    <div className="lg:col-span-2 space-y-6">
                      <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl h-full relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3 text-amber-500">
                            <ScrollText size={24} />
                            <h2 className="text-xl font-bold uppercase tracking-widest">Ficha do Personagem</h2>
                          </div>
                          <div className="px-3 py-1 bg-gray-800 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Slot {activeCharacterIndex + 1}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Classe / Level</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Classe"
                                  value={activeChar?.class || ''}
                                  onChange={(e) => viewingPlayerId && updatePlayerInfo(viewingPlayerId, 'class', e.target.value)}
                                  disabled={state.currentUser?.id !== viewingPlayerId}
                                  className="flex-1 bg-[#0b0e14] border border-gray-800 p-3 rounded-xl text-gray-200 text-sm focus:border-amber-500/50 outline-none disabled:opacity-50"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Level"
                                  value={activeChar?.level || ''}
                                  onChange={(e) => viewingPlayerId && updatePlayerInfo(viewingPlayerId, 'level', e.target.value)}
                                  disabled={state.currentUser?.id !== viewingPlayerId}
                                  className="w-20 bg-[#0b0e14] border border-gray-800 p-3 rounded-xl text-gray-200 text-sm focus:border-amber-500/50 outline-none disabled:opacity-50"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Equipamentos</label>
                              <div className="relative bg-[#0b0e14] border border-gray-800 rounded-2xl p-4 min-h-[500px] flex items-center justify-center overflow-hidden">
                                {/* Equipment Grid Layout */}
                                <div className="relative w-full max-w-[280px] aspect-[3/5] grid grid-cols-3 gap-2">
                                  {/* Top Row */}
                                  <div className="w-full aspect-square"></div>
                                  <EquipmentSlot 
                                    slot="helmet" 
                                    label="Helmet" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <div className="w-full aspect-square"></div>

                                  {/* Second Row */}
                                  <div className="w-full aspect-square"></div>
                                  <EquipmentSlot 
                                    slot="armor" 
                                    label="Armor" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <div className="w-full aspect-square"></div>

                                  {/* Third Row */}
                                  <EquipmentSlot 
                                    slot="gloves" 
                                    label="Gloves" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                    className="-translate-y-4"
                                  />
                                  <EquipmentSlot 
                                    slot="pants" 
                                    label="Pants" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <EquipmentSlot 
                                    slot="boots" 
                                    label="Boots" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                    className="-translate-y-4"
                                  />

                                  {/* Middle Section */}
                                  <EquipmentSlot 
                                    slot="weapon" 
                                    label="Weapon" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <div className="w-full aspect-square flex items-center justify-center">
                                    <Shield size={24} className="text-gray-800 opacity-20" />
                                  </div>
                                  <EquipmentSlot 
                                    slot="shield" 
                                    label="Shield" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />

                                  {/* Bottom Section */}
                                  <EquipmentSlot 
                                    slot="earring1" 
                                    label="Earring" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <EquipmentSlot 
                                    slot="necklace" 
                                    label="Necklace" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <EquipmentSlot 
                                    slot="earring2" 
                                    label="Earring" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />

                                  {/* Very Bottom */}
                                  <EquipmentSlot 
                                    slot="ring1" 
                                    label="Ring" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                  <div className="w-full aspect-square"></div>
                                  <EquipmentSlot 
                                    slot="ring2" 
                                    label="Ring" 
                                    player={activeChar as any}
                                    isOwner={state.currentUser?.id === viewingPlayerId}
                                    onEdit={(slot, val) => { setEditingSlot(slot); setEditValue(val.name); setEditGrade(val.grade as any); }}
                                  />
                                </div>

                                {/* Edit Modal Overlay */}
                                <AnimatePresence>
                                  {editingSlot && (
                                    <motion.div 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
                                    >
                                      <div className="w-full max-w-xs space-y-4">
                                        <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs text-center">Editar {editingSlot}</h3>
                                        
                                        <div className="space-y-4">
                                          <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nome do Item</label>
                                            <input 
                                              autoFocus
                                              type="text" 
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  if (viewingPlayerId) {
                                                    updateEquipment(viewingPlayerId, editingSlot, editValue, editGrade);
                                                    setEditingSlot(null);
                                                  }
                                                }
                                                if (e.key === 'Escape') setEditingSlot(null);
                                              }}
                                              className="w-full bg-gray-900 border border-amber-500/30 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                              placeholder="Ex: Draconic Bow..."
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Grade</label>
                                            <div className="grid grid-cols-4 gap-2">
                                              {(['', 'D', 'C', 'B'] as const).map((grade) => (
                                                <button
                                                  key={grade}
                                                  onClick={() => setEditGrade(grade)}
                                                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                                    editGrade === grade 
                                                      ? 'bg-amber-500 border-amber-500 text-black' 
                                                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-amber-500/50'
                                                  }`}
                                                >
                                                  {grade || 'N/A'}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                          <button 
                                            onClick={() => setEditingSlot(null)}
                                            className="flex-1 bg-gray-800 text-gray-400 font-bold py-2 rounded-lg text-xs uppercase"
                                          >
                                            Cancelar
                                          </button>
                                          <button 
                                            onClick={() => {
                                              if (viewingPlayerId) {
                                                updateEquipment(viewingPlayerId, editingSlot, editValue, editGrade);
                                                setEditingSlot(null);
                                              }
                                            }}
                                            className="flex-1 bg-amber-500 text-black font-bold py-2 rounded-lg text-xs uppercase"
                                          >
                                            Salvar
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Funções na CP</label>
                              <textarea 
                                placeholder="Descreva suas funções na CP..."
                                value={activeChar?.notes || ''}
                                onChange={(e) => viewingPlayerId && updatePlayerInfo(viewingPlayerId, 'notes', e.target.value)}
                                disabled={state.currentUser?.id !== viewingPlayerId}
                                className="w-full h-40 bg-[#0b0e14] border border-gray-800 p-4 rounded-xl text-gray-400 text-sm focus:border-amber-500/50 outline-none disabled:opacity-50 resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {state.currentUser?.id === viewingPlayerId && (
                          <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Settings size={20} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Modo de Edição</h4>
                              <p className="text-[10px] text-gray-400">Você pode editar sua classe, level, equipamentos e funções na CP para este personagem.</p>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </div>
                );
              })() : (
                <section className="bg-[#151921] rounded-2xl p-8 border border-gray-800 shadow-xl">
                  <div className="flex items-center gap-3 mb-8 text-amber-500">
                    <Users size={24} />
                    <h2 className="text-xl font-bold uppercase tracking-widest">Membros da CP</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[...state.players].sort((a, b) => a.name.localeCompare(b.name)).map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between bg-[#0b0e14] border border-gray-800 p-4 rounded-xl hover:border-amber-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative group/avatar">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold border border-amber-500/20 overflow-hidden">
                              {player.imageUrl ? (
                                <img 
                                  src={player.imageUrl} 
                                  alt={player.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span>{player.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            {isAdmin && (
                              <label className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer shadow-md border-2 border-[#0b0e14] z-10">
                                <Plus size={12} className="text-black" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*,video/*,.gif,.webp" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) updatePlayerImage(player.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <button 
                            onClick={() => { setViewingPlayerId(player.id); setActiveCharacterIndex(0); }}
                            className="text-lg font-medium text-gray-200 hover:text-amber-500 transition-colors text-left"
                          >
                            {player.name}
                          </button>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => removePlayer(player.id)}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                              title="Remover Membro"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {isAdmin && (
                    <div className="mt-10 pt-8 border-t border-gray-800">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest">Adicionar Novo Membro</h3>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Nome do player"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                          className="flex-1 bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <button 
                          onClick={addPlayer}
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                        >
                          <Plus size={20} />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          )}

              {activeTab === 'DKP' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-6xl mx-auto space-y-8"
                >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Dragon Kill Points (DKP)</h1>
                  <p className="text-gray-400 mt-1">Sistema de pontos por participação e loot</p>
                </div>
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={14} />
                      Master Admin: Malakai
                    </div>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        if(confirm('Aplicar decaimento de 10% de todos os pontos de DKP?')) {
                          applyDKPDecay();
                        }
                      }}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Decay Semanal
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-[#151921] rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800 bg-gray-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" />
                        Ranking de DKP
                      </h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                          type="text"
                          value={dkpSearch}
                          onChange={(e) => setDkpSearch(e.target.value)}
                          placeholder="Buscar membro..."
                          className="bg-[#0b0e14] border border-gray-700 rounded-full pl-9 pr-4 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500 transition-all w-full md:w-64"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#0b0e14] text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-gray-800">
                            <th className="px-6 py-4">Membro</th>
                            <th className="px-6 py-4 text-right">Saldo DKP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {[...state.players]
                            .filter(p => p.name.toLowerCase().includes(dkpSearch.toLowerCase()))
                            .sort((a, b) => (b.dkpPoints || 0) - (a.dkpPoints || 0))
                            .map((player, index) => {
                            const displayRank = index + 1;

                            return (
                              <tr key={player.id} className="hover:bg-amber-500/5 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-gray-600 w-4">#{displayRank}</div>
                                    <div className="relative">
                                      <div className="w-8 h-8 rounded-lg bg-[#0b0e14] border border-gray-700 overflow-hidden flex items-center justify-center text-xs font-black text-amber-500">
                                        {player.imageUrl ? (
                                          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                                        ) : player.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-gray-200">{player.name}</div>
                                      <div className="text-[10px] text-gray-500">{player.class || 'Membro'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`text-sm font-black ${(player.dkpPoints || 0) >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {(player.dkpPoints || 0).toLocaleString()} DKP
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="bg-[#151921] rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800 bg-gray-800/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <HistoryIcon size={18} className="text-amber-500" />
                          Histórico Local
                        </h3>
                        {isAdmin && state.dkpHistory && state.dkpHistory.length > 0 && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearDKPHistory();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer active:scale-95"
                            title="Limpar Todo o Histórico de DKP"
                          >
                            <Trash2 size={12} className="pointer-events-none" />
                            Limpar Histórico
                          </button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                        <input 
                          type="text"
                          value={dkpHistorySearch}
                          onChange={(e) => setDkpHistorySearch(e.target.value)}
                          placeholder="Filtrar histórico por membro ou motivo..."
                          className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-[10px] text-gray-400 focus:outline-none focus:border-amber-500/50 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {(!state.dkpHistory || state.dkpHistory.length === 0) ? (
                        <div className="p-10 text-center text-gray-600 italic text-xs">Sem registros de DKP.</div>
                      ) : (
                        state.dkpHistory
                          .filter(entry => 
                            entry.playerName.toLowerCase().includes(dkpHistorySearch.toLowerCase()) ||
                            entry.reason.toLowerCase().includes(dkpHistorySearch.toLowerCase())
                          )
                          .map((entry) => (
                          <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.amount >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {entry.amount >= 0 ? <Plus size={14} /> : <Trash2 size={14} />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-200">
                                  {entry.playerName} <span className={entry.amount >= 0 ? 'text-green-500' : 'text-red-500'}>{entry.amount > 0 ? '+' : ''}{entry.amount} DKP</span>
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                                  {entry.reason} • {new Date(entry.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            {isAdmin && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteDKPEntry(entry.id);
                                }}
                                className="relative z-50 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                              >
                                <Trash2 size={16} className="pointer-events-none" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  {isAdmin ? (
                    <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden bg-gradient-to-b from-[#1c222d] to-[#151921]">
                      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Settings size={18} className="text-amber-500" />
                        Painel do Administrador (Malakai)
                      </h3>

                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Membro Alvo</label>
                          <select 
                            value={selectedDKPPlayerId}
                            onChange={(e) => setSelectedDKPPlayerId(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Selecionar...</option>
                            {state.players.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Quantidade de Pontos</label>
                          <input 
                            type="number"
                            value={dkpAmount}
                            onChange={(e) => setDkpAmount(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                            placeholder="Ex: 50"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Motivo</label>
                          <input 
                            type="text"
                            value={dkpReason}
                            onChange={(e) => setDkpReason(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                            placeholder="Raid Boss, Evento, etc."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => addDKP('add')}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-xl text-xs uppercase transition-all shadow-lg shadow-amber-500/20"
                          >
                            Adicionar DKP
                          </button>
                          <button 
                            onClick={() => addDKP('sub')}
                            className="bg-gray-800 hover:bg-red-900 border border-red-500/30 text-red-500 hover:text-white font-black py-4 rounded-xl text-xs uppercase transition-all"
                          >
                            Retirar DKP
                          </button>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                          <button 
                            onClick={() => {
                              const amount = prompt("Quantidade de DKP para TODOS:");
                              const reason = prompt("Motivo para TODOS:");
                              if(amount && reason) handleBulkDKP(parseInt(amount), reason);
                            }}
                            className="w-full bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 text-blue-500 hover:text-white font-black py-3 rounded-xl text-[10px] uppercase transition-all"
                          >
                            Bônus Geral (CP Inteira)
                          </button>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <div className="p-8 bg-gray-800/20 border border-gray-800 rounded-3xl text-center space-y-4">
                      <Lock className="mx-auto text-gray-600" size={32} />
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Somente Malakai pode alterar pontos.</p>
                    </div>
                  )}

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info size={14} />
                      Regras Simples
                    </h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-black font-bold text-[10px]">1</div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">Ganhe pontos participando de eventos oficiais e raids.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-black font-bold text-[10px]">2</div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">Troque seus pontos por itens no Clan Warehouse.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-black font-bold text-[10px]">3</div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">O ranking define quem tem direito de escolha sobre o drop de bosses.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Meu Perfil' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Meu Perfil</h1>
                  <p className="text-gray-400 mt-1">Gerencie suas informações pessoais e segurança</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold uppercase tracking-widest">
                  <User size={14} />
                  Perfil do Membro
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Photo Section */}
                <div className="md:col-span-1 space-y-6">
                  <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    
                    <div className="relative group mx-auto mb-6 w-32 h-32">
                      <div className="w-full h-full rounded-full bg-[#0b0e14] border-2 border-gray-800 overflow-hidden flex items-center justify-center shadow-2xl group-hover:border-amber-500/50 transition-all">
                        {state.currentUser?.imageUrl ? (
                          <img 
                            src={state.currentUser.imageUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={48} className="text-gray-700" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-4 border-[#151921] hover:bg-amber-600 transition-colors">
                        <Camera size={18} className="text-black" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && state.currentUser) updatePlayerImage(state.currentUser.id, file);
                          }}
                        />
                      </label>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">{state.currentUser?.name}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Membro da CP</p>
                    
                    <div className="pt-4 border-t border-gray-800/50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-relaxed">
                        Sua foto de perfil é visível para todos os membros na lista de membros.
                      </p>
                    </div>
                  </section>
                </div>

                {/* Security Section */}
                <div className="md:col-span-2 space-y-6">
                  <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8 text-amber-500">
                      <Lock size={24} />
                      <h2 className="text-xl font-bold uppercase tracking-widest">Segurança da Conta</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nova Senha</label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                              placeholder="Mínimo 6 caracteres"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                              placeholder="Repita a nova senha"
                            />
                          </div>
                        </div>
                      </div>

                      {passwordMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border text-sm font-medium text-center ${
                            passwordMessage.type === 'success' 
                              ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                              : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}
                        >
                          {passwordMessage.text}
                        </motion.div>
                      )}

                      <button
                        onClick={changePassword}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        ATUALIZAR SENHA
                      </button>

                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-1">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Dica de Segurança</h4>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            Evite usar senhas óbvias. Sua senha protege seu acesso ao sistema de Craft, Vendas e Histórico da CP.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Notificações' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Notificações</h1>
                  <p className="text-gray-400 mt-1">Fique por dentro de tudo o que acontece na CP</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold uppercase tracking-widest">
                  <Bell size={14} />
                  Central de Alertas
                </div>
              </div>

              <div className="bg-[#151921] rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-800/20">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Alertas Recentes</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        if (!state.currentUser) return;
                        setState(prev => ({
                          ...prev,
                          notifications: (prev.notifications || []).map(n => ({
                            ...n,
                            readBy: [...new Set([...n.readBy, state.currentUser!.id])]
                          }))
                        }));
                      }}
                      className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors"
                    >
                      Marcar lidas
                    </button>
                    {isAdmin && state.notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Limpar Tudo
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-gray-800">
                  {(!state.notifications || state.notifications.length === 0) ? (
                    <div className="p-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto text-gray-600">
                        <BellOff size={32} />
                      </div>
                      <p className="text-gray-500 font-medium">Nenhuma notificação por enquanto.</p>
                    </div>
                  ) : (
                    state.notifications.map((notif) => {
                      const isRead = notif.readBy.includes(state.currentUser?.id || '');
                      return (
                        <motion.div 
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-6 flex items-start gap-4 transition-all cursor-pointer hover:bg-amber-500/5 ${isRead ? 'opacity-60' : 'bg-amber-500/[0.02]'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            notif.type === 'siege' ? 'bg-red-500/20 text-red-500' :
                            notif.type === 'boss' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            {notif.type === 'siege' ? <Castle size={20} /> :
                             notif.type === 'boss' ? <Skull size={20} /> :
                             <Info size={20} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                notif.type === 'siege' ? 'text-red-500' :
                                notif.type === 'boss' ? 'text-amber-500' :
                                'text-blue-500'
                              }`}>
                                {notif.type === 'siege' ? 'Convocação de Siege' :
                                 notif.type === 'boss' ? 'Alerta de Boss' :
                                 'Informação'}
                              </span>
                              <span className="text-[10px] text-gray-600 font-medium">
                                {new Date(notif.timestamp).toLocaleString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className={`text-sm ${isRead ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                              {notif.message}
                            </p>
                          </div>
                          {!isRead && (
                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Admin' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {!isAdmin ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="bg-[#151921] p-10 rounded-3xl border border-gray-800 shadow-2xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                      <Lock size={40} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Acesso Restrito</h2>
                      <p className="text-gray-500 text-sm mt-2">Apenas Malakai ou membros autorizados podem acessar as configurações do sistema.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-green-500/5 border border-green-500/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-3 text-green-500">
                      <ShieldCheck size={20} />
                      <span className="font-bold uppercase tracking-widest text-[10px]">Sessão de Administrador Ativa (Malakai)</span>
                    </div>
                  </div>
 
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white tracking-tight">Painel do Administrador</h1>
                      <p className="text-gray-400 mt-1">Gerenciamento central do sistema CP FURIA-BR</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold uppercase tracking-widest">
                      <Shield size={14} />
                      Acesso Administrador
                    </div>
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#151921] p-6 rounded-2xl border border-gray-800 shadow-xl">
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                    <Users size={20} />
                    <h3 className="font-bold uppercase tracking-wider text-sm">Membros</h3>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{state.players.length}</div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total na CP</p>
                </div>

                <div className="bg-[#151921] p-6 rounded-2xl border border-gray-800 shadow-xl">
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                    <ScrollText size={20} />
                    <h3 className="font-bold uppercase tracking-wider text-sm">Itens no Banco</h3>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{state.items.length}</div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cadastrados</p>
                </div>

                <div className="bg-[#151921] p-6 rounded-2xl border border-gray-800 shadow-xl">
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                    <HistoryIcon size={20} />
                    <h3 className="font-bold uppercase tracking-wider text-sm">Transações</h3>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{state.history.length + state.sales.length}</div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Registros</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Member Management */}
                <section className="bg-[#151921] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-amber-500">
                      <Users size={20} />
                      <h2 className="font-bold uppercase tracking-widest">Gerenciar Membros</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        placeholder="Nome do novo membro..."
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="flex-1 bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                      />
                      <button 
                        onClick={addPlayer}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Plus size={18} />
                        <span>Add</span>
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {state.players.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-[#0b0e14] border border-gray-800 rounded-xl group">
                          <span className="font-medium">{player.name}</span>
                          <button 
                            onClick={() => removePlayer(player.id)}
                            className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* System Actions */}
                <section className="space-y-8">
                  {/* Branding / Logo Section */}
                  <div className="bg-[#151921] rounded-2xl border border-gray-800 shadow-xl p-6">
                    <div className="flex items-center gap-3 text-amber-500 mb-6">
                      <ImageIcon size={20} />
                      <h2 className="font-bold uppercase tracking-widest">Identidade Visual (Logo)</h2>
                    </div>
                    <div className="space-y-6">
                      {/* URL Option */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Opção 1: URL da Imagem</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Cole a URL da imagem aqui..."
                            value={newLogoUrl}
                            onChange={(e) => setNewLogoUrl(e.target.value)}
                            className="flex-1 bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      {/* File Upload Option */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Opção 2: Upload de Arquivo (PNG/JPG)</label>
                        <label className="flex items-center justify-center gap-3 p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl transition-all cursor-pointer group">
                          <Upload size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <div className="text-sm font-bold text-white">Selecionar Arquivo</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">PNG, JPG ou GIF</div>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button 
                          onClick={updateClanLogo}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                        >
                          APLICAR LOGO NO SISTEMA
                        </button>
                      </div>

                      <div className="p-4 bg-[#0b0e14] rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Prévia da Logo</span>
                        <div className="w-24 h-24 relative">
                          <img 
                            src={newLogoUrl || DEFAULT_CLAN_LOGO} 
                            alt="Preview Logo" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 italic text-center">A imagem será atualizada no Portal, Login e Sidebar após clicar em aplicar.</p>
                    </div>
                  </div>

                  <div className="bg-[#151921] rounded-2xl border border-gray-800 shadow-xl p-6">
                    <div className="flex items-center gap-3 text-amber-500 mb-6">
                      <Database size={20} />
                      <h2 className="font-bold uppercase tracking-widest">Dados do Sistema</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={exportData}
                        className="flex items-center justify-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-2xl transition-all group"
                      >
                        <Download size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">Exportar Backup</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Salvar em JSON</div>
                        </div>
                      </button>

                      <label className="flex items-center justify-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-2xl transition-all group cursor-pointer">
                        <Upload size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">Importar Backup</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Carregar JSON</div>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) importData(file);
                          }}
                        />
                      </label>
                    </div>

                    <button
                      onClick={() => saveToServer(state)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Sincronizar com Banco de Dados (.json)
                    </button>

                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSoundEnabled ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-800 text-gray-500'}`}>
                            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white uppercase tracking-widest">Alertas Sonoros</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Ativar/Desativar som de respawn</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setIsSoundEnabled(!isSoundEnabled);
                            if (isSoundEnabled) stopAlertSound();
                          }}
                          className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isSoundEnabled ? 'bg-amber-500' : 'bg-gray-800'}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${isSoundEnabled ? 'left-8' : 'left-1'}`}></div>
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-bold text-red-500 uppercase tracking-widest">Zona de Perigo</div>
                      </div>
                      {!confirmReset ? (
                        <button 
                          onClick={() => setConfirmReset(true)}
                          className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl transition-all text-red-500 group"
                        >
                          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                          <span className="font-bold">Resetar Todos os Dados</span>
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setState(INITIAL_STATE);
                              setConfirmReset(false);
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-colors"
                          >
                            Confirmar Reset
                          </button>
                          <button 
                            onClick={() => setConfirmReset(false)}
                            className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                        <Shield size={20} className="text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-1">Informações de Segurança</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          O painel de administrador permite modificações diretas no banco de dados local. 
                          Certifique-se de exportar um backup antes de realizar operações de reset ou importação em massa.
                          O e-mail de administrador atual é: <span className="text-amber-500 font-mono">{ADMIN_EMAIL}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      )}

          {activeTab === 'Loteria Furia' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-2">
                  <Clover size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white uppercase tracking-[0.2em]">Loteria Furia-BR</h1>
                <p className="text-gray-500 text-sm max-w-md">Sorteio aleatório para membros da CP. Selecione os participantes e gire a roleta!</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left Side: Controls */}
                <div className="space-y-8">
                  {/* Prize Input */}
                  <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    <label className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] mb-4 block">Prêmio do Sorteio</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 100kk Adena, Item Grade S..."
                      value={lotteryPrize}
                      onChange={(e) => setLotteryPrize(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-gray-800 rounded-2xl px-6 py-4 text-lg font-bold text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-gray-700"
                    />
                  </section>

                  {/* Member Selection Grid */}
                  <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Participantes ({selectedLotteryPlayers.length}/9)</h2>
                      <button 
                        onClick={() => setSelectedLotteryPlayers(selectedLotteryPlayers.length === 9 ? [] : state.players.map(p => p.name))}
                        className="text-[10px] font-bold text-amber-500 uppercase hover:underline"
                      >
                        {selectedLotteryPlayers.length === 9 ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {state.players.map((player) => {
                        const isSelected = selectedLotteryPlayers.includes(player.name);
                        return (
                          <button
                            key={player.id}
                            onClick={() => toggleLotteryPlayer(player.name)}
                            disabled={isSpinning}
                            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden ${
                              isSelected 
                                ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                                : 'bg-[#0b0e14] border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                              isSelected ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                            }`}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tighter truncate w-full px-2 text-center ${
                              isSelected ? 'text-green-500' : 'text-gray-500'
                            }`}>
                              {player.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle2 size={12} className="text-green-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedLotteryPlayers.length >= 2 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={spinLottery}
                        disabled={isSpinning}
                        className={`w-full mt-8 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm transition-all shadow-2xl flex items-center justify-center gap-3 ${
                          isSpinning 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/20'
                        }`}
                      >
                        {isSpinning ? (
                          <>
                            <RefreshCw size={20} className="animate-spin" />
                            Sorteando...
                          </>
                        ) : (
                          <>
                            <Trophy size={20} />
                            Girar Roleta
                          </>
                        )}
                      </motion.button>
                    )}
                  </section>
                </div>

                {/* Right Side: Roulette Wheel */}
                <div className="flex flex-col items-center justify-center space-y-8 sticky top-8">
                  <div className="relative w-full max-w-[450px] aspect-square">
                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-xl border-4 border-[#151921]">
                        <Plus size={20} className="text-black rotate-45" />
                      </div>
                      <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-amber-500 mx-auto -mt-1"></div>
                    </div>

                    {/* The Wheel */}
                    <motion.div 
                      className="w-full h-full rounded-full border-8 border-gray-800 bg-[#151921] relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                      animate={{ rotate: rotation }}
                      transition={{ 
                        duration: 5, 
                        ease: [0.45, 0.05, 0.55, 0.95] // Custom cubic-bezier for realistic spin
                      }}
                    >
                      {selectedLotteryPlayers.length > 0 ? (
                        selectedLotteryPlayers.map((name, i) => {
                          const angle = 360 / selectedLotteryPlayers.length;
                          const rotate = i * angle;
                          return (
                            <div 
                              key={name}
                              className="absolute top-0 left-1/2 w-1/2 h-full origin-left"
                              style={{ 
                                transform: `rotate(${rotate}deg)`,
                                borderLeft: '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <div 
                                className="absolute top-0 left-0 w-full h-full origin-left flex items-center justify-end pr-12"
                                style={{ 
                                  transform: `rotate(${angle / 2}deg)`,
                                  background: `linear-gradient(to right, transparent, ${i % 2 === 0 ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)'})`
                                }}
                              >
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap origin-center -rotate-90">
                                  {name}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-center p-12">
                          <p className="text-xs uppercase font-bold tracking-widest">Selecione participantes para ativar a roleta</p>
                        </div>
                      )}
                      
                      {/* Center Hub */}
                      <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#151921] border-4 border-gray-800 z-10 flex items-center justify-center shadow-inner">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Clover size={16} className="text-amber-500" />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Winner Announcement */}
                  <AnimatePresence>
                    {lotteryWinner && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        className="bg-green-500 text-black px-10 py-6 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.4)] text-center relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 opacity-70">Temos um Vencedor!</p>
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{lotteryWinner}</h2>
                        {lotteryPrize && (
                          <div className="bg-black/10 px-4 py-2 rounded-xl inline-flex items-center gap-2">
                            <Trophy size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">{lotteryPrize}</span>
                          </div>
                        )}
                        
                        {/* Confetti-like effect */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 bg-white/20 rounded-full blur-xl"></div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/20 rounded-full blur-xl"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Lottery History Section */}
              <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl">
                <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6">
                  <div className="flex items-center gap-3 text-amber-500">
                    <HistoryIcon size={20} />
                    <h2 className="text-lg font-bold uppercase tracking-wider">Histórico de Sorteio</h2>
                  </div>
                  {isAdmin && state.lotteryHistory.length > 0 && (
                    <button 
                      onClick={clearLotteryHistory}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl border border-red-500/30 transition-all font-bold text-xs uppercase flex items-center gap-2 shadow-lg shadow-red-500/10"
                    >
                      <Trash2 size={16} />
                      Limpar Histórico
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {(!state.lotteryHistory || state.lotteryHistory.length === 0) ? (
                    <div className="text-center py-12 bg-[#0b0e14] rounded-2xl border border-dashed border-gray-800">
                      <p className="text-gray-600 text-sm uppercase font-bold tracking-widest">Nenhum sorteio realizado ainda</p>
                    </div>
                  ) : (
                    state.lotteryHistory.map((draw) => (
                      <div 
                        key={draw.id} 
                        className="flex items-center justify-between bg-[#0b0e14] border border-gray-800 p-4 rounded-2xl hover:border-amber-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Trophy size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white uppercase tracking-tight">{draw.winner}</span>
                              <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase">Vencedor</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Prêmio: <span className="text-amber-500/80 font-medium">{draw.prize}</span></p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                              {new Date(draw.timestamp).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-[10px] font-mono text-gray-700 mt-0.5">
                              {new Date(draw.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={() => removeLotteryDraw(draw.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all shadow-sm"
                              title="Excluir Sorteio"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </motion.div>
          )}
          {activeTab === 'Cla Warehouse' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Add Warehouse Item Form */}
              <section className="bg-[#151921] rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-amber-500 font-bold mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                  <Archive size={16} /> Adicionar ao Cla Warehouse
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome do Item</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Enchant Weapon Grade S"
                      value={warehouseForm.name}
                      onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Quantidade</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="1"
                      value={warehouseForm.quantity}
                      onChange={(e) => setWarehouseForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                    <select 
                      value={warehouseForm.category}
                      onChange={(e) => setWarehouseForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      onClick={addWarehouseItem}
                      className="w-full bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-300 font-bold py-2 rounded-xl transition-all text-sm uppercase"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </section>

              {/* Warehouse List */}
              <section className="bg-[#151921] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Buscar no armazém..."
                      value={warehouseSearch}
                      onChange={(e) => setWarehouseSearch(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {['Todos', ...categories].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setWarehouseFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                          warehouseFilter === cat 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    {isAdmin && state.warehouseItems.length > 0 && (
                      <button 
                        onClick={clearWarehouse}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-lg transition-all"
                        title="Limpar Todo o Armazém"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-800/30 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="px-6 py-4 w-16">Img</th>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Qtd</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {(state.warehouseItems || []).filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(warehouseSearch.toLowerCase());
                        const matchesFilter = warehouseFilter === 'Todos' || item.category === warehouseFilter;
                        return matchesSearch && matchesFilter;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-gray-500 italic text-sm">
                            Nenhum item no armazém. Adicione itens acima.
                          </td>
                        </tr>
                      ) : (
                        (state.warehouseItems || []).filter(item => {
                          const matchesSearch = item.name.toLowerCase().includes(warehouseSearch.toLowerCase());
                          const matchesFilter = warehouseFilter === 'Todos' || item.category === warehouseFilter;
                          return matchesSearch && matchesFilter;
                        }).map(item => (
                          <tr key={item.id} className="hover:bg-gray-800/20 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="relative w-10 h-10 bg-[#0b0e14] border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center group/img">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Archive size={16} className="text-gray-700" />
                                )}
                                
                                {isAdmin && (
                                  <label className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer shadow-md border-2 border-[#0b0e14] z-10">
                                    <Plus size={12} className="text-black" />
                                    <input 
                                      type="file" 
                                      accept="image/*,video/*,.gif,.webp" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) updateWarehouseItemImage(item.id, file);
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-200">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-amber-500 font-bold">
                              {item.quantity.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md bg-gray-800 text-[10px] font-bold text-gray-400 uppercase">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAdmin && (
                                <button 
                                  onClick={() => removeWarehouseItem(item.id)}
                                  className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                  title="Remover do Armazém"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}
          {activeTab === 'Siege' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Castle className="text-amber-500" size={32} />
                    CONVOCAÇÃO DE SIEGE
                  </h2>
                  <p className="text-gray-500 font-medium">Agende e confirme presença nas batalhas pelo castelo</p>
                </div>
                {isAdmin && state.siegeEvents && state.siegeEvents.length > 0 && (
                  <button 
                    onClick={clearSiegeHistory}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl border border-red-500/30 transition-all font-bold text-xs uppercase flex items-center gap-2 shadow-lg shadow-red-500/10"
                  >
                    <Trash2 size={16} />
                    Limpar Tudo
                  </button>
                )}
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar/Form Section */}
                <div className="lg:col-span-1 space-y-6">
                  {isAdmin && (
                    <section className="bg-[#151921] rounded-3xl p-6 border border-gray-800 shadow-xl">
                      <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Calendar size={16} />
                        Agendar Batalha
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Castelo</label>
                          <input 
                            type="text" 
                            value={siegeForm.castle}
                            onChange={(e) => setSiegeForm({...siegeForm, castle: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 p-3 rounded-xl text-gray-200 text-sm focus:border-amber-500/50 outline-none"
                            placeholder="Ex: Giran, Aden..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Data</label>
                            <input 
                              type="date" 
                              value={siegeForm.date}
                              onChange={(e) => setSiegeForm({...siegeForm, date: e.target.value})}
                              className="w-full bg-[#0b0e14] border border-gray-800 p-3 rounded-xl text-gray-200 text-sm focus:border-amber-500/50 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Horário</label>
                            <input 
                              type="time" 
                              value={siegeForm.time}
                              onChange={(e) => setSiegeForm({...siegeForm, time: e.target.value})}
                              className="w-full bg-[#0b0e14] border border-gray-800 p-3 rounded-xl text-gray-200 text-sm focus:border-amber-500/50 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Descrição</label>
                          <textarea 
                            value={siegeForm.description}
                            onChange={(e) => setSiegeForm({...siegeForm, description: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 p-3 rounded-xl text-gray-200 text-sm focus:border-amber-500/50 outline-none h-20 resize-none"
                            placeholder="Instruções para a CP..."
                          />
                        </div>
                        <button 
                          onClick={scheduleSiege}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
                        >
                          CONVOCAR MEMBROS
                        </button>
                      </div>
                    </section>
                  )}

                  <section className="bg-[#151921] rounded-3xl p-6 border border-gray-800 shadow-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Próximas Sieges</h3>
                    <div className="space-y-4">
                      {state.siegeEvents?.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-8 italic">Nenhuma siege agendada no momento.</p>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {state.siegeEvents?.map(event => (
                            <motion.div 
                              key={event.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                              className="p-4 bg-gray-800/30 border border-gray-800 rounded-2xl hover:border-amber-500/30 transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-amber-500 uppercase">{event.castle}</span>
                                  {isAdmin && (
                                    <button 
                                      onClick={() => deleteSiegeEvent(event.id)}
                                      className="text-gray-600 hover:text-red-500 transition-colors"
                                      title="Excluir Agendamento"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">{event.date}</span>
                              </div>
                              <p className="text-xs text-gray-400 mb-4">{event.description || 'Sem descrição adicional.'}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-2 overflow-hidden">
                                  {Object.keys(event.attendance).map(pid => {
                                    const p = state.players.find(player => player.id === pid);
                                    return (
                                      <div key={pid} className="inline-block h-6 w-6 rounded-full ring-2 ring-[#151921] bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black" title={p?.name}>
                                        {p?.name?.[0]}
                                      </div>
                                    );
                                  })}
                                  {Object.keys(event.attendance).length === 0 && (
                                    <span className="text-[10px] text-gray-600">Ninguém confirmou ainda</span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={() => confirmAttendance(event.id)}
                                    disabled={event.attendance[state.currentUser?.id || '']}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                      event.attendance[state.currentUser?.id || '']
                                        ? 'bg-green-500/20 text-green-500 cursor-default'
                                        : 'bg-amber-500 text-black hover:bg-amber-600'
                                    }`}
                                  >
                                    {event.attendance[state.currentUser?.id || ''] ? 'Confirmado' : 'Confirmar'}
                                  </button>
                                  
                                  {!event.attendance[state.currentUser?.id || ''] && !event.absences?.[state.currentUser?.id || ''] && (
                                    <button 
                                      onClick={() => setArregueiEventId(event.id)}
                                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-600 text-white hover:bg-red-700 transition-all"
                                    >
                                      Arreguei
                                    </button>
                                  )}
                                  
                                  {event.absences?.[state.currentUser?.id || ''] && (
                                    <span className="text-[10px] font-bold text-red-500 uppercase text-center">Arregou</span>
                                  )}

                                  {isAdmin && Object.keys(event.attendance).length > 0 && (
                                    <button 
                                      onClick={() => awardEventEP(event.id, 'siege')}
                                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-green-500 text-black hover:bg-green-600 uppercase transition-all flex items-center justify-center gap-1"
                                      title="Bonificar presentes com 50 EP"
                                    >
                                      <Trophy size={10} />
                                      Bonificar EP
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Justification Field */}
                              <AnimatePresence>
                                {arregueiEventId === event.id && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 space-y-2 overflow-hidden"
                                  >
                                    <label className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Justificativa do Arregão</label>
                                    <textarea 
                                      value={arregueiJustification}
                                      onChange={(e) => setArregueiJustification(e.target.value)}
                                      placeholder="Por que você está arregando?"
                                      className="w-full bg-red-500/10 border border-red-500/30 p-2 rounded-xl text-xs text-red-200 focus:outline-none focus:border-red-500 h-16 resize-none"
                                    />
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleArreguei(event.id)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 rounded-lg uppercase transition-all"
                                      >
                                        Confirmar Arrego
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setArregueiEventId(null);
                                          setArregueiJustification('');
                                        }}
                                        className="px-3 bg-gray-800 text-gray-400 text-[10px] font-bold py-1.5 rounded-lg uppercase hover:text-white transition-all"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </section>
                </div>

                {/* Main Calendar View */}
                <div className="lg:col-span-2">
                  <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl h-full">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-white capitalize">
                        {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-2">
                        <button className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white"><RefreshCw size={16} /></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-4">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">{day}</div>
                      ))}
                      
                      {/* Dynamic calendar logic */}
                      {(() => {
                        const now = new Date();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        
                        const calendarDays = [];
                        
                        // Empty slots for days before the 1st
                        for (let i = 0; i < firstDayOfMonth; i++) {
                          calendarDays.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                        }
                        
                        // Actual days of the month
                        for (let day = 1; day <= daysInMonth; day++) {
                          const hasEvent = state.siegeEvents?.some(e => {
                            const eventDate = new Date(e.date + 'T00:00:00');
                            return eventDate.getDate() === day && 
                                   eventDate.getMonth() === currentMonth && 
                                   eventDate.getFullYear() === currentYear;
                          });
                          
                          const isToday = now.getDate() === day;
                          
                          calendarDays.push(
                            <div 
                              key={day} 
                              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative ${
                                hasEvent 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                  : isToday
                                    ? 'bg-gray-800 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                                    : 'bg-gray-800/20 border-gray-800/50 text-gray-600'
                              }`}
                            >
                              <span className={`text-xs font-bold ${isToday ? 'text-amber-500' : ''}`}>{day}</span>
                              {hasEvent && <Castle size={12} className="animate-pulse" />}
                              {isToday && <div className="absolute top-1 right-1 w-1 h-1 bg-amber-500 rounded-full"></div>}
                            </div>
                          );
                        }
                        
                        return calendarDays;
                      })()}
                    </div>
                  </section>
                </div>
              </div>

              {/* Attendance and Absence Lists (Scroll Style) - Moved and Resized */}
              {state.siegeEvents && state.siegeEvents.length > 0 && (
                <div className="space-y-12 mt-12">
                  {state.siegeEvents.map(event => (
                    <div key={`lists-${event.id}`} className="space-y-8 bg-gray-900/30 p-8 rounded-3xl border border-gray-800">
                      <h4 className="text-xl font-black text-amber-500 uppercase tracking-[0.2em] text-center">Registros de Guerra: {event.castle}</h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Warriors List (Scroll) */}
                        <div className="relative">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 bg-[#151921] p-4 rounded-full border-2 border-amber-500/50 shadow-2xl shadow-amber-500/30">
                            <ShieldCheck className="text-amber-500" size={48} />
                          </div>
                          <div className="bg-[#f4e4bc] rounded-xl p-10 pt-16 shadow-2xl relative overflow-hidden min-h-[500px] border-x-[12px] border-[#d4c49c]">
                            {/* Scroll textures */}
                            <div className="absolute top-0 left-0 w-full h-6 bg-[#e4d4ac] border-b-2 border-[#c4b48c]"></div>
                            <div className="absolute bottom-0 left-0 w-full h-6 bg-[#e4d4ac] border-t-2 border-[#c4b48c]"></div>
                            
                            <h5 className="text-center font-serif font-black text-2xl text-[#5d4037] uppercase tracking-widest mb-8 border-b-4 border-[#5d4037]/20 pb-4">Guerreiros Confirmados</h5>
                            <ul className="space-y-4">
                              {Object.keys(event.attendance).length === 0 ? (
                                <li className="text-center text-[#8d6e63] italic text-lg py-12">Nenhum herói se apresentou para a batalha...</li>
                              ) : (
                                Object.keys(event.attendance).map(pid => {
                                  const p = state.players.find(player => player.id === pid);
                                  return (
                                    <li key={pid} className="flex items-center gap-4 text-[#5d4037] font-serif font-bold text-xl">
                                      <Shield size={20} className="shrink-0 text-[#795548]" />
                                      <span>{p?.name}</span>
                                    </li>
                                  );
                                })
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Arregões List (Scroll) */}
                        <div className="relative">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 bg-[#151921] p-4 rounded-full border-2 border-red-500/50 shadow-2xl shadow-red-500/30">
                            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Main Head - Perfect Rounded Profile */}
                              <path d="M30 65 Q 30 35, 60 35 Q 90 35, 90 65 Q 90 90, 60 90 Q 30 90, 30 65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-red-500" />
                              
                              {/* Comb (Crista) - 4 Tall Rounded Lobes */}
                              <path d="M45 35 C 40 20, 50 15, 53 25 C 55 10, 65 10, 68 25 C 70 10, 80 15, 82 28 C 85 20, 95 30, 88 45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="#ef5350" className="text-red-500" />
                              
                              {/* Beak (Bico) - Profile with Upper and Lower Part */}
                              <path d="M30 55 L 15 65 L 30 75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="#ff9800" className="text-red-500" />
                              <path d="M20 65 L 30 65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-red-500" />
                              
                              {/* Eye - Large, Round with Dual Highlights */}
                              <circle cx="65" cy="55" r="10" fill="currentColor" className="text-red-500" />
                              <circle cx="70" cy="50" r="4" fill="white" />
                              <circle cx="60" cy="60" r="1.5" fill="white" />
                              
                              {/* Wattles (Gogó) - Two Rounded Teardrops */}
                              <path d="M30 75 Q 20 90, 35 95 Q 50 90, 40 75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="#ef5350" className="text-red-500" />
                            </svg>
                          </div>
                          <div className="bg-[#fce4ec] rounded-xl p-10 pt-16 shadow-2xl relative overflow-hidden min-h-[500px] border-x-[12px] border-[#f8bbd0]">
                            {/* Scroll textures */}
                            <div className="absolute top-0 left-0 w-full h-6 bg-[#f8bbd0] border-b-2 border-[#f48fb1]"></div>
                            <div className="absolute bottom-0 left-0 w-full h-6 bg-[#f8bbd0] border-t-2 border-[#f48fb1]"></div>
                            
                            <h5 className="text-center font-serif font-black text-2xl text-[#880e4f] uppercase tracking-widest mb-8 border-b-4 border-[#880e4f]/20 pb-4">Lista dos Arregões</h5>
                            <ul className="space-y-6">
                              {(!event.absences || Object.keys(event.absences).length === 0) ? (
                                <li className="text-center text-[#ad1457] italic text-lg py-12">Ninguém arregou ainda... por enquanto.</li>
                              ) : (
                                Object.entries(event.absences).map(([pid, justification]) => {
                                  const p = state.players.find(player => player.id === pid);
                                  return (
                                    <li key={pid} className="flex flex-col gap-2 text-[#880e4f] font-serif">
                                      <div className="flex items-center gap-3 font-black text-xl">
                                        <XCircle size={20} className="shrink-0" />
                                        <span>{p?.name}</span>
                                      </div>
                                      {justification && (
                                        <p className="text-sm italic bg-white/40 p-4 rounded-lg border border-[#f48fb1]/30 shadow-inner">
                                          "{justification}"
                                        </p>
                                      )}
                                    </li>
                                  );
                                })
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Boss' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Skull className="text-amber-500" size={32} />
                    SISTEMA DE BOSS
                  </h2>
                  <p className="text-gray-500 font-medium">Controle de respawn e caçadas</p>
                </div>
                <div className="flex gap-2 items-center">
                  {isAdmin && state.bossEvents && state.bossEvents.length > 0 && (
                    <button 
                      onClick={clearBossHistory}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/30 transition-all font-bold text-[10px] uppercase flex items-center gap-1.5 mr-2"
                    >
                      <Trash2 size={12} />
                      Limpar Tudo
                    </button>
                  )}
                  {isAudioBlocked && isSoundEnabled && (
                    <button 
                      onClick={() => {
                        playAlertSound();
                        setIsAudioBlocked(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/50 rounded-xl text-amber-500 text-[10px] font-black uppercase animate-pulse hover:bg-amber-500 hover:text-black transition-all"
                    >
                      <VolumeX size={14} />
                      Ativar Som de Alerta
                    </button>
                  )}
                  {(selectedBossCategory || selectedBossId || showTodayBosses) && (
                    <button 
                      onClick={() => {
                        if (selectedBossId) setSelectedBossId(null);
                        else if (showTodayBosses) setShowTodayBosses(false);
                        else setSelectedBossCategory(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all text-sm font-bold"
                    >
                      <ArrowLeft size={16} />
                      Voltar
                    </button>
                  )}
                </div>
              </header>

              {!selectedBossCategory && !showTodayBosses ? (
                /* Category List */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {BOSS_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedBossCategory(cat)}
                        className="p-6 bg-[#151921] border border-gray-800 rounded-3xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group text-left"
                      >
                        <h3 className="text-lg font-black text-white group-hover:text-amber-500 transition-colors">
                          Chefes de nível {cat.replace('-', ' a ')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {state.bosses?.filter(b => b.category === cat).length || 0} Bosses registrados
                        </p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowTodayBosses(true)}
                    className="w-full p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Calendar size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                          Bosses abatidos nas últimas 24h
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                          {state.bosses?.filter(b => {
                            if (!b.lastDeath) return false;
                            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
                            return b.lastDeath >= twentyFourHoursAgo;
                          }).length || 0} Registros recentes
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 group-hover:translate-x-1 transition-transform">
                      <ExternalLink size={20} />
                    </div>
                  </button>
                </div>
              ) : showTodayBosses && !selectedBossId ? (
                /* Today's Bosses List */
                <div className="space-y-6">
                  <div className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                        <HistoryIcon size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Abatidos (Últimas 24h)</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ordenado por nível (menor para maior)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.bosses?.filter(b => {
                        if (!b.lastDeath) return false;
                        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
                        return b.lastDeath >= twentyFourHoursAgo;
                      })
                      .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0))
                      .map(boss => {
                        const isHighLevel = (boss.level || 0) >= 50;
                        const baseHours = isHighLevel ? 10 : 6;
                        const windowStart = boss.lastDeath! + ((baseHours - 1.5) * 60 * 60 * 1000);
                        const windowBase = boss.lastDeath! + (baseHours * 60 * 60 * 1000);
                        const windowEnd = boss.lastDeath! + ((baseHours + 1.5) * 60 * 60 * 1000);

                        return (
                          <button 
                            key={boss.id}
                            onClick={() => {
                              setSelectedBossId(boss.id);
                              setSelectedBossCategory(boss.category || null);
                            }}
                            className="p-5 bg-gray-800/30 border border-gray-800 rounded-2xl flex items-center justify-between group hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
                          >
                            <div className="flex-1">
                              <div className="flex gap-1.5 mb-2">
                                <div className={`w-2 h-2 rounded-full ${currentTime < windowStart ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-800'}`} />
                                <div className={`w-2 h-2 rounded-full ${currentTime < windowBase ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-gray-800'}`} />
                                <div className={`w-2 h-2 rounded-full ${currentTime < windowEnd ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-gray-800'}`} />
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{boss.name}</span>
                                <span className="text-[10px] font-bold bg-gray-800 px-2 py-0.5 rounded text-gray-400">Lvl {boss.level}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">
                                  Morto às: <span className="text-gray-300">{new Date(boss.lastDeath!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                                {boss.location && (
                                  <p className="text-[10px] text-amber-500/70 font-bold uppercase">{boss.location}</p>
                                )}
                              </div>
                            </div>
                            <div className="p-2 bg-gray-800 rounded-lg text-gray-500 group-hover:text-amber-500 transition-colors">
                              <ExternalLink size={14} />
                            </div>
                          </button>
                        );
                      })}
                      {(!state.bosses || state.bosses.filter(b => {
                        if (!b.lastDeath) return false;
                        const deathDate = new Date(b.lastDeath).toDateString();
                        const today = new Date().toDateString();
                        return deathDate === today;
                      }).length === 0) && (
                        <div className="col-span-full py-12 text-center bg-gray-800/10 rounded-3xl border border-dashed border-gray-800">
                          <Skull size={48} className="mx-auto text-gray-800 mb-4" />
                          <p className="text-gray-600 font-bold uppercase tracking-widest">Nenhuma morte registrada hoje.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : !selectedBossId ? (
                /* Boss List in Category */
                <div className="space-y-6">
                  <div className="bg-[#151921] rounded-3xl p-6 border border-gray-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Chefes Nível {selectedBossCategory}</h3>
                      <span className="text-xs text-gray-500">{state.bosses?.filter(b => b.category === selectedBossCategory).length || 0}/20 Bosses</span>
                    </div>

                    {isAdmin && (state.bosses?.filter(b => b.category === selectedBossCategory).length || 0) < 20 && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 bg-gray-800/20 p-4 rounded-2xl border border-gray-800/50">
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome do Boss</label>
                          <input 
                            type="text" 
                            placeholder="Nome do Boss"
                            value={newBossName}
                            onChange={(e) => setNewBossName(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Localização</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Cruma Tower"
                            value={newBossLocation}
                            onChange={(e) => setNewBossLocation(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Level</label>
                          <input 
                            type="number" 
                            placeholder="Lvl"
                            value={newBossLevel}
                            onChange={(e) => setNewBossLevel(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button 
                            onClick={addBoss}
                            className="w-full h-full bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all text-sm uppercase"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.bosses?.filter(b => b.category === selectedBossCategory).map(boss => (
                        <div 
                          key={boss.id}
                          className="p-4 bg-gray-800/30 border border-gray-800 rounded-2xl flex items-center justify-between group"
                        >
                          <button 
                            onClick={() => setSelectedBossId(boss.id)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-amber-500 transition-colors">{boss.name}</span>
                              <span className="text-[10px] font-bold bg-gray-800 px-2 py-0.5 rounded text-gray-400">Lvl {boss.level}</span>
                            </div>
                            {boss.location && (
                              <p className="text-[10px] text-amber-500/70 font-medium mt-0.5">{boss.location}</p>
                            )}
                            {boss.lastDeath && (Date.now() - boss.lastDeath) <= (((boss.level || 0) >= 50 ? 11.5 : 7.5) * 60 * 60 * 1000) ? (
                              <p className="text-[10px] text-gray-500 mt-1">
                                Última morte: {new Date(boss.lastDeath).toLocaleString('pt-BR')}
                              </p>
                            ) : (
                              <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">
                                Status: <span className="text-amber-500/50">SEM REGISTRO</span>
                              </p>
                            )}
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => deleteBoss(boss.id)}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      {state.bosses?.filter(b => b.category === selectedBossCategory).length === 0 && (
                        <p className="col-span-full text-center text-gray-600 italic py-8">Nenhum boss registrado nesta categoria.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Boss Detail View */
                (() => {
                  const boss = state.bosses?.find(b => b.id === selectedBossId);
                  if (!boss) return null;

                  const deathTime = boss.lastDeath || 0;
                  const isHighLevel = (boss.level || 0) >= 50;
                  
                  const baseHours = isHighLevel ? 10 : 6;
                  const startHours = baseHours - 1.5;
                  const endHours = baseHours + 1.5;

                  const windowStart = deathTime + (startHours * 60 * 60 * 1000);
                  const windowBase = deathTime + (baseHours * 60 * 60 * 1000);
                  const windowEnd = deathTime + (endHours * 60 * 60 * 1000);
                  
                  let status = "Vivo";
                  let statusColor = "text-green-500";
                  let showPossibleAlert = false;

                  if (deathTime > 0) {
                    if (currentTime < windowStart) {
                      status = "Morto";
                      statusColor = "text-red-500";
                    } else if (currentTime <= windowEnd) {
                      status = "Janela de Respawn";
                      statusColor = "text-amber-500";
                      showPossibleAlert = true;
                    } else {
                      status = "SEM REGISTRO";
                      statusColor = "text-gray-500";
                    }
                  } else {
                    status = "SEM REGISTRO";
                    statusColor = "text-gray-500";
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 space-y-6">
                        <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl text-center">
                          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Skull size={40} className="text-amber-500" />
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase mb-1">{boss.name}</h3>
                          {boss.location && (
                            <p className="text-gray-400 text-xs font-medium mb-1">{boss.location}</p>
                          )}
                          <p className="text-amber-500 font-bold mb-6">Level {boss.level}</p>
                          
                          <div className="space-y-6 bg-gray-800/20 p-6 rounded-2xl border border-gray-800/50 mb-8">
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status Atual</p>
                              <p className={`text-xl font-black uppercase ${statusColor}`}>{status}</p>
                              {deathTime > 0 && status !== "SEM REGISTRO" && (
                                <div className="mt-2 text-[10px] text-gray-400 font-medium space-y-0.5">
                                  <p>Morto em: <span className="text-gray-200">{new Date(deathTime).toLocaleDateString('pt-BR')} às {new Date(deathTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                                  <p>Registrado por: <span className="text-amber-500/80">{boss.killedBy || 'Sistema'}</span></p>
                                </div>
                              )}
                            </div>

                            {deathTime > 0 && status !== "SEM REGISTRO" && (
                              <div className="space-y-4 pt-4 border-t border-gray-800">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="flex flex-col items-center p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest mb-1">Início ({isHighLevel ? '8:30h' : '4:30h'})</p>
                                    <p className="text-sm font-black text-white mb-1">{formatTargetTime(windowStart)}</p>
                                    <p className="text-xs font-mono font-bold text-green-500">
                                      {formatTimeLeft(windowStart - currentTime)}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-center p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                    <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mb-1">Base ({isHighLevel ? '10h' : '6h'})</p>
                                    <p className="text-sm font-black text-white mb-1">{formatTargetTime(windowBase)}</p>
                                    <p className="text-xs font-mono font-bold text-amber-500">
                                      {formatTimeLeft(windowBase - currentTime)}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest mb-1">Fim ({isHighLevel ? '11:30h' : '7:30h'})</p>
                                    <p className="text-sm font-black text-white mb-1">{formatTargetTime(windowEnd)}</p>
                                    <p className="text-xs font-mono font-bold text-red-500">
                                      {formatTimeLeft(windowEnd - currentTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {showPossibleAlert && (
                              <div className="mt-2 py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse">
                                <p className="text-amber-500 font-black text-xs uppercase tracking-[0.2em]">(possivelmente vivo)</p>
                              </div>
                            )}
                          </div>

                          {!boss.lastDeath || status === "SEM REGISTRO" ? (
                            <div className="space-y-4 mb-6 bg-gray-800/20 p-4 rounded-2xl border border-gray-800/50">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Informar Horário da Morte</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[8px] font-bold text-gray-600 uppercase block mb-1">Data</label>
                                  <input 
                                    type="date" 
                                    value={manualDeathDate}
                                    onChange={(e) => setManualDeathDate(e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-gray-800 rounded-lg p-2 text-xs text-white focus:border-amber-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-gray-600 uppercase block mb-1">Hora</label>
                                  <input 
                                    type="time" 
                                    value={manualDeathTime}
                                    onChange={(e) => setManualDeathTime(e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-gray-800 rounded-lg p-2 text-xs text-white focus:border-amber-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <button 
                            onClick={() => {
                              const [year, month, day] = manualDeathDate.split('-').map(Number);
                              const [hour, minute] = manualDeathTime.split(':').map(Number);
                              const deathTimestamp = new Date(year, month - 1, day, hour, minute).getTime();
                              markBossDead(boss.id, deathTimestamp);
                            }}
                            disabled={!manualDeathDate || !manualDeathTime}
                            className={`w-full font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2 ${
                              (!manualDeathDate || !manualDeathTime)
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                            }`}
                          >
                            <Skull size={20} />
                            Registrar Morte
                          </button>

                          {isAdmin && boss.lastDeath && status !== "SEM REGISTRO" && (
                            <button 
                              onClick={() => resetBossStatus(boss.id)}
                              className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold py-3 rounded-2xl transition-all border border-gray-700 uppercase text-[10px] tracking-widest"
                            >
                              Resetar Status / Reeditar
                            </button>
                          )}
                        </section>
                      </div>

                      <div className="lg:col-span-2 space-y-8">
                        {/* Calendar View */}
                        <section className="bg-[#151921] rounded-3xl p-8 border border-gray-800 shadow-xl">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white capitalize">
                              {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-4">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                              <div key={day} className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">{day}</div>
                            ))}
                            
                            {(() => {
                              const now = new Date();
                              const currentMonth = now.getMonth();
                              const currentYear = now.getFullYear();
                              const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                              
                              const calendarDays = [];
                              for (let i = 0; i < firstDayOfMonth; i++) {
                                calendarDays.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                              }
                              
                              for (let day = 1; day <= daysInMonth; day++) {
                                const hasEvent = state.bossEvents?.some(e => {
                                  const eventDate = new Date(e.date + 'T00:00:00');
                                  return eventDate.getDate() === day && 
                                         eventDate.getMonth() === currentMonth && 
                                         eventDate.getFullYear() === currentYear &&
                                         e.bossName === boss.name;
                                });
                                
                                const isToday = now.getDate() === day;
                                
                                calendarDays.push(
                                  <div 
                                    key={day} 
                                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative ${
                                      hasEvent 
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                        : isToday
                                          ? 'bg-gray-800 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                                          : 'bg-gray-800/20 border-gray-800/50 text-gray-600'
                                    }`}
                                  >
                                    <span className={`text-xs font-bold ${isToday ? 'text-amber-500' : ''}`}>{day}</span>
                                    {hasEvent && <Skull size={12} className="animate-pulse" />}
                                  </div>
                                );
                              }
                              return calendarDays;
                            })()}
                          </div>
                        </section>

                        {/* Next Hunts for this boss */}
                        <section className="bg-[#151921] rounded-3xl p-6 border border-gray-800 shadow-xl">
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Próximas Hunts: {boss.name}</h3>
                          <div className="space-y-4">
                            {state.bossEvents?.filter(e => e.bossName === boss.name).length === 0 ? (
                              <p className="text-xs text-gray-600 text-center py-8 italic">Nenhuma hunt agendada para este boss.</p>
                            ) : (
                              state.bossEvents?.filter(e => e.bossName === boss.name).map(event => (
                                <div key={event.id} className="p-4 bg-gray-800/30 border border-gray-800 rounded-2xl flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-black text-amber-500 uppercase">{event.date} às {event.time}</p>
                                    <p className="text-[10px] text-gray-500">{Object.keys(event.attendance).length} Confirmados</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => confirmBossAttendance(event.id)}
                                      className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-bold rounded-lg uppercase hover:bg-amber-600 transition-all"
                                    >
                                      Confirmar
                                    </button>
                                    {isAdmin && (
                                      <div className="flex gap-2">
                                        {Object.keys(event.attendance).length > 0 && (
                                          <button 
                                            onClick={() => awardEventEP(event.id, 'boss')}
                                            className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-xl transition-all"
                                            title="Bonificar presentes com 50 EP"
                                          >
                                            <Trophy size={16} />
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => deleteBossEvent(event.id)}
                                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                          title="Excluir Evento"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </section>
                      </div>
                    </div>
                  );
                })()
              )}
            </motion.div>
          )}
          {activeTab === 'Tributos e Multas' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar"
            >
              <header>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <DollarSign className="text-amber-500" size={32} />
                  TRIBUTOS E MULTAS
                </h2>
                <p className="text-gray-500 font-medium">Gestão financeira da CP: Multas por arrego e tributos mensais</p>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Section: Multas */}
                <section className="space-y-6">
                  <div className="bg-[#151921] rounded-3xl p-6 border border-gray-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Multas (Arregões)
                      </h3>
                      {isAdmin && state.fines.length > 0 && (
                        <button 
                          onClick={clearFinesHistory}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-xl border border-red-500/30 transition-all font-bold text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-red-500/10"
                        >
                          <Trash2 size={12} />
                          Limpar Histórico
                        </button>
                      )}
                    </div>
                    
                    {isAdmin && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 bg-gray-800/20 p-4 rounded-2xl border border-gray-800/50">
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Membro</label>
                          <select 
                            value={fineForm.playerName}
                            onChange={(e) => setFineForm({...fineForm, playerName: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          >
                            <option value="">Selecionar...</option>
                            {state.players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-6">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Motivo</label>
                          <input 
                            type="text" 
                            placeholder="Motivo da multa"
                            value={fineForm.reason}
                            onChange={(e) => setFineForm({...fineForm, reason: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button 
                            onClick={addManualFine}
                            className="w-full h-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm uppercase"
                          >
                            Multar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {(!state.fines || state.fines.length === 0) ? (
                        <p className="text-center text-gray-600 italic py-12">Nenhuma multa registrada.</p>
                      ) : (
                        state.fines.map(fine => (
                          <div key={fine.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            fine.status === 'paid' 
                              ? 'bg-green-500/5 border-green-500/20 opacity-60' 
                              : 'bg-red-500/5 border-red-500/20'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                fine.status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                              }`}>
                                {fine.status === 'paid' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{fine.playerName}</span>
                                  <span className="text-[10px] font-mono text-amber-500 font-bold">{fine.amount.toLocaleString('pt-BR')}k</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{fine.reason}</p>
                                <p className="text-[9px] text-gray-600 uppercase mt-1">{new Date(fine.date).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {fine.status === 'pending' ? (
                                <button 
                                  onClick={() => payFine(fine.id)}
                                  className="px-4 py-2 bg-red-600 hover:bg-green-600 text-white text-[10px] font-bold rounded-xl uppercase transition-all shadow-lg shadow-red-500/10"
                                >
                                  Pagar
                                </button>
                              ) : (
                                <span className="px-4 py-2 bg-green-500/20 text-green-500 text-[10px] font-bold rounded-xl uppercase border border-green-500/30">
                                  Pago
                                </span>
                              )}
                              {isAdmin && (
                                <button 
                                  onClick={() => removeFine(fine.id)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all shadow-sm"
                                  title="Excluir Multa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* Section: Tributos */}
                <section className="space-y-6">
                  <div className="bg-[#151921] rounded-3xl p-6 border border-gray-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign size={16} />
                        Tributos (Mensalidades)
                      </h3>
                      {isAdmin && state.tributes.length > 0 && (
                        <button 
                          onClick={clearTributesHistory}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-xl border border-red-500/30 transition-all font-bold text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-red-500/10"
                        >
                          <Trash2 size={12} />
                          Limpar Histórico
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 bg-gray-800/20 p-4 rounded-2xl border border-gray-800/50">
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Membro</label>
                          <select 
                            value={tributeForm.playerName}
                            onChange={(e) => setTributeForm({...tributeForm, playerName: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          >
                            <option value="">Selecionar...</option>
                            {state.players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Valor (k)</label>
                          <input 
                            type="text" 
                            placeholder="Valor"
                            value={tributeForm.amount}
                            onChange={(e) => setTributeForm({...tributeForm, amount: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Abril/2026"
                            value={tributeForm.description}
                            onChange={(e) => setTributeForm({...tributeForm, description: e.target.value})}
                            className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button 
                            onClick={addTribute}
                            className="w-full h-full bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all text-sm uppercase"
                          >
                            Lançar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {(!state.tributes || state.tributes.length === 0) ? (
                        <p className="text-center text-gray-600 italic py-12">Nenhum tributo registrado.</p>
                      ) : (
                        state.tributes.map(tribute => (
                          <div key={tribute.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            tribute.status === 'paid' 
                              ? 'bg-green-500/5 border-green-500/20 opacity-60' 
                              : 'bg-amber-500/5 border-amber-500/20'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tribute.status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
                              }`}>
                                <DollarSign size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{tribute.playerName}</span>
                                  <span className="text-[10px] font-mono text-amber-500 font-bold">{tribute.amount.toLocaleString('pt-BR')}k</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{tribute.description}</p>
                                <p className="text-[9px] text-gray-600 uppercase mt-1">{new Date(tribute.date).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {tribute.status === 'pending' ? (
                                <button 
                                  onClick={() => payTribute(tribute.id)}
                                  className="px-4 py-2 bg-amber-500 hover:bg-green-600 text-black hover:text-white text-[10px] font-bold rounded-xl uppercase transition-all shadow-lg shadow-amber-500/10"
                                >
                                  Pagar
                                </button>
                              ) : (
                                <span className="px-4 py-2 bg-green-500/20 text-green-500 text-[10px] font-bold rounded-xl uppercase border border-green-500/30">
                                  Pago
                                </span>
                              )}
                              {isAdmin && (
                                <button 
                                  onClick={() => removeTribute(tribute.id)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all shadow-sm"
                                  title="Excluir Tributo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
          {activeTab !== 'Craft-CP' && activeTab !== 'Vendas' && activeTab !== 'Histórico' && activeTab !== 'Itens' && activeTab !== 'Membros' && activeTab !== 'DKP' && activeTab !== 'Meu Perfil' && activeTab !== 'Admin' && activeTab !== 'Loteria Furia' && activeTab !== 'Cla Warehouse' && activeTab !== 'Siege' && activeTab !== 'Boss' && activeTab !== 'Tributos e Multas' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center">
                <LayoutDashboard size={40} />
              </div>
              <p className="text-xl font-medium">Módulo {activeTab} em desenvolvimento</p>
              <button 
                onClick={() => setActiveTab('Craft-CP')}
                className="text-amber-500 hover:underline"
              >
                Voltar para o Sistema
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Siege Notification Pop-up */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] w-full max-w-sm"
          >
            <div className="bg-[#151921] border-2 border-amber-500 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black shrink-0 animate-bounce">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-amber-500 uppercase tracking-tighter leading-tight mb-1">
                    {activeNotification.type === 'siege' ? 'CONVOCAÇÃO DE GUERRA!' : 'CONVOCAÇÃO PARA BOSS!'}
                  </h3>
                  <p className="text-sm text-gray-300 font-medium mb-4">{activeNotification.message}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        markNotificationRead(activeNotification.id);
                        setActiveNotification(null);
                        setActiveTab(activeNotification.type === 'siege' ? 'Siege' : 'Boss');
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-xl text-xs uppercase transition-all"
                    >
                      VER NO CALENDÁRIO
                    </button>
                    <button 
                      onClick={() => {
                        markNotificationRead(activeNotification.id);
                        setActiveNotification(null);
                      }}
                      className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-2 rounded-xl text-xs uppercase transition-all"
                    >
                      FECHAR
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <Volume2 size={12} />
                {activeNotification.type === 'siege' ? 'Trombetas de guerra soando...' : 'Preparando para a caçada...'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boss Respawn Alert Pop-up */}
      <AnimatePresence>
        {bossAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="fixed top-8 right-8 z-[110] w-full max-w-sm"
          >
            <div className="bg-[#1a1f29] border-2 border-green-500 rounded-3xl p-6 shadow-2xl shadow-green-500/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-black shrink-0 animate-bounce">
                  <Skull size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-green-500 uppercase tracking-tighter leading-tight mb-1">
                    BOSS EM BREVE!
                  </h3>
                  <p className="text-sm text-gray-300 font-medium mb-4">
                    O boss <span className="text-white font-bold">{bossAlert.name}</span> entrará em janela base em menos de 5 minutos!
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedBossId(bossAlert.id);
                        setActiveTab('Boss');
                        setBossAlert(null);
                        stopAlertSound();
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-xl text-xs uppercase transition-all"
                    >
                      VER DETALHES
                    </button>
                    <button 
                      onClick={() => {
                        setBossAlert(null);
                        stopAlertSound();
                      }}
                      className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-2 rounded-xl text-xs uppercase transition-all"
                    >
                      FECHAR
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  <Volume2 size={12} className={isSoundEnabled ? "text-green-500 animate-pulse" : "text-gray-600"} />
                  {isSoundEnabled ? 'Alerta Sonoro Ativo' : 'Som Desativado'}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      stopAlertSound();
                    }}
                    className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    <VolumeX size={12} />
                    PARAR SOM
                  </button>
                  <button 
                    onClick={() => {
                      setIsSoundEnabled(!isSoundEnabled);
                      if (isSoundEnabled) stopAlertSound();
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    {isSoundEnabled ? 'DESLIGAR ALERTAS' : 'LIGAR ALERTAS'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}
