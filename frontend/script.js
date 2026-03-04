// --- ТЕМА ---
const body = document.body;
if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-theme");
}

document.getElementById("themeToggle").addEventListener("click", () => {
  body.classList.toggle("light-theme");
  localStorage.setItem(
    "theme",
    body.classList.contains("light-theme") ? "light" : "dark",
  );
});

// --- ЕЛЕМЕНТИ ---
const textarea = document.getElementById("mainText");
const backdrop = document.getElementById("backdrop");
const searchWidget = document.getElementById("searchWidget");
const findInput = document.getElementById("findInput");

let matches = [];
let currentIndex = -1;

// --- ДІЇ КНОПОК ПАНЕЛІ ІНСТРУМЕНТІВ ---
// Копіювати
document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(textarea.value);
});

// Вставити
document.getElementById("pasteBtn").addEventListener("click", () => {
  navigator.clipboard
    .readText()
    .then((text) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value =
        textarea.value.substring(0, start) +
        text +
        textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    })
    .catch((err) => {
      alert("Помилка доступу до буфера обміну. Будь ласка, надайте дозвіл.");
    });
});

// Очистити
document.getElementById("clearBtn").addEventListener("click", () => {
  textarea.value = "";
  textarea.dispatchEvent(new Event("input"));
});

// Імпорт (виклик прихованого input)
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    textarea.value = e.target.result;
    textarea.dispatchEvent(new Event("input"));
  };
  reader.readAsText(file);
  this.value = ""; // Скидаємо значення, щоб можна було завантажити той самий файл знову
});

// Аналіз (поки що заглушка)
document.getElementById("analyzeBtn").addEventListener("click", () => {
  alert("Скоро тут буде магія C++ і WebAssembly!");
});

// --- СИНХРОНІЗАЦІЯ СКРОЛУ ---
textarea.addEventListener("scroll", () => {
  backdrop.scrollTop = textarea.scrollTop;
  backdrop.scrollLeft = textarea.scrollLeft;
});

// --- ПІДСВІТКА ТЕКСТУ ---
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderHighlights() {
  const text = textarea.value;
  const term = findInput.value;

  if (!term || matches.length === 0) {
    let escaped = escapeHTML(text);
    if (text.endsWith("\n")) escaped += " ";
    backdrop.innerHTML = escaped;
    return;
  }

  let result = "";
  let lastIndex = 0;

  matches.forEach((m, i) => {
    result += escapeHTML(text.substring(lastIndex, m.index));
    const isCurrent = i === currentIndex ? 'class="current"' : "";
    result += `<mark ${isCurrent}>${escapeHTML(text.substring(m.index, m.index + m.length))}</mark>`;
    lastIndex = m.index + m.length;
  });

  result += escapeHTML(text.substring(lastIndex));
  if (text.endsWith("\n")) result += " ";

  backdrop.innerHTML = result;
}

// --- СТАТИСТИКА (тимчасово на JS) ---
textarea.addEventListener("input", () => {
  const text = textarea.value;
  document.getElementById("charCount").innerText = text.length;

  if (text.trim() === "") {
    document.getElementById("wordCount").innerText = 0;
    document.getElementById("sentenceCount").innerText = 0;
    document.getElementById("punctCount").innerText = 0;
    document.getElementById("topWords").innerHTML =
      '<li style="justify-content: center; color: var(--text-muted)">Немає тексту</li>';
  } else {
    const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    const words = cleanText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    document.getElementById("wordCount").innerText = words.length;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    document.getElementById("sentenceCount").innerText = sentences.length;

    const punctuation = text.match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g);
    document.getElementById("punctCount").innerText = punctuation
      ? punctuation.length
      : 0;

    const wordFreq = {};
    words.forEach((word) => {
      let w = word.toLowerCase();
      if (w.length > 2) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

    const sortedWords = Object.keys(wordFreq)
      .sort((a, b) => wordFreq[b] - wordFreq[a])
      .slice(0, 3);

    const topWordsHtml =
      sortedWords.length > 0
        ? sortedWords
            .map(
              (w) =>
                `<li><span>${w}</span> <span style="color: var(--accent); font-weight: 600;">${wordFreq[w]}</span></li>`,
            )
            .join("")
        : '<li style="justify-content: center; color: var(--text-muted)">Мало слів</li>';
    document.getElementById("topWords").innerHTML = topWordsHtml;
  }

  updateSearch();
});

// --- ПОШУК ТА ЗАМІНА ---
document.getElementById("toggleExpand").onclick = () =>
  searchWidget.classList.toggle("expanded");

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
    e.preventDefault();
    findInput.focus();
    findInput.select();
  }
});

findInput.addEventListener("input", updateSearch);

function updateSearch() {
  const text = textarea.value;
  const term = findInput.value;
  matches = [];
  currentIndex = -1;

  if (!term) {
    document.getElementById("findCount").innerText = "0/0";
    renderHighlights();
    return;
  }

  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safeTerm, "gi");
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
    });
  }

  if (matches.length > 0) {
    currentIndex = 0;
    document.getElementById("findCount").innerText =
      `${currentIndex + 1}/${matches.length}`;
  } else {
    document.getElementById("findCount").innerText = "0/0";
  }

  renderHighlights();
}

function jumpToMatch() {
  if (matches.length === 0) return;
  document.getElementById("findCount").innerText =
    `${currentIndex + 1}/${matches.length}`;
  renderHighlights();

  const m = matches[currentIndex];
  textarea.focus();
  textarea.setSelectionRange(m.index, m.index + m.length);
}

document.getElementById("nextBtn").onclick = () => {
  if (matches.length === 0) return;
  currentIndex = (currentIndex + 1) % matches.length;
  jumpToMatch();
};

document.getElementById("prevBtn").onclick = () => {
  if (matches.length === 0) return;
  currentIndex = (currentIndex - 1 + matches.length) % matches.length;
  jumpToMatch();
};

document.getElementById("replaceBtn").onclick = () => {
  if (matches.length === 0 || currentIndex === -1) return;
  const replaceVal = document.getElementById("replaceInput").value;
  const text = textarea.value;
  const m = matches[currentIndex];
  textarea.value =
    text.slice(0, m.index) + replaceVal + text.slice(m.index + m.length);

  textarea.dispatchEvent(new Event("input"));
  if (matches.length > 0) jumpToMatch();
};

document.getElementById("replaceAllBtn").onclick = () => {
  const term = findInput.value;
  const replaceVal = document.getElementById("replaceInput").value;
  if (!term) return;
  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safeTerm, "gi");
  textarea.value = textarea.value.replace(regex, replaceVal);

  textarea.dispatchEvent(new Event("input"));
};
