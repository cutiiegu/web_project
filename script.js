// Мобильное меню
const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');
const closeMenu = document.getElementById('closeMenu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMobile.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

if (closeMenu) {
    closeMenu.addEventListener('click', () => {
        navMobile.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

const mobileLinks = document.querySelectorAll('.nav-mobile .nav-link');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMobile) {
            navMobile.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

const mobileDropdownToggle = document.querySelector('.mobile-dropdown-toggle');
const mobileDropdown = document.querySelector('.mobile-dropdown');

if (mobileDropdownToggle) {
    mobileDropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobileDropdown) {
            mobileDropdown.classList.toggle('active');
            mobileDropdownToggle.classList.toggle('active');
        }
    });
}

// Слайдер
const slider = document.getElementById('slider');
const sliderPrev = document.getElementById('sliderPrev');
const sliderNext = document.getElementById('sliderNext');
const sliderDots = document.getElementById('sliderDots');

let currentSlide = 0;
let slideInterval;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function createSliderDots() {
    if (!sliderDots) return;
    sliderDots.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('data-slide', i);
        sliderDots.appendChild(dot);
        dot.addEventListener('click', () => {
            goToSlide(i);
            resetSlideInterval();
        });
    }
}

function goToSlide(slideIndex) {
    if (!slider) return;
    currentSlide = slideIndex;
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function startSlideInterval() {
    if (totalSlides === 0) return;
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        goToSlide(currentSlide);
    }, 5000);
}

function resetSlideInterval() {
    clearInterval(slideInterval);
    startSlideInterval();
}

if (sliderPrev && sliderNext) {
    sliderPrev.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        goToSlide(currentSlide);
        resetSlideInterval();
    });
    sliderNext.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        goToSlide(currentSlide);
        resetSlideInterval();
    });
}

const sliderContainer = document.querySelector('.slider-container');
if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
    sliderContainer.addEventListener('mouseleave', () => startSlideInterval());
}

createSliderDots();
startSlideInterval();

// FAQ
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    }
});

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if (this.classList.contains('dropdown-item') || this.getAttribute('href') === '#') return;
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            if (navMobile && navMobile.classList.contains('active')) {
                navMobile.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
        }
    });
});

// Навигация при скролле
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.1)';
        } else {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(139, 69, 19, 0.1)';
        }
    }
});

// ========== ОТПРАВКА ФОРМЫ ==========
const orderForm = document.getElementById('orderForm');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');

if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (submitBtn) {
            submitBtn.textContent = "Отправка...";
            submitBtn.disabled = true;
        }
        
        if (formMessage) {
            formMessage.textContent = 'Отправляем ваш заказ...';
            formMessage.classList.remove('error');
            formMessage.classList.add('success');
            formMessage.style.display = 'block';
        }
        
        try {
            const formData = new FormData(orderForm);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });
            
            const response = await fetch('/web_project/api/application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                let messageText = result.message || 'Заказ успешно отправлен!';
                
                // credentials остаются на экране (не исчезают)
                if (result.credentials) {
                    messageText = '<div class="credentials-message">';
                    messageText += '<strong>✅ Заказ успешно отправлен!</strong><br><br>';
                    messageText += '<strong>Сохраните данные для входа:</strong><br>';
                    messageText += 'Логин: <strong>' + result.credentials.login + '</strong><br>';
                    messageText += 'Пароль: <strong>' + result.credentials.password + '</strong><br><br>';
                    messageText += 'Вы можете использовать их для входа в личный кабинет.';
                    messageText += '</div>';
                }
                
                if (formMessage) {
                    formMessage.innerHTML = messageText;
                    orderForm.reset();
                    // НЕ УДАЛЯЕМ СООБЩЕНИЕ АВТОМАТИЧЕСКИ
                    // Оно остаётся до перезагрузки страницы
                }
            } else {
                let errorText = 'Ошибка при отправке. ';
                if (result.errors) errorText += Object.values(result.errors).join(' ');
                else if (result.error) errorText += result.error;
                throw new Error(errorText);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            if (formMessage) {
                formMessage.innerHTML = error.message || 'Ошибка при отправке. Попробуйте еще раз.';
                formMessage.classList.remove('success');
                formMessage.classList.add('error');
                formMessage.style.display = 'block';
            }
        } finally {
            if (submitBtn) {
                submitBtn.textContent = "Отправить заявку";
                submitBtn.disabled = false;
            }
        }
    });
}

// ========== МОДАЛЬНОЕ ОКНО ДЛЯ ВХОДА ==========
const loginLink = document.getElementById('loginLink');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const userLoginForm = document.getElementById('userLoginForm');
const loginMessage = document.getElementById('loginMessage');

if (loginLink) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginModal) loginModal.style.display = 'block';
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.style.display = 'none';
});

if (userLoginForm) {
    userLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const login = document.getElementById('userLogin').value;
        const password = document.getElementById('userPassword').value;
        
        if (loginMessage) {
            loginMessage.innerHTML = 'Вход...';
            loginMessage.style.color = '#DAA520';
        }
        
        try {
            const response = await fetch('/web_project/api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                loginMessage.innerHTML = '✅ Вход выполнен успешно! Перезагружаем страницу...';
                loginMessage.style.color = 'green';
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userId', result.user.id);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                loginMessage.innerHTML = '❌ ' + (result.error || 'Неверный логин или пароль');
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            loginMessage.innerHTML = '❌ Ошибка сети. Попробуйте позже.';
            loginMessage.style.color = 'red';
        }
    });
}

// Проверка авторизации
async function checkAuth() {
    try {
        const response = await fetch('/web_project/api/check.php', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        if (result.success && result.logged_in) {
            const authLinks = document.querySelector('.auth-links');
            if (authLinks && !document.getElementById('editProfileLink')) {
                const editLink = document.createElement('a');
                editLink.id = 'editProfileLink';
                editLink.href = '#';
                editLink.className = 'auth-link';
                editLink.textContent = 'Мои заказы';
                editLink.style.marginLeft = '10px';
                editLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('Функция просмотра заказов в разработке');
                });
                authLinks.appendChild(editLink);
            }
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);
