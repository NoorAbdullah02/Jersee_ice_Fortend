// Enhanced Error Handling System
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

        // Hide all other messages
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

        // Special handling for email service errors
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

// Form Validation System
class FormValidator {
    static validators = {
        name: (value) => {
            if (!value.trim()) return 'Name is required';
            if (value.trim().length < 2) return 'Name must be at least 2 characters';
            // if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
            return null;
        },
        studentId: (value) => {
            if (!value.trim()) return 'Student ID / Teachres ID is required';
            if (!/^\d+$/.test(value.trim())) return 'Student ID / Teachres ID must contain only numbers';
            return null;
        },
        jerseyNumber: (value) => {
            if (!value) return 'Jersey number is required';
            const num = parseInt(value);
            if (isNaN(num) || num < 0 || num > 500) return 'Jersey number must be between 0 and 500';
            return null;
        },
        batch: (value) => {
            // Batch is optional - no validation needed
            return null;
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
        transactionId: (value) => {
            // Transaction ID is optional - no validation needed
            return null;
        },
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

            // Remove success icon, add error icon
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

            // Remove error icon, add success icon
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

// Network Status Monitor
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

// Loading Manager
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

// Updated API Service for Backend Integration
class ApiService {
    // Automatically detect environment and set base URL
    static baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'  // Local development
        : 'https://jersee-ice-backend.onrender.com/api';  // Production (same domain)

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

                // Try to get error message from response
                try {
                    const errorData = await response.json();
                    error.message = errorData.error || errorData.message || error.message;
                } catch (e) {
                    // If response is not JSON, use status text
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

// Price Calculator
class PriceCalculator {
    static prices = {
        'round-half': 400,
        'round-full': 500,
        'polo-half': 600,
        'polo-full': 700
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

        // Add animation
        if (priceDisplay) {
            priceDisplay.style.transform = 'scale(1.1)';
            setTimeout(() => {
                priceDisplay.style.transform = 'scale(1)';
            }, 200);
        }

        return price;
    }
}

// Enhanced success message handler for better user feedback


// class SuccessHandler {
//     static showOrderSuccess(result) {
//         // Update order ID in success message
//         const orderIdEl = document.getElementById('orderId');
//         if (orderIdEl) {
//             orderIdEl.textContent = result.orderId || Date.now().toString().slice(-6);
//         }

//         // Show success message with additional details
//         const successMessage = document.getElementById('success-message');
//         const successText = successMessage.querySelector('p');

//         if (successText) {
//             successText.innerHTML = `
//                 Your jersey order has been received successfully!
//                 <br><br>
//                 <strong>What happens next:</strong><br>
//                 • Confirmation email sent to your email address<br>
//                 • Admin notification sent for processing<br>
//                 • Payment verification (1-2 business days)<br>
//                 • Order confirmation (2-3 business days)<br>
//                 • Production and delivery (7-10 business days)<br>
//                 <br>
//                 <small><strong>Order ID:</strong> ${result.orderId || 'ICE-' + Date.now().toString().slice(-6)}</small>
//             `;
//         }

//         ErrorHandler.showMessage('success', 'Order Placed Successfully!', '', 0);
//     }
// }

class SuccessHandler {
    static showOrderSuccess(result) {
        // Generate orderId (3-digit fallback with ICE- prefix)
        const fallbackId = 'ICE-' + Date.now().toString().slice(-3).padStart(3, '0');
        const orderId = result.orderId || fallbackId;

        // Update order ID in success message element
        const orderIdEl = document.getElementById('orderId');
        if (orderIdEl) {
            orderIdEl.textContent = orderId;
        }

        // Show success message with additional details
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
                <small><strong>Order ID:</strong> ${orderId}</small>
            `;
        }

        ErrorHandler.showMessage('success', 'Order Placed Successfully!', '', 0);
    }
}


// Main Application
class JerseyOrderApp {
    static async init() {
        // Initialize all systems
        if (typeof AOS !== 'undefined') {
            AOS.init({ duration: 1000, once: true, offset: 100 });
        }
        NetworkMonitor.init();
        this.createParticles();
        this.bindEvents();
        this.setupRealTimeValidation();

        // Test backend connection on startup
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

        const particleTypes = ['particle-1', 'particle-2', 'particle-3'];
        const particleCount = 60;

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
        // Form submission
        const form = document.getElementById('jersey-order-form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Price update events
        const collarRadios = document.querySelectorAll('input[name="collarType"]');
        const sleeveRadios = document.querySelectorAll('input[name="sleeveType"]');

        [...collarRadios, ...sleeveRadios].forEach(radio => {
            radio.addEventListener('change', PriceCalculator.updatePriceDisplay.bind(PriceCalculator));
        });

        // Jersey number uniqueness check
        const jerseyNumberInput = document.getElementById('jerseyNumber');

        if (jerseyNumberInput) {
            const debouncedCheck = this.debounce(this.checkJerseyUniqueness.bind(this), 500);
            jerseyNumberInput.addEventListener('input', debouncedCheck);
        }

        // Name existence check
        const nameInput = document.getElementById('name');
        if (nameInput) {
            const debouncedNameCheck = this.debounce(this.checkNameExists.bind(this), 500);
            nameInput.addEventListener('input', debouncedNameCheck);
        }

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Parallax effect
        window.addEventListener('scroll', this.debounce(() => {
            const scrolled = window.pageYOffset;
            const parallax = document.querySelector('.hero-header');
            if (parallax) {
                const speed = scrolled * 0.5;
                parallax.style.transform = `translateY(${speed}px)`;
            }
        }, 10));
    }

    static setupRealTimeValidation() {
        const fields = ['name', 'studentId', 'jerseyNumber', 'batch', 'size', 'email', 'transactionId'];

        fields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => this.validateSingleField(fieldName));
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) {
                        this.validateSingleField(fieldName);
                    }
                });
            }
        });

        // Radio button validation
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
        } else if (value.trim() || fieldName === 'batch' || fieldName === 'transactionId') {
            // Only show success for fields with values or optional fields
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
                // Show warning but still allow submission
                FormValidator.showFieldError('name', 'This name is already taken.');
            } else {
                FormValidator.showFieldSuccess('name');
            }
        } catch (error) {
            console.warn('Name existence check failed:', error);
            // Don't show error to user for this check, as it's optional
        }
    }

    static async checkJerseyUniqueness() {
        const jerseyNumber = document.getElementById('jerseyNumber')?.value;

        if (!jerseyNumber) return;

        try {
            // Check jersey number regardless of batch - jersey numbers must be globally unique
            const result = await ApiService.checkJerseyNumber(jerseyNumber, null);

            if (!result.available) {
                FormValidator.showFieldError('jerseyNumber', `This jersey number is already taken.`);
            } else {
                FormValidator.showFieldSuccess('jerseyNumber');
            }
        } catch (error) {
            console.warn('Jersey uniqueness check failed:', error);
            // Don't show error to user for this check, as it's optional
        }
    }

    static async handleFormSubmit(event) {
        event.preventDefault();

        // Hide all previous messages
        ['success', 'error', 'warning', 'info'].forEach(type => {
            const msg = document.getElementById(`${type}-message`);
            if (msg) msg.style.display = 'none';
        });

        // Collect form data
        const formData = this.collectFormData();

        // Validate form
        const validation = FormValidator.validateForm(formData);

        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            ErrorHandler.showMessage('error', 'Form Validation Failed', 'Please correct the highlighted fields and try again.', 5000);
            return;
        }

        // Calculate final price
        formData.finalPrice = PriceCalculator.calculatePrice(formData.collarType, formData.sleeveType);
        formData.orderDate = new Date().toISOString();
        formData.department = 'ICE';

        // Prepare submission
        const submitRequest = async () => {
            LoadingManager.show('Submitting your jersey order...');

            try {
                const result = await ApiService.submitOrder(formData);

                // Show enhanced success message
                SuccessHandler.showOrderSuccess(result);

                // Reset form
                this.resetForm();

            } catch (error) {
                ErrorHandler.handleError(error, 'form-submission');
            } finally {
                LoadingManager.hide();
            }
        };

        // Set up retry capability
        ErrorHandler.setLastRequest(submitRequest);

        // Submit the order
        await submitRequest();
    }

    static collectFormData() {
        const formData = {};

        // Text inputs
        ['name', 'studentId', 'jerseyNumber', 'email', 'transactionId', 'notes', 'batch'].forEach(field => {
            const element = document.getElementById(field);
            const value = element ? element.value.trim() : '';

            // Set empty optional fields to null instead of empty string
            if ((field === 'batch' || field === 'transactionId') && !value) {
                formData[field] = null;
            } else {
                formData[field] = value;
            }
        });

        // Select inputs
        ['size'].forEach(field => {
            const element = document.getElementById(field);
            formData[field] = element ? element.value : '';
        });

        // Radio inputs
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

        // Scroll to first error
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

            // Clear all validation states
            ['name', 'studentId', 'jerseyNumber', 'batch', 'size', 'email', 'transactionId', 'collarType', 'sleeveType'].forEach(field => {
                FormValidator.clearFieldValidation(field);
            });

            // Reset price display
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    JerseyOrderApp.init().catch(error => {
        console.error('Failed to initialize app:', error);
        ErrorHandler.showMessage('error', 'Initialization Error', 'Failed to initialize the application. Please refresh the page.', 0);
    });
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ErrorHandler.handleError(event.error, 'global');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    ErrorHandler.handleError(event.reason, 'promise');
    event.preventDefault();
});