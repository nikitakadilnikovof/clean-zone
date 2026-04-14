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

  // 👉 более надёжная проверка видео
  const isVideo = (url) => {
    return url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) || url.includes("video");
  };

  data.forEach(item => {
    if (!item.carModel || item.imgList.length === 0) return;

    // 👉 язык
    const serviceMap = {
      ru: "serviceRu",
      en: "serviceEn",
      es: "serviceEs"
    };

    const key = serviceMap[lang] || "serviceEn";
    const serviceText = item[key] || item.serviceEn || "";

    // 👉 формируем media
    const media = item.imgList.map(link => ({
      type: isVideo(link) ? "video" : "image",
      src: link
    }));

    const preview = item.imgList[0];
    const previewIsVideo = isVideo(preview);

    const card = document.createElement("article");
    card.className = "work-card";

    card.setAttribute("data-title", item.carModel);
    card.setAttribute("data-service", serviceText);
    card.setAttribute("data-media", JSON.stringify(media));

    // 👉 превью (видео или картинка)
    const mediaHTML = previewIsVideo
      ? `<video src="${preview}" muted playsinline autoplay loop></video>`
      : `<img src="${preview}" alt="${item.carModel}">`;

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
}