document.addEventListener('DOMContentLoaded', () => {
  // 1. Конфігурація та регулярні вирази (RegEx)
  const REGEX_PHONE = /^\+380\d{9}$/;
  const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const REGEX_LOCAL_UA_PHONE = /^0\d{9}$/; // Для виявлення формату 0501234567 (Edge Case)

  // Елементи DOM
  const form = document.getElementById('feedbackForm');
  const fields = {
    username: document.getElementById('username'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    message: document.getElementById('message'),
    agreement: document.getElementById('agreement'),
  };

  const phoneSuggestBtn = document.getElementById('phoneSuggestBtn');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  let lastFocusedElement = null;

  // Відстеження взаємодії користувача з кожним полем (щоб не показувати помилки одразу)
  const touched = {
    username: false,
    email: false,
    phone: false,
    message: false,
    agreement: false,
  };

  // 2. Функції керування UI-станами (Normal / Error / Success)
  function showError(input, message) {
    const errorEl = document.getElementById(`${input.id}Error`);
    input.setAttribute('aria-invalid', 'true');

    if (input.type !== 'checkbox') {
      input.classList.remove('border-stone-300', 'border-green-500');
      input.classList.add('border-red-500');
    }

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function showSuccess(input) {
    const errorEl = document.getElementById(`${input.id}Error`);
    input.setAttribute('aria-invalid', 'false');

    if (input.type !== 'checkbox') {
      input.classList.remove('border-stone-300', 'border-red-500');
      input.classList.add('border-green-500');
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  function resetFieldUI(input) {
    const errorEl = document.getElementById(`${input.id}Error`);
    input.setAttribute('aria-invalid', 'false');

    if (input.type !== 'checkbox') {
      input.classList.remove('border-red-500', 'border-green-500');
      input.classList.add('border-stone-300');
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  // 3. Окремі функції валідації кожного поля
  function validateName() {
    const value = fields.username.value.trim();
    if (value.length === 0) {
      showError(fields.username, 'Введіть ваше ім’я.');
      return false;
    }
    if (value.length < 2) {
      showError(fields.username, 'Ім’я повинно містити щонайменше 2 символи.');
      return false;
    }
    showSuccess(fields.username);
    return true;
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    if (value.length === 0) {
      showError(fields.email, 'Введіть електронну пошту.');
      return false;
    }
    if (!REGEX_EMAIL.test(value)) {
      showError(fields.email, 'Введіть коректний email (наприклад, user@gmail.com).');
      return false;
    }
    showSuccess(fields.email);
    return true;
  }

  function validatePhone() {
    const rawValue = fields.phone.value.trim();
    phoneSuggestBtn.classList.add('hidden');

    if (rawValue.length === 0) {
      showError(fields.phone, 'Введіть номер телефону.');
      return false;
    }

    // Безпечна UX-допомога для Edge Case (введено 0501234567 замість +380501234567)
    const digitsOnly = rawValue.replace(/[\s\-()]/g, '');
    if (REGEX_LOCAL_UA_PHONE.test(digitsOnly)) {
      const formatted = `+38${digitsOnly}`;
      showError(fields.phone, 'Номер має починатися з +380 (без пробілів та дужок).');
      phoneSuggestBtn.textContent = `Замінити на ${formatted}?`;
      phoneSuggestBtn.dataset.suggested = formatted;
      phoneSuggestBtn.classList.remove('hidden');
      return false;
    }

    if (!REGEX_PHONE.test(rawValue)) {
      showError(fields.phone, 'Введіть номер строго у форматі +380XXXXXXXXX (9 цифр після +380).');
      return false;
    }

    showSuccess(fields.phone);
    return true;
  }

  function validateMessage() {
    const value = fields.message.value.trim();
    if (value.length === 0) {
      showError(fields.message, 'Введіть текст повідомлення.');
      return false;
    }
    if (value.length < 10) {
      showError(fields.message, `Повідомлення закоротке (${value.length}/10 символів).`);
      return false;
    }
    showSuccess(fields.message);
    return true;
  }

  function validateAgreement() {
    if (!fields.agreement.checked) {
      showError(fields.agreement, 'Необхідно погодитися з політикою конфіденційності.');
      return false;
    }
    showSuccess(fields.agreement);
    return true;
  }

  const validators = {
    username: validateName,
    email: validateEmail,
    phone: validatePhone,
    message: validateMessage,
    agreement: validateAgreement,
  };

  // Клік по UX-підказці для автоматичного форматування 0XXXXXXXXX -> +380XXXXXXXXX
  phoneSuggestBtn.addEventListener('click', () => {
    fields.phone.value = phoneSuggestBtn.dataset.suggested;
    touched.phone = true;
    validatePhone();
    fields.phone.focus();
  });

  // 4. Динамічна валідація (blur — фінальна перевірка поля, input — оновлення після взаємодії)
  Object.keys(fields).forEach((key) => {
    const input = fields[key];

    input.addEventListener('blur', () => {
      touched[key] = true;
      validators[key]();
    });

    const eventType = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventType, () => {
      if (touched[key]) {
        validators[key]();
      }
    });
  });

  // 5. Керування модальним вікном
  function openModal() {
    lastFocusedElement = document.activeElement;
    successModal.classList.remove('hidden');
    closeModalBtn.focus();
  }

  function closeModal() {
    successModal.classList.add('hidden');
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  closeModalBtn.addEventListener('click', closeModal);

  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 6. Обробка надсилання форми (Submit Event)
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Позначаємо всі поля як перевірені
    Object.keys(touched).forEach((key) => {
      touched[key] = true;
    });

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isMessageValid = validateMessage();
    const isAgreementValid = validateAgreement();

    const isFormValid =
      isNameValid && isEmailValid && isPhoneValid && isMessageValid && isAgreementValid;

    if (!isFormValid) {
      // Переводимо фокус на перше невалідне поле для доступності
      const firstInvalidKey = Object.keys(fields).find(
        (key) => fields[key].getAttribute('aria-invalid') === 'true'
      );
      if (firstInvalidKey) {
        fields[firstInvalidKey].focus();
      }
      return;
    }

    // Імітація успішного надсилання та очищення форми
    openModal();
    form.reset();
    phoneSuggestBtn.classList.add('hidden');
    Object.keys(fields).forEach((key) => {
      touched[key] = false;
      resetFieldUI(fields[key]);
    });
  });
});