// ============================================
// ENHANCED ERROR HANDLING SYSTEM
// ============================================
class ErrorHandler {
    static lastRequest = null;
    static retryCount = 0;
    static maxRetries = 3;

    static showMessage(type, title, message, duration = 5000) {
        const messageEl = document.getElementById(`${type}-message`);
        const titleEl = messageEl.querySelector('h4');
        const textEl = messageEl.querySelector(`#${type}-text`);

        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = message;

        ['success', 'error', 'warning', 'info'].forEach(t => {
            if (t !== type) {
                document.getElementById(`${t}-message`).style.display = 'none';
            }
        });

        messageEl.style.display = 'block';
        messageEl.scrollIntoView({ behavior: 'smooth' });

        if (duration > 0) {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, duration);
        }
    }

    static handleError(error, context = '') {
        console.error('Error occurred:', error, 'Context:', context);

        let message = 'An unexpected error occurred. Please try again.';
        let title = 'Error';

        if (error.name === 'NetworkError' || !navigator.onLine) {
            message = 'Network connection issue. Please check your internet and try again.';
            title = 'Connection Error';
        } else if (error.name === 'ValidationError') {
            message = error.message || 'Please check your form inputs.';
            title = 'Validation Error';
        } else if (error.status === 429) {
            message = 'Too many requests. Please wait a moment and try again.';
            title = 'Rate Limited';
        } else if (error.status >= 500) {
            message = 'Server error. Our team has been notified. Please try again later.';
            title = 'Server Error';
        } else if (error.status === 400) {
            message = error.message || 'Invalid request. Please check your information and try again.';
            title = 'Invalid Request';
        } else if (error.status === 409) {
            message = error.message || 'Jersey number already taken for this batch.';
            title = 'Conflict Error';
        } else if (error.status === 404) {
            message = 'The requested resource was not found.';
            title = 'Not Found';
        } else if (error.message) {
            message = error.message;
            title = 'Request Failed';
        }

        if (context === 'form-submission' && error.message.includes('email')) {
            message = 'Your order was submitted but there was an issue sending the confirmation email. Please contact support if needed.';
            title = 'Partial Success';
            this.showMessage('warning', title, message, 0);
            return;
        }

        this.showMessage('error', title, message, 0);
    }

    static async retryLastRequest() {
        if (!this.lastRequest || this.retryCount >= this.maxRetries) {
            this.showMessage('error', 'Retry Failed', 'Maximum retry attempts reached. Please refresh the page and try again.', 3000);
            return;
        }

        this.retryCount++;
        this.showMessage('info', 'Retrying...', `Attempt ${this.retryCount} of ${this.maxRetries}`, 2000);

        try {
            await this.lastRequest();
        } catch (error) {
            this.handleError(error, 'retry');
        }
    }

    static setLastRequest(requestFn) {
        this.lastRequest = requestFn;
        this.retryCount = 0;
    }
}

// ============================================
// FORM VALIDATION SYSTEM
// ============================================
class FormValidator {
    static validators = {
        name: (value) => {
            if (!value.trim()) return 'Name is required';
            if (value.trim().length < 2) return 'Name must be at least 2 characters';
            return null;
        },
        mobileNumber: (value) => {
            if (!value.trim()) return 'Mobile Number is required';
            if (!/^\d+$/.test(value.trim())) return 'Mobile number must contain only digits';
            return null;
        },
        // jerseyNumber: (value) => {
        //     if (!value) return 'Jersey number is required';
        //     const num = parseInt(value);
        //     if (isNaN(num) || num < 0 || num > 500) return 'Jersey number must be between 0 and 500';
        //     return null;
        // },
        jerseyNumber: (value) => {
        if (!value.trim()) return 'Jersey number is required';
        if (!/^\d+$/.test(value.trim())) return 'Jersey number must contain only digits';
        
        const num = parseInt(value.trim(), 10);
        if (isNaN(num) || num < 0 || num > 500) return 'Jersey number must be between 0 and 500';
        
        return null;
         },

        batch: (value) => {
            return null; // Optional field
        },
        size: (value) => {
            if (!value) return 'Please select a size';
            return null;
        },
        email: (value) => {
            if (!value.trim()) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Please enter a valid email address';
            return null;
        },
        // transactionId removed from main form — handled in payment modal
        collarType: (value) => {
            if (!value) return 'Please select collar type';
            return null;
        },
        sleeveType: (value) => {
            if (!value) return 'Please select sleeve type';
            return null;
        }
    };

    static validateField(fieldName, value) {
        const validator = this.validators[fieldName];
        if (!validator) return null;
        return validator(value);
    }

    static validateForm(formData) {
        const errors = {};

        Object.keys(this.validators).forEach(field => {
            const error = this.validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorEl = document.getElementById(`${fieldName}Error`);

        if (field && errorEl) {
            field.classList.add('error');
            field.classList.remove('success');
            errorEl.textContent = message;
            errorEl.style.display = 'block';

            const existing = field.parentElement.querySelector('.success-icon, .error-icon');
            if (existing) existing.remove();

            const errorIcon = document.createElement('i');
            errorIcon.className = 'fas fa-times-circle error-icon';
            field.parentElement.appendChild(errorIcon);
        }
    }

    static showFieldSuccess(fieldName) {
        const field = document.getElementById(fieldName);
        const errorEl = document.getElementById(`${fieldName}Error`);

        if (field && errorEl) {
            field.classList.add('success');
            field.classList.remove('error');
            errorEl.style.display = 'none';

            const existing = field.parentElement.querySelector('.success-icon, .error-icon');
            if (existing) existing.remove();

            const successIcon = document.createElement('i');
            successIcon.className = 'fas fa-check-circle success-icon';
            field.parentElement.appendChild(successIcon);
        }
    }

    static clearFieldValidation(fieldName) {
        const field = document.getElementById(fieldName);
        const errorEl = document.getElementById(`${fieldName}Error`);

        if (field && errorEl) {
            field.classList.remove('error', 'success');
            errorEl.style.display = 'none';

            const existing = field.parentElement.querySelector('.success-icon, .error-icon');
            if (existing) existing.remove();
        }
    }
}

// NETWORK STATUS MONITOR



class NetworkMonitor {
    static isOnline = navigator.onLine;
    static statusEl = document.getElementById('networkStatus');
    static textEl = document.getElementById('networkText');

    static init() {
        this.updateStatus();
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    static handleOnline() {
        this.isOnline = true;
        this.updateStatus();
        ErrorHandler.showMessage('info', 'Connection Restored', 'Your internet connection has been restored.', 3000);
    }

    static handleOffline() {
        this.isOnline = false;
        this.updateStatus();
        ErrorHandler.showMessage('warning', 'Connection Lost', 'Please check your internet connection.', 0);
    }

    static updateStatus() {
        if (this.statusEl && this.textEl) {
            this.statusEl.className = `network-status ${this.isOnline ? 'online' : 'offline'}`;
            this.textEl.textContent = this.isOnline ? 'Connected' : 'Disconnected';
            this.statusEl.style.display = 'block';

            if (this.isOnline) {
                setTimeout(() => {
                    this.statusEl.style.display = 'none';
                }, 3000);
            }
        }
    }
}

// LOADING MANAGER



class LoadingManager {
    static overlay = document.getElementById('loadingOverlay');

    static show(message = 'Processing...') {
        if (this.overlay) {
            const messageEl = this.overlay.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            this.overlay.classList.add('show');
        }
    }

    static hide() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
        }
    }
}

// API SERVICE



class ApiService {
    static baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://jersee-ice-backend.onrender.com/api';

    static async makeRequest(endpoint, options = {}) {
        if (!NetworkMonitor.isOnline) {
            throw new Error('No internet connection');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;

                try {
                    const errorData = await response.json();
                    error.message = errorData.error || errorData.message || error.message;
                } catch (e) {
                    error.message = response.statusText || error.message;
                }

                throw error;
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                error.name = 'NetworkError';
                error.message = 'Network connection failed. Please check your internet connection.';
            }
            throw error;
        }
    }

    static async submitOrder(orderData) {
        return this.makeRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    static async checkJerseyNumber(jerseyNumber, batch) {
        const batchParam = batch ? `&batch=${encodeURIComponent(batch)}` : '';
        return this.makeRequest(`/orders/check-jersey?number=${jerseyNumber}${batchParam}`);
    }

    static async checkNameExists(name) {
        return this.makeRequest(`/orders/check-name?name=${encodeURIComponent(name)}`);
    }

    static async getOrderById(orderId) {
        return this.makeRequest(`/orders/${orderId}`);
    }

    static async getAllOrders() {
        return this.makeRequest('/orders');
    }

    static async updateOrderStatus(orderId, status) {
        return this.makeRequest(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    static async healthCheck() {
        return this.makeRequest('/health');
    }
}

// ============================================
// PRICE CALCULATOR
// ============================================
class PriceCalculator {
    static prices = {
        'round-half': 400,
        'round-full': 500,
        'polo-half': 360,
        'polo-full': 400
    };

    static calculatePrice(collarType, sleeveType) {
        if (!collarType || !sleeveType) return 400;
        const key = `${collarType}-${sleeveType}`;
        return this.prices[key] || 400;
    }

    static updatePriceDisplay() {
        const collarType = document.querySelector('input[name="collarType"]:checked')?.value;
        const sleeveType = document.querySelector('input[name="sleeveType"]:checked')?.value;

        const price = PriceCalculator.calculatePrice(collarType, sleeveType);

        const priceText = document.getElementById('priceText');
        const displayPrice = document.getElementById('displayPrice');
        const priceDisplay = document.getElementById('priceDisplay');

        if (priceText) priceText.textContent = `৳${price}`;
        if (displayPrice) displayPrice.textContent = `৳${price}`;

        if (priceDisplay) {
            priceDisplay.style.transform = 'scale(1.1)';
            setTimeout(() => {
                priceDisplay.style.transform = 'scale(1)';
            }, 200);
        }

        return price;
    }
}

// ============================================
// SUCCESS HANDLER
// ============================================
class SuccessHandler {
    static showOrderSuccess(result) {
        const orderIdEl = document.getElementById('orderId');
        if (orderIdEl) {
            orderIdEl.textContent = result.orderId || Date.now().toString().slice(-6);
        }

        const successMessage = document.getElementById('success-message');
        const successText = successMessage.querySelector('p');

        if (successText) {
            successText.innerHTML = `
                Your jersey order has been received successfully!
                <br><br>
                <strong>What happens next:</strong><br>
                • Confirmation email sent to your email address<br>
                • Admin notification sent for processing<br>
                • Payment verification (1-2 business days)<br>
                • Order confirmation (2-3 business days)<br>
                • Production and delivery (7-10 business days)<br>
                <br>
                <small><strong>Order ID:</strong> ${result.orderId || 'ICE-' + Date.now().toString().slice(-6)}</small>
            `;
        }

        ErrorHandler.showMessage('success', 'Order Placed Successfully!', '', 0);
    }
}

// ============================================
// MAIN APPLICATION - OPTIMIZED FOR MOBILE
// ============================================
class JerseyOrderApp {
    static async init() {
        // Initialize AOS with mobile optimization
        if (typeof AOS !== 'undefined') {
            const isMobile = window.innerWidth <= 768;
            AOS.init({ 
                duration: isMobile ? 500 : 1000,
                once: true, 
                offset: isMobile ? 50 : 100,
                disable: window.innerWidth < 480
            });
        }
        
        NetworkMonitor.init();
        this.createParticles();
        this.bindEvents();
        this.setupRealTimeValidation();

        try {
            await ApiService.healthCheck();
            console.log('Jersey Order App initialized successfully - Backend connected');
        } catch (error) {
            console.warn('Backend connection failed:', error);
            ErrorHandler.showMessage('warning', 'Backend Connection Issue', 'Unable to connect to server. Some features may not work properly.', 5000);
        }
    }

    static createParticles() {
        const particles = document.querySelector('.particles');
        if (!particles) return;

        // OPTIMIZED: Detect device and adjust particle count
        const isMobile = window.innerWidth <= 768;
        const isLowEnd = navigator.hardwareConcurrency <= 4 || window.innerWidth <= 480;
        
        let particleCount;
        if (isLowEnd) {
            particleCount = 0;
        } else if (isMobile) {
            particleCount = 15;
        } else {
            particleCount = 40;
        }

        if (particleCount === 0) {
            particles.style.display = 'none';
            return;
        }

        const particleTypes = ['particle-1', 'particle-2', 'particle-3'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const randomType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            particle.className = `particle ${randomType}`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
            particles.appendChild(particle);
        }
    }

    static bindEvents() {
        const form = document.getElementById('jersey-order-form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        const collarRadios = document.querySelectorAll('input[name="collarType"]');
        const sleeveRadios = document.querySelectorAll('input[name="sleeveType"]');

        [...collarRadios, ...sleeveRadios].forEach(radio => {
            radio.addEventListener('change', PriceCalculator.updatePriceDisplay.bind(PriceCalculator));
        });

        const jerseyNumberInput = document.getElementById('jerseyNumber');
        if (jerseyNumberInput) {
            const isMobile = window.innerWidth <= 768;
            const debounceTime = isMobile ? 800 : 500;
            const debouncedCheck = this.debounce(this.checkJerseyUniqueness.bind(this), debounceTime);
            jerseyNumberInput.addEventListener('input', debouncedCheck);
        }

        const nameInput = document.getElementById('name');
        if (nameInput) {
            const isMobile = window.innerWidth <= 768;
            const debounceTime = isMobile ? 800 : 500;
            const debouncedNameCheck = this.debounce(this.checkNameExists.bind(this), debounceTime);
            nameInput.addEventListener('input', debouncedNameCheck);
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // OPTIMIZED: Parallax only on desktop
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            window.addEventListener('scroll', this.debounce(() => {
                const scrolled = window.pageYOffset;
                const parallax = document.querySelector('.hero-header');
                if (parallax) {
                    const speed = scrolled * 0.5;
                    parallax.style.transform = `translateY(${speed}px)`;
                }
            }, 10));
        }

        // pm-card clicks: allow quick selection from payment section
        document.querySelectorAll('.pm-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const method = card.getAttribute('data-method');
                const provider = card.getAttribute('data-provider');

                // Try to collect current form data and validate before opening modal
                const currentFormData = this.collectFormData();
                const validation = FormValidator.validateForm(currentFormData);

                if (!validation.isValid) {
                    // show validation errors and guide user
                    this.showValidationErrors(validation.errors);
                    ErrorHandler.showMessage('warning', 'Complete Form', 'Please complete the order form before choosing a payment option.', 4000);
                    const firstField = Object.keys(validation.errors)[0];
                    const el = document.getElementById(firstField);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }

                // compute price for current selection and save pending data, then open modal with preselection
                currentFormData.finalPrice = PriceCalculator.calculatePrice(currentFormData.collarType, currentFormData.sleeveType);
                this.pendingOrderData = currentFormData;
                this.showPaymentModal(this.pendingOrderData);

                // programmatically open provider or set COD after modal appears
                setTimeout(() => {
                    const payMethodRadio = document.querySelector(`input[name="payOption"][value="${method === 'cod' ? 'cod' : 'online'}"]`);
                    if (payMethodRadio) payMethodRadio.checked = true;
                    if (payMethodRadio) payMethodRadio.dispatchEvent(new Event('change'));

                    if (method !== 'cod' && provider) {
                        const providerBtn = document.querySelector(`#paymentModal button[data-provider="${provider}"]`) || document.querySelector(`#select${provider}`);
                        if (providerBtn) providerBtn.click();
                    }
                }, 150);
            });
        });
    }

    static setupRealTimeValidation() {
    const fields = ['name', 'mobileNumber', 'jerseyNumber', 'batch', 'size', 'email'];

        fields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => this.validateSingleField(fieldName));
                field.addEventListener('input', this.debounce(() => {
                    if (field.classList.contains('error')) {
                        this.validateSingleField(fieldName);
                    }
                }, 300));
            }
        });

        ['collarType', 'sleeveType'].forEach(groupName => {
            const radios = document.querySelectorAll(`input[name="${groupName}"]`);
            radios.forEach(radio => {
                radio.addEventListener('change', () => this.validateRadioGroup(groupName));
            });
        });
    }

    static validateSingleField(fieldName) {
        const field = document.getElementById(fieldName);
        if (!field) return;

        const value = field.value || field.selectedOptions?.[0]?.value || '';
        const error = FormValidator.validateField(fieldName, value);

        if (error) {
            FormValidator.showFieldError(fieldName, error);
        } else if (value.trim() || fieldName === 'batch') {
            FormValidator.showFieldSuccess(fieldName);
        }
    }

    static validateRadioGroup(groupName) {
        const checkedRadio = document.querySelector(`input[name="${groupName}"]:checked`);
        const errorEl = document.getElementById(`${groupName}Error`);

        if (checkedRadio) {
            if (errorEl) errorEl.style.display = 'none';
        } else {
            if (errorEl) {
                errorEl.textContent = FormValidator.validateField(groupName, '');
                errorEl.style.display = 'block';
            }
        }
    }

    static async checkNameExists() {
        const nameField = document.getElementById('name');
        const name = nameField?.value?.trim();

        if (!name || name.length < 2) return;

        try {
            const result = await ApiService.checkNameExists(name);

            if (result.exists) {
                FormValidator.showFieldError('name', 'This jersey name is already taken, but you can still use it without any problem.');
            } else {
                FormValidator.showFieldSuccess('name');
            }
        } catch (error) {
            console.warn('Name existence check failed:', error);
        }
    }

    static async checkJerseyUniqueness() {
        const jerseyNumber = document.getElementById('jerseyNumber')?.value;

        if (!jerseyNumber) return;

        try {
            const result = await ApiService.checkJerseyNumber(jerseyNumber, null);

            if (!result.available) {
                FormValidator.showFieldError('jerseyNumber', `This jersey number is already taken, but you can still use it without any problem.`);
            } else {
                FormValidator.showFieldSuccess('jerseyNumber');
            }
        } catch (error) {
            console.warn('Jersey uniqueness check failed:', error);
        }
    }

    static async handleFormSubmit(event) {
        event.preventDefault();

        ['success', 'error', 'warning', 'info'].forEach(type => {
            const msg = document.getElementById(`${type}-message`);
            if (msg) msg.style.display = 'none';
        });

        const formData = this.collectFormData();
        const validation = FormValidator.validateForm(formData);

        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            ErrorHandler.showMessage('error', 'Form Validation Failed', 'Please correct the highlighted fields and try again.', 5000);
            return;
        }

        // Save pending data and show payment modal to let user choose COD or Online
        formData.finalPrice = PriceCalculator.calculatePrice(formData.collarType, formData.sleeveType);
        formData.orderDate = new Date().toISOString();
        formData.department = 'ICE';

        // store pending order; submission will happen from payment modal
        this.pendingOrderData = formData;

        // ensure payment modal setup is ready
        this.showPaymentModal(formData);
    }

    // Prepare and show payment modal
    static showPaymentModal(formData) {
        const paymentModalEl = document.getElementById('paymentModal');
        if (!paymentModalEl) {
            // Fallback: submit directly if modal not present
            this.submitFinalOrder(formData, { method: 'cod' });
            return;
        }

        // Lazy init listeners once
        if (!this._paymentModalInitialized) {
            this.setupPaymentModal();
            this._paymentModalInitialized = true;
        }

        // Update amount to show (online adds +10 BDT)
        const amountEl = document.getElementById('amountToPay');
        const base = formData.finalPrice || 0;
        if (amountEl) amountEl.textContent = (base + 10).toString();

        // reset txn input and messages
        const txnInput = document.getElementById('paymentTxnId');
        const txnError = document.getElementById('txnError');
        if (txnInput) txnInput.value = '';
        if (txnError) txnError.style.display = 'none';

        // default provider label
        const providerLabel = document.getElementById('paymentProviderLabel');
        const sendNumber = document.getElementById('sendNumber');
        if (providerLabel) providerLabel.textContent = 'bKash';
        if (sendNumber) sendNumber.textContent = '01637964859';

        // hide online detail block by default
        document.getElementById('onlineOptions').style.display = 'none';
        document.getElementById('paymentDetails').style.display = 'none';

        // show modal
        const bootstrapModal = new bootstrap.Modal(paymentModalEl);
        bootstrapModal.show();
        this._bootstrapPaymentModal = bootstrapModal;
    }

    static setupPaymentModal() {
        const paymentModalEl = document.getElementById('paymentModal');
        if (!paymentModalEl) return;

        const payCash = document.getElementById('payCash');
        const payOnline = document.getElementById('payOnline');
        const onlineOptions = document.getElementById('onlineOptions');
        const selectBkash = document.getElementById('selectBkash');
        const selectNagad = document.getElementById('selectNagad');
        const paymentDetails = document.getElementById('paymentDetails');
        const paymentProviderLabel = document.getElementById('paymentProviderLabel');
        const sendNumber = document.getElementById('sendNumber');
        const copyNumberBtn = document.getElementById('copyNumberBtn');
        const copyAmountBtn = document.getElementById('copyAmountBtn');
        const paymentTxnId = document.getElementById('paymentTxnId');
        const txnError = document.getElementById('txnError');
        const paymentSubmitBtn = document.getElementById('paymentSubmitBtn');

        // toggle online options when radio changes
        [payCash, payOnline].forEach(r => {
            if (!r) return;
            r.addEventListener('change', () => {
                if (payOnline.checked) {
                    onlineOptions.style.display = 'block';
                } else {
                    onlineOptions.style.display = 'none';
                    paymentDetails.style.display = 'none';
                }
            });
        });

        // provider buttons
        if (selectBkash) selectBkash.addEventListener('click', () => {
            if (paymentProviderLabel) paymentProviderLabel.textContent = 'bKash';
            if (sendNumber) sendNumber.textContent = '01637964859';
            paymentDetails.style.display = 'block';
        });

        if (selectNagad) selectNagad.addEventListener('click', () => {
            if (paymentProviderLabel) paymentProviderLabel.textContent = 'Nagad';
            if (sendNumber) sendNumber.textContent = '01637964859';
            paymentDetails.style.display = 'block';
        });

        // copy helpers
        if (copyNumberBtn) copyNumberBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(sendNumber.textContent.trim());
                ErrorHandler.showMessage('info', 'Copied', 'Number copied to clipboard', 2000);
            } catch (e) {
                ErrorHandler.showMessage('warning', 'Copy Failed', 'Unable to copy. Please long-press to copy.', 3000);
            }
        });

        if (copyAmountBtn) copyAmountBtn.addEventListener('click', async () => {
            const amount = document.getElementById('amountToPay')?.textContent || '';
            try {
                await navigator.clipboard.writeText(amount.trim());
                ErrorHandler.showMessage('info', 'Copied', 'Amount copied to clipboard', 2000);
            } catch (e) {
                ErrorHandler.showMessage('warning', 'Copy Failed', 'Unable to copy. Please long-press to copy.', 3000);
            }
        });

        // submit from modal
        if (paymentSubmitBtn) paymentSubmitBtn.addEventListener('click', async () => {
            const payMethod = document.querySelector('input[name="payOption"]:checked')?.value || 'cod';

            if (payMethod === 'cod') {
                // submit pending order as COD
                const order = this.pendingOrderData || this.collectFormData();
                await this.submitFinalOrder(order, { method: 'cod' });
                return;
            }

            // online path: ensure provider selected and txn provided
            if (paymentDetails.style.display === 'none') {
                ErrorHandler.showMessage('warning', 'Select Provider', 'Please select bKash or Nagad to proceed.', 3000);
                return;
            }

            const provider = paymentProviderLabel?.textContent || 'bKash';
            const txn = (paymentTxnId?.value || '').trim();
            if (!txn) {
                if (txnError) txnError.style.display = 'block';
                return;
            }

            const order = this.pendingOrderData || this.collectFormData();
            await this.submitFinalOrder(order, { method: 'online', provider, txn });
        });

        // clear txn error on input
        if (paymentTxnId) paymentTxnId.addEventListener('input', () => {
            if (txnError) txnError.style.display = 'none';
        });
    }

    // Final submission after payment selection
    static async submitFinalOrder(formData, paymentInfo) {
        // attach payment info to submission payload
        const payload = { ...formData };

        if (paymentInfo.method === 'cod') {
            payload.paymentMethod = 'COD';
            payload.transactionId = null;
            payload.chargedAmount = payload.finalPrice; // no extra
            // keep finalPrice as base amount
        } else {
            payload.paymentMethod = 'Online';
            payload.paymentProvider = paymentInfo.provider || 'bKash';
            payload.transactionId = paymentInfo.txn || null;
            const charged = (Number(payload.finalPrice) || 0) + 10; // add extra 10 BDT
            payload.chargedAmount = charged;
            // update finalPrice so server/email shows amount customer actually paid
            payload.finalPrice = charged;
        }

        const paymentModalEl = document.getElementById('paymentModal');
        try {
            LoadingManager.show('Submitting your order...');
            const result = await ApiService.submitOrder(payload);

            // close modal if open
            if (this._bootstrapPaymentModal) {
                try { this._bootstrapPaymentModal.hide(); } catch (e) { }
            }

            SuccessHandler.showOrderSuccess(result);
            this.resetForm();
        } catch (error) {
            ErrorHandler.handleError(error, 'form-submission');
        } finally {
            LoadingManager.hide();
        }
    }

    static collectFormData() {
        const formData = {};

    ['name', 'mobileNumber', 'jerseyNumber', 'email', 'notes', 'batch'].forEach(field => {
            const element = document.getElementById(field);
            let value = element ? element.value.trim() : '';

         if (field === 'name' || field === 'notes') {
            value = value.toUpperCase(); 
            }

            // Keep jerseyNumber as string to preserve leading zeros
            if (field === 'jerseyNumber') {
                formData[field] = value; // Store as string "01", "001", etc.
            } else if (field === 'batch' && !value) {
                formData[field] = null;
            } else {
                formData[field] = value;
            }
        });

        ['size'].forEach(field => {
            const element = document.getElementById(field);
            formData[field] = element ? element.value : '';
        });

        ['collarType', 'sleeveType'].forEach(field => {
            const element = document.querySelector(`input[name="${field}"]:checked`);
            formData[field] = element ? element.value : '';
        });

        return formData;
    }

    static showValidationErrors(errors) {
        Object.keys(errors).forEach(fieldName => {
            FormValidator.showFieldError(fieldName, errors[fieldName]);
        });

        const firstErrorField = Object.keys(errors)[0];
        const firstErrorElement = document.getElementById(firstErrorField);
        if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorElement.focus();
        }
    }

    static resetForm() {
        const form = document.getElementById('jersey-order-form');
        if (form) {
            form.reset();

        ['name', 'mobileNumber', 'jerseyNumber', 'batch', 'size', 'email', 'collarType', 'sleeveType'].forEach(field => {
                    FormValidator.clearFieldValidation(field);
            });

            PriceCalculator.updatePriceDisplay();
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ============================================
// PERFORMANCE MONITORING
// ============================================
if (window.performance) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        if (pageLoadTime > 3000) {
            console.warn('Slow device detected, optimizing performance');
            document.body.classList.add('reduce-motion');
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    JerseyOrderApp.init().catch(error => {
        console.error('Failed to initialize app:', error);
        ErrorHandler.showMessage('error', 'Initialization Error', 'Failed to initialize the application. Please refresh the page.', 0);
    });
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ErrorHandler.handleError(event.error, 'global');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    ErrorHandler.handleError(event.reason, 'promise');
    event.preventDefault();
});