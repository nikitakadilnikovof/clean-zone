export async function getDataFromGoogleSheet() {
  const sheetId = "1wRMlY7WqFcINwx6lsdwyewMk9h7S0omlefl4q0l9HYs";
  const sheetName = "Лист1";

  // 👉 Берём конкретно ячейку D1
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&range=J1`;

  const res = await fetch(url);
  const text = await res.text();

  // 👉 Google возвращает не чистый JSON, нужно вырезать лишнее
  const json = JSON.parse(text.substring(47).slice(0, -2));

  // 👉 Достаём строку из D1
  const jsonString = json.table.rows[0].c[0].v;

  // 👉 Преобразуем в массив объектов
  const dataArray = JSON.parse(jsonString);
  console.log(dataArray)
  renderWorks(dataArray)
  //return dataArray;//
}


function renderWorks(data) {
  const container = document.querySelector(".works-grid");
  container.innerHTML = "";

  const lang = document.documentElement.lang || "en";

  const serviceLabel = {
    en: "Service",
    ru: "Услуга",
    es: "Servicio"
  };

  const isVideo = (url) => {
    return url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) || url.includes("video");
  };

  data.forEach(item => {
    if (!item.carModel || item.imgList.length === 0) return;

    const serviceMap = {
      ru: "serviceRu",
      en: "serviceEn",
      es: "serviceEs"
    };

    const key = serviceMap[lang] || "serviceEn";
    const serviceText = item[key] || item.serviceEn || "";

    const media = item.imgList.map(link => ({
      type: isVideo(link) ? "video" : "image",
      src: link
    }));

    const preview = media[0];
    const previewIsVideo = preview.type === "video";

    const card = document.createElement("article");
    card.className = "work-card";

    card.dataset.title = item.carModel;
    card.dataset.service = serviceText;
    card.dataset.media = JSON.stringify(media);

    // 🔥 превью
    let mediaHTML = "";

    if (previewIsVideo) {
      mediaHTML = `
        <video 
          src="${preview.src}" 
          class="work-preview-video"
          muted 
          preload="metadata"
          playsinline 
        ></video>
      `;
    } else {
      mediaHTML = `<img src="${preview.src}" alt="${item.carModel}">`;
    }

    card.innerHTML = `
      <div class="work-media">
        ${mediaHTML}
      </div>
      <div class="work-info">
        <h3>${item.carModel}</h3>
        <button type="button" class="work-open-btn" aria-label="Open gallery">
          <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
        </button>
        <p>${serviceLabel[lang] || serviceLabel.en}: ${serviceText}</p>
      </div>
    `;

    container.appendChild(card);
  });

  // 🔥 Гарантированно убираем звук у всех превью
  const videos = container.querySelectorAll("video");
  videos.forEach(video => {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
  });

  const previewVideos = container.querySelectorAll(".work-preview-video");
  previewVideos.forEach(video => {
    const setMiddleFrame = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const middleTime = Math.max(0.1, video.duration / 2);
      video.currentTime = middleTime;
    };

    const freezeFrame = () => {
      video.pause();
      video.currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    };

    if (video.readyState >= 1) {
      setMiddleFrame();
    } else {
      video.addEventListener("loadedmetadata", setMiddleFrame, { once: true });
    }

    video.addEventListener("seeked", freezeFrame, { once: true });
  });
}