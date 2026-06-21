import { useMemo } from "react";

import type { ElectronBridge } from "../types/electron";

export interface ElectronDetection {
  isDesktop: boolean;
  bridge: ElectronBridge | null;
}

export const detectElectronBridge = (windowObj: Window & { electron?: ElectronBridge }): ElectronDetection => {
  const bridge = windowObj.electron ?? null;
  const isDesktop = typeof bridge === "object" && bridge !== null;
  return { isDesktop, bridge: isDesktop ? bridge : null };
};

export const useElectron = (): ElectronDetection => {
  return useMemo(() => detectElectronBridge(window), []);
};
