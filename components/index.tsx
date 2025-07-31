import React, { useEffect, useState } from 'react';
import styles from './WebScreens.module.css';
import { useLocalStorageValue } from '@react-hookz/web';
import { LOCAL_GN_PH_STORAGE, LocalGnPhStorage } from '@/constants';
import dayjs from 'dayjs';

import 'dayjs/locale/ru';

dayjs.locale('ru');

// 1. Экран входа
export const EntryFormScreen: React.FC<{ onSubmit: (garNum: string, phone: string) => void }> = ({ onSubmit }) => {
  const [garNum, setGarNum] = useState('');
  const [phone, setPhone] = useState('');

  const { value: initialValues } = useLocalStorageValue<LocalGnPhStorage>(LOCAL_GN_PH_STORAGE, {
    initializeWithValue: true,
  });

  useEffect(() => {
    if (!initialValues) return;

    setGarNum(initialValues.gn);
    setPhone(initialValues.ph);
  }, [initialValues]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Запись на заправку</h1>
      <p className={styles.subtitle}>Адрес: Иркутск, Покрышкина, 74</p>

      <label className={styles.label}>
        Гаражный номер
        <input type="text" value={garNum} onChange={(e) => setGarNum(e.target.value)} className={styles.input} />
      </label>

      <label className={styles.label}>
        Ваш телефон
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} />
      </label>

      <button className={styles.button} onClick={() => onSubmit(garNum, phone)}>
        Подтвердить
      </button>
    </div>
  );
};

// 2. Экран, если запись уже есть
export const AlreadyRegisteredScreen: React.FC<{ regTime: string; onOk: () => void; onCancel: () => void }> = ({
  regTime,
  onOk,
  onCancel,
}) => {
  const datetime = dayjs(regTime);

  return (
    <div className={styles.centered}>
      <h1 className={styles.title}>Вы уже записаны на</h1>

      <p className={styles.time}>{datetime.format('DD MMMM')}</p>
      <p className={styles.time}>{datetime.format('HH:mm')}</p>

      <div className={styles.actions}>
        <button className={styles.button} onClick={onOk}>
          OK
        </button>
        <button className={styles.buttonSecondary} onClick={onCancel}>
          Отменить запись
        </button>
      </div>
    </div>
  );
};

// 3. Экран выбора слота
export const SlotSuggestionScreen: React.FC<{ nextTime: string; onConfirm: () => void; onReject: () => void }> = ({
  nextTime,
  onConfirm,
  onReject,
}) => {
  const datetime = dayjs(nextTime);

  return (
    <div className={styles.centered}>
      <h1 className={styles.title}>Заезд строго по времени!</h1>
      <p>Доступное время:</p>
      <p className={styles.time}>{datetime.format('DD MMMM')}</p>
      <p className={styles.time}>{datetime.format('HH:mm')}</p>
      <div className={styles.actions}>
        <button className={styles.button} onClick={onConfirm}>
          Записаться
        </button>
        <button className={styles.buttonSecondary} onClick={onReject}>
          Нет, запишусь позже
        </button>
      </div>
    </div>
  );
};

// 4. Экран при отсутствии слотов
export const NoSlotsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className={styles.centered}>
    <p>Нет доступной записи, попробуйте позже</p>
    <button className={styles.button} onClick={onBack}>
      Вернуться
    </button>
  </div>
);

// 6. Экран информации о записи
export const RegisteredInfoScreen: React.FC<{
  regTime: string;
  FIO: string;
  GosNomer: string;
  onOk: VoidFunction;
  onCancel: VoidFunction;
}> = ({ regTime, FIO, GosNomer, onCancel, onOk }) => {
  const datetime = dayjs(regTime);

  return (
    <div className={styles.centered}>
      <h1 className={styles.title}>Вы записаны</h1>

      <p className={styles.time}>Дата: {datetime.format('DD MMMM')}</p>
      <p className={styles.time}>Время: {datetime.format('HH:mm')}</p>
      <p className={styles.time}>ГосНомер: {GosNomer}</p>
      <p className={styles.time}>Водитель: {FIO}</p>

      <div className={styles.actions}>
        <button className={styles.button} onClick={onOk}>
          OK
        </button>
        <button className={styles.buttonSecondary} onClick={onCancel}>
          Отменить запись
        </button>
      </div>
    </div>
  );
};

// 6. Экран успешной записи
export const RegisteredSuccessScreen: React.FC<{ regTime: string }> = ({ regTime }) => {
  const datetime = dayjs(regTime);

  return (
    <div className={styles.centered}>
      <h1 className={styles.title}>
        Ждём вас {datetime.format('DD MMMM')} в {datetime.format('HH:mm')}
      </h1>
      <p className={styles.subtitle}>Адрес: Иркутск, Покрышкина, 74</p>
    </div>
  );
};
