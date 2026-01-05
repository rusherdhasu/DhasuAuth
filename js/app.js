document.addEventListener('DOMContentLoaded', async () => {
    const userTag = document.getElementById('userTag');
    const panelsList = document.getElementById('panelsList');
    const createPanelBtn = document.getElementById('createPanelBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Tabs
    const tabItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageTitle = document.getElementById('pageTitle');
    const avatarInitial = document.getElementById('avatarInitial');

    // Global Stats
    const statTotal = document.getElementById('statTotal');
    const statActive = document.getElementById('statActive');
    const statPause = document.getElementById('statPause');
    const statBan = document.getElementById('statBan');

    // User Management UI Elements
    const userSearch = document.getElementById('userSearch');
    const userList = document.getElementById('userList');
    const userEditForm = document.getElementById('userEditForm');
    const userCreateForm = document.getElementById('userCreateForm');
    const noUserSelected = document.getElementById('noUserSelected');
    const createNewUserToggle = document.getElementById('createNewUserToggle');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');

    // Inline Stats
    const statActiveInline = document.getElementById('statActiveInline');
    const statBanInline = document.getElementById('statBanInline');

    // Edit Form Elements
    const editingUserTitle = document.getElementById('editingUserTitle');
    const userStatusBadge = document.getElementById('userStatusBadge');
    const editUsername = document.getElementById('editUsername');
    const editPassword = document.getElementById('editPassword');
    const editStatus = document.getElementById('editStatus');
    const editExpiry = document.getElementById('editExpiry');
    const editReason = document.getElementById('editReason');
    const editHwid = document.getElementById('editHwid');
    const saveUserBtn = document.getElementById('saveUserBtn');
    const resetHwidBtn = document.getElementById('resetHwidBtn');
    const deleteUserBtn = document.getElementById('deleteUserBtn');

    // Create Form Elements
    const newUsername = document.getElementById('newUsername');
    const newPassword = document.getElementById('newPassword');
    const newExpiry = document.getElementById('newExpiry');
    const newStatus = document.getElementById('newStatus');
    const createUserBtn = document.getElementById('createUserBtn');

    // HWID Access UI Elements
    const hwidSearch = document.getElementById('hwidSearch');
    const hwidList = document.getElementById('hwidList');
    const hwidEditForm = document.getElementById('hwidEditForm');
    const hwidCreateForm = document.getElementById('hwidCreateForm');
    const noHwidSelected = document.getElementById('noHwidSelected');
    const createNewHwidToggle = document.getElementById('createNewHwidToggle');
    const cancelHwidCreateBtn = document.getElementById('cancelHwidCreateBtn');
    const cancelHwidEditBtn = document.getElementById('cancelHwidEditBtn');

    const hwidVal = document.getElementById('hwidVal');
    const hwidName = document.getElementById('hwidName');
    const hwidExpiry = document.getElementById('hwidExpiry');
    const saveHwidBtn = document.getElementById('saveHwidBtn');
    const deleteHwidBtn = document.getElementById('deleteHwidBtn');

    const newHwidVal = document.getElementById('newHwidVal');
    const newHwidName = document.getElementById('newHwidName');
    const newHwidExpiry = document.getElementById('newHwidExpiry');
    const createHwidBtn = document.getElementById('createHwidBtn');

    // Panel Settings
    const panelSecret = document.getElementById('panelSecret');
    const panelVersion = document.getElementById('panelVersion');
    const panelStatus = document.getElementById('panelStatus');
    const pubUsername = document.getElementById('pubUsername');
    const pubPassword = document.getElementById('pubPassword');
    const savePanelSettingsBtn = document.getElementById('savePanelSettingsBtn');
    const deleteActivePanelBtn = document.getElementById('deleteActivePanelBtn');

    let currentPanelId = null;
    let selectedUserId = null;
    let selectedHwidId = null;
    let panels = [];
    let users = [];
    let hwidAccess = [];

    // --- Auth Check ---
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.status === 401) {
                window.location.href = 'index.html';
                return null;
            }
            const data = await res.json();
            if (!data.success) {
                window.location.href = 'index.html';
                return null;
            }
            userTag.textContent = data.user.username;
            if (avatarInitial) avatarInitial.textContent = data.user.username.charAt(0).toUpperCase();
            document.body.style.opacity = '1';
            return data.user;
        } catch (err) {
            window.location.href = 'index.html';
            return null;
        }
    };

    // Hide body initially
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';

    const user = await checkAuth();
    if (!user) return;

    // --- Tab Switching ---
    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            tabPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`${tab}Panel`).classList.add('active');

            // Update Page Title
            if (pageTitle) {
                const titleMap = { 'users': 'User Management', 'hwid': 'HWID Access Control', 'settings': 'Panel Configuration' };
                pageTitle.textContent = titleMap[tab] || 'Dashboard';
            }
        });
    });

    // --- Panel Management ---
    const loadPanels = async () => {
        const res = await fetch('/api/panels');
        const data = await res.json();
        if (data.success) {
            panels = data.panels;
            renderPanels();
            if (panels.length > 0 && !currentPanelId) {
                selectPanel(panels[0]._id);
            }
        }
    };

    const renderPanels = () => {
        panelsList.innerHTML = '';
        panels.forEach(p => {
            const div = document.createElement('div');
            div.className = `nav-item ${p._id === currentPanelId ? 'active' : ''}`;
            div.innerHTML = `
                <svg style="width:16px;height:16px;" viewBox="0 0 24 24"><path fill="currentColor" d="M13,9V3.5L18.5,9M6,2c-1.11,0-2,0.89-2,2v16a2,2 0 0,0 2,2h12a2,2 0 0,0 2,-2V8L14,2H6Z" /></svg>
                <span>${p.name}</span>
            `;
            div.onclick = () => selectPanel(p._id);
            panelsList.appendChild(div);
        });
    };

    const selectPanel = async (id) => {
        currentPanelId = id;
        selectedUserId = null;
        renderPanels();
        const panel = panels.find(p => p._id === id);
        if (panel) {
            panelSecret.value = panel.secret;
            panelVersion.value = panel.version || '1.0.0';
            panelStatus.value = panel.status || 'active';
            pubUsername.value = panel.publicLogin.username || '';
            pubPassword.value = panel.publicLogin.password || '';

            loadStats();
            loadUsers();
            loadHWID();
            showDetails('none');
        }
    };

    createPanelBtn.onclick = async () => {
        const name = prompt('Panel Name:');
        if (!name) return;
        const res = await fetch('/api/panels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) loadPanels();
    };

    // --- Statistics ---
    const loadStats = async () => {
        const res = await fetch(`/api/stats/${currentPanelId}`);
        const data = await res.json();
        if (data.success) {
            statTotal.textContent = data.stats.total;
            statActive.textContent = data.stats.active;
            statPause.textContent = data.stats.pause;
            statBan.textContent = data.stats.ban;

            statActiveInline.textContent = data.stats.active;
            statBanInline.textContent = data.stats.ban;
        }
    };

    // --- Users Management ---
    const loadUsers = async () => {
        try {
            userList.innerHTML = '<div class="loading-placeholder">Loading users...</div>';
            const res = await fetch(`/api/users/${currentPanelId}`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (data.success) {
                users = data.users || [];
                renderUsers();
            } else {
                userList.innerHTML = `<div class="loading-placeholder error">Error: ${data.message}</div>`;
            }
        } catch (err) {
            console.error('Load Users Failed:', err);
            userList.innerHTML = `<div class="loading-placeholder error">Connection failed. Check console.</div>`;
        }
    };

    const renderUsers = () => {
        const query = (userSearch.value || "").toLowerCase();
        userList.innerHTML = '';

        const filtered = (users || []).filter(u => {
            const username = u.username || "";
            return username.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            userList.innerHTML = '<div class="loading-placeholder">No matching records</div>';
            return;
        }

        filtered.forEach((u, index) => {
            const div = document.createElement('div');
            div.className = `list-item ${u._id === selectedUserId ? 'selected' : ''}`;
            div.style.animationDelay = `${index * 0.05}s`;

            const initial = (u.username || "?").charAt(0).toUpperCase();
            const expiry = u.expiryDate ? new Date(u.expiryDate).toLocaleDateString() : 'Never';
            const status = u.status || 'active';

            div.innerHTML = `
                <div class="item-avatar">${initial}</div>
                <div class="item-content">
                    <div class="item-title">${u.username || "Unknown"}</div>
                    <div class="item-subtitle">${expiry}</div>
                </div>
                <div class="status-dot ${status}"></div>
            `;
            div.onclick = () => selectUser(u._id);
            userList.appendChild(div);
        });
    };

    const selectUser = (id) => {
        selectedUserId = id;
        renderUsers();
        const user = users.find(u => u._id === id);
        if (user) {
            editUsername.value = user.username;
            editPassword.value = user.password;
            editStatus.value = user.status;
            editReason.value = user.reason || '';
            editHwid.value = user.hwid || '';

            if (user.expiryDate) {
                editExpiry.value = new Date(user.expiryDate).toISOString().split('T')[0];
            } else {
                editExpiry.value = '';
            }

            editingUserTitle.textContent = `Editing: ${user.username}`;
            userStatusBadge.textContent = user.status;
            userStatusBadge.className = `status-badge ${user.status}`;

            showDetails('edit');
        }
    };

    const showDetails = (mode) => {
        // Simple fade entry for forms
        const targets = [noUserSelected, userEditForm, userCreateForm];
        targets.forEach(t => { if (t) t.style.display = 'none'; });

        let active = null;
        if (mode === 'none') active = noUserSelected;
        if (mode === 'edit') active = userEditForm;
        if (mode === 'create') active = userCreateForm;

        if (active) {
            active.style.display = 'block';
            if (active === noUserSelected) active.style.display = 'flex';
            active.classList.add('animate-in');
        }
    };

    createNewUserToggle.onclick = () => {
        selectedUserId = null;
        renderUsers();
        showDetails('create');
    };

    cancelCreateBtn.onclick = () => showDetails('none');
    userSearch.oninput = renderUsers;

    saveUserBtn.onclick = async () => {
        if (!selectedUserId) return;
        const res = await fetch(`/api/users/${selectedUserId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: editUsername.value,
                password: editPassword.value,
                status: editStatus.value,
                expiryDate: editExpiry.value ? new Date(editExpiry.value) : undefined,
                reason: editReason.value
            })
        });
        if (res.ok) {
            alert('User updated successfully');
            loadUsers();
            loadStats();
        }
    };

    resetHwidBtn.onclick = async () => {
        if (!selectedUserId) return;
        const res = await fetch(`/api/users/${selectedUserId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hwid: null })
        });
        if (res.ok) {
            alert('HWID Reset Successful');
            editHwid.value = '';
        }
    };

    deleteUserBtn.onclick = async () => {
        if (!selectedUserId || !confirm('Are you sure you want to delete this user?')) return;
        const res = await fetch(`/api/users/${selectedUserId}`, { method: 'DELETE' });
        if (res.ok) {
            selectedUserId = null;
            showDetails('none');
            loadUsers();
            loadStats();
        }
    };

    createUserBtn.onclick = async () => {
        if (!newUsername.value || !newPassword.value) return alert('Username and password required');
        const res = await fetch(`/api/users/${currentPanelId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: newUsername.value,
                password: newPassword.value,
                expiryDays: parseInt(newExpiry.value),
                status: newStatus.value
            })
        });
        if (res.ok) {
            alert('User Account Created');
            newUsername.value = '';
            newPassword.value = '';
            showDetails('none');
            loadUsers();
            loadStats();
        } else {
            const data = await res.json();
            alert(data.message || 'Error creating user');
        }
    };

    // --- HWID Management ---
    const loadHWID = async () => {
        try {
            hwidList.innerHTML = '<div class="loading-placeholder">Syncing whitelist...</div>';
            const res = await fetch(`/api/hwid/${currentPanelId}`);
            const data = await res.json();
            if (data.success) {
                hwidAccess = data.access || [];
                renderHWIDs();
            }
        } catch (err) {
            console.error('HWID Load Failed:', err);
        }
    };

    const renderHWIDs = () => {
        const query = (hwidSearch.value || "").toLowerCase();
        hwidList.innerHTML = '';

        const filtered = (hwidAccess || []).filter(a => {
            return (a.name || "").toLowerCase().includes(query) || (a.hwid || "").toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            hwidList.innerHTML = '<div class="loading-placeholder">No hardware records</div>';
            return;
        }

        filtered.forEach((a, index) => {
            const div = document.createElement('div');
            div.className = `list-item ${a._id === selectedHwidId ? 'selected' : ''}`;
            div.style.animationDelay = `${index * 0.05}s`;

            const initial = (a.name || "D").charAt(0).toUpperCase();
            const expiry = a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : 'Infinite';

            div.innerHTML = `
                <div class="item-avatar">${initial}</div>
                <div class="item-content">
                    <div class="item-title">${a.name || "Device"}</div>
                    <div class="item-subtitle">${expiry}</div>
                </div>
                <div class="status-dot active"></div>
            `;
            div.onclick = () => selectHWID(a._id);
            hwidList.appendChild(div);
        });
    };

    const selectHWID = (id) => {
        selectedHwidId = id;
        renderHWIDs();
        const item = hwidAccess.find(a => a._id === id);
        if (item) {
            hwidVal.value = item.hwid;
            hwidName.value = item.name;
            hwidExpiry.value = ''; // Expiry calculation is simplified in form
            showHwidDetails('edit');
        }
    };

    const showHwidDetails = (mode) => {
        const targets = [noHwidSelected, hwidEditForm, hwidCreateForm];
        targets.forEach(t => { if (t) t.style.display = 'none'; });

        let active = null;
        if (mode === 'none') active = noHwidSelected;
        if (mode === 'edit') active = hwidEditForm;
        if (mode === 'create') active = hwidCreateForm;

        if (active) {
            active.style.display = 'block';
            if (active === noHwidSelected) active.style.display = 'flex';
            active.classList.add('animate-in');
        }
    };

    createNewHwidToggle.onclick = () => {
        selectedHwidId = null;
        renderHWIDs();
        showHwidDetails('create');
    };

    cancelHwidCreateBtn.onclick = () => showHwidDetails('none');
    cancelHwidEditBtn.onclick = () => showHwidDetails('none');
    hwidSearch.oninput = renderHWIDs;

    saveHwidBtn.onclick = async () => {
        if (!selectedHwidId) return;
        const res = await fetch(`/api/hwid/${selectedHwidId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hwid: hwidVal.value,
                name: hwidName.value,
                expiryDays: hwidExpiry.value
            })
        });
        if (res.ok) {
            alert('HWID Entry Synchronized');
            loadHWID();
        }
    };

    createHwidBtn.onclick = async () => {
        if (!newHwidVal.value || !newHwidName.value) return alert('All fields required');
        const res = await fetch(`/api/hwid/${currentPanelId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hwid: newHwidVal.value,
                name: newHwidName.value,
                expiryDays: newHwidExpiry.value
            })
        });
        if (res.ok) {
            alert('HWID Whitelist Provisioned');
            newHwidVal.value = '';
            newHwidName.value = '';
            newHwidExpiry.value = '';
            showHwidDetails('none');
            loadHWID();
        } else {
            const data = await res.json();
            alert(data.message || 'Error creating HWID access');
        }
    };

    deleteHwidBtn.onclick = async () => {
        if (!selectedHwidId || !confirm('Revoke access for this hardware signature?')) return;
        const res = await fetch(`/api/hwid/${selectedHwidId}`, { method: 'DELETE' });
        if (res.ok) {
            selectedHwidId = null;
            showHwidDetails('none');
            loadHWID();
        }
    };

    // --- Panel Settings ---
    savePanelSettingsBtn.onclick = async () => {
        const res = await fetch(`/api/panels/${currentPanelId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                version: panelVersion.value,
                status: panelStatus.value,
                publicLogin: {
                    username: pubUsername.value,
                    password: pubPassword.value
                }
            })
        });
        if (res.ok) {
            alert('Panel Settings Updated');
            loadPanels();
        }
    };

    deleteActivePanelBtn.onclick = async () => {
        const confirmName = prompt(`Type "DELETE" to confirm deleting this panel and ALL associated users:`);
        if (confirmName !== "DELETE") return;
        const res = await fetch(`/api/panels/${currentPanelId}`, { method: 'DELETE' });
        if (res.ok) {
            currentPanelId = null;
            loadPanels();
        }
    };

    logoutBtn.onclick = () => {
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = 'index.html';
    };

    loadPanels();
});
