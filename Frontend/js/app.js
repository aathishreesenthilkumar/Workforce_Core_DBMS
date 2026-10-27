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
                this.initSwitchUser();
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
    },

    /**
     * Initializes the Global Switch User / Impersonate feature across all pages
     */
    initSwitchUser() {
        if (window.location.pathname.endsWith('login.html')) return;

        // Add switch user button to header chrome-actions if not already added
        const actions = document.querySelector('.chrome-actions');
        if (actions && !document.getElementById('switchUserChromeBtn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'switchUserChromeBtn';
            btn.className = 'btn-gs-sm btn-gs-outline font-monospace me-2';
            btn.title = 'Switch active account to any of the 32 employees';
            btn.innerHTML = '<i class="fa-solid fa-users me-1"></i> SWITCH USER';
            btn.onclick = () => this.openSwitchUserModal();
            actions.insertBefore(btn, actions.firstChild);
        }

        // Inject modal structure into DOM if not exists
        if (!document.getElementById('switchUserModal')) {
            const modalHtml = `
                <div class="modal fade" id="switchUserModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content" style="background: var(--bg); border: 1px solid var(--border); color: var(--text);">
                            <div class="modal-header border-bottom" style="border-color: var(--border) !important;">
                                <div>
                                    <span class="hero-tag mb-0" style="font-size: 0.74rem;">
                                        <span class="brand-beacon" style="width: 7px; height: 7px;"></span>
                                        SIMULATION &bull; 32 EMPLOYEE ACCOUNTS
                                    </span>
                                    <h5 class="modal-title fw-bold mt-1" style="color: var(--text); letter-spacing: -0.02em;">Switch Active Session</h5>
                                </div>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">
                                <div class="mb-3">
                                    <input type="text" id="switchUserSearch" class="form-control font-monospace" placeholder="Filter by employee name, code, designation, or department..." oninput="App.filterSwitchUserList()">
                                </div>
                                <div id="switchUserListContainer" style="max-height: 480px; overflow-y: auto;">
                                    <div class="text-center py-4 font-monospace" style="color: var(--text-muted);">Loading employee directory...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    },

    cachedDemoUsers: null,

    /**
     * Opens modal and renders all 32 employee accounts
     */
    async openSwitchUserModal() {
        const modalEl = document.getElementById('switchUserModal');
        if (!modalEl) return;
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();

        const container = document.getElementById('switchUserListContainer');
        try {
            if (!this.cachedDemoUsers) {
                const res = await this.fetchAPI('/api/auth/demo-users');
                if (res && res.users) {
                    this.cachedDemoUsers = res.users;
                }
            }

            this.renderSwitchUserList(this.cachedDemoUsers);
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger font-monospace">${err.message}</div>`;
        }
    },

    /**
     * Render the list of employees in the modal
     */
    renderSwitchUserList(users) {
        const container = document.getElementById('switchUserListContainer');
        if (!users || users.length === 0) {
            container.innerHTML = '<div class="text-center py-4 font-monospace" style="color: var(--text-muted);">No matching employees found.</div>';
            return;
        }

        const currentUsername = this.currentUser ? this.currentUser.username : '';

        // Group by department
        const depts = {};
        users.forEach(u => {
            const d = u.department_name || 'General';
            if (!depts[d]) depts[d] = [];
            depts[d].push(u);
        });

        let html = '';
        Object.keys(depts).forEach(deptName => {
            html += `
                <div class="dept-group mb-3">
                    <div class="d-flex align-items-center justify-content-between pb-1 mb-2 border-bottom" style="border-color: var(--border) !important;">
                        <span class="font-monospace text-uppercase fw-bold" style="font-size: 0.78rem; letter-spacing: 0.08em; color: var(--accent-text);">
                            <i class="fa-regular fa-building me-1"></i> ${deptName}
                        </span>
                        <span class="pill-tag dark" style="font-size: 0.7rem;">${depts[deptName].length} Personnel</span>
                    </div>
                    <div class="list-group list-group-flush">
            `;

            depts[deptName].forEach(u => {
                const isCurrent = u.username.toLowerCase() === currentUsername.toLowerCase();
                const roleBadge = u.role === 'ADMIN' ? 'bg-danger' : u.role === 'MANAGER' ? 'bg-primary' : 'bg-secondary';
                html += `
                    <div class="list-group-item d-flex align-items-center justify-content-between p-2 mb-1 rounded-2" style="background: ${isCurrent ? 'var(--accent-dim)' : 'var(--glass-bg)'}; border: 1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'};">
                        <div class="d-flex align-items-center gap-3">
                            <div class="font-monospace fw-bold text-center" style="width: 40px; height: 40px; line-height: 40px; border-radius: 8px; background: rgba(255,255,255,0.06); font-size: 0.85rem; color: var(--text);">
                                ${u.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-bold d-flex align-items-center gap-2" style="color: var(--text); font-size: 0.92rem;">
                                    ${u.full_name}
                                    <span class="badge ${roleBadge}" style="font-size: 0.65rem;">${u.role}</span>
                                    ${isCurrent ? '<span class="badge bg-success" style="font-size: 0.65rem;"><i class="fa-solid fa-check me-1"></i>ACTIVE</span>' : ''}
                                </div>
                                <div class="font-monospace small" style="color: var(--text-2); font-size: 0.78rem;">
                                    ${u.employee_code} &bull; ${u.designation} &bull; <span class="text-muted">@${u.username}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            ${isCurrent ? `
                                <button type="button" class="btn-gs-sm btn-gs-outline font-monospace disabled" style="opacity: 0.6; font-size: 0.75rem;">
                                    Current
                                </button>
                            ` : `
                                <button type="button" class="btn-gs-sm btn-gs font-monospace" style="font-size: 0.75rem;" onclick="App.switchToUser('${u.username}')">
                                    Switch <i class="fa-solid fa-arrow-right-arrow-left ms-1"></i>
                                </button>
                            `}
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
    },

    /**
     * Search filter inside Switch User modal
     */
    filterSwitchUserList() {
        const query = (document.getElementById('switchUserSearch')?.value || '').toLowerCase().trim();
        if (!this.cachedDemoUsers) return;

        if (!query) {
            this.renderSwitchUserList(this.cachedDemoUsers);
            return;
        }

        const filtered = this.cachedDemoUsers.filter(u => 
            u.full_name.toLowerCase().includes(query) ||
            u.employee_code.toLowerCase().includes(query) ||
            u.username.toLowerCase().includes(query) ||
            u.designation.toLowerCase().includes(query) ||
            (u.department_name && u.department_name.toLowerCase().includes(query)) ||
            u.role.toLowerCase().includes(query)
        );

        this.renderSwitchUserList(filtered);
    },

    /**
     * Executes switch user call and reloads the current page
     */
    async switchToUser(username) {
        try {
            const res = await this.fetchAPI('/api/auth/switch-user', {
                method: 'POST',
                body: { username }
            });

            if (res && res.success) {
                const modalEl = document.getElementById('switchUserModal');
                if (modalEl) {
                    const inst = bootstrap.Modal.getInstance(modalEl);
                    if (inst) inst.hide();
                }
                window.location.reload();
            }
        } catch (err) {
            alert('Could not switch user: ' + err.message);
        }
    }
};

window.App = App;

