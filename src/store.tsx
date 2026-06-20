import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, Material, SalesMethod, Settings, Work } from "./domain/types";
import { loadData, saveData } from "./domain/storage";
import { FREE_LIMITS } from "./domain/defaults";

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface StoreApi {
  data: AppData;
  // 材料
  addMaterial: (m: Omit<Material, "id" | "createdAt" | "updatedAt">) => Material | null;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  // 作品
  addWork: (w: Omit<Work, "id" | "createdAt" | "updatedAt">) => Work | null;
  updateWork: (id: string, patch: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  duplicateWork: (id: string) => Work | null;
  // 販売方法
  upsertSalesMethod: (m: SalesMethod) => void;
  deleteSalesMethod: (id: string) => void;
  // 設定
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  // 制限
  canAddMaterial: boolean;
  canAddWork: boolean;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  // 変更のたびに端末内へ自動保存（描画後にデバウンス的に）
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveData(data);
  }, [data]);

  const isPro = data.settings.isPro;

  const addMaterial = useCallback<StoreApi["addMaterial"]>(
    (m) => {
      let created: Material | null = null;
      setData((d) => {
        if (!d.settings.isPro && d.materials.length >= FREE_LIMITS.materials) return d;
        const now = Date.now();
        created = { ...m, id: uid(), createdAt: now, updatedAt: now };
        return { ...d, materials: [...d.materials, created] };
      });
      return created;
    },
    [],
  );

  const updateMaterial = useCallback<StoreApi["updateMaterial"]>((id, patch) => {
    setData((d) => ({
      ...d,
      materials: d.materials.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: Date.now() } : m)),
    }));
  }, []);

  const deleteMaterial = useCallback<StoreApi["deleteMaterial"]>((id) => {
    setData((d) => ({
      ...d,
      materials: d.materials.filter((m) => m.id !== id),
      // 作品からも当該材料の使用を取り除く
      works: d.works.map((w) => ({ ...w, materials: w.materials.filter((wm) => wm.materialId !== id) })),
    }));
  }, []);

  const addWork = useCallback<StoreApi["addWork"]>((w) => {
    let created: Work | null = null;
    setData((d) => {
      if (!d.settings.isPro && d.works.length >= FREE_LIMITS.works) return d;
      const now = Date.now();
      created = { ...w, id: uid(), createdAt: now, updatedAt: now };
      return { ...d, works: [...d.works, created] };
    });
    return created;
  }, []);

  const updateWork = useCallback<StoreApi["updateWork"]>((id, patch) => {
    setData((d) => ({
      ...d,
      works: d.works.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: Date.now() } : w)),
    }));
  }, []);

  const deleteWork = useCallback<StoreApi["deleteWork"]>((id) => {
    setData((d) => ({ ...d, works: d.works.filter((w) => w.id !== id) }));
  }, []);

  const duplicateWork = useCallback<StoreApi["duplicateWork"]>((id) => {
    let created: Work | null = null;
    setData((d) => {
      if (!d.settings.isPro && d.works.length >= FREE_LIMITS.works) return d;
      const src = d.works.find((w) => w.id === id);
      if (!src) return d;
      const now = Date.now();
      created = {
        ...src,
        id: uid(),
        name: src.name + "（複製）",
        materials: src.materials.map((m) => ({ ...m })),
        createdAt: now,
        updatedAt: now,
      };
      return { ...d, works: [...d.works, created] };
    });
    return created;
  }, []);

  const upsertSalesMethod = useCallback<StoreApi["upsertSalesMethod"]>((m) => {
    setData((d) => {
      const exists = d.salesMethods.some((x) => x.id === m.id);
      return {
        ...d,
        salesMethods: exists ? d.salesMethods.map((x) => (x.id === m.id ? m : x)) : [...d.salesMethods, m],
      };
    });
  }, []);

  const deleteSalesMethod = useCallback<StoreApi["deleteSalesMethod"]>((id) => {
    setData((d) => ({
      ...d,
      salesMethods: d.salesMethods.filter((m) => m.id !== id),
      works: d.works.map((w) => (w.salesMethodId === id ? { ...w, salesMethodId: null } : w)),
    }));
  }, []);

  const updateSettings = useCallback<StoreApi["updateSettings"]>((patch) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const replaceAll = useCallback<StoreApi["replaceAll"]>((next) => {
    setData(next);
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      data,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addWork,
      updateWork,
      deleteWork,
      duplicateWork,
      upsertSalesMethod,
      deleteSalesMethod,
      updateSettings,
      replaceAll,
      canAddMaterial: isPro || data.materials.length < FREE_LIMITS.materials,
      canAddWork: isPro || data.works.length < FREE_LIMITS.works,
    }),
    [
      data,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addWork,
      updateWork,
      deleteWork,
      duplicateWork,
      upsertSalesMethod,
      deleteSalesMethod,
      updateSettings,
      replaceAll,
      isPro,
    ],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
