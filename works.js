export async function getDataFromGoogleSheet() {
  const sheetId = "1wRMlY7WqFcINwx6lsdwyewMk9h7S0omlefl4q0l9HYs";
  const sheetName = "Лист1";

  // 👉 Берём конкретно ячейку D1
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&range=D1`;

  const res = await fetch(url);
  const text = await res.text();

  // 👉 Google возвращает не чистый JSON, нужно вырезать лишнее
  const json = JSON.parse(text.substring(47).slice(0, -2));

  // 👉 Достаём строку из D1
  const jsonString = json.table.rows[0].c[0].v;

  // 👉 Преобразуем в массив объектов
  const dataArray = JSON.parse(jsonString);
  renderWorks(dataArray)
  //return dataArray;//
}


function renderWorks(data) {
  const container = document.querySelector(".works-grid");

  // очищаем перед рендером
  container.innerHTML = "";

  data.forEach(item => {
    // 👉 пропускаем пустые записи
    if (!item.carModel || !item.service || item.imgList.length === 0) return;

    // 👉 формируем data-media (все изображения)
    const media = item.imgList.map(link => ({
      type: "image",
      src: link
    }));

    // 👉 первая картинка как превью
    const preview = item.imgList[0];

    const card = document.createElement("article");
    card.className = "work-card";

    card.setAttribute("data-title", item.carModel);
    card.setAttribute("data-service", item.service);
    card.setAttribute("data-media", JSON.stringify(media));

    card.innerHTML = `
      <div class="work-media">
        <img src="${preview}" alt="${item.carModel}">
      </div>
      <div class="work-info">
        <h3>${item.carModel}</h3>
        <button type="button" class="work-open-btn" aria-label="Открыть галерею работы">
          <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
        </button>
        <p>Услуга: ${item.service}</p>
      </div>
    `;

    container.appendChild(card);
  });
}