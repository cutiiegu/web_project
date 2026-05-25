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

// Работа с окном входа (Логин)
const loginLink = document.getElementById('loginLink');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');

if (loginLink) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Открываем логин, только если не авторизованы
        if (!loginLink.innerHTML.includes('fa-user')) {
            loginModal.style.display = 'block';
        }
    });
}

if (closeLoginModal) {
    closeLoginModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

// Отправка главного заказа
const orderForm = document.getElementById('orderForm');
const formMessage = document.getElementById('formMessage');

if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            dessert: document.getElementById('dessert').value,
            date: document.getElementById('date').value,
            servings: document.getElementById('servings').value,
            message: document.getElementById('message').value
        };

        if (formMessage) {
            formMessage.innerHTML = 'Отправка...';
            formMessage.className = 'form-message';
            formMessage.style.display = 'block';
        }

        try {
            const response = await fetch('api/application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                let messageText = result.message || 'Заказ успешно отправлен!';
                
                // Если сгенерировались доступы
                if (result.credentials) {
                    messageText = `
                        <div class="credentials-message" style="background:#fff5ee; padding:15px; border:1px solid #dda0dd; border-radius:6px; margin-top:15px; color:#8b4513;">
                            <p><strong>✨ Заказ принят! Создан ваш личный кабинет:</strong></p>
                            <p>Логин: <strong style="color:#dda0dd;">${result.credentials.login}</strong></p>
                            <p>Пароль: <strong style="color:#dda0dd;">${result.credentials.password}</strong></p>
                            <p style="font-size:0.85em; margin-top:5px; color:gray;">Используйте их для просмотра и редактирования заказов сверху меню.</p>
                        </div>
                    `;
                }
                
                if (formMessage) {
                    formMessage.innerHTML = messageText;
                }
                orderForm.reset();
                // Обновляем статус кнопок
                checkAuth();
            } else {
                let errText = 'Произошла ошибка при отправке.';
                if (result.errors) {
                    errText = Object.values(result.errors).join('<br>');
                }
                if (formMessage) {
                    formMessage.innerHTML = `<div class="error" style="color:red;">${errText}</div>`;
                }
            }
        } catch (error) {
            if (formMessage) {
                formMessage.innerHTML = '<div class="error" style="color:red;">Ошибка сети при отправке заказа.</div>';
            }
        }
    });
}

// --- ИНТЕГРАЦИЯ ПОП-АПОВ ЛИЧНОГО КАБИНЕТА ---
document.addEventListener('DOMContentLoaded', () => {
    const ordersLink = document.getElementById('ordersLink');
    const ordersModal = document.getElementById('ordersModal');
    const closeOrdersModal = document.getElementById('closeOrdersModal');
    const editOrderModal = document.getElementById('editOrderModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editOrderForm = document.getElementById('editOrderForm');

    // Открытие списка заказов
    if (ordersLink) {
        ordersLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadUserOrders();
            ordersModal.style.display = 'block';
        });
    }

    // Закрытие модальных окон
    if (closeOrdersModal) closeOrdersModal.addEventListener('click', () => ordersModal.style.display = 'none');
    if (closeEditModal) closeEditModal.addEventListener('click', () => editOrderModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === ordersModal) ordersModal.style.display = 'none';
        if (e.target === editOrderModal) editOrderModal.style.display = 'none';
    });

    // Обработка авторизации через форму
    const userLoginForm = document.getElementById('userLoginForm');
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginVal = document.getElementById('userLogin').value;
            const passVal = document.getElementById('userPassword').value;

            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login: loginVal, password: passVal })
                });
                const result = await response.json();
                const msgDiv = document.getElementById('loginMessage');

                if (result.success) {
                    msgDiv.innerHTML = '<div style="color:green; margin-top:10px;">Вход выполнен успешно!</div>';
                    if (loginLink) loginLink.innerHTML = `<i class="fas fa-user"></i> ${result.user.login}`;
                    if (ordersLink) ordersLink.style.display = 'inline-block';
                    
                    setTimeout(() => {
                        loginModal.style.display = 'none';
                        msgDiv.innerHTML = '';
                    }, 1000);
                } else {
                    msgDiv.innerHTML = `<div style="color:red; margin-top:10px;">${result.error || 'Ошибка входа'}</div>`;
                }
            } catch (error) {
                document.getElementById('loginMessage').innerHTML = '<div style="color:red; margin-top:10px;">Ошибка сервера</div>';
            }
        });
    }

    // Отправка отредактированного заказа (PUT)
    if (editOrderForm) {
        editOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const orderId = document.getElementById('editOrderId').value;
            
            const data = {
                name: document.getElementById('editName').value,
                phone: document.getElementById('editPhone').value,
                email: document.getElementById('editEmail').value,
                servings: document.getElementById('editServings').value,
                message: document.getElementById('editMessage').value
            };

            try {
                const response = await fetch(`api/application/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                const msgDiv = document.getElementById('editMessageDiv');

                if (result.success) {
                    msgDiv.innerHTML = '<div style="color: green; font-weight:bold; margin-top:10px;">Заказ изменен!</div>';
                    loadUserOrders(); // Перезагружаем карточки
                    setTimeout(() => {
                        editOrderModal.style.display = 'none';
                        msgDiv.innerHTML = '';
                    }, 1200);
                } else {
                    msgDiv.innerHTML = `<div style="color: red; margin-top:10px;">${result.error || 'Ошибка изменения'}</div>`;
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    // Проверяем статус входа при запуске
    checkAuth();
});

// Проверка сессии
async function checkAuth() {
    try {
        const response = await fetch('api/check.php');
        const result = await response.json();
        
        const lLink = document.getElementById('loginLink');
        const oLink = document.getElementById('ordersLink');

        if (result.success && result.logged_in) {
            if (lLink) lLink.innerHTML = `<i class="fas fa-user"></i> ${result.login}`;
            if (oLink) oLink.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Ошибка проверки:', error);
    }
}

// Загрузка заказов пользователя
async function loadUserOrders() {
    const listDiv = document.getElementById('userOrdersList');
    if (!listDiv) return;

    listDiv.innerHTML = '<p style="text-align:center; color:#8b4513;">Загрузка списка ваших заказов...</p>';

    try {
        const response = await fetch('api/application');
        const result = await response.json();

        if (result.success && result.orders && result.orders.length > 0) {
            listDiv.innerHTML = '';
            
            result.orders.forEach(order => {
                const card = document.createElement('div');
                card.className = 'order-card';
                
                const dDate = order.date ? order.date : 'Не указана';
                const dDessert = order.dessert ? order.dessert : 'Индивидуальный выбор';
                const safeOrder = JSON.stringify(order).replace(/"/g, '&quot;');

                card.innerHTML = `
                    <div class="order-info">
                        <h4>Заказ №${order.id} — ${dDessert}</h4>
                        <p><strong>Дата доставки:</strong> ${dDate} | <strong>Гости:</strong> ${order.servings || '-'}</p>
                        <p><strong>Контактное лицо:</strong> ${order.name} (${order.phone})</p>
                        ${order.message ? `<p><strong>Пожелания:</strong> ${order.message}</p>` : ''}
                    </div>
                    <div class="order-actions">
                        <button class="btn-sm btn-edit-order" onclick="openEditOrderPopup(${safeOrder})">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                    </div>
                `;
                listDiv.appendChild(card);
            });
        } else {
            listDiv.innerHTML = '<div class="no-orders">У вас пока нет оформленных заказов.</div>';
        }
    } catch (error) {
        listDiv.innerHTML = '<div class="no-orders" style="color:red;">Произошла ошибка связи с сервером.</div>';
    }
}

// Предзаполнение полей редактирования
function openEditOrderPopup(order) {
    document.getElementById('editOrderId').value = order.id;
    document.getElementById('editName').value = order.name;
    document.getElementById('editPhone').value = order.phone;
    document.getElementById('editEmail').value = order.email || '';
    document.getElementById('editServings').value = order.servings || '';
    document.getElementById('editMessage').value = order.message || '';
    document.getElementById('editMessageDiv').innerHTML = '';
    
    document.getElementById('editOrderModal').style.display = 'block';
}
