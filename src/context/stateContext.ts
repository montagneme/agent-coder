import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GlobalState {
  states: Record<string, any>;
  setState: (key: string, value: any) => void;
  getState: (key: string) => any;
  removeState: (key: string) => void;
  setStates: (states: Record<string, any>) => void;
}

// 创建 store
export const useGlobalStore = create<GlobalState>()(
  subscribeWithSelector((set, get) => ({
    states: {},
    setState: (key, value) => set((state) => ({
      states: {
        ...state.states,
        [key]: value
      }
    })),
    getState: (key) => get().states[key],
    removeState: (key) => set((state) => {
      const { [key]: _, ...rest } = state.states;
      return { states: rest };
    }),
    setStates: (newStates) => set((state) => ({
      states: {
        ...state.states,
        ...newStates
      }
    }))
  }))
);

// 自定义 hook 用于组件定义和获取状态
const useGlobalState = <T>(key: string, initialValue?: T) => {
  const state = useGlobalStore((state) => state.states[key]);
  const setState = useGlobalStore((state) => state.setState);
  
  // 如果状态不存在且提供了初始值，则设置初始值
  if (state === undefined && initialValue !== undefined) {
    setState(key, initialValue);
  }
  
  return [
    state !== undefined ? state : initialValue,
    (value: T) => setState(key, value)
  ];
};

export default useGlobalState