/**
 * SettingsApp 页面实现分片 - 用户页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「用户」页面成员
 * （getDeviceName、renderOverview、renderUser、数据清除等），必须紧跟在
 * js/apps/settings.js 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    getDeviceName() {
        const fallbackName = 'RakkoWorkPlace-Next';
        const raw = String(State?.settings?.deviceName || '').trim();
        return raw || fallbackName;
    },

    _normalizeDeviceName(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    _promptRenameDevice() {
        const currentName = this.getDeviceName();
        FluentUI.InputDialog({
            title: t('rename'),
            placeholder: t('settings.user.name-placeholder'),
            defaultValue: currentName,
            maxLength: 32,
            validateFn: (value) => {
                const nextName = this._normalizeDeviceName(value);
                if (!nextName) return t('files.rename-empty');
                return true;
            },
            confirmText: t('ok'),
            cancelText: t('cancel'),
            onConfirm: (value) => {
                const nextName = this._normalizeDeviceName(value);
                if (!nextName) return;
                State.updateSettings({ deviceName: nextName });
                this.addRecentSetting(t('rename'), nextName, 'overview');
                FluentUI.Toast({
                    title: t('settings.title'),
                    message: `${t('rename')}: ${nextName}`,
                    type: 'success'
                });
                this.render();
            }
        });
    },

    // 概览页面
    renderOverview(container) {
        container.className = 'settings-content settings-overview';
        const deviceName = this.getDeviceName();
        
        // 设备信息头部（显示壁纸和电脑名称）
        const header = document.createElement('div');
        header.className = 'settings-overview-header';
        const wallpaper = typeof State.getResolvedWallpaper === 'function'
            ? State.getResolvedWallpaper('desktop')
            : (State.settings.wallpaperDesktop || 'Theme/Picture/Fluent-2.png');
        header.innerHTML = `
            <div class="settings-overview-device">
                <div class="settings-overview-wallpaper">
                    <img src="${wallpaper}" alt="壁纸">
                </div>
                <div class="settings-overview-device-info">
                    <h2>${deviceName}</h2>
                    <p>${t('settings.vm-device')}</p>
                    <span class="settings-overview-rename">${t('rename')}</span>
                </div>
            </div>
        `;
        container.appendChild(header);
        const renameBtn = header.querySelector('.settings-overview-rename');
        if (renameBtn) {
            renameBtn.addEventListener('click', () => this._promptRenameDevice());
        }

        // 推荐设置
        const recommendSection = document.createElement('div');
        recommendSection.className = 'settings-section';
        recommendSection.innerHTML = `<div class="settings-section-title">${t('settings.recommend')}</div>`;
        
        const recommendList = document.createElement('div');
        recommendList.className = 'settings-recommend-list';
        
        const recommendations = [
            { icon: 'Color Picker', label: t('settings.recommend-personalize'), desc: t('settings.recommend-personalize-desc'), pageId: 'personalization' },
            { icon: 'Lock', label: t('settings.recommend-security'), desc: t('settings.recommend-security-desc'), pageId: 'privacy' },
            { icon: 'Globe', label: t('settings.recommend-network'), desc: t('settings.recommend-network-desc'), pageId: 'network' }
        ];
        
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'settings-recommend-item';
            item.innerHTML = `
                <div class="settings-recommend-icon">
                    <img src="Theme/Icon/Symbol_icon/stroke/${rec.icon}.svg" alt="">
                </div>
                <div class="settings-recommend-text">
                    <h4>${rec.label}</h4>
                    <p>${rec.desc}</p>
                </div>
                <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" class="settings-recommend-arrow" alt="">
            `;
            item.addEventListener('click', () => {
                this.navigateToPage(rec.pageId);
            });
            recommendList.appendChild(item);
        });
        recommendSection.appendChild(recommendList);
        container.appendChild(recommendSection);
        
        // 最近设置
        if (this.recentSettings.length > 0) {
            const recentSection = document.createElement('div');
            recentSection.className = 'settings-section';
            recentSection.innerHTML = `<div class="settings-section-title">${t('settings.recent')}</div>`;
            
            const recentList = document.createElement('div');
            recentList.className = 'settings-recent-list';
            
            this.recentSettings.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'settings-recent-item';
                item.innerHTML = `
                    <div class="settings-recent-info">
                        <span class="settings-recent-label">${rec.label}</span>
                        <span class="settings-recent-value">${rec.value}</span>
                    </div>
                    <span class="settings-recent-time">${rec.time}</span>
                `;
                item.addEventListener('click', () => {
                    this.navigateToPage(rec.pageId, {
                        after: () => this.highlightSetting(rec.label),
                        delay: 220
                    });
                });
                recentList.appendChild(item);
            });
            recentSection.appendChild(recentList);
            container.appendChild(recentSection);
        }
    },
    
    getUserAvatarOptions() {
        return [
            'Theme/Profile_img/UserAva.jpg',
            ...Array.from({ length: 10 }, (_, i) => `Theme/Profile_img/${i + 1}.jpg`)
        ];
    },

    getAvatarThumbCache() {
        if (this._avatarThumbCache) return this._avatarThumbCache;
        const parsed = Storage.get(this._avatarThumbStorageKey, {});
        this._avatarThumbCache = parsed && typeof parsed === 'object' ? parsed : {};
        return this._avatarThumbCache;
    },

    saveAvatarThumbCache() {
        Storage.set(this._avatarThumbStorageKey, this._avatarThumbCache || {});
    },

    getAvatarThumbSrc(src, fallback = '') {
        const cache = this.getAvatarThumbCache();
        return cache[src] || fallback || this._avatarPlaceholderSrc;
    },

    async buildAvatarThumb(src, size = 80) {
        return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                try {
                    const width = Number(img.naturalWidth) || size;
                    const height = Number(img.naturalHeight) || size;
                    const cropSize = Math.min(width, height);
                    const sx = Math.max(0, (width - cropSize) / 2);
                    const sy = Math.max(0, (height - cropSize) / 2);

                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(src);
                        return;
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
                    resolve(canvas.toDataURL('image/jpeg', 0.76));
                } catch (_) {
                    resolve(src);
                }
            };
            img.onerror = () => resolve(src);
            img.src = src;
        });
    },

    async ensureAvatarThumbs(sources = []) {
        if (!Array.isArray(sources) || sources.length === 0) return;
        if (this._avatarThumbBuildPromise) return this._avatarThumbBuildPromise;

        this._avatarThumbBuildPromise = (async () => {
            const cache = this.getAvatarThumbCache();
            let changed = false;

            for (const src of sources) {
                if (!src || cache[src] || /^data:image\//i.test(src)) continue;

                await new Promise((resolve) => {
                    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
                        window.requestIdleCallback(() => resolve(), { timeout: 120 });
                    } else {
                        setTimeout(resolve, 16);
                    }
                });

                const thumb = await this.buildAvatarThumb(src, 80);
                if (!thumb || thumb === src) continue;

                cache[src] = thumb;
                changed = true;

                if (this.currentPage === 'user' && this.container) {
                    const key = encodeURIComponent(src);
                    const imgs = this.container.querySelectorAll(`img[data-avatar-key="${key}"]`);
                    imgs.forEach((img) => {
                        img.src = thumb;
                    });

                    const selectedAvatar = String(State?.settings?.userAvatar || '').trim();
                    const preview = this.container.querySelector('.settings-user-avatar-preview img[data-avatar-preview="1"]');
                    if (preview && selectedAvatar === src) preview.src = thumb;
                }
            }

            if (changed) {
                this._avatarThumbCache = cache;
                this.saveAvatarThumbCache();
            }
        })().finally(() => {
            this._avatarThumbBuildPromise = null;
        });

        return this._avatarThumbBuildPromise;
    },

    async resizeImageFileToDataUrl(file, size = 192, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('read-failed'));
            reader.onload = () => {
                const src = String(reader.result || '');
                if (!/^data:image\//i.test(src)) {
                    reject(new Error('invalid-image'));
                    return;
                }

                const img = new Image();
                img.decoding = 'async';
                img.onerror = () => reject(new Error('decode-failed'));
                img.onload = () => {
                    try {
                        const width = Number(img.naturalWidth) || size;
                        const height = Number(img.naturalHeight) || size;
                        const cropSize = Math.min(width, height);
                        const sx = Math.max(0, (width - cropSize) / 2);
                        const sy = Math.max(0, (height - cropSize) / 2);

                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            resolve(src);
                            return;
                        }

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } catch (error) {
                        reject(error);
                    }
                };
                img.src = src;
            };
            reader.readAsDataURL(file);
        });
    },

    getUserProfile() {
        const fallbackName = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.username')
            : 'Owner';
        const fallbackEmail = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.email')
            : 'owner@sample.com';
        const avatars = this.getUserAvatarOptions();
        const rawAvatar = String(State.settings.userAvatar || '').trim();
        const isCustomAvatar = /^data:image\//i.test(rawAvatar);
        const avatar = (avatars.includes(rawAvatar) || isCustomAvatar) ? rawAvatar : avatars[0];
        const name = String(State.settings.userName || '').trim() || fallbackName;
        const email = String(State.settings.userEmail || '').trim() || fallbackEmail;
        return { name, email, avatar };
    },

    renderUser(container) {
        container.className = 'settings-content settings-user';

        const profile = this.getUserProfile();
        const avatars = this.getUserAvatarOptions();
        const previewAvatarSrc = this.getAvatarThumbSrc(profile.avatar, profile.avatar);

        const profileSection = this.createSection(t('settings.user'));
        const profileCard = document.createElement('div');
        profileCard.className = 'fluent-setting-item settings-user-profile-card';
        profileCard.innerHTML = `
            <div class="settings-user-avatar-preview">
                <img src="${previewAvatarSrc}" data-avatar-preview="1" alt="avatar" loading="lazy" decoding="async">
            </div>
            <div class="settings-user-profile-text">
                <div class="settings-user-profile-name">${profile.name}</div>
                <div class="settings-user-profile-email">${profile.email}</div>
            </div>
        `;
        profileSection.appendChild(profileCard);

        const avatarGrid = document.createElement('div');
        avatarGrid.className = 'settings-user-avatar-grid';
        avatars.forEach((avatarPath, index) => {
            const avatarBtn = document.createElement('button');
            avatarBtn.className = `settings-user-avatar-item ${avatarPath === profile.avatar ? 'selected' : ''}`;
            const thumbSrc = this.getAvatarThumbSrc(avatarPath, avatarPath);
            const avatarKey = encodeURIComponent(avatarPath);
            avatarBtn.innerHTML = `<img src="${thumbSrc}" data-avatar-key="${avatarKey}" alt="avatar-${index + 1}" loading="lazy" decoding="async">`;
            avatarBtn.addEventListener('click', () => {
                State.updateSettings({ userAvatar: avatarPath });
                this.addRecentSetting(
                    t('settings.user.recent-avatar'),
                    t('settings.user.recent-avatar-index', { index: index + 1 }),
                    'user'
                );
                State.addNotification({
                    title: t('settings.user'),
                    message: t('settings.user.avatar-updated'),
                    type: 'success'
                });
                this.render();
            });
            avatarGrid.appendChild(avatarBtn);
        });
        profileSection.appendChild(avatarGrid);

        const thumbSources = profile.avatar && !avatars.includes(profile.avatar)
            ? [...avatars, profile.avatar]
            : avatars.slice();
        requestAnimationFrame(() => {
            this.ensureAvatarThumbs(thumbSources);
        });

        const avatarUploadInput = document.createElement('input');
        avatarUploadInput.type = 'file';
        avatarUploadInput.accept = 'image/*';
        avatarUploadInput.style.display = 'none';
        avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type || !file.type.startsWith('image/')) {
                FluentUI.Toast({
                    title: t('settings.user'),
                    message: t('settings.user.avatar-file-invalid'),
                    type: 'error'
                });
                avatarUploadInput.value = '';
                return;
            }

            this.resizeImageFileToDataUrl(file, 192, 0.8)
                .then((dataUrl) => {
                    State.updateSettings({ userAvatar: dataUrl });
                    this.addRecentSetting(
                        t('settings.user.recent-avatar'),
                        t('settings.user.recent-avatar-custom'),
                        'user'
                    );
                    State.addNotification({
                        title: t('settings.user'),
                        message: t('settings.user.custom-avatar-updated'),
                        type: 'success'
                    });
                    this.render();
                })
                .catch(() => {
                    FluentUI.Toast({
                        title: t('settings.user'),
                        message: t('settings.user.avatar-read-failed'),
                        type: 'error'
                    });
                })
                .finally(() => {
                    avatarUploadInput.value = '';
                });
        });

        const avatarActions = document.createElement('div');
        avatarActions.className = 'settings-user-avatar-actions';
        avatarActions.appendChild(FluentUI.Button({
            text: t('settings.user.upload-avatar'),
            variant: 'secondary',
            onClick: () => avatarUploadInput.click()
        }));
        avatarActions.appendChild(FluentUI.Button({
            text: t('settings.user.restore-avatar'),
            variant: 'secondary',
            onClick: () => {
                State.updateSettings({ userAvatar: 'Theme/Profile_img/UserAva.jpg' });
                this.addRecentSetting(
                    t('settings.user.recent-avatar'),
                    t('settings.user.recent-avatar-default'),
                    'user'
                );
                State.addNotification({
                    title: t('settings.user'),
                    message: t('settings.user.default-avatar-restored'),
                    type: 'info'
                });
                this.render();
            }
        }));
        profileCard.appendChild(avatarActions);
        profileSection.appendChild(avatarUploadInput);
        container.appendChild(profileSection);

        const fallbackName = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.username')
            : 'Owner';
        const fallbackEmail = (typeof I18n !== 'undefined' && typeof I18n.t === 'function')
            ? I18n.t('login.email')
            : 'owner@sample.com';
        const profileNameEl = profileCard.querySelector('.settings-user-profile-name');
        const profileEmailEl = profileCard.querySelector('.settings-user-profile-email');
        const syncProfilePreviewText = (name, email) => {
            if (profileNameEl) profileNameEl.textContent = String(name || '').trim() || fallbackName;
            if (profileEmailEl) profileEmailEl.textContent = String(email || '').trim() || fallbackEmail;
        };

        const infoSection = this.createSection(t('settings.user.info-section'));
        const nameInput = FluentUI.Input({
            value: profile.name,
            placeholder: t('settings.user.name-placeholder'),
            onChange: (value) => {
                const nextName = String(value || '');
                State.updateSettings({ userName: nextName });
                syncProfilePreviewText(nextName, emailInput.getValue());
            }
        });
        infoSection.appendChild(FluentUI.SettingItem({
            label: t('settings.user.name'),
            description: t('settings.user.lock-preview-desc'),
            control: nameInput
        }));

        const emailInput = FluentUI.Input({
            value: profile.email,
            placeholder: t('settings.user.email-placeholder'),
            onChange: (value) => {
                const nextEmail = String(value || '');
                State.updateSettings({ userEmail: nextEmail });
                syncProfilePreviewText(nameInput.getValue(), nextEmail);
            }
        });
        infoSection.appendChild(FluentUI.SettingItem({
            label: t('settings.user.email'),
            description: t('settings.user.lock-preview-desc'),
            control: emailInput
        }));
        container.appendChild(infoSection);

        const resetSection = this.createSection(t('settings.user.data-clear-section'));
        const resetCard = document.createElement('div');
        resetCard.className = 'fluent-setting-item settings-user-danger-content';
        resetCard.innerHTML = `
            <div class="settings-user-danger-text">
                ${t('settings.user.data-clear-description')}
            </div>
        `;
        resetCard.appendChild(FluentUI.Button({
            text: t('settings.user.data-clear-button'),
            variant: 'danger',
            onClick: () => this.confirmDataClear()
        }));
        resetSection.appendChild(resetCard);
        container.appendChild(resetSection);
    },

    confirmDataClear() {
        const delaySeconds = 5;
        let remaining = delaySeconds;
        let timer = null;

        const dialogRef = FluentUI.Dialog({
            type: 'warning',
            title: t('settings.user.data-clear-dialog-title'),
            closeOnOverlay: false,
            content: `
                <div class="settings-reset-warning">
                    <div>${t('settings.user.data-clear-dialog-line1')}</div>
                    <div>${t('settings.user.data-clear-dialog-line2')}</div>
                    <div id="settings-reset-countdown" class="settings-reset-countdown">${t('settings.user.data-clear-dialog-countdown', { seconds: delaySeconds })}</div>
                </div>
            `,
            buttons: [
                { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                { text: t('settings.user.data-clear-dialog-continue-seconds', { seconds: delaySeconds }), variant: 'danger', value: 'continue' }
            ],
            onClose: (result) => {
                if (timer) clearInterval(timer);
                if (result === 'continue') {
                    this.promptDataClearPin();
                }
            }
        });

        const continueBtn = dialogRef.dialog.querySelector('.fluent-btn-danger');
        const continueBtnText = continueBtn?.querySelector('.fluent-btn-text');
        const countdownEl = dialogRef.dialog.querySelector('#settings-reset-countdown');
        if (continueBtn) continueBtn.disabled = true;

        timer = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(timer);
                timer = null;
                if (continueBtn) continueBtn.disabled = false;
                if (continueBtnText) continueBtnText.textContent = t('settings.user.data-clear-dialog-continue');
                if (countdownEl) countdownEl.textContent = t('settings.user.data-clear-dialog-unlocked');
                return;
            }

            if (continueBtnText) continueBtnText.textContent = t('settings.user.data-clear-dialog-continue-seconds', { seconds: remaining });
            if (countdownEl) countdownEl.textContent = t('settings.user.data-clear-dialog-countdown', { seconds: remaining });
        }, 1000);
    },

    promptDataClearPin() {
        const currentPin = String(State.settings.pin || '1234');
        FluentUI.InputDialog({
            title: t('settings.user.pin-title'),
            placeholder: t('settings.user.pin-placeholder'),
            inputType: 'password',
            confirmText: t('settings.user.pin-confirm'),
            cancelText: t('cancel'),
            closeOnOverlay: false,
            validateFn: (value) => {
                const pin = String(value || '').trim();
                if (!pin) return t('settings.user.pin-required');
                if (pin !== currentPin) return t('settings.user.pin-invalid');
                return true;
            },
            onConfirm: () => this.runDataClearAndReboot()
        });
    },

    async runDataClearAndReboot() {
        if (this._dataClearRunning) return;
        this._dataClearRunning = true;
        FluentUI.Toast({
            title: t('settings.title'),
            message: t('settings.user.data-clear-rebooting'),
            type: 'warning'
        });

        try {
            if (typeof WindowManager !== 'undefined' && Array.isArray(WindowManager.windows)) {
                WindowManager.windows.slice().forEach((windowData) => {
                    if (windowData?.id !== this.windowId) WindowManager.closeWindow(windowData.id);
                });
                await new Promise(resolve => setTimeout(resolve, 120));
            }
            await Storage.clearAllUserData();
            window.location.reload();
        } catch (error) {
            this._dataClearRunning = false;
            console.error('[SettingsApp] Full user data clear failed', error);
            const failedAreas = (error?.failures || []).map(item => item.label).join(', ');
            FluentUI.Toast({
                title: t('settings.title'),
                message: I18n.currentLang === 'en'
                    ? `Some browser data could not be deleted${failedAreas ? `: ${failedAreas}` : ''}. Nothing was reset.`
                    : `部分浏览器数据无法删除${failedAreas ? `：${failedAreas}` : ''}，系统未执行重置。`,
                type: 'error',
                duration: 8000
            });
        }
    },

    // 网络页面
});
