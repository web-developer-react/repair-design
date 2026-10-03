// Небольшие сценарии страницы: переключение имеющихся фотографий и честное сообщение формы без отправки личных данных.
"use strict";

// Галерея использует только фотографии, уже подключённые к настольной части того же макета Figma.
const gallery = document.querySelector(".mobile-gallery"); // Находит мобильную галерею; на промежуточных ширинах она тоже видна.
const galleryImage = gallery?.querySelector(".mobile-gallery__image"); // Основное изображение сохраняет заданные CSS пропорции при смене фото.
const galleryPhotos = [...document.querySelectorAll(".fantasies__gallery .fantasies__image")].map((image) => ({
  src: image.getAttribute("src"), // Берёт проверенный локальный PNG, а не временный адрес Figma.
  alt: image.alt, // Каждая фотография получает своё понятное текстовое описание.
}));

// Проверка элементов позволяет подключать файл безопасно даже при отсутствии галереи в другой странице проекта.
if (gallery && galleryImage && galleryPhotos.length > 1) {
  let photoIndex = 0; // Первое фото совпадает с начальным состоянием мобильного макета.
  let displayedIndex = 0; // Сохраняет номер последнего успешно показанного фото для восстановления после ошибки.
  let requestNumber = 0; // Номер запроса не даёт медленной загрузке заменить более новое выбранное фото.
  const status = document.createElement("span"); // Скрытый текст сообщает экранному диктору номер фотографии.
  status.className = "visually-hidden"; // Скрывает служебную подпись зрительно, сохраняя её доступной для чтения.
  status.setAttribute("aria-live", "polite"); // Сообщает смену фото после текущей речи диктора.
  status.setAttribute("aria-atomic", "true"); // Читает короткую подпись целиком.
  gallery.append(status); // Помещает подпись рядом с управляемым изображением.

  // Загружает выбранное фото перед заменой, сохраняя старое изображение при ошибке и исключая пустую вспышку.
  async function changePhoto(direction) {
    photoIndex = (photoIndex + direction + galleryPhotos.length) % galleryPhotos.length; // Замыкает список: после последнего фото снова идёт первое.
    const currentRequest = ++requestNumber; // Запоминает, какой выбор сейчас самый новый.
    const photo = galleryPhotos[photoIndex]; // Получает источник и описание выбранной фотографии.
    const preload = new Image(); // Загрузка заранее не меняет размер и содержимое видимой галереи.
    preload.src = photo.src; // Загружает исходный PNG целиком перед показом следующего фото.
    try {
      await preload.decode(); // Ждёт готового изображения, а не только начала сетевого запроса.
      if (currentRequest !== requestNumber) return; // Пропускает устаревший результат после быстрых повторных нажатий.
      galleryImage.src = photo.src; // Показывает готовый исходный PNG без дополнительного сжатия с потерей деталей.
      galleryImage.alt = photo.alt; // Меняет описание вместе с реальным содержимым изображения.
      displayedIndex = photoIndex; // Запоминает подтверждённое состояние после успешной загрузки.
      status.textContent = `Interior photo ${photoIndex + 1} of ${galleryPhotos.length}`; // Подтверждает выбор без изменения видимого макета.
    } catch {
      if (currentRequest === requestNumber) {
        photoIndex = displayedIndex; // Возвращает выбор к реально показанному фото, чтобы следующая попытка не перескакивала через кадр.
        status.textContent = "The photo could not be loaded. Please try again."; // Сообщает ошибку и оставляет последнее успешно загруженное фото.
      }
    }
  }

  gallery.querySelector(".mobile-gallery__control--previous")?.addEventListener("click", () => changePhoto(-1)); // Левая кнопка выбирает предыдущее фото.
  gallery.querySelector(".mobile-gallery__control--next")?.addEventListener("click", () => changePhoto(1)); // Правая кнопка выбирает следующее фото.
  gallery.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; // Не перехватывает Tab, Enter и другие клавиши.
    event.preventDefault(); // Убирает горизонтальную прокрутку при управлении стрелками в самой галерее.
    changePhoto(event.key === "ArrowLeft" ? -1 : 1); // Позволяет переключать фото клавишами при фокусе на кнопках галереи.
  });
}

// У статического учебного сайта нет подтверждённого обработчика заявок; нельзя показывать выдуманное успешное отправление.
document.querySelectorAll("form").forEach((form) => {
  form.setAttribute("method", "post"); // Даже без сценария значения не попадают в адрес страницы как параметры GET.
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Не отправляет личные данные на несуществующий обработчик и не перезагружает страницу.
    if (!form.reportValidity()) return; // Сохраняет штатную проверку обязательных полей и согласия браузером.
    let status = form.querySelector(".form-status"); // Повторная попытка обновляет одно сообщение, не создавая дубликаты.
    if (!status) {
      status = document.createElement("p"); // Добавляет сообщение только после реального действия пользователя.
      status.className = "form-status"; // Оформляет сообщение общими стилями всех форм.
      status.setAttribute("role", "status"); // Экранный диктор читает результат без принудительного перемещения фокуса.
      const phone = document.createElement("a"); // Даёт пользователю рабочий способ связаться по номеру из макета.
      phone.href = "tel:+79287683229"; // Использует существующий контакт, не придумывая адрес электронной почты.
      phone.textContent = "+7 (928) 768 32 29"; // Показывает номер, который уже находится в контактном блоке.
      status.append("Online requests are currently unavailable. Please call ", phone, "."); // Честно объясняет результат и сохраняет введённые данные.
      form.append(status); // Помещает сообщение рядом с формой, к которой оно относится.
    }
  });
});
