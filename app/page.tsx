'use client';

import React, { useState } from 'react';
import axios from 'axios';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
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
  Adress: string;
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

  const [address, setAddress] = useState<string>('');

  const { set } = useLocalStorageValue<LocalGnPhStorage>(LOCAL_GN_PH_STORAGE, {
    initializeWithValue: true,
  });

  const nextSlotQuery = useMutation({
    mutationKey: ['nextSlot'],
    mutationFn: ({ gn, ph }: { gn: string; ph: string }) =>
      axios.post<NextSlotResponse>('/api/next-slot', {
        garageNumber: gn,
        phone: ph,
      }),
  });

  const authMutation = useMutation({
    mutationFn: ({ gn, ph }: { gn: string; ph: string }) =>
      axios.post<AuthResponse>('/api/auth', { garageNumber: gn, phone: ph }),
  });

  const queueMutation = useMutation({
    mutationFn: () =>
      axios.post<QueueResponse>('/api/queue', { garNum, phone, regTime }),
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

  const handleSubmit = async (gn: string, ph: string) => {
    try {
      const authResponse = await authMutation.mutateAsync({ gn, ph });

      setGarNum(gn);
      setPhone(ph);

      setFIO(authResponse.data.FIO);
      setGosNomer(authResponse.data.GosNomer);
      setAddress(authResponse.data.Adress);
      set({ gn, ph });

      if (authResponse.data.isReg) {
        setRegTime(authResponse.data.RegTime);
        setScreen(Screen.AlreadyRegistered);
        return;
      }

      try {
        const slotResponse = await nextSlotQuery.mutateAsync({ gn, ph });

        if (slotResponse.data?.RegTime) {
          setRegTime(slotResponse.data.RegTime);
          setScreen(Screen.SuggestSlot);
        } else {
          toast.error('Нет доступного времени для записи.');
        }
      } catch {
        toast.error('Нет доступного времени для записи.');
      }
    } catch {
      toast.error('Неверный гаражный номер или телефон');
    }
  };

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const handleConfirmSlot = () => queueMutation.mutate();
  const handleRejectSlot = () => setScreen(Screen.Entry);
  const handleConfirmRegistry = () => setScreen(Screen.Success);

  return (
    <>
      {screen === Screen.Entry && (
        <EntryFormScreen
          onSubmit={handleSubmit}
          pending={authMutation.isPending || nextSlotQuery.isPending}
        />
      )}
      {screen === Screen.AlreadyRegistered && (
        <AlreadyRegisteredScreen
          regTime={regTime}
          onOk={handleConfirmRegistry}
          onCancel={handleCancel}
          address={address}
          pending={cancelMutation.isPending}
        />
      )}
      {screen === Screen.SuggestSlot && (
        <SlotSuggestionScreen
          nextTime={regTime}
          onConfirm={handleConfirmSlot}
          onReject={handleRejectSlot}
          address={address}
          pending={queueMutation.isPending}
        />
      )}
      {screen === Screen.NoSlots && <NoSlotsScreen onBack={handleRejectSlot} />}
      {screen === Screen.RegistryInfo && (
        <RegisteredInfoScreen
          FIO={FIO}
          regTime={regTime}
          GosNomer={GosNomer}
          onOk={handleConfirmRegistry}
          onCancel={handleCancel}
          address={address}
          pending={cancelMutation.isPending}
        />
      )}
      {screen === Screen.Success && (
        <RegisteredSuccessScreen regTime={regTime} address={address} />
      )}

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
