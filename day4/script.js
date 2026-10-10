const textArea = document.querySelector('#note-text');
const charCount = document.querySelector('#char-count');
const wordCount = document.querySelector('#word-count');
const clearBtn = document.querySelector('#clear-btn');
const themeToggle = document.querySelector('#theme-toggle');

const noteKey = 'note';
const themeKey = 'dark-theme';

textArea.value = localStorage.getItem(noteKey) ?? '';
document.body.classList.toggle('dark', localStorage.getItem(themeKey) === 'enabled');
updateThemeLabel();
updateCounts();

textArea.addEventListener('input', () => {
    localStorage.setItem(noteKey, textArea.value);
    updateCounts();
});

clearBtn.addEventListener('click', clearText);

textArea.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        clearText();
    }
});

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem(themeKey, isDark ? 'enabled' : 'disabled');
    updateThemeLabel();
});

function clearText() {
    textArea.value = '';
    localStorage.removeItem(noteKey);
    updateCounts();
}

function updateCounts() {
    const text = textArea.value;
    const charLength = text.length;
    const wordLength = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    charCount.textContent = `${charLength} / 200 characters`;
    wordCount.textContent = `${wordLength} words`;
    charCount.classList.toggle('warning', charLength > 180 && charLength <= 200);
    charCount.classList.toggle('over', charLength > 200);
}

function updateThemeLabel() {
    themeToggle.textContent = document.body.classList.contains('dark')
        ? 'Light mode'
        : 'Dark mode';
}
