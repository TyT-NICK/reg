'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  EntryFormScreen,
  AlreadyRegisteredScreen,
  SlotSuggestionScreen,
  NoSlotsScreen,
  RegisteredSuccessScreen,
  RegisteredInfoScreen,
} from '@/components';
import { useLocalStorageValue } from '@react-hookz/web';
import { LOCAL_GN_PH_STORAGE, LocalGnPhStorage } from '@/constants';

enum Screen {
  Entry,
  AlreadyRegistered,
  SuggestSlot,
  NoSlots,
  RegistryInfo,
  Success,
}

interface AuthResponse {
  result: boolean;
  error: boolean;
  isReg: boolean;
  RegTime: string;
  FIO: string;
  GosNomer: string;
}

interface NextSlotResponse {
  RegTime: string;
}

interface QueueResponse {
  RegTime: string;
  error: string;
}

const MainComponent: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.Entry);
  const [garNum, setGarNum] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [regTime, setRegTime] = useState<string>('');
  const [FIO, setFIO] = useState<string>('');
  const [GosNomer, setGosNomer] = useState<string>('');

  const nextSlotQuery = useQuery<NextSlotResponse>({
    queryKey: ['nextSlot'],
    queryFn: () => axios.get<NextSlotResponse>('/api/next-slot').then((r) => r.data),
    enabled: false,
  });

  const { set } = useLocalStorageValue<LocalGnPhStorage>(LOCAL_GN_PH_STORAGE, { initializeWithValue: true });

  const authMutation = useMutation({
    mutationFn: ({ gn, ph }: { gn: string; ph: string }) =>
      axios.post<AuthResponse>('/api/auth', { garageNumber: gn, phone: ph }),
    onSuccess: async ({ data }, { gn, ph }) => {
      setGarNum(gn);
      setPhone(ph);

      setFIO(data.FIO);
      setGosNomer(data.GosNomer);

      set({ gn, ph });

      if (data.isReg) {
        setRegTime(data.RegTime);
        setScreen(Screen.AlreadyRegistered);
        return;
      }

      const nextAvailableSlot = await nextSlotQuery.refetch();

      if (nextAvailableSlot.data?.RegTime) {
        setRegTime(nextAvailableSlot.data.RegTime);
        setScreen(Screen.SuggestSlot);
      } else {
        toast.error('Нет доступного времени для записи.');
      }
    },
    onError: () => toast.error('Неверный гаражный номер или телефон'),
  });

  const queueMutation = useMutation({
    mutationFn: () => axios.post<QueueResponse>('/api/queue', { garNum, phone, regTime }),
    onSuccess: ({ data }) => {
      if (data.RegTime) {
        setScreen(Screen.RegistryInfo);
      }
    },
    onError: () => {
      toast.error('Время уже занято. Обновите страницу и попробуйте заново.');
      setScreen(Screen.Entry);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => axios.post<void>('/api/cancel', { garNum, phone }),
    onSuccess: () => {
      toast.success('Запись отменена.');
      setScreen(Screen.Entry);
    },
    onError: () => toast.error('Ошибка отмены записи.'),
  });

  const handleSubmit = (gn: string, ph: string) => {
    authMutation.mutate({ gn, ph });
  };

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const handleConfirmSlot = () => queueMutation.mutate();
  const handleRejectSlot = () => setScreen(Screen.Entry);
  const handleConfirmRegistry = () => setScreen(Screen.Success);

  return (
    <>
      {screen === Screen.Entry && <EntryFormScreen onSubmit={handleSubmit} />}
      {screen === Screen.AlreadyRegistered && (
        <AlreadyRegisteredScreen regTime={regTime} onOk={handleConfirmRegistry} onCancel={handleCancel} />
      )}
      {screen === Screen.SuggestSlot && (
        <SlotSuggestionScreen nextTime={regTime} onConfirm={handleConfirmSlot} onReject={handleRejectSlot} />
      )}
      {screen === Screen.NoSlots && <NoSlotsScreen onBack={handleRejectSlot} />}
      {screen === Screen.RegistryInfo && (
        <RegisteredInfoScreen
          FIO={FIO}
          regTime={regTime}
          GosNomer={GosNomer}
          onOk={handleConfirmRegistry}
          onCancel={handleCancel}
        />
      )}
      {screen === Screen.Success && <RegisteredSuccessScreen regTime={regTime} />}
      <ToastContainer position="bottom-center" />
    </>
  );
};

const queryClient = new QueryClient();

const WrappedApp: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <MainComponent />
  </QueryClientProvider>
);

export default WrappedApp;
