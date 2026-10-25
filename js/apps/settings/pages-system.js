/**
 * SettingsApp 页面实现分片 - 系统页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「系统」页面成员
 * （renderNetwork、renderTimeLanguage、renderMultitask、renderPrivacy），
 * 必须紧跟在 js/apps/settings.js 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    renderNetwork(container) {
        container.className = 'settings-content settings-network';
        
        // 顶部以太网状态卡片
        const ethernetHero = document.createElement('div');
        ethernetHero.className = 'network-hero-card';
        ethernetHero.innerHTML = `
            <div class="network-hero-icon">
                <img src="Theme/Icon/Symbol_icon/stroke/Ethernet.svg" alt="Ethernet">
            </div>
            <div class="network-hero-info">
                <h2>${t('settings.ethernet')} 4</h2>
                <div class="network-hero-status">
                    <span class="network-status-dot connected"></span>
                    <span>${t('settings.connected')}</span>
                </div>
            </div>
            <div class="network-hero-actions">
                <span class="network-hero-link">${t('properties')}</span>
                <span class="network-hero-link">${t('settings.data-usage')}</span>
            </div>
        `;
        container.appendChild(ethernetHero);
        
        // 网络选项列表
        const networkList = document.createElement('div');
        networkList.className = 'network-options-list';
        
        // 以太网选项
        const ethernetItem = document.createElement('div');
        ethernetItem.className = 'network-option-item';
        ethernetItem.innerHTML = `
            <div class="network-option-icon">
                <img src="Theme/Icon/Symbol_icon/stroke/Ethernet.svg" alt="">
            </div>
            <div class="network-option-info">
                <h4>${t('settings.ethernet')}</h4>
                <p>${t('settings.ethernet-desc')}</p>
            </div>
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow Right.svg" class="network-option-arrow" alt="">
        `;
        networkList.appendChild(ethernetItem);
        
        // 蓝牙选项（可展开）
        const btExpanded = State.settings.bluetoothExpanded || false;
        const btEnabled = State.settings.bluetoothEnabled !== false;
        
        const btItem = document.createElement('div');
        btItem.className = 'network-option-item network-option-expandable';
        btItem.innerHTML = `
            <div class="network-option-icon bluetooth-icon ${btEnabled ? 'enabled' : 'disabled'}">
                <img src="Theme/Icon/Symbol_icon/stroke/Bluetooth_${btEnabled ? 'open' : 'close'}.svg" alt="">
            </div>
            <div class="network-option-info">
                <h4>${t('settings.bluetooth-name')}</h4>
                <p>${btEnabled ? t('settings.bluetooth-on') : t('settings.bluetooth-off')}</p>
            </div>
            <img src="Theme/Icon/Symbol_icon/stroke/Arrow ${btExpanded ? 'Down' : 'Right'}.svg" class="network-option-arrow expand-arrow" alt="">
        `;
        btItem.addEventListener('click', (e) => {
            if (!e.target.closest('.fluent-toggle')) {
                State.updateSettings({ bluetoothExpanded: !btExpanded });
                this.render();
            }
        });
        networkList.appendChild(btItem);
        
        // 蓝牙展开内容
        if (btExpanded) {
            const btPanel = document.createElement('div');
            btPanel.className = 'network-expand-panel';
            
            // 蓝牙开关
            const btToggleRow = document.createElement('div');
            btToggleRow.className = 'network-expand-row';
            btToggleRow.innerHTML = `<span>${t('settings.bluetooth-name')}</span>`;
            const btToggle = FluentUI.Toggle({
                checked: btEnabled,
                onChange: (v) => {
                    State.updateSettings({ bluetoothEnabled: v });
                    this.addRecentSetting(t('settings.bluetooth-name'), v ? t('settings.on') : t('settings.off'), 'network');
                    State.addNotification({ title: t('settings.bluetooth-name'), message: v ? t('settings.bluetooth-enabled') : t('settings.bluetooth-disabled'), type: 'info' });
                    // 同步控制中心
                    if (typeof ControlCenter !== 'undefined') {
                        ControlCenter.updateTiles();
                    }
                    this.render();
                }
            });
            btToggleRow.appendChild(btToggle);
            btPanel.appendChild(btToggleRow);
            
            if (btEnabled) {
                // 设备发现
                const discoverRow = document.createElement('div');
                discoverRow.className = 'network-expand-row';
                discoverRow.innerHTML = `<span>${t('settings.device-discovery')}</span>`;
                discoverRow.appendChild(FluentUI.Toggle({ checked: true }));
                btPanel.appendChild(discoverRow);
                
                // 设备列表
                const deviceList = document.createElement('div');
                deviceList.className = 'network-device-list';
                deviceList.innerHTML = `
                    <div class="network-device-empty">
                        <img src="Theme/Icon/Symbol_icon/stroke/Bluetooth_open.svg" alt="">
                        <p>${t('settings.no-bt-device')}</p>
                        <span>${t('settings.no-bt-device-desc')}</span>
                    </div>
                `;
                btPanel.appendChild(deviceList);
            }
            
            networkList.appendChild(btPanel);
        }
        
        container.appendChild(networkList);
    },
    
    // 时间和语言页面
    renderTimeLanguage(container) {
        // 时间设置
        const timeSection = this.createSection(t('settings.time'));

        timeSection.appendChild(FluentUI.SettingItem({
            label: t('settings.auto-sync-time'),
            description: t('settings.auto-sync-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.autoSyncTime !== false,
                onChange: (v) => {
                    State.updateSettings({ autoSyncTime: v });
                    this.addRecentSetting(t('settings.auto-sync-time'), v ? t('settings.on') : t('settings.off'), 'time-language');
                    State.addNotification({ title: t('settings.time'), message: v ? t('settings.auto-sync-on') : t('settings.auto-sync-off'), type: 'info' });
                }
            })
        }));

        timeSection.appendChild(FluentUI.SettingItem({
            label: t('settings.use-local-time'),
            description: t('settings.use-local-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.useLocalTime === true,
                onChange: (v) => {
                    State.updateSettings({ useLocalTime: v });
                    this.addRecentSetting(t('settings.use-local-time'), v ? t('settings.on') : t('settings.off'), 'time-language');
                    State.addNotification({ title: t('settings.time'), message: v ? t('settings.local-time-on') : t('settings.local-time-off'), type: 'info' });
                }
            })
        }));

        container.appendChild(timeSection);

        // 语言设置
        const langSection = this.createSection(t('settings.language'));
        langSection.appendChild(FluentUI.SettingItem({
            label: t('settings.language.display'),
            description: t('settings.language.desc'),
            control: FluentUI.Select({
                options: [
                    { value: 'zh', label: t('settings.lang-zh') },
                    { value: 'en', label: 'English' }
                ],
                value: State.settings.language,
                onChange: (v) => {
                    I18n.setLanguage(v);
                    this.addRecentSetting(t('settings.language.display'), v === 'zh' ? t('settings.lang-zh') : 'English', 'time-language');
                    State.addNotification({ title: t('settings.language'), message: t('settings.language.changed'), type: 'info' });
                }
            })
        }));
        container.appendChild(langSection);
    },

    renderMultitask(container) {
        container.className = 'settings-content';
        const performanceSection = this.createSection(t('settings.performance-title'));

        performanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.tombstone-background'),
            description: t('settings.tombstone-background-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.tombstoneBackgroundEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ tombstoneBackgroundEnabled: v });
                    this.addRecentSetting(t('settings.tombstone-background'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.performance-title'),
                        message: v ? t('settings.tombstone-background-on') : t('settings.tombstone-background-off'),
                        type: 'info'
                    });
                }
            })
        }));

        container.appendChild(performanceSection);

        const section = this.createSection(t('settings.multitask-window-title'));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-quick-switch'),
            description: t('settings.multitask-quick-switch-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.quickWindowSwitchEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ quickWindowSwitchEnabled: v });
                    this.addRecentSetting(t('settings.multitask-quick-switch'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-quick-switch-on') : t('settings.multitask-quick-switch-off'),
                        type: 'info'
                    });
                    if (!v && typeof AppSwitcher !== 'undefined' && typeof AppSwitcher.close === 'function') {
                        AppSwitcher.close(false);
                    }
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-edge-snap'),
            description: t('settings.multitask-edge-snap-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.windowEdgeSnapEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ windowEdgeSnapEnabled: v });
                    this.addRecentSetting(t('settings.multitask-edge-snap'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-edge-snap-on') : t('settings.multitask-edge-snap-off'),
                        type: 'info'
                    });
                    if (!v && typeof WindowManager !== 'undefined' && typeof WindowManager._hideDragSnapHint === 'function') {
                        WindowManager._hideDragSnapHint(true);
                    }
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-hover-snap'),
            description: t('settings.multitask-hover-snap-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.windowHoverSnapEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ windowHoverSnapEnabled: v });
                    this.addRecentSetting(t('settings.multitask-hover-snap'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-hover-snap-on') : t('settings.multitask-hover-snap-off'),
                        type: 'info'
                    });
                    if (!v && typeof WindowManager !== 'undefined' && typeof WindowManager._hideAllSnapMenus === 'function') {
                        WindowManager._hideAllSnapMenus();
                    }
                }
            })
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.multitask-top-maximize'),
            description: t('settings.multitask-top-maximize-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.windowTopMaximizeEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ windowTopMaximizeEnabled: v });
                    this.addRecentSetting(t('settings.multitask-top-maximize'), v ? t('settings.on') : t('settings.off'), 'multitask');
                    State.addNotification({
                        title: t('settings.multitask-title'),
                        message: v ? t('settings.multitask-top-maximize-on') : t('settings.multitask-top-maximize-off'),
                        type: 'info'
                    });
                    if (!v && typeof WindowManager !== 'undefined' && typeof WindowManager._hideDragSnapHint === 'function') {
                        WindowManager._hideDragSnapHint(true);
                    }
                }
            })
        }));

        container.appendChild(section);
    },
    
    // 隐私页面（原系统页面）
    renderPrivacy(container) {
        // 安全设置
        const securitySection = this.createSection(t('settings.security'));
        securitySection.appendChild(FluentUI.SettingItem({
            label: t('settings.change-pin'),
            description: t('settings.change-pin.desc'),
            control: FluentUI.Button({
                text: t('settings.change-pin.btn'),
                variant: 'primary',
                onClick: () => {
                    FluentUI.InputDialog({
                        title: t('settings.change-pin.prompt'),
                        placeholder: t('settings.change-pin.placeholder'),
                        inputType: 'password',
                        minLength: 4,
                        maxLength: 10,
                        validateFn: (value) => {
                            if (value.length < 4) return t('settings.change-pin.error');
                            if (value.length > 10) return t('settings.change-pin.error');
                            return true;
                        },
                        confirmText: t('settings.confirm-pin'),
                        cancelText: t('cancel'),
                        onConfirm: (newPin) => {
                            State.updateSettings({ pin: newPin });
                            this.addRecentSetting(t('settings.change-pin'), t('settings.change-pin.success'), 'privacy');
                            FluentUI.Toast({
                                title: t('settings.security'),
                                message: t('settings.change-pin.success'),
                                type: 'success'
                            });
                        }
                    });
                }
            })
        }));
        container.appendChild(securitySection);

        // 隐私设置
        const privacySection = this.createSection(t('settings.privacy-title'));
        privacySection.appendChild(FluentUI.SettingItem({
            label: t('settings.location-service'),
            description: t('settings.location-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.locationEnabled !== false,
                onChange: (v) => {
                    State.updateSettings({ locationEnabled: v });
                    this.addRecentSetting(t('settings.location-service'), v ? t('settings.on') : t('settings.off'), 'privacy');
                    State.addNotification({ title: t('settings.privacy-title'), message: v ? t('settings.location-on') : t('settings.location-off'), type: 'info' });
                }
            })
        }));

        privacySection.appendChild(FluentUI.SettingItem({
            label: t('settings.file-upload'),
            description: t('settings.file-upload-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableExternalFileImport === true,
                onChange: (v) => {
                    State.updateSettings({ enableExternalFileImport: v });
                    this.addRecentSetting(t('settings.file-upload'), v ? t('settings.on') : t('settings.off'), 'privacy');
                    State.addNotification({
                        title: t('settings.privacy-title'),
                        message: v ? t('settings.file-upload-on') : t('settings.file-upload-off'),
                        type: 'info'
                    });
                }
            })
        }));

        const strictCspItem = FluentUI.SettingItem({
            label: t('settings.strict-csp'),
            description: t('settings.strict-csp-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.strictCspEnabled === true,
                onChange: (v) => {
                    const updates = { strictCspEnabled: v };
                    if (!v && State.settings.fingoCustomMode) {
                        updates.fingoCustomMode = false;
                        // Keep last custom-mode preference so startup CSP restore can recover it.
                        updates.fingoCustomLastEnabled = true;
                    }
                    State.updateSettings(updates);
                    this.addRecentSetting(t('settings.strict-csp'), v ? t('settings.on') : t('settings.off'), 'privacy');
                    State.addNotification({
                        title: t('settings.privacy-title'),
                        message: v ? t('settings.strict-csp-on') : t('settings.strict-csp-off'),
                        type: 'info'
                    });
                }
            })
        });
        strictCspItem.dataset.settingId = 'privacy-strict-csp';
        privacySection.appendChild(strictCspItem);
        container.appendChild(privacySection);
    },

});
