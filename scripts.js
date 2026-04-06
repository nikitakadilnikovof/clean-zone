import { getDataFromGoogleSheet } from "./works.js"
document.addEventListener('DOMContentLoaded', () => {
  getDataFromGoogleSheet()
  const items = Array.from(document.querySelectorAll('.nav-item'));
  const supportsHover = window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches === true;
  const header = document.querySelector('.header');

  const setOpen = (item, open) => {
    const btn = item.querySelector('button');
    item.classList.toggle('open', open);
    btn?.setAttribute('aria-expanded', String(open));
  };

  const closeAll = (except = null) => {
    for (const it of items) {
      if (it !== except) setOpen(it, false);
    }
  };

  for (const item of items) {
    const btn = item.querySelector('button');
    if (!btn) continue;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = !item.classList.contains('open');
      closeAll(item);
      setOpen(item, next);
    });

    if (supportsHover) {
      item.addEventListener('click', () => setOpen(item));
    }
  }

  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // Точный скролл к секциям с учетом фиксированного хедера.
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      closeAll();

      const headerRect = header?.getBoundingClientRect();
      const headerHeight = headerRect?.height ?? 0;
      const headerTop = Math.max(0, headerRect?.top ?? 0);
      const headerTopGap = 8; // небольшой запас под тень/отступ
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const top = Math.max(0, Math.round(targetTop - headerHeight - headerTop - headerTopGap));

      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  const TELEGRAM_BOT_TOKEN = '8740861663:AAHhFUpiq8Y9kqWKtizYOGJEXN4gBySWDbo';
  const TELEGRAM_CHAT_ID = '-5249471437';
  const REQUESTS_STORAGE_KEY = 'clean_zone_requests';

  const pageLang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  const FORM_I18N = {
    ru: {
      extraService: 'Доп услуга',
      fillFields: 'Заполните все поля формы.',
      businessHours: 'Выберите время с 06:00 до 21:00.',
      futureTime: 'Выберите работающее время: с 06:00 до 21:00 и не раньше текущего момента.',
      sending: 'Отправляем заявку...',
      sentOk: 'Заявка отправлена в Telegram.',
      sentFail: 'Не удалось отправить в Telegram. Данные сохранены локально для теста.',
      tgTitle: 'Новая заявка с сайта Clean Zone',
      tgPhone: 'Телефон',
      tgDate: 'Дата',
      tgTime: 'Время',
      tgService: 'Услуга',
      tgExtras: 'Доп. услуги',
      tgExtrasNone: 'нет'
    },
    en: {
      extraService: 'Add-on service',
      fillFields: 'Please fill in all fields.',
      businessHours: 'Choose a time between 6:00 AM and 9:00 PM.',
      futureTime: 'Choose a future appointment within business hours (6:00 AM – 9:00 PM).',
      sending: 'Sending your request...',
      sentOk: 'Request sent to Telegram.',
      sentFail: 'Could not send to Telegram. Data saved locally for testing.',
      tgTitle: 'New request from Clean Zone website',
      tgPhone: 'Phone',
      tgDate: 'Date',
      tgTime: 'Time',
      tgService: 'Service',
      tgExtras: 'Add-on services',
      tgExtrasNone: 'none'
    },
    es: {
      extraService: 'Servicio adicional',
      fillFields: 'Complete todos los campos.',
      businessHours: 'Elija una hora entre las 6:00 y las 21:00.',
      futureTime: 'Elija fecha y hora futuras dentro del horario (6:00 – 21:00).',
      sending: 'Enviando solicitud...',
      sentOk: 'Solicitud enviada a Telegram.',
      sentFail: 'No se pudo enviar a Telegram. Los datos se guardaron localmente para pruebas.',
      tgTitle: 'Nueva solicitud desde el sitio Clean Zone',
      tgPhone: 'Teléfono',
      tgDate: 'Fecha',
      tgTime: 'Hora',
      tgService: 'Servicio',
      tgExtras: 'Servicios adicionales',
      tgExtrasNone: 'ninguno'
    }
  };
  const tf = (key) => FORM_I18N[pageLang]?.[key] ?? FORM_I18N.ru[key];

  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    const dateInput = contactForm.querySelector('input[name="date"]');
    const timeInput = contactForm.querySelector('input[name="time"]');
    const serviceSelect = contactForm.querySelector('.service-main-select');
    const addServiceBtn = contactForm.querySelector('.add-service-btn');
    const extraServicesEl = contactForm.querySelector('.extra-services');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const statusEl = document.createElement('p');
    statusEl.className = 'form-status';
    statusEl.setAttribute('aria-live', 'polite');
    contactForm.append(statusEl);

    const setStatus = (text, isError = false) => {
      statusEl.textContent = text;
      statusEl.classList.toggle('error', isError);
      statusEl.classList.toggle('success', !isError && text.length > 0);
    };

    const saveRequestLocally = (request) => {
      const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push(request);
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(list));
    };

    const formatDateInputValue = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const pad2 = (n) => String(n).padStart(2, '0');

    const formatTimeFromDate = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

    const timeStrToMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const BUSINESS_START = '06:00';
    const BUSINESS_END = '21:00';

    const isTimeInBusinessHours = (timeStr) => {
      const mins = timeStrToMinutes(timeStr);
      return mins >= 6 * 60 && mins <= 21 * 60;
    };

    const getTodayStr = () => formatDateInputValue(new Date());

    const syncDateTimeConstraints = () => {
      if (!dateInput || !timeInput) return;

      const todayStr = getTodayStr();
      dateInput.min = todayStr;

      let dateVal = dateInput.value;
      if (!dateVal || dateVal < todayStr) {
        dateVal = todayStr;
        dateInput.value = dateVal;
      }

      const now = new Date();
      const endToday = new Date();
      endToday.setHours(21, 0, 0, 0);

      if (dateVal === todayStr && now >= endToday) {
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        dateVal = formatDateInputValue(tmr);
        dateInput.value = dateVal;
      }

      timeInput.max = BUSINESS_END;

      if (dateVal === todayStr) {
        const startToday = new Date();
        startToday.setHours(6, 0, 0, 0);
        let earliest = new Date(now.getTime() + 5 * 60000);
        if (earliest < startToday) earliest = startToday;
        const endSlot = new Date();
        endSlot.setHours(21, 0, 0, 0);
        if (earliest > endSlot) {
          const tmr = new Date();
          tmr.setDate(tmr.getDate() + 1);
          dateVal = formatDateInputValue(tmr);
          dateInput.value = dateVal;
          timeInput.min = BUSINESS_START;
        } else {
          timeInput.min = formatTimeFromDate(earliest);
        }
      }

      if (dateVal !== todayStr) {
        timeInput.min = BUSINESS_START;
      }

      if (!timeInput.value || timeInput.value < timeInput.min) {
        timeInput.value = timeInput.min;
      }
      if (timeInput.value > timeInput.max) {
        timeInput.value = timeInput.max;
      }
    };

    const enforceTimeInWindow = () => {
      if (!timeInput?.value) return;
      const lo = timeStrToMinutes(timeInput.min || BUSINESS_START);
      const hi = timeStrToMinutes(timeInput.max || BUSINESS_END);
      let m = timeStrToMinutes(timeInput.value);
      if (Number.isNaN(m)) return;
      if (m < lo) m = lo;
      if (m > hi) m = hi;
      timeInput.value = `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
    };

    const onTimeFieldUpdate = () => {
      syncDateTimeConstraints();
      enforceTimeInWindow();
    };

    syncDateTimeConstraints();
    enforceTimeInWindow();
    dateInput?.addEventListener('change', syncDateTimeConstraints);
    dateInput?.addEventListener('input', syncDateTimeConstraints);
    timeInput?.addEventListener('focus', onTimeFieldUpdate);
    timeInput?.addEventListener('change', onTimeFieldUpdate);
    timeInput?.addEventListener('input', onTimeFieldUpdate);
    timeInput?.addEventListener('blur', enforceTimeInWindow);

    const allServiceOptions = Array.from(serviceSelect?.options ?? [])
      .filter((opt) => opt.value)
      .map((opt) => ({ value: opt.value, label: opt.textContent?.trim() || opt.value }));

    const getAdditionalSelects = () => Array.from(contactForm.querySelectorAll('select[name="extraService[]"]'));

    const getSelectedValues = () => {
      const values = new Set();
      if (serviceSelect?.value) values.add(serviceSelect.value);
      for (const select of getAdditionalSelects()) {
        if (select.value) values.add(select.value);
      }
      return values;
    };

    const buildServiceOptions = (currentValue = '') => {
      const selected = getSelectedValues();
      if (currentValue) selected.delete(currentValue);
      return allServiceOptions.filter((opt) => !selected.has(opt.value));
    };

    const refreshAddServiceButton = () => {
      if (!addServiceBtn || !serviceSelect) return;
      const canShow = Boolean(serviceSelect.value);
      const availableCount = buildServiceOptions().length;
      addServiceBtn.classList.toggle('visible', canShow);
      addServiceBtn.disabled = !canShow || availableCount === 0;
    };

    const refreshAdditionalSelects = () => {
      for (const select of getAdditionalSelects()) {
        const currentValue = select.value;
        const options = buildServiceOptions(currentValue);
        select.innerHTML = '';

        for (const option of options) {
          const optEl = document.createElement('option');
          optEl.value = option.value;
          optEl.textContent = option.label;
          select.append(optEl);
        }

        if (options.some((opt) => opt.value === currentValue)) {
          select.value = currentValue;
        } else if (options[0]) {
          select.value = options[0].value;
        } else {
          select.closest('.extra-service-row')?.remove();
        }
      }

      refreshAddServiceButton();
    };

    const createExtraServiceRow = () => {
      if (!extraServicesEl) return;

      const row = document.createElement('div');
      row.className = 'extra-service-row';

      const label = document.createElement('label');
      label.className = 'form-field';
      const title = document.createElement('span');
      title.textContent = tf('extraService');
      const select = document.createElement('select');
      select.name = 'extraService[]';

      label.append(title, select);
      row.append(label);
      extraServicesEl.append(row);

      select.addEventListener('change', refreshAdditionalSelects);
      refreshAdditionalSelects();
    };

    serviceSelect?.addEventListener('change', () => {
      refreshAdditionalSelects();
      refreshAddServiceButton();
    });

    addServiceBtn?.addEventListener('click', () => {
      if (buildServiceOptions().length === 0) return;
      createExtraServiceRow();
    });

    refreshAddServiceButton();

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      syncDateTimeConstraints();
      enforceTimeInWindow();
      const formData = new FormData(contactForm);

      const phone = String(formData.get('phone') ?? '').trim();
      const date = String(formData.get('date') ?? '').trim();
      const time = String(timeInput?.value ?? formData.get('time') ?? '').trim();
      const service = String(formData.get('service') ?? '').trim();
      const serviceLabel = contactForm.querySelector('select[name="service"] option:checked')?.textContent?.trim() || service;
      const extraServices = getAdditionalSelects()
        .map((select) => select.options[select.selectedIndex])
        .filter(Boolean)
        .map((opt) => ({ value: opt.value, label: opt.textContent?.trim() || opt.value }));

      if (!phone || !date || !time || !service) {
        setStatus(tf('fillFields'), true);
        return;
      }

      if (!isTimeInBusinessHours(time)) {
        setStatus(tf('businessHours'), true);
        return;
      }

      const selectedDateTime = new Date(`${date}T${time}`);
      if (Number.isNaN(selectedDateTime.getTime()) || selectedDateTime <= new Date()) {
        setStatus(tf('futureTime'), true);
        return;
      }

      const requestPayload = {
        phone,
        date,
        time,
        service,
        serviceLabel,
        extraServices,
        createdAt: new Date().toISOString()
      };

      saveRequestLocally(requestPayload);

      if (submitButton) submitButton.disabled = true;
      setStatus(tf('sending'));

      try {
        const extrasLine = extraServices.length
          ? extraServices.map((item) => item.label).join(', ')
          : tf('tgExtrasNone');
        const message = [
          tf('tgTitle'),
          `${tf('tgPhone')}: ${phone}`,
          `${tf('tgDate')}: ${date}`,
          `${tf('tgTime')}: ${time}`,
          `${tf('tgService')}: ${serviceLabel}`,
          `${tf('tgExtras')}: ${extrasLine}`
        ].join('\n');

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message
          })
        });

        if (!response.ok) {
          throw new Error(`Telegram API error: ${response.status}`);
        }

        setStatus(tf('sentOk'));
        contactForm.reset();
        if (extraServicesEl) extraServicesEl.innerHTML = '';
        syncDateTimeConstraints();
        refreshAddServiceButton();
      } catch (error) {
        console.error(error);
        setStatus(tf('sentFail'), true);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  const workModal = document.getElementById('workModal');
  const modalContent = workModal?.querySelector('.work-modal-content');
  const closeBtn = workModal?.querySelector('.work-modal-close');
  const prevBtn = workModal?.querySelector('.work-modal-nav.prev');
  const nextBtn = workModal?.querySelector('.work-modal-nav.next');
  const worksGrid = document.querySelector('.works-grid');

  let currentMedia = [];
  let currentIndex = 0;

  const renderMedia = () => {
    if (!modalContent || currentMedia.length === 0) return;
    const item = currentMedia[currentIndex];
    const isVideo = item.type === 'video';

    modalContent.innerHTML = '';
    if (isVideo) {
      const video = document.createElement('video');
      video.src = item.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      modalContent.append(video);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = 'Фото выполненной работы';
      modalContent.append(img);
    }
  };

  const setModalState = (open) => {
    if (!workModal) return;
    workModal.classList.toggle('open', open);
    workModal.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  const openModal = (media) => {
    if (!Array.isArray(media) || media.length === 0) return;
    currentMedia = media;
    currentIndex = 0;
    renderMedia();
    setModalState(true);
  };

  const closeModal = () => setModalState(false);

  const showPrev = () => {
    if (currentMedia.length < 2) return;
    currentIndex = (currentIndex - 1 + currentMedia.length) % currentMedia.length;
    renderMedia();
  };

  const showNext = () => {
    if (currentMedia.length < 2) return;
    currentIndex = (currentIndex + 1) % currentMedia.length;
    renderMedia();
  };

  const parseCardMedia = (card) => {
    if (!card) return [];
    const raw = card.dataset.media || card.getAttribute('data-images') || '';
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          if (typeof item === 'string') return { type: 'image', src: item };
          if (item && typeof item === 'object' && item.src) {
            return { type: item.type === 'video' ? 'video' : 'image', src: item.src };
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Некорректный формат media у карточки:', error);
      return [];
    }
  };

  const setCardMediaRatio = (card) => {
    const mediaBox = card?.querySelector('.work-media');
    const firstImage = mediaBox?.querySelector('img');
    if (!mediaBox || !firstImage) return;

    const applyRatio = () => {
      if (!firstImage.naturalWidth || !firstImage.naturalHeight) return;
      mediaBox.style.setProperty('--work-ratio', String(firstImage.naturalWidth / firstImage.naturalHeight));
    };

    if (firstImage.complete) applyRatio();
    else firstImage.addEventListener('load', applyRatio, { once: true });
  };

  const initExistingCards = () => {
    for (const card of document.querySelectorAll('.work-card')) {
      setCardMediaRatio(card);
    }
  };

  initExistingCards();

  worksGrid?.addEventListener('click', (e) => {
    const trigger = e.target.closest('.work-open-btn, .work-media');
    if (!trigger) return;
    const card = trigger.closest('.work-card');
    const media = parseCardMedia(card);
    if (media.length === 0) return;
    openModal(media);
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('.work-card')) setCardMediaRatio(node);
        for (const card of node.querySelectorAll?.('.work-card') || []) {
          setCardMediaRatio(card);
        }
      }
    }
  });
  if (worksGrid) observer.observe(worksGrid, { childList: true, subtree: true });

  closeBtn?.addEventListener('click', closeModal);
  prevBtn?.addEventListener('click', showPrev);
  nextBtn?.addEventListener('click', showNext);

  workModal?.addEventListener('click', (e) => {
    if (e.target === workModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!workModal?.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
});
