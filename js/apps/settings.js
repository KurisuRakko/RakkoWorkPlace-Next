/**
 * 设置应用 - 使用 FluentUI 组件库
 */
const SettingsApp = {
    handlesInitialOpenData: true,
    windowId: null,
    container: null,
    frame: null,
    currentPage: 'overview',
    _aboutDevTapCount: 0,
    _developerModeVisible: false,
    _isMounted() {
        return !!(this.container && this.container.isConnected);
    },

    getPages() {
        const pages = [
            { id: 'overview', label: 'settings.overview', icon: 'Home', desc: t('settings.overview-desc') },
            { id: 'user', label: 'settings.user', icon: 'User Circle', desc: t('settings.user-desc') },
            { id: 'network', label: 'settings.network', icon: 'Globe', desc: t('settings.network-desc') },
            { id: 'personalization', label: 'settings.personalization', icon: 'Color Picker', desc: t('settings.personalization-desc') },
            { id: 'applications', label: 'settings.applications', icon: 'Inbox Download', desc: t('settings.applications-desc') },
            { id: 'multitask', label: 'settings.multitask', icon: 'Dashboard Check', desc: t('settings.multitask-desc') },
            { id: 'time-language', label: 'settings.time-language', icon: 'Clock', desc: t('settings.time-language-desc') },
            { id: 'privacy', label: 'settings.privacy', icon: 'Lock', desc: t('settings.privacy-desc') },
            { id: 'fingo', label: 'settings.fingo', icon: 'Robot Happy', desc: t('settings.fingo-desc') },
            { id: 'lab', label: 'settings.lab', icon: 'Tube', desc: t('settings.lab-desc') },
            { id: 'about', label: 'settings.about', icon: 'Information Circle', desc: t('settings.about-desc') }
        ];
        if (this._developerModeVisible === true) {
            pages.push({
                id: 'developer',
                label: 'settings.developer',
                icon: 'Tube',
                desc: t('settings.developer-desc')
            });
        }
        return pages;
    },
    
    // 正在修复中的应用
    repairingApps: [],
    _fingoModeAnimating: false,
    _pendingFingoCustomEnter: false,
    _fingoCustomRiskAcknowledgedForCsp: false,
    _avatarThumbCache: null,
    _avatarThumbBuildPromise: null,
    _avatarThumbStorageKey: 'fluentos.avatarThumbs.v1',
    _avatarPlaceholderSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    _stateUnsubscribers: [],
    _lastStorageSnapshot: null,
    _storageSnapshotPromise: null,
    _storageSnapshotToken: 0,
    
    // 获取应用包大小（字节）。静态文件数据由构建期清单提供。
    getAppSize(appId, isPWA = false) {
        const app = typeof Desktop !== 'undefined' ? Desktop.apps.find(item => item.id === appId) : null;
        if (!app || !globalThis.FluentOSStorage) return 0;
        return FluentOSStorage.getAppSize({ ...app, isPWA: isPWA === true || app.isPWA === true });
    },

    prepareStorageSnapshot() {
        const token = ++this._storageSnapshotToken;
        this._lastStorageSnapshot = null;
        if (!globalThis.FluentOSStorage) {
            this._storageSnapshotPromise = Promise.resolve(null);
            return;
        }
        const apps = this.getStorageApps();
        this._storageSnapshotPromise = FluentOSStorage.analyze(apps, { force: true })
            .then((snapshot) => {
                if (token === this._storageSnapshotToken) this._lastStorageSnapshot = snapshot;
                return token === this._storageSnapshotToken ? snapshot : null;
            })
            .catch((error) => {
                if (token === this._storageSnapshotToken) console.error('[SettingsApp] Storage analysis failed', error);
                return null;
            });
    },

    getPreparedStorageSnapshot() {
        if (this._lastStorageSnapshot) return Promise.resolve(this._lastStorageSnapshot);
        return this._storageSnapshotPromise || Promise.resolve(null);
    },

    init(windowId, initialData = null) {
        this.windowId = windowId || `window-${Date.now()}`;
        this.container = document.getElementById(`${this.windowId}-content`);
        // 默认打开概览页
        this.currentPage = 'overview';
        this.currentAppDetail = null;
        this._aboutDevTapCount = 0;
        this._developerModeVisible = false;

        // 首次创建窗口时先消费目标页，再进行首帧渲染，避免先显示概览页后
        // 异步导航与 FluentWindow 的初始化渲染互相覆盖。
        let initialDataHandled = false;
        if (initialData && initialData.page === 'app-detail' && initialData.appId) {
            const app = this.getAppDetailData(initialData.appId);
            if (app) {
                this.currentAppDetail = app;
                this.currentPage = 'app-detail';
                initialDataHandled = true;
            }
        } else if (initialData && initialData.page) {
            const page = initialData.page;
            const hasPage = this.getPages().some(item => item.id === page);
            if (hasPage || page === 'personalization-advanced' || page === 'about-changelog') {
                this.currentPage = page;
                initialDataHandled = true;
            }
        }
        this.prepareStorageSnapshot();
        this.render();
        
        this._stateUnsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
        this._stateUnsubscribers.push(State.on('languageChange', () => {
            if (this._isMounted()) this.render();
        }, { key: 'SettingsApp.languageChange' }));

        this._stateUnsubscribers.push(State.on('settingsChange', (updates) => {
            if (
                this._isMounted()
                && this.currentPage === 'applications'
                && updates
                && Object.prototype.hasOwnProperty.call(updates, 'installedApps')
            ) {
                this.refreshCurrentPage();
            }
        }, { key: 'SettingsApp.settingsChange' }));

        this._stateUnsubscribers.push(State.on('appUsageChange', () => {
            if (this._isMounted() && this.currentPage === 'applications') {
                this.refreshCurrentPage();
            }
        }, { key: 'SettingsApp.appUsageChange' }));

        if (this._storageChangeHandler) window.removeEventListener('fluentos-storage-change', this._storageChangeHandler);
        this._storageChangeHandler = () => {
            if (!this._isMounted()) return;
            if (this.currentPage === 'applications' || this.currentPage === 'app-detail') this.refreshCurrentPage();
        };
        window.addEventListener('fluentos-storage-change', this._storageChangeHandler);

        this._stateUnsubscribers.push(State.on('fingoApiKeyReady', () => {
            if (this._isMounted() && this.currentPage === 'fingo') {
                this.render();
            }
        }, { key: 'SettingsApp.fingoApiKeyReady' }));

        return initialDataHandled;
    },

    openData(data) {
        if (!data || !data.page) return;
        if (data.page !== 'app-detail') {
            const hasPage = this.getPages().some(page => page.id === data.page);
            if (hasPage || data.page === 'personalization-advanced' || data.page === 'about-changelog') {
                this.currentAppDetail = null;
                this.navigateToPage(data.page);
            }
            return;
        }
        if (!data.appId) return;
        const app = this.getAppDetailData(data.appId);
        if (!app) return;
        this.currentAppDetail = app;
        this.navigateToPage('app-detail');
    },

    navigateToPage(pageId, options = {}) {
        if (!pageId) return;
        const previousPage = this.currentPage;
        this.currentPage = pageId;
        if (this.frame && typeof this.frame.navigate === 'function' && previousPage !== pageId) {
            this.frame.navigate(pageId);
        } else {
            this.render();
        }
        if (typeof options.after === 'function') {
            setTimeout(options.after, options.delay || 180);
        }
    },

    getNavActivePageId(pageId = this.currentPage) {
        return {
            'personalization-advanced': 'personalization',
            'app-detail': 'applications',
            'about-changelog': 'about'
        }[pageId] || pageId;
    },

    createSecondaryBackBar(label, onBack) {
        const bar = document.createElement('div');
        bar.className = 'settings-secondary-topbar';
        bar.setAttribute('data-fw-scroll-bounce-fixed', '');
        bar.appendChild(FluentUI.Button({
            text: label,
            icon: 'Arrow Left',
            variant: 'secondary',
            className: 'settings-secondary-back-button',
            onClick: onBack
        }));
        return bar;
    },

    refreshCurrentPage(options = {}) {
        if (!this.frame || typeof this.frame.refresh !== 'function') {
            this.render();
            return;
        }

        const preserveScroll = options.preserveScroll !== false;
        const card = this.frame.cardEl;
        const scrollTop = preserveScroll && card ? card.scrollTop : 0;
        this.frame.refresh();

        if (!preserveScroll || !card) return;
        const restore = () => {
            if (!card.isConnected) return;
            const maxScroll = Math.max(0, card.scrollHeight - card.clientHeight);
            card.scrollTop = Math.min(scrollTop, maxScroll);
        };
        requestAnimationFrame(() => {
            restore();
            requestAnimationFrame(restore);
        });
        setTimeout(restore, 180);
    },

    getAppDetailData(appId) {
        const desktopApp = typeof Desktop !== 'undefined'
            ? Desktop.apps.find(app => app.id === appId)
            : null;
        if (!desktopApp) return null;
        const isPWA = desktopApp.isPWA === true;
        return {
            id: desktopApp.id,
            name: Desktop.getAppName(desktopApp),
            icon: desktopApp.icon,
            isPWA,
            sizeBytes: this.getAppSize(desktopApp.id, isPWA),
            desc: isPWA
                ? ((typeof PWALoader !== 'undefined' && PWALoader.apps[desktopApp.id]?.description) || t('settings.app-desc-default'))
                : this.getAppDescription(desktopApp.id)
        };
    },

    beforeClose() {
        this._storageSnapshotToken += 1;
        this._storageSnapshotPromise = null;
        this._lastStorageSnapshot = null;
        this._stateUnsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
        if (this._storageChangeHandler) {
            window.removeEventListener('fluentos-storage-change', this._storageChangeHandler);
            this._storageChangeHandler = null;
        }
        if (this.frame && typeof this.frame.destroy === 'function') {
            this.frame.destroy();
            this.frame = null;
        }
        this.container = null;
        this.windowId = null;
        return true;
    },

    render() {
        if (!this.container) return;
        this.container.style.overflow = 'hidden';
        this.container.innerHTML = '';
        if (this.currentPage !== 'developer' && this._developerModeVisible) {
            this._developerModeVisible = false;
            this._aboutDevTapCount = 0;
        }

        if (this.frame && typeof this.frame.destroy === 'function') {
            this.frame.destroy();
            this.frame = null;
        }

        if (typeof FluentWindow === 'undefined' || typeof FluentWindow.mount !== 'function') {
            console.error('[SettingsApp] FluentWindow framework is not loaded');
            return;
        }

        this.frame = FluentWindow.mount({
            container: this.container,
            items: this.getPages().map(p => ({ id: p.id, label: t(p.label), icon: p.icon })),
            activeId: this.currentPage,
            getNavActiveId: (pageId) => this.getNavActivePageId(pageId),
            preserveScrollPositions: true,
            getScrollKey: (pageId) => {
                if (pageId === 'app-detail') {
                    const appId = this.currentAppDetail && this.currentAppDetail.id;
                    return `app-detail:${appId || 'unknown'}`;
                }
                return pageId || 'overview';
            },
            onNavigate: (pageId, pageEl) => {
                // FluentWindow reuses the same page element. Clear secondary-page
                // exit states before rendering so their fill-mode cannot keep the
                // next page transparent.
                pageEl.classList.remove(
                    'settings-material-page',
                    'settings-about-changelog',
                    'slide-out'
                );
                if (this.currentPage === 'developer' && pageId !== 'developer') {
                    this._developerModeVisible = false;
                    this._aboutDevTapCount = 0;
                }
                this.currentPage = pageId;
                pageEl.classList.add('settings-content', 'settings-fw-content');
                pageEl.id = 'settings-content';
                pageEl.dataset.pageId = this.currentPage;
                if (this.currentPage === 'app-detail' && this.currentAppDetail && this.currentAppDetail.id) {
                    pageEl.dataset.detailAppId = this.currentAppDetail.id;
                } else {
                    delete pageEl.dataset.detailAppId;
                }

                this.renderPage(pageEl);
                pageEl.classList.add('fw-page', 'settings-content', 'settings-fw-content');
            }
        });
    },


    renderPage(container) {
        switch (this.currentPage) {
            case 'overview':
                this.renderOverview(container);
                break;
            case 'user':
                this.renderUser(container);
                break;
            case 'network':
                this.renderNetwork(container);
                break;
            case 'personalization':
                this.renderPersonalization(container);
                break;
            case 'personalization-advanced':
                this.renderPersonalizationAdvanced(container);
                break;
            case 'applications':
                this.renderApplications(container);
                break;
            case 'multitask':
                this.renderMultitask(container);
                break;
            case 'app-detail':
                this.renderAppDetailPage(container);
                break;
            case 'time-language':
                this.renderTimeLanguage(container);
                break;
            case 'privacy':
                this.renderPrivacy(container);
                break;
            case 'fingo':
                this.renderFingo(container);
                break;
            case 'lab':
                this.renderLab(container);
                break;
            case 'about':
                this.renderAbout(container);
                break;
            case 'about-changelog':
                this.renderAboutChangelog(container);
                break;
            case 'developer':
                this.renderDeveloper(container);
                break;
            default:
                this.renderOverview(container);
                break;
        }
    },
    
    // 最近设置记录
    recentSettings: [],
    
    // 添加最近设置记录
    addRecentSetting(label, value, pageId, settingId = null) {
        const record = {
            label,
            value,
            pageId,
            settingId: settingId || label.replace(/\s/g, '-').toLowerCase(),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        this.recentSettings.unshift(record);
        if (this.recentSettings.length > 5) {
            this.recentSettings.pop();
        }
    },
    
    // 高亮指定设置项
    highlightSetting(settingId) {
        setTimeout(() => {
            const content = this.container.querySelector('.settings-content');
            if (!content) return;
            
            // 查找匹配的设置项
            const items = content.querySelectorAll('.fluent-setting-item');
            items.forEach(item => {
                const label = item.querySelector('.fluent-setting-item-label');
                if (label && label.textContent.includes(settingId)) {
                    // 滚动到视图
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 添加高亮
                    item.classList.add('highlight');
                    // 1.5秒后渐隐
                    setTimeout(() => {
                        item.classList.remove('highlight');
                        item.classList.add('highlight-fade');
                        setTimeout(() => {
                            item.classList.remove('highlight-fade');
                        }, 500);
                    }, 1500);
                }
            });
        }, 100);
    },

    highlightSettingByDataId(settingDataId, holdMs = 1000) {
        setTimeout(() => {
            const content = this.container?.querySelector('.settings-content');
            if (!content) return;
            const item = content.querySelector(`.fluent-setting-item[data-setting-id="${settingDataId}"]`);
            if (!item) return;

            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.classList.add('highlight-soft-blue');
            setTimeout(() => {
                item.classList.remove('highlight-soft-blue');
                item.classList.add('highlight-soft-blue-fade');
                setTimeout(() => item.classList.remove('highlight-soft-blue-fade'), 300);
            }, holdMs);
        }, 80);
    },
    
    getAccentPalette() {
        return [
            '#ffb900', '#ff8c00', '#f7630c', '#ca5010', '#da3b01', '#ef6950', '#d13438', '#ff4343',
            '#e74856', '#e81123', '#e3008c', '#bf0077', '#c30052', '#9a0089', '#b146c2', '#881798',
            '#0078d4', '#0063b1', '#8e8cd8', '#6b69d6', '#8764b8', '#744da9', '#b24bc2', '#881798',
            '#0099bc', '#2d7d9a', '#00b7c3', '#038387', '#00a98f', '#018574', '#00cc6a', '#10893e',
            '#7a7574', '#5d5a58', '#68768a', '#515c6b', '#567c73', '#486860', '#498205', '#107c10',
            '#767676', '#4c4a48', '#69797e', '#4a5459', '#647c64', '#525e54', '#847545', '#7e735f'
        ];
    },

    createAccentColorPanel() {
        const currentColor = State.normalizeAccentColor
            ? State.normalizeAccentColor(State.settings.accentColor)
            : (State.settings.accentColor || '#0078d4');
        const autoEnabled = State.settings.accentColorAuto === true;
        const readabilityEnabled = State.settings.accentColorReadability === true;
        const expanded = State.settings.accentColorExpanded === true;
        const recentColors = State.normalizeRecentAccentColors
            ? State.normalizeRecentAccentColors(State.settings.recentAccentColors)
            : (State.settings.recentAccentColors || []);

        const wrapper = document.createElement('div');
        wrapper.className = `settings-accent-panel ${expanded ? 'is-expanded' : ''}`;

        const entry = document.createElement('div');
        entry.className = `network-option-item network-option-expandable settings-accent-entry ${expanded ? 'is-expanded' : ''}`;
        entry.innerHTML = `
            <div class="network-option-icon">
                <span class="settings-accent-entry-swatch" style="--accent: ${currentColor}; background: ${currentColor}; background-color: ${currentColor};"></span>
            </div>
            <div class="network-option-info">
                <h4>${t('settings.accent-color')}</h4>
                <p>${autoEnabled ? t('settings.accent-auto') : currentColor.toUpperCase()}</p>
            </div>
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" class="network-option-arrow expand-arrow" alt="">
        `;
        entry.addEventListener('click', () => {
            if (expanded) {
                wrapper.classList.add('is-collapsing');
                const reducedMotion = typeof window !== 'undefined'
                    && window.matchMedia
                    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                setTimeout(() => {
                    State.updateSettings({ accentColorExpanded: false });
                    this.refreshCurrentPage();
                }, reducedMotion ? 0 : 260);
                return;
            }
            State.updateSettings({ accentColorExpanded: true });
            this.refreshCurrentPage();
        });
        wrapper.appendChild(entry);

        const selectColor = (color) => {
            const normalized = State.normalizeAccentColor ? State.normalizeAccentColor(color) : color;
            State.updateSettings({
                accentColor: normalized,
                accentColorAuto: false,
                recentAccentColors: State.addRecentAccentColor ? State.addRecentAccentColor(normalized) : [normalized, ...recentColors].slice(0, 8)
            });
            this.addRecentSetting(t('settings.accent-color'), normalized, 'personalization');
            State.addNotification({ title: t('settings.accent-color'), message: t('settings.accent-color-changed'), type: 'success' });
            this.refreshCurrentPage();
        };

        const createSwatch = (color) => {
            const normalized = State.normalizeAccentColor ? State.normalizeAccentColor(color) : color;
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = `settings-accent-swatch ${normalized === currentColor ? 'selected' : ''}`;
            swatch.style.setProperty('--swatch-color', normalized);
            swatch.style.background = normalized;
            swatch.style.backgroundColor = normalized;
            swatch.title = normalized;
            swatch.setAttribute('aria-label', normalized);
            swatch.addEventListener('click', () => selectColor(normalized));
            return swatch;
        };

        if (!expanded) {
            return wrapper;
        }

        const panel = document.createElement('div');
        panel.className = 'network-expand-panel settings-accent-expand-panel';

        const autoRow = document.createElement('div');
        autoRow.className = 'network-expand-row settings-accent-auto-row';
        autoRow.innerHTML = `<span>${t('settings.accent-auto')}</span>`;
        const autoToggle = FluentUI.Toggle({
            checked: autoEnabled,
            onChange: async (next) => {
                State.updateSettings({ accentColorAuto: next });
                this.addRecentSetting(t('settings.accent-color'), next ? t('settings.on') : t('settings.off'), 'personalization');
                State.addNotification({
                    title: t('settings.accent-color'),
                    message: next ? t('settings.accent-auto-on') : t('settings.accent-auto-off'),
                    type: next ? 'info' : 'success'
                });
                if (next && State.updateAccentFromWallpaper) {
                    const color = await State.updateAccentFromWallpaper(State.settings.wallpaperDesktop);
                    if (color) {
                        this.refreshCurrentPage();
                        return;
                    }
                }
                this.refreshCurrentPage();
            }
        });
        autoRow.appendChild(autoToggle);
        panel.appendChild(autoRow);

        const readabilityRow = document.createElement('div');
        readabilityRow.className = 'network-expand-row settings-accent-auto-row';
        readabilityRow.innerHTML = `<span>${t('settings.accent-readability')}</span>`;
        const readabilityToggle = FluentUI.Toggle({
            checked: readabilityEnabled,
            onChange: (next) => {
                State.updateSettings({ accentColorReadability: next });
                this.addRecentSetting(t('settings.accent-color'), next ? t('settings.on') : t('settings.off'), 'personalization');
                State.addNotification({
                    title: t('settings.accent-color'),
                    message: next ? t('settings.accent-readability-on') : t('settings.accent-readability-off'),
                    type: next ? 'info' : 'success'
                });
                this.refreshCurrentPage();
            }
        });
        readabilityRow.appendChild(readabilityToggle);
        panel.appendChild(readabilityRow);

        if (recentColors.length) {
            const recentGroup = document.createElement('div');
            recentGroup.className = 'settings-accent-group';
            recentGroup.innerHTML = `<div class="settings-accent-group-title">${t('settings.accent-recent')}</div>`;
            const row = document.createElement('div');
            row.className = 'settings-accent-row';
            recentColors.forEach((color) => row.appendChild(createSwatch(color)));
            recentGroup.appendChild(row);
            panel.appendChild(recentGroup);
        }

        const paletteGroup = document.createElement('div');
        paletteGroup.className = 'settings-accent-group';
        paletteGroup.innerHTML = `<div class="settings-accent-group-title">${t('settings.accent-windows')}</div>`;
        const grid = document.createElement('div');
        grid.className = 'settings-accent-grid';
        this.getAccentPalette().slice(0, -1).forEach((color) => grid.appendChild(createSwatch(color)));
        const input = document.createElement('input');
        input.type = 'color';
        input.value = currentColor;
        input.style.display = 'none';
        input.addEventListener('input', (event) => selectColor(event.target.value));
        const customBtn = document.createElement('button');
        customBtn.type = 'button';
        customBtn.className = 'settings-accent-custom';
        customBtn.innerHTML = '<img src="Theme/Icon/Symbol_icon/stroke/Add.svg" alt="">';
        customBtn.setAttribute('aria-label', t('settings.accent-custom'));
        customBtn.addEventListener('click', () => input.click());
        grid.appendChild(customBtn);
        grid.appendChild(input);
        paletteGroup.appendChild(grid);
        panel.appendChild(paletteGroup);
        wrapper.appendChild(panel);

        return wrapper;
    },

    // 辅助方法：创建分区
    createSection(title) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        const titleEl = document.createElement('div');
        titleEl.className = 'settings-section-title';
        titleEl.textContent = title;
        section.appendChild(titleEl);
        return section;
    },
    
    // 辅助方法：创建壁纸网格
    createWallpaperGrid(wallpapers, selected, type) {
        const grid = document.createElement('div');
        grid.className = 'wallpaper-grid';
        wallpapers.forEach(wp => {
            const item = document.createElement('div');
            item.className = `wallpaper-item ${wp === selected ? 'selected' : ''}`;
            item.innerHTML = `<img src="${wp}" alt="壁纸">`;
            item.addEventListener('click', async () => {
                if (type === 'desktop') {
                    await State.setWallpaper('desktop', wp, { sourceType: 'built-in' });
                    await Desktop.updateWallpaper();
                } else {
                    await State.setWallpaper('lock', wp, { sourceType: 'built-in' });
                    if (typeof LockScreen !== 'undefined' && LockScreen.updateWallpaper) await LockScreen.updateWallpaper();
                }
                grid.querySelectorAll('.wallpaper-item').forEach(candidate => {
                    candidate.classList.toggle('selected', candidate === item);
                });
                State.addNotification({ title: t('settings.personalization'), message: t('settings.wallpaper-changed', { type: type === 'desktop' ? t('settings.desktop') : t('settings.lockscreen') }), type: 'success' });
            });
            grid.appendChild(item);
        });
        return grid;
    }
};

if (typeof window !== 'undefined') {
    window.SettingsApp = SettingsApp;
}
