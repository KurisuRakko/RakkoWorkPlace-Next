/**
 * SettingsApp 页面实现分片 - 实验室 / 开发者页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「实验室」与「开发者」
 * 页面成员（renderLab、renderDeveloper），必须紧跟在 js/apps/settings.js
 * 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    renderLab(container) {
        // 实验室标题
        const section = this.createSection(t('settings.lab-title'));
        
        // 实验性功能说明
        const notice = document.createElement('div');
        notice.className = 'lab-notice';
        notice.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Exclamation Triangle.svg" alt="" style="width: 20px; height: 20px; opacity: 0.7;">
            <span style="font-size: 13px; color: var(--text-secondary);">${t('settings.lab-notice')}</span>
        `;
        notice.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(255, 180, 0, 0.1); border-radius: var(--radius-md); margin-bottom: 16px;';
        section.appendChild(notice);

        // 开发者中心仍处于 BETA，其显示入口归入实验室管理。
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.hide-developer-center'),
            description: t('settings.hide-developer-center-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.hideDeveloperCenter !== false,
                onChange: (value) => {
                    State.updateSettings({ hideDeveloperCenter: value });
                    this.addRecentSetting(t('settings.hide-developer-center'), value ? t('settings.on') : t('settings.off'), 'lab');
                    State.addNotification({
                        title: t('settings.lab-title'),
                        message: value ? t('settings.developer-center-hidden') : t('settings.developer-center-visible'),
                        type: 'info'
                    });
                }
            })
        }));
        
        // 墓碑后台实验选项
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.tombstone-freeze-delay'),
            description: t('settings.tombstone-freeze-delay-desc'),
            control: this.createTombstoneFreezeDelayControl()
        }));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.tombstone-dim-frozen-apps'),
            description: t('settings.tombstone-dim-frozen-apps-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.tombstoneDimFrozenAppsEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ tombstoneDimFrozenAppsEnabled: v });
                    this.addRecentSetting(t('settings.tombstone-dim-frozen-apps'), v ? t('settings.on') : t('settings.off'), 'lab');
                    State.addNotification({
                        title: t('settings.lab-title'),
                        message: v ? t('settings.tombstone-dim-frozen-apps-on') : t('settings.tombstone-dim-frozen-apps-off'),
                        type: 'info'
                    });
                }
            })
        }));

        const experimentalToggles = [
            {
                key: 'enableSystemInteractionAudio',
                label: 'settings.lab-system-interaction-audio',
                description: 'settings.lab-system-interaction-audio-desc',
                enabledMessage: 'settings.lab-system-interaction-audio-on',
                disabledMessage: 'settings.lab-system-interaction-audio-off'
            },
            {
                key: 'enableCrossAppDragDrop',
                label: 'settings.lab-cross-app-drop',
                description: 'settings.lab-cross-app-drop-desc',
                enabledMessage: 'settings.lab-cross-app-drop-on',
                disabledMessage: 'settings.lab-cross-app-drop-off'
            },
            {
                key: 'enableAppMultiWindow',
                label: 'settings.lab-multi-window',
                description: 'settings.lab-multi-window-desc',
                enabledMessage: 'settings.lab-multi-window-on',
                disabledMessage: 'settings.lab-multi-window-off'
            }
        ];

        experimentalToggles.forEach((item) => {
            section.appendChild(FluentUI.SettingItem({
                label: t(item.label),
                description: t(item.description),
                control: FluentUI.Toggle({
                    checked: State.settings[item.key] === true,
                    onChange: (value) => {
                        State.updateSettings({ [item.key]: value });
                        this.addRecentSetting(t(item.label), value ? t('settings.on') : t('settings.off'), 'lab');
                        State.addNotification({
                            title: t('settings.lab-title'),
                            message: t(value ? item.enabledMessage : item.disabledMessage),
                            type: 'info',
                            playSound: item.key !== 'enableSystemInteractionAudio'
                        });
                    }
                })
            }));
        });

        // 强制始终实时模糊开关(默认关闭:桌面小组件使用静态模糊贴图降低 GPU 压力)
        section.appendChild(FluentUI.SettingItem({
            label: t('settings.lab-realtime-blur'),
            description: t('settings.lab-realtime-blur-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.forceRealtimeBlur === true,
                onChange: (v) => {
                    State.updateSettings({ forceRealtimeBlur: v });
                    this.addRecentSetting(t('settings.lab-realtime-blur'), v ? t('settings.on') : t('settings.off'), 'lab');
                    State.addNotification({
                        title: t('settings.lab-title'),
                        message: `${t('settings.lab-realtime-blur')}：${v ? t('settings.on') : t('settings.off')}`,
                        type: 'info'
                    });
                }
            })
        }));
        
        // ========== 灵翼交互 ==========
        const lingyiSection = this.createSection(t('settings.lingyi'));
        
        // 灵翼交互停维说明
        const lingyiNotice = document.createElement('div');
        lingyiNotice.className = 'lab-notice lingyi-notice';
        lingyiNotice.innerHTML = `
            <img src="Theme/Icon/Symbol_icon/stroke/Exclamation Triangle.svg" alt="" style="width: 20px; height: 20px; opacity: 0.8;">
            <span style="display:grid; gap:3px; font-size:13px; color:var(--text-secondary);"><strong style="color:#c42b1c;">${t('settings.lingyi-deprecated')}</strong><span>${t('settings.lingyi-notice')}</span></span>
        `;
        lingyiNotice.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: color-mix(in srgb, #c42b1c 9%, var(--bg-secondary)); border: 1px solid color-mix(in srgb, #c42b1c 24%, var(--border-color)); border-radius: var(--radius-md); margin-bottom: 16px;';
        lingyiSection.appendChild(lingyiNotice);
        
        // 灵翼交互主开关
        const lingyiEnabled = State.settings.lingyiEnabled || false;
        lingyiSection.appendChild(FluentUI.SettingItem({
            label: t('settings.lingyi-enable'),
            description: t('settings.lingyi-enable-desc'),
            control: FluentUI.Toggle({
                checked: lingyiEnabled,
                onChange: async (v) => {
                    try {
                        if (v) {
                            await LingYi.start();
                            State.addNotification({
                                title: t('settings.lingyi'),
                                message: t('settings.lingyi-started'),
                                type: 'success',
                                playSound: false
                            });
                        } else {
                            LingYi.stop();
                            State.addNotification({
                                title: t('settings.lingyi'),
                                message: t('settings.lingyi-stopped'),
                                type: 'info',
                                playSound: false
                            });
                        }
                        this.addRecentSetting(t('settings.lingyi'), v ? t('settings.on') : t('settings.off'), 'lab');
                        this.render(); // 刷新以更新选项状态
                    } catch (error) {
                        console.error('灵翼交互启动失败:', error);
                    }
                }
            })
        }));
        
        // 灵翼交互子选项（仅在启用时显示）
        if (lingyiEnabled && typeof LingYi !== 'undefined') {
            // 显示摄像头画面
            lingyiSection.appendChild(FluentUI.SettingItem({
                label: t('settings.lingyi-camera'),
                description: t('settings.lingyi-camera-desc'),
                control: FluentUI.Toggle({
                    checked: LingYi.options.showCamera,
                    onChange: (v) => {
                        LingYi.setOption('showCamera', v);
                        this.addRecentSetting(t('settings.lingyi-camera'), v ? t('settings.on') : t('settings.off'), 'lab');
                    }
                })
            }));

            // 显示代码实时显示
            lingyiSection.appendChild(FluentUI.SettingItem({
                label: t('settings.lingyi-code'),
                description: t('settings.lingyi-code-desc'),
                control: FluentUI.Toggle({
                    checked: LingYi.options.showCodePanel,
                    onChange: (v) => {
                        LingYi.setOption('showCodePanel', v);
                        this.addRecentSetting(t('settings.lingyi-code'), v ? t('settings.on') : t('settings.off'), 'lab');
                    }
                })
            }));
            
            // 状态指示器
            const statusContainer = document.createElement('div');
            statusContainer.className = 'fluent-setting-item';
            statusContainer.innerHTML = `
                <div class="fluent-setting-item-info">
                    <div class="fluent-setting-item-label">${t('settings.lingyi-status')}</div>
                    <div class="fluent-setting-item-desc">${t('settings.lingyi-status-desc')}</div>
                </div>
                <div class="fluent-setting-item-control">
                    <div class="lingyi-status-indicator">
                        <span class="lingyi-status-dot ${LingYi.enabled ? 'active' : ''}"></span>
                        <span>${LingYi.enabled ? t('settings.lingyi-running') : t('settings.lingyi-stopped-status')}</span>
                    </div>
                </div>
            `;
            lingyiSection.appendChild(statusContainer);
            
            // 使用说明
            const usageGuide = document.createElement('div');
            usageGuide.className = 'lingyi-usage-guide';
            usageGuide.style.cssText = 'padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-top: 12px;';
            usageGuide.innerHTML = `
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">${t('settings.lingyi-guide')}</div>
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary);">
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">☝️</span>
                        <span><strong>${t('settings.lingyi-move')}</strong> - ${t('settings.lingyi-move-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">👌</span>
                        <span><strong>${t('settings.lingyi-click')}</strong> - ${t('settings.lingyi-click-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: #ffa050; font-weight: 600;">🤏</span>
                        <span><strong>${t('settings.lingyi-rclick')}</strong> - ${t('settings.lingyi-rclick-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: #00ff64; font-weight: 600;">🖐️</span>
                        <span><strong>${t('settings.lingyi-scroll')}</strong> - ${t('settings.lingyi-scroll-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">↔️</span>
                        <span><strong>${t('settings.lingyi-resize')}</strong> - ${t('settings.lingyi-resize-desc')}</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <span style="color: var(--accent); font-weight: 600;">⤡</span>
                        <span><strong>${t('settings.lingyi-scale')}</strong> - ${t('settings.lingyi-scale-desc')}</span>
                    </div>
                </div>
            `;
            lingyiSection.appendChild(usageGuide);
        }
        
        container.appendChild(section);
        // 已停止维护的灵翼交互始终位于实验室最底部。
        container.appendChild(lingyiSection);
    },

    renderDeveloper(container) {
        container.className = 'settings-content';
        const section = this.createSection(t('settings.developer-title'));

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.debug-mode'),
            description: t('settings.debug-mode-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.debugModeEnabled === true,
                onChange: (v) => {
                    State.updateSettings({ debugModeEnabled: v });
                    this.addRecentSetting(t('settings.debug-mode'), v ? t('settings.on') : t('settings.off'), 'developer');
                    State.addNotification({
                        title: t('settings.developer-title'),
                        message: v ? t('settings.debug-mode-on') : t('settings.debug-mode-off'),
                        type: 'info'
                    });
                }
            })
        }));

        const appShopFeatureOptions = [
            { value: 'auto', label: '自动按日期切换' },
            ...Array.from({ length: 16 }, (_, index) => ({
                value: String(index + 1),
                label: `第 ${index + 1} 期精选`
            }))
        ];
        const currentAppShopPreview = Number(State.settings.appShopFeaturePreviewIndex);
        section.appendChild(FluentUI.SettingItem({
            label: 'App Shop 精选预览',
            description: '用于开发调试：手动选择 App Shop 首页展示第几期精选内容。',
            control: FluentUI.Select({
                options: appShopFeatureOptions,
                value: Number.isInteger(currentAppShopPreview) && currentAppShopPreview >= 1 && currentAppShopPreview <= 16
                    ? String(currentAppShopPreview)
                    : 'auto',
                onChange: (value) => {
                    const nextValue = value === 'auto' ? 'auto' : String(value);
                    State.updateSettings({ appShopFeaturePreviewIndex: nextValue });
                    this.addRecentSetting('App Shop 精选预览', value === 'auto' ? '自动' : `第 ${value} 期`, 'developer');
                    State.addNotification({
                        title: t('settings.developer-title'),
                        message: value === 'auto' ? 'App Shop 精选已恢复自动切换。' : `App Shop 精选已切换到第 ${value} 期。`,
                        type: 'info'
                    });
                }
            })
        }));

        container.appendChild(section);
    },
    
});
