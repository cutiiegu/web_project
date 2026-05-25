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
                
                if (result.credentials) {
                    messageText = '<div class="credentials-message">';
                    messageText += '<strong>Заказ успешно отправлен!</strong><br><br>';
                    messageText += 'Сохраните данные для входа:<br>';
                    messageText += 'Логин: <strong>' + result.credentials.login + '</strong><br>';
                    messageText += 'Пароль: <strong>' + result.credentials.password + '</strong><br><br>';
                    messageText += 'Вы можете использовать их для входа в личный кабинет.';
                    messageText += '</div>';
                }
                
                if (formMessage) {
                    formMessage.innerHTML = messageText;
                    orderForm.reset();
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
                loginMessage.innerHTML = 'Вход выполнен успешно! Загружаем заказы...';
                loginMessage.style.color = 'green';
                
                // Закрываем модальное окно входа
                if (loginModal) loginModal.style.display = 'none';
                
                // Загружаем заказы пользователя
                await loadAndShowOrders();
            } else {
                loginMessage.innerHTML = result.error || 'Неверный логин или пароль';
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            loginMessage.innerHTML = 'Ошибка сети. Попробуйте позже.';
            loginMessage.style.color = 'red';
        }
    });
}

// ========== ЗАГРУЗКА И ПОКАЗ ЗАКАЗОВ ПОСЛЕ ВХОДА ==========

async function loadAndShowOrders() {
    try {
        const response = await fetch('/web_project/api/application', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        
        if (result.success && result.orders && result.orders.length > 0) {
            showOrdersModal(result.orders);
        } else if (result.success && (!result.orders || result.orders.length === 0)) {
            showNoOrdersModal();
        } else {
            alert('Ошибка загрузки заказов');
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        alert('Ошибка загрузки заказов');
    }
}

function showNoOrdersModal() {
    let modal = document.getElementById('ordersModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'ordersModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center;">
            <span class="close" onclick="document.getElementById('ordersModal').style.display='none'">&times;</span>
            <h3>Личный кабинет</h3>
            <p>У вас пока нет заказов.</p>
            <button class="btn" onclick="document.getElementById('ordersModal').style.display='none'">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
}

function showOrdersModal(orders) {
    let modal = document.getElementById('ordersModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'ordersModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    let ordersHtml = '<div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">';
    ordersHtml += '<span class="close" onclick="document.getElementById(\'ordersModal\').style.display=\'none\'">&times;</span>';
    ordersHtml += '<h3>Мои заказы</h3>';
    
    orders.forEach(order => {
        ordersHtml += '<div style="border: 1px solid #e0c9b8; border-radius: 12px; padding: 15px; margin-bottom: 15px; background: #FFF5EE;">';
        ordersHtml += '<p><strong>Заказ #' + order.id + '</strong> от ' + order.created_at + '</p>';
        ordersHtml += '<p><strong>Имя:</strong> ' + escapeHtml(order.name) + '</p>';
        ordersHtml += '<p><strong>Телефон:</strong> ' + escapeHtml(order.phone) + '</p>';
        ordersHtml += '<p><strong>Email:</strong> ' + escapeHtml(order.email || '-') + '</p>';
        ordersHtml += '<p><strong>Десерт:</strong> ' + escapeHtml(order.dessert || '-') + '</p>';
        ordersHtml += '<p><strong>Дата получения:</strong> ' + (order.date || '-') + '</p>';
        ordersHtml += '<p><strong>Количество персон:</strong> ' + (order.servings || '-') + '</p>';
        ordersHtml += '<p><strong>Пожелания:</strong> ' + escapeHtml(order.message || '-') + '</p>';
        ordersHtml += '<button class="btn btn-small" onclick="window.editOrderModal(' + order.id + ')">Редактировать</button>';
        ordersHtml += '</div>';
    });
    
    ordersHtml += '</div>';
    modal.innerHTML = ordersHtml;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.editOrderModal = async function(orderId) {
    try {
        const response = await fetch('/web_project/api/application/' + orderId, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        
        if (result.success && result.order) {
            showEditForm(result.order);
        } else {
            alert('Ошибка загрузки заказа');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки заказа');
    }
};

function showEditForm(order) {
    let modal = document.getElementById('editOrderModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'editOrderModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const formHtml = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="document.getElementById('editOrderModal').style.display='none'">&times;</span>
            <h3>Редактирование заказа #${order.id}</h3>
            <form id="editOrderForm">
                <div class="form-group"><label>Имя:</label><input type="text" name="name" value="${escapeHtml(order.name)}" required class="form-control"></div>
                <div class="form-group"><label>Телефон:</label><input type="text" name="phone" value="${escapeHtml(order.phone)}" required class="form-control"></div>
                <div class="form-group"><label>Email:</label><input type="email" name="email" value="${escapeHtml(order.email || '')}" class="form-control"></div>
                <div class="form-group"><label>Десерт:</label>
                    <select name="dessert" class="form-control">
                        <option value="">Выберите</option>
                        <option value="chocolate-cake" ${order.dessert === 'chocolate-cake' ? 'selected' : ''}>Шоколадный торт</option>
                        <option value="macarons" ${order.dessert === 'macarons' ? 'selected' : ''}>Макаруны</option>
                        <option value="cupcakes" ${order.dessert === 'cupcakes' ? 'selected' : ''}>Капкейки</option>
                        <option value="red-velvet" ${order.dessert === 'red-velvet' ? 'selected' : ''}>Красный бархат</option>
                        <option value="other" ${order.dessert === 'other' ? 'selected' : ''}>Другой</option>
                    </select>
                </div>
                <div class="form-group"><label>Дата получения:</label><input type="date" name="date" value="${order.date || ''}" class="form-control"></div>
                <div class="form-group"><label>Количество персон:</label><input type="number" name="servings" value="${order.servings || ''}" class="form-control"></div>
                <div class="form-group"><label>Пожелания:</label><textarea name="message" rows="3" class="form-control">${escapeHtml(order.message || '')}</textarea></div>
                <button type="submit" class="btn">Сохранить изменения</button>
            </form>
            <div id="editMessage"></div>
        </div>
    `;
    
    modal.innerHTML = formHtml;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    
    const form = document.getElementById('editOrderForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {};
        formData.forEach((v, k) => { data[k] = v; });
        
        try {
            const response = await fetch('/web_project/api/application/' + order.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            const msgDiv = document.getElementById('editMessage');
            if (result.success) {
                msgDiv.innerHTML = '<div class="form-message success" style="display:block; margin-top:15px;">Заказ обновлён! Страница будет перезагружена.</div>';
                setTimeout(() => window.location.reload(), 1500);
            } else {
                msgDiv.innerHTML = '<div class="form-message error" style="display:block; margin-top:15px;">' + (result.error || 'Ошибка') + '</div>';
            }
        } catch (error) {
            document.getElementById('editMessage').innerHTML = '<div class="form-message error" style="display:block; margin-top:15px;">Ошибка сети</div>';
        }
    };
}

// Проверка авторизации при загрузке страницы
async function checkAuth() {
    try {
        const response = await fetch('/web_project/api/application', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        if (result.success && result.orders !== undefined) {
            // Пользователь авторизован, показываем его заказы
            if (result.orders && result.orders.length > 0) {
                // Можем показать кнопку "Мои заказы" в шапке
                const authLinks = document.querySelector('.auth-links');
                if (authLinks && !document.getElementById('myOrdersBtn')) {
                    const ordersBtn = document.createElement('a');
                    ordersBtn.id = 'myOrdersBtn';
                    ordersBtn.href = '#';
                    ordersBtn.className = 'auth-link';
                    ordersBtn.textContent = 'Мои заказы';
                    ordersBtn.style.marginLeft = '15px';
                    ordersBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        showOrdersModal(result.orders);
                    });
                    authLinks.appendChild(ordersBtn);
                }
            }
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);
