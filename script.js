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
        navMobile.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

const mobileDropdownToggle = document.querySelector('.mobile-dropdown-toggle');
const mobileDropdown = document.querySelector('.mobile-dropdown');

if (mobileDropdownToggle) {
    mobileDropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        mobileDropdown.classList.toggle('active');
        mobileDropdownToggle.classList.toggle('active');
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
    sliderContainer.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    sliderContainer.addEventListener('mouseleave', () => {
        startSlideInterval();
    });
}

createSliderDots();
startSlideInterval();

// FAQ - Аккордеон
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
        if (this.classList.contains('dropdown-item') || 
            this.getAttribute('href') === '#') {
            return;
        }
        
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            if (navMobile && navMobile.classList.contains('active')) {
                navMobile.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Изменение навигации при скролле
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

// ================================================
// AJAX ОТПРАВКА ФОРМЫ НА ТВОЙ API
// ================================================

const orderForm = document.getElementById('orderForm');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');

if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (submitBtn) {
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Отправка...";
            submitBtn.disabled = true;
        }
        
        if (formMessage) {
            formMessage.textContent = 'Отправляем ваш заказ...';
            formMessage.classList.remove('error');
            formMessage.classList.add('success');
        }
        
        try {
            const formData = new FormData(orderForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Отправка на твой API
            const response = await fetch('/lab8/api/application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                if (formMessage) {
                    formMessage.textContent = result.message || 'Заказ успешно отправлен!';
                    orderForm.reset();
                    
                    setTimeout(() => {
                        if (formMessage) {
                            formMessage.classList.remove('success');
                            formMessage.textContent = '';
                        }
                    }, 7000);
                }
            } else {
                let errorText = 'Ошибка при отправке. ';
                if (result.errors) {
                    errorText += Object.values(result.errors).join(' ');
                } else if (result.error) {
                    errorText += result.error;
                }
                throw new Error(errorText);
            }
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            
            if (formMessage) {
                formMessage.textContent = error.message || 'Ошибка при отправке. Пожалуйста, попробуйте еще раз.';
                formMessage.classList.remove('success');
                formMessage.classList.add('error');
                
                setTimeout(() => {
                    formMessage.classList.remove('error');
                    formMessage.textContent = '';
                }, 5000);
            }
            
        } finally {
            if (submitBtn) {
                submitBtn.textContent = "Отправить заявку";
                submitBtn.disabled = false;
            }
        }
    });
}