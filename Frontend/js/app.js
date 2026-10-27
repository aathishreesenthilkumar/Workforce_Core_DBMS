/**
 * Shared Application Client Controller & API Helpers
 */

const App = {
    currentUser: null,

    /**
     * Parse cookies to extract CSRF token
     */
    getCsrfToken() {
        const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : '';
    },

    /**
     * Unified fetch wrapper with automated CSRF attachment and error handling
     */
    async fetchAPI(url, options = {}) {
        const headers = options.headers || {};

        // Auto-inject JSON Content-Type if sending a body that isn't FormData
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        // Auto-inject CSRF token for state-changing requests
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const token = this.getCsrfToken();
            if (token) {
                headers['X-CSRF-Token'] = token;
            }
        }

        options.headers = headers;
        options.credentials = 'same-origin';

        try {
            const response = await fetch(url, options);

            // Handle unauthenticated session
            if (response.status === 401) {
                if (!window.location.pathname.endsWith('login.html')) {
                    window.location.href = 'login.html';
                }
                return null;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error on [${method} ${url}]:`, error.message);
            throw error;
        }
    },

    /**
     * Verify session and retrieve current active user
     */
    async checkAuth() {
        try {
            const res = await this.fetchAPI('/api/auth/me');
            if (res && res.success) {
                this.currentUser = res.user;
                this.updateUIForUser(res.user);
                return res.user;
            }
        } catch (err) {
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
        }
        return null;
    },

    /**
     * Terminate user session
     */
    async logout() {
        try {
            await this.fetchAPI('/api/auth/logout', { method: 'POST' });
        } finally {
            window.location.href = 'login.html';
        }
    },

    /**
     * Dynamically update UI with user info and role permissions
     */
    updateUIForUser(user) {
        // Update user display tags
        const nameElems = document.querySelectorAll('.user-display-name');
        nameElems.forEach(el => el.textContent = user.full_name);

        const roleElems = document.querySelectorAll('.user-display-role');
        roleElems.forEach(el => {
            el.textContent = user.role;
            el.className = `badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'MANAGER' ? 'bg-primary' : 'bg-secondary'}`;
        });

        const deptElems = document.querySelectorAll('.user-display-dept');
        deptElems.forEach(el => el.textContent = user.department_name);

        const avatarElems = document.querySelectorAll('.user-display-avatar');
        avatarElems.forEach(el => {
            el.textContent = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        });

        // Show/hide admin & manager navigation items
        const adminOnlyElems = document.querySelectorAll('.admin-only');
        adminOnlyElems.forEach(el => {
            if (user.role === 'ADMIN' || user.role === 'MANAGER') {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    },

    /**
     * Display a floating bootstrap alert or toast
     */
    showAlert(containerId, message, type = 'success') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        container.innerHTML = '';
        container.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 200);
        }, 5000);
    },

    /**
     * Format currency in Indian Rupees
     */
    formatCurrency(amount) {
        const num = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(num);
    },

    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Status Badge HTML helper
     */
    renderStatusBadge(status) {
        const s = (status || '').toUpperCase();
        let css = 'bg-secondary';
        if (s === 'PRESENT' || s === 'APPROVED' || s === 'PAID' || s === 'ACTIVE') css = 'badge-present';
        else if (s === 'ABSENT' || s === 'REJECTED' || s === 'INACTIVE' || s === 'TERMINATED') css = 'badge-absent';
        else if (s === 'PENDING' || s === 'HALF_DAY') css = 'badge-pending';
        else if (s === 'ON_LEAVE') css = 'badge-leave';
        else if (s === 'PROCESSED') css = 'badge-processed';

        return `<span class="badge-status ${css}">${s}</span>`;
    }
};

window.App = App;

