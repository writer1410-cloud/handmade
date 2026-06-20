// アプリ全体のデータモデル。すべて端末内（localStorage）に保存する。

/** 材料：まとめ買いした購入情報から「単位原価」を導出する。 */
export interface Material {
  id: string;
  name: string;
  /** 購入価格（税込・円） */
  purchasePrice: number;
  /** 購入量（個数・g・cm など unit に対応する数量） */
  purchaseQty: number;
  /** 単位（個・g・cm・m・枚 など） */
  unit: string;
  /** 購入時にかかった送料（円）。単位原価に按分する。 */
  purchaseShipping: number;
  /**
   * 取れる数：この購入1セットから作れる完成品の個数（取り都合）。
   * 例：フェルト1枚(¥500)から商品が10個作れる場合は 10。
   * 0 または未設定なら通常の「購入量あたり」の単位原価で計算する。
   * 設定されている場合、使用単位は「個分」になる。
   */
  yieldCount?: number;
  createdAt: number;
  updatedAt: number;
}

/** 作品で使用する材料の明細 */
export interface WorkMaterial {
  materialId: string;
  /** 使用量（材料の unit に対応） */
  qty: number;
}

/** 作品（販売する1点） */
export interface Work {
  id: string;
  name: string;
  materials: WorkMaterial[];
  /** 制作時間（分） */
  productionMinutes: number;
  /** 梱包費（円） */
  packagingCost: number;
  /** その他経費（円）：タグ・ラッピング・design使用料など */
  otherCost: number;
  /** 想定販売価格（円）。価格シミュレーションの初期値。 */
  price: number;
  /** 紐づく販売方法ID（手数料・送料負担の計算に使用） */
  salesMethodId: string | null;
  createdAt: number;
  updatedAt: number;
}

/** 販売方法（オンライン／対面／委託／オーダー）。手数料は固定せずユーザー編集可能。 */
export interface SalesMethod {
  id: string;
  name: string;
  /** 販売手数料率（％） 例: minne/Creema 等 */
  feePercent: number;
  /** 固定手数料（円） 例: 振込手数料・出店料の按分 */
  fixedFee: number;
  /** 委託料率（％）：委託販売の取り分。0なら無し。 */
  consignmentPercent: number;
  /** 送料の自己負担額（円）。送料無料販売で作家が負担する分。 */
  shippingBurden: number;
  /** 削除不可の組み込みテンプレートか */
  builtin?: boolean;
}

export interface Settings {
  /** 目標時給（円/時） */
  targetHourlyWage: number;
  /** 標準梱包費（円）：新規作品の初期値 */
  standardPackagingCost: number;
  /** Pro（有料）会員フラグ。実際はPlay Billingで更新する。 */
  isPro: boolean;
}

export interface AppData {
  version: number;
  materials: Material[];
  works: Work[];
  salesMethods: SalesMethod[];
  settings: Settings;
}
