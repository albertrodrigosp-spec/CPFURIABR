export interface EquipmentItem {
  name: string;
  grade: 'D' | 'C' | 'B' | '';
}

export interface Equipment {
  helmet?: EquipmentItem;
  armor?: EquipmentItem;
  pants?: EquipmentItem;
  boots?: EquipmentItem;
  gloves?: EquipmentItem;
  weapon?: EquipmentItem;
  shield?: EquipmentItem;
  necklace?: EquipmentItem;
  earring1?: EquipmentItem;
  earring2?: EquipmentItem;
  ring1?: EquipmentItem;
  ring2?: EquipmentItem;
  cloak?: EquipmentItem;
  ears?: EquipmentItem;
}

export interface Character {
  id: string;
  name?: string;
  imageUrl?: string;
  class?: string;
  level?: string;
  notes?: string;
  equipment?: Equipment;
}

export interface Player {
  id: string;
  name: string;
  imageUrl?: string;
  characterImageUrl?: string;
  class?: string;
  level?: string;
  notes?: string;
  equipment?: Equipment;
  characters?: Character[];
  password?: string;
  dkpPoints?: number;
}

export interface LootItem {
  id: string;
  name: string;
  price: number;
}

export interface CraftMaterial {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  playerId: string;
}

export interface RecipeMaterial {
  name: string;
  quantity: string;
}

export interface Contribution {
  name: string;
  quantity: string;
  unitValue: string;
}

export interface Sale {
  id: string;
  itemName: string;
  salePrice: number;
  sellerName: string;
  status: 'pending' | 'sold';
  createdAt: number;
  isVendaConcluida: boolean;
  payments: { [playerName: string]: boolean };
  contributions: { [playerName: string]: Contribution[] };
  allPlayerNames: string[];
  materials: RecipeMaterial[];
  recipeQuantity: string;
}

export interface HistoryEntry {
  id: string;
  recipeName: string;
  recipeQuantity: string;
  materials: RecipeMaterial[];
  contributions: { [playerName: string]: Contribution[] };
  allPlayerNames?: string[];
  timestamp: number;
  totalValue?: number;
  payoutPerPlayer?: number;
  sellerName?: string;
  isSold?: boolean;
  payments?: { [playerName: string]: boolean };
  isVendaConcluida?: boolean;
  isFailed?: boolean;
  totalLoss?: number;
}

export interface Item {
  id: string;
  name: string;
  unitValue: number;
  category: string;
  imageUrl?: string;
  requiredMaterials?: { name: string; quantity: string }[];
}

export interface SiegeEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  castle: string;
  description?: string;
  attendance: { [playerId: string]: boolean };
  absences?: { [playerId: string]: string }; // playerId -> justification
  createdAt: number;
}

export interface BossEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  bossName: string;
  description?: string;
  attendance: { [playerId: string]: boolean };
  absences?: { [playerId: string]: string }; // playerId -> justification
  createdAt: number;
}

export interface CPNotification {
  id: string;
  type: 'siege' | 'boss' | 'info';
  message: string;
  timestamp: number;
  readBy: string[];
  isManual?: boolean;
}

export interface CPState {
  players: Player[];
  loot: LootItem[];
  craft: CraftMaterial[]; // Keep for legacy/financials if needed, but we'll focus on contributions
  craftSlots: (string | null)[]; // Array of 9 player IDs or null
  recipe: RecipeMaterial[]; // Array of 12 materials
  recipeName: string;
  recipeQuantity: string;
  contributions: { [slotIndex: number]: Contribution[] }; // 12 contributions per slot
  sales: Sale[];
  history: HistoryEntry[];
  items: Item[];
  guestPlayers: string[];
  lotteryHistory?: LotteryDraw[];
  warehouseItems?: WarehouseItem[];
  siegeEvents?: SiegeEvent[];
  bossEvents?: BossEvent[];
  notifications?: CPNotification[];
  currentUser?: Player | null;
  clanLogoUrl?: string;
  tributes?: Tribute[];
  fines?: Fine[];
  bosses?: Boss[];
  dkpHistory?: DKPHistoryEntry[];
}

export interface Boss {
  id: string;
  name: string;
  level: number;
  category: string;
  lastDeath?: number;
  killedBy?: string;
  location?: string;
}

export interface Tribute {
  id: string;
  playerName: string;
  amount: number;
  description: string;
  date: number;
  status: 'pending' | 'paid';
}

export interface Fine {
  id: string;
  playerName: string;
  amount: number;
  reason: string;
  date: number;
  status: 'pending' | 'paid';
  eventId?: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  imageUrl?: string;
}

export interface LotteryDraw {
  id: string;
  winner: string;
  prize: string;
  timestamp: number;
}

export interface DKPHistoryEntry {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  reason: string;
  timestamp: number;
  createdBy: string;
}
