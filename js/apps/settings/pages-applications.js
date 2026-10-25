/**
 * SettingsApp 页面实现分片 - 应用页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「应用」页面成员
 * （应用排序/系统应用/存储统计/应用详情/修复与关闭应用等），必须紧跟在
 * js/apps/settings.js 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    // 应用排序状态
    appSortOrder: 'desc', // 'desc' 或 'asc'
    
    // Fluent OS 应用及其中允许由用户卸载的可选应用
    systemAppIds: ['files', 'settings', 'process-manager', 'developer-center', 'terminal', 'tips', 'calculator', 'notes', 'browser', 'clock', 'weather', 'appshop', 'camera', 'photos', 'media'],
    removableSystemAppIds: ['tips', 'camera', 'photos', 'media'],

    getAppVersion(appId) {
        const versions = {
            terminal: '2.0.2',
            'process-manager': '2.0.2',
            'developer-center': '0.9.0 BETA',
            media: '2.1.0',
            photos: '2.1.0',
            files: '2.1.0',
            settings: '2.1.0',
            appshop: '2.1.0'
        };
        return versions[appId] || '2.0.1';
    },

    // 应用描述
    getAppDescription(appId) {
        const descKeys = {
            'files': 'settings.app-desc-files',
            'settings': 'settings.app-desc-settings',
            'calculator': 'settings.app-desc-calculator',
            'notes': 'settings.app-desc-notes',
            'browser': 'settings.app-desc-browser',
            'clock': 'settings.app-desc-clock',
            'weather': 'settings.app-desc-weather',
            'appshop': 'settings.app-desc-appshop',
            'camera': 'settings.app-desc-camera',
            'photos': 'settings.app-desc-photos',
            'media': 'settings.app-desc-media'
        };
        return descKeys[appId] ? t(descKeys[appId]) : t('settings.app-desc-default');
    },
    
    renderApplications(container) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        const apps = this.getStorageApps();
        
        // 存储概览卡片
        const storageCard = document.createElement('div');
        storageCard.className = 'fluent-setting-item settings-static-card';
        storageCard.innerHTML = `
            <div class="storage-card-content">
                <div class="storage-header">
                    <span class="storage-title">${this.getDeviceName()}</span>
                    <span class="storage-usage">${t('settings.storage-calculating')}</span>
                </div>
                <div class="storage-bar-wrapper" aria-hidden="true"></div>
                <div class="storage-legend"></div>
            </div>
        `;
        section.appendChild(storageCard);
        
        // 应用列表标题
        const listHeader = document.createElement('div');
        listHeader.className = 'apps-list-header';
        listHeader.innerHTML = `
            <span class="apps-list-title">${t('settings.installed-apps')}</span>
            <span class="apps-sort-btn" id="apps-sort-btn">${t('settings.sort-size')} ${this.appSortOrder === 'desc' ? '↓' : '↑'}</span>
        `;
        section.appendChild(listHeader);
        
        // 应用列表容器
        const appsList = document.createElement('div');
        appsList.className = 'apps-list';
        appsList.id = 'apps-list-container';
        const preparedSnapshot = this._lastStorageSnapshot;
        this.renderAppsListContent(appsList, apps, preparedSnapshot);
        section.appendChild(appsList);
        
        container.appendChild(section);

        if (preparedSnapshot) {
            this.renderStorageOverview(storageCard, preparedSnapshot);
        } else if (globalThis.FluentOSStorage) {
            this.getPreparedStorageSnapshot().then((snapshot) => {
                if (!storageCard.isConnected || this.currentPage !== 'applications') return;
                if (!snapshot) {
                    const usage = storageCard.querySelector('.storage-usage');
                    if (usage) usage.textContent = t('settings.storage-unavailable');
                    return;
                }
                this.renderStorageOverview(storageCard, snapshot);
                this.renderAppsListContent(appsList, apps, snapshot);
            });
        }
        
        // 排序按钮事件
        listHeader.querySelector('#apps-sort-btn').addEventListener('click', () => {
            this.appSortOrder = this.appSortOrder === 'desc' ? 'asc' : 'desc';
            listHeader.querySelector('#apps-sort-btn').textContent = `${t('settings.sort-size')} ${this.appSortOrder === 'desc' ? '↓' : '↑'}`;
            this.renderAppsListContent(appsList, apps, this._lastStorageSnapshot || null);
        });
    },

    getStorageApps() {
        const installed = new Set(State.settings.installedApps || []);
        const desktopApps = typeof Desktop !== 'undefined' ? Desktop.apps : [];
        return desktopApps.filter((app) => app.isPWA !== true || app.developerCreated === true || installed.has(app.id)).map((app) => {
            const shopApp = typeof AppShop !== 'undefined' ? AppShop.apps.find(item => item.id === app.id) : null;
            const pwaConfig = typeof PWALoader !== 'undefined' ? PWALoader.apps?.[app.id] : null;
            const isPWA = app.isPWA === true;
            return {
                ...app,
                name: Desktop.getAppName(app),
                isPWA,
                desc: isPWA
                    ? (pwaConfig?.description || shopApp?.desc || t('settings.app-desc-default'))
                    : this.getAppDescription(app.id)
            };
        });
    },

    renderStorageOverview(card, snapshot) {
        this._lastStorageSnapshot = snapshot;
        const categories = snapshot.categories;
        const displayQuota = Number(snapshot.displayCapacityBytes)
            || FluentOSStorage.getDisplayCapacity(snapshot.importedFilesBytes || 0);
        const denominator = displayQuota;
        const segments = [
            ['core', t('settings.storage-core'), categories.systemCoreBytes],
            ['resources', t('settings.storage-resources'), categories.systemResourceBytes],
            ['apps', t('settings.storage-apps'), categories.appsBytes],
            ['other', t('settings.storage-other'), categories.otherBytes],
            ['overhead', t('settings.storage-overhead'), categories.browserOverheadBytes]
        ];
        const bar = card.querySelector('.storage-bar-wrapper');
        bar.innerHTML = segments.map(([key, label, bytes]) => {
            const width = Math.max(0, Math.min(100, bytes / denominator * 100));
            return `<div class="storage-bar-fill ${key}" style="width:${width.toFixed(4)}%" title="${label}"></div>`;
        }).join('');
        const legend = card.querySelector('.storage-legend');
        legend.innerHTML = segments.map(([key, label]) => `
            <span class="storage-legend-item"><span class="legend-dot legend-dot-${key}"></span><span>${label}</span></span>
        `).join('') + `
            <span class="storage-legend-item"><span class="legend-dot legend-dot-available"></span><span>${t('settings.storage-available')}</span></span>
        `;
        const usage = card.querySelector('.storage-usage');
        usage.textContent = `${FluentOSStorage.formatBytes(snapshot.browserUsageBytes || 0)} / ${FluentOSStorage.formatBytes(displayQuota)}`;
    },

    renderAppsListContent(container, apps, snapshot) {
        const allApps = apps.map((app) => {
            const sizeBytes = snapshot?.apps?.[app.id]?.appSizeBytes
                ?? (globalThis.FluentOSStorage ? FluentOSStorage.getAppSize(app) : 0);
            const dataSizeBytes = snapshot?.apps?.[app.id]?.dataSizeBytes ?? 0;
            return {
                ...app,
                sizeBytes,
                dataSizeBytes,
                dataAvailable: snapshot?.apps?.[app.id]?.dataAvailable !== false,
                totalSizeBytes: sizeBytes + dataSizeBytes
            };
        });
        
        // 排序
        allApps.sort((a, b) => {
            if (a.dataAvailable !== b.dataAvailable) return a.dataAvailable ? -1 : 1;
            return this.appSortOrder === 'desc'
                ? b.totalSizeBytes - a.totalSizeBytes
                : a.totalSizeBytes - b.totalSizeBytes;
        });
        
        container.innerHTML = allApps.map(app => `
            <div class="app-list-item" data-app-id="${app.id}" data-is-pwa="${app.isPWA}">
                <div class="app-icon">
                    <img src="${app.icon}" alt="${app.name}">
                </div>
                <div class="app-info">
                    <div class="app-name">${app.name}</div>
                    <div class="app-meta">${t('settings.last-used', { time: this.formatAppLastUsed(app.id) })}</div>
                </div>
                <div class="app-size">${app.dataAvailable ? (globalThis.FluentOSStorage ? FluentOSStorage.formatBytes(app.totalSizeBytes) : '0 B') : t('settings.storage-unknown')}</div>
                <div class="app-arrow">
                    <img src="Theme/Icon/Symbol_icon/stroke/Chevron Right.svg" alt="">
                </div>
            </div>
        `).join('');
        
        // 绑定点击事件
        container.querySelectorAll('.app-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const appId = item.dataset.appId;
                const app = allApps.find(a => a.id === appId);
                if (app) {
                    this.showAppDetail(app);
                }
            });
        });
    },

    formatAppLastUsed(appId) {
        const lastUsed = typeof State.getAppLastUsed === 'function' ? State.getAppLastUsed(appId) : null;
        if (!lastUsed) return t('settings.last-used-never');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const usedDay = new Date(lastUsed.getFullYear(), lastUsed.getMonth(), lastUsed.getDate());
        const diffDays = Math.floor((today - usedDay) / 86400000);

        if (diffDays <= 0) return t('settings.last-used-today');
        if (diffDays === 1) return t('settings.last-used-yesterday');
        if (diffDays === 2) return t('settings.last-used-2days');
        if (diffDays === 3) return t('settings.last-used-3days');
        if (diffDays < 7) return t('settings.last-used-days-ago', { days: diffDays });

        const lang = I18n.currentLang === 'en' ? 'en-US' : 'zh-CN';
        return lastUsed.toLocaleDateString(lang, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },
    
    // 当前查看的应用详情
    currentAppDetail: null,
    
    showAppDetail(app) {
        this.currentAppDetail = app;
        // 保持同一个 FluentWindow 实例，让框架保存 applications 页的滚动位置。
        this.navigateToPage('app-detail');
    },
    
    renderAppDetailPage(container) {
        const app = this.currentAppDetail;
        if (!app) {
            this.currentPage = 'applications';
            this.render();
            return;
        }
        
        const isSystem = this.systemAppIds.includes(app.id);
        const canUninstall = !isSystem || this.removableSystemAppIds.includes(app.id);
        const initialSize = Number(app.sizeBytes || this.getAppSize(app.id, app.isPWA === true) || 0);
        const initialDataSize = Number(app.dataSizeBytes || 0);
        
        container.className = 'settings-content settings-secondary-page';

        const section = document.createElement('div');
        section.className = 'settings-section app-detail-page';
        
        container.appendChild(this.createSecondaryBackBar(t('settings.applications'), () => {
            // 播放滑出动画
            section.classList.add('slide-out');
            setTimeout(() => {
                const detailId = this.currentAppDetail?.id;
                this.navigateToPage('applications', {
                    delay: 420,
                    after: () => {
                        if (this.currentAppDetail?.id === detailId) this.currentAppDetail = null;
                    }
                });
            }, 280);
        }));
        
        // 应用信息卡片
        const infoCard = document.createElement('div');
        infoCard.className = 'fluent-setting-item settings-static-card app-info-card';
        infoCard.innerHTML = `
            <div class="app-detail-info-card">
                <img src="${app.icon}" class="app-detail-icon" alt="${app.name}">
                <div class="app-detail-info">
                    <div class="app-detail-name">${app.name}</div>
                    <div class="app-detail-version">${t('settings.version')} ${this.getAppVersion(app.id)}</div>
                    <div class="app-detail-developer">${isSystem ? 'RakkoWorkPlace-Next' : t('settings.third-party-dev')}</div>
                </div>
            </div>
        `;
        section.appendChild(infoCard);
        
        // 存储信息
        const storageCard = document.createElement('div');
        storageCard.className = 'fluent-setting-item settings-static-card app-storage-card';
        storageCard.innerHTML = `
            <div class="app-storage-info">
                <div class="app-storage-row">
                    <span>${t('settings.app-size')}</span>
                    <span data-storage-value="app">${FluentOSStorage.formatBytes(initialSize)}</span>
                </div>
                <div class="app-storage-divider"></div>
                <div class="app-storage-row">
                    <span>${t(app.id === 'files' ? 'settings.documents-data' : 'settings.app-data')}</span>
                    <span data-storage-value="data">${FluentOSStorage.formatBytes(initialDataSize)}</span>
                </div>
                <div class="app-storage-divider"></div>
                <div class="app-storage-row app-storage-total">
                    <span>${t('settings.app-total')}</span>
                    <span data-storage-value="total">${FluentOSStorage.formatBytes(initialSize + initialDataSize)}</span>
                </div>
            </div>
        `;
        section.appendChild(storageCard);
        
        // 应用介绍
        const descCard = document.createElement('div');
        descCard.className = 'fluent-setting-item settings-static-card';
        descCard.innerHTML = `
            <div class="app-desc-card">
                <div class="app-desc-title">${t('settings.app-intro')}</div>
                <p class="app-desc-text">${app.desc}</p>
            </div>
        `;
        section.appendChild(descCard);
        
        // 修复按钮 - 使用统一 Fluent 按钮和高光系统
        const repairHost = document.createElement('div');
        repairHost.className = 'app-action-host';
        repairHost.appendChild(FluentUI.Button({
            text: t('settings.repair-app'),
            variant: 'secondary',
            className: 'app-detail-action app-detail-repair',
            disabled: this.isAppRepairing(app.id),
            onClick: () => {
                this._ensureAppClosed(app.id, app.name, t('settings.repair'), () => this.repairApp(app));
            }
        }));
        section.appendChild(repairHost);
        
        const repairDesc = document.createElement('p');
        repairDesc.className = 'app-action-desc';
        repairDesc.textContent = t('settings.repair-desc');
        section.appendChild(repairDesc);
        
        // 卸载按钮
        const uninstallHost = document.createElement('div');
        uninstallHost.className = 'app-action-host';
        uninstallHost.appendChild(FluentUI.Button({
            text: isSystem ? t('settings.uninstall-app') : t('settings.delete-app'),
            variant: canUninstall ? 'danger' : 'secondary',
            className: 'app-detail-action app-detail-uninstall',
            disabled: !canUninstall,
            onClick: !canUninstall ? null : () => {
                this._ensureAppClosed(app.id, app.name, t('settings.uninstall'), () => {
                    FluentUI.Dialog({
                        title: t('settings.confirm-uninstall'),
                        content: t('settings.confirm-uninstall-msg', { name: app.name }),
                        type: 'warning',
                        buttons: [
                            { text: t('cancel'), variant: 'secondary' },
                            { text: t('settings.uninstall'), variant: 'danger', value: 'uninstall' }
                        ],
                        onClose: async (result) => {
                            if (result === 'uninstall') {
                                let success = true;
                                if (typeof AppShop !== 'undefined' && AppShop.uninstallApp) {
                                    success = await AppShop.uninstallApp(app.id, {
                                        skipConfirm: true,
                                        skipRunningCheck: true
                                    });
                                }
                                if (success === false) return;
                                this.currentPage = 'applications';
                                this.currentAppDetail = null;
                                this.render();
                            }
                        }
                    });
                });
            }
        }));
        section.appendChild(uninstallHost);
        
        const uninstallDesc = document.createElement('p');
        uninstallDesc.className = 'app-action-desc';
        uninstallDesc.textContent = canUninstall ? t('settings.uninstall-desc') : t('settings.system-app-no-uninstall');
        if (canUninstall) uninstallDesc.classList.add('app-action-desc-danger');
        section.appendChild(uninstallDesc);
        
        container.appendChild(section);

        if (globalThis.FluentOSStorage) {
            const applySnapshot = (snapshot) => {
                if (!storageCard.isConnected || this.currentPage !== 'app-detail' || this.currentAppDetail?.id !== app.id) return;
                if (!snapshot) return;
                const values = snapshot.apps[app.id] || { appSizeBytes: initialSize, dataSizeBytes: 0 };
                app.sizeBytes = values.appSizeBytes;
                app.dataSizeBytes = values.dataSizeBytes;
                storageCard.querySelector('[data-storage-value="app"]').textContent = FluentOSStorage.formatBytes(values.appSizeBytes);
                storageCard.querySelector('[data-storage-value="data"]').textContent = values.dataAvailable === false
                    ? t('settings.storage-unknown')
                    : FluentOSStorage.formatBytes(values.dataSizeBytes);
                storageCard.querySelector('[data-storage-value="total"]').textContent = values.dataAvailable === false
                    ? t('settings.storage-unknown')
                    : FluentOSStorage.formatBytes(values.appSizeBytes + values.dataSizeBytes);
            };
            if (this._lastStorageSnapshot) applySnapshot(this._lastStorageSnapshot);
            else this.getPreparedStorageSnapshot().then(applySnapshot);
        }
    },
    
    // 修复应用
    repairApp(app) {
        // 检查是否已在修复中
        if (this.repairingApps.includes(app.id)) {
            FluentUI.Toast({ title: app.name, message: t('settings.app-repairing'), type: 'warning' });
            return;
        }
        
        // 添加到修复列表
        this.repairingApps.push(app.id);
        
        // 显示开始修复通知
        FluentUI.Toast({
            title: app.name,
            message: t('settings.app-repairing-start'),
            type: 'info',
            duration: 5000
        });

        // 触发修复状态变化事件
        State.emit('appRepairStart', app.id);
        
        // 10秒后完成修复
        setTimeout(() => {
            let repaired = true;
            try {
                if (app.isPWA === true && typeof AppShop !== 'undefined') {
                    const catalogApp = AppShop.apps.find(item => item.id === app.id);
                    if (typeof PWALoader !== 'undefined') PWALoader.unregister(app.id);
                    repaired = !!catalogApp && AppShop.ensureAppRegistered(catalogApp) !== false;
                } else if (typeof WindowManager !== 'undefined') {
                    repaired = !!WindowManager.appConfigs?.[app.id];
                }
            } catch (error) {
                console.error('[SettingsApp] App repair failed', error);
                repaired = false;
            }
            // 从修复列表移除
            this.repairingApps = this.repairingApps.filter(id => id !== app.id);
            
            // 显示修复完成通知
            FluentUI.Toast({ 
                title: app.name, 
                message: repaired ? t('settings.app-repaired') : t('settings.storage-unavailable'),
                type: repaired ? 'success' : 'error'
            });
            
            // 触发修复完成事件
            State.emit('appRepairEnd', app.id);
        }, 10000);
    },
    
    // 检查应用是否正在修复
    isAppRepairing(appId) {
        return this.repairingApps.includes(appId);
    },

    // 检查应用是否有正在运行的窗口
    _isAppRunning(appId) {
        if (typeof WindowManager === 'undefined') return false;
        return WindowManager.windows.some(w => w.appId === appId);
    },

    // 关闭指定应用的所有窗口
    _forceCloseApp(appId) {
        if (typeof WindowManager === 'undefined') return;
        const wins = WindowManager.windows.filter(w => w.appId === appId);
        wins.forEach(w => WindowManager.closeWindow(w.id));
    },

    // 如果应用正在运行，弹出确认对话框；否则直接执行回调
    _ensureAppClosed(appId, appName, actionLabel, callback) {
        if (!this._isAppRunning(appId)) {
            callback();
            return;
        }
        FluentUI.Dialog({
            title: t('settings.app-running', { name: appName }),
            content: t('settings.app-running-msg', { action: actionLabel, name: appName }),
            type: 'warning',
            buttons: [
                { text: t('cancel'), variant: 'secondary' },
                { text: t('settings.end-process'), variant: 'danger', value: 'confirm' }
            ],
            onClose: (result) => {
                if (result === 'confirm') {
                    this._forceCloseApp(appId);
                    // 等窗口关闭动画结束后再执行操作
                    setTimeout(() => callback(), 300);
                }
            }
        });
    },

});
