// Web Configurator JavaScript
// MacroPass - FIDO2 + macropad configuration interface

let port = null;
let reader = null;
let writer = null;
let isConnected = false;

let loadedMacros = new Array(12).fill(null);
let originalMacros = new Array(12).fill(null);
let customKeyNames = new Array(12).fill(null);
let sequenceSteps = Array.from({ length: 12 }, () => ({ windows: [], mac: [] }));
let ledColors = Array.from({ length: 6 }, () => '#000032');
let deviceBrightness = 50;
let logEntries = [];

let selectedMacroIndex = 0;
let activeDeviceOS = 'win';
let activeTab = 'macros';

let serialBuffer = '';
let listParsingState = 'idle';
let deviceSequences = {};
let appShell = null;
let saveStateKind = 'neutral';
let saveStateText = 'Waiting for Device';

const keyNames = {
    4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G', 11: 'H',
    12: 'I', 13: 'J', 14: 'K', 15: 'L', 16: 'M', 17: 'N', 18: 'O', 19: 'P',
    20: 'Q', 21: 'R', 22: 'S', 23: 'T', 24: 'U', 25: 'V', 26: 'W', 27: 'X',
    28: 'Y', 29: 'Z', 30: '1', 31: '2', 32: '3', 33: '4', 34: '5', 35: '6',
    36: '7', 37: '8', 38: '9', 39: '0', 40: 'Enter', 41: 'Esc', 42: 'Backspace',
    43: 'Tab', 44: 'Space', 45: '-', 46: '=', 47: '[', 48: ']', 49: '\\',
    51: ';', 52: '\'', 53: '`', 54: ',', 55: '.', 56: '/', 57: 'Caps Lock',
    58: 'F1', 59: 'F2', 60: 'F3', 61: 'F4', 62: 'F5', 63: 'F6', 64: 'F7',
    65: 'F8', 66: 'F9', 67: 'F10', 68: 'F11', 69: 'F12', 70: 'Print Screen',
    71: 'Scroll Lock', 72: 'Pause', 73: 'Insert', 74: 'Home', 75: 'Page Up',
    76: 'Delete', 77: 'End', 78: 'Page Down', 79: 'Right Arrow', 80: 'Left Arrow',
    81: 'Down Arrow', 82: 'Up Arrow', 205: 'Play'
};

const modifierOptions = [
    { value: 1, label: 'Ctrl' },
    { value: 2, label: 'Shift' },
    { value: 4, label: 'Alt' },
    { value: 8, label: 'Win/Cmd' }
];

const tabItems = [
    { key: 'macros', panelId: 'tabMacros', label: 'Macros' },
    { key: 'lighting', panelId: 'tabLighting', label: 'Lighting' },
    { key: 'security', panelId: 'tabSecurity', label: 'Security' },
    { key: 'device', panelId: 'tabDevice', label: 'Device' },
    { key: 'logs', panelId: 'tabLogs', label: 'Logs' }
];

function buildKeyOptions() {
    return Object.keys(keyNames)
        .map((code) => ({ value: parseInt(code, 10), label: keyNames[code] }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

function buildKeyOptionMarkup(selectedKeycode = 0) {
    const selectedValue = parseInt(selectedKeycode, 10) || 0;
    const options = ['<option value="0">Select key</option>'];

    for (const option of buildKeyOptions()) {
        const selected = selectedValue === option.value ? ' selected' : '';
        options.push(`<option value="${option.value}"${selected}>${option.label}</option>`);
    }

    return options.join('');
}

function macroPassApp() {
    return {
        session: {
            connected: false,
            save: {
                kind: 'neutral',
                text: 'Waiting for Device'
            }
        },
        device: {
            os: 'win',
            brightness: 50
        },
        tabs: {
            active: 'macros',
            items: tabItems.map((tab) => ({ ...tab }))
        },
        macros: {
            selectedKey: 0,
            scope: 'windows',
            modifierOptions: modifierOptions.map((modifier) => ({ ...modifier })),
            keyOptions: buildKeyOptions(),
            selected: {
                index: 0,
                name: '',
                title: 'Key 1',
                type: 4,
                steps: [],
                previewLines: [],
                hasChanges: false,
                canSave: false,
                scopeLabel: '(Windows)'
            },
            keys: Array.from({ length: 12 }, (_, i) => ({
                index: i,
                label: `K${String(i + 1).padStart(2, '0')}`,
                meta: `Key ${i + 1}`,
                disabled: false
            }))
        },
        lighting: {
            zones: Array.from({ length: 6 }, (_, i) => ({
                index: i,
                label: `LED ${i}`,
                color: ledColors[i]
            }))
        },
        logs: [],
        init() {
            appShell = this;
            syncShellState();
        },
        getKeyOptionMarkup(selectedKeycode) {
            return buildKeyOptionMarkup(selectedKeycode);
        },
        setTab(tabId) {
            window.setActiveTab(tabId);
        },
        previewBrightness(value) {
            window.handleBrightnessPreview(value);
        },
        async toggleConnection() {
            await window.handleConnectionToggle();
        },
        async selectOSProfile(os) {
            await window.selectOS(os);
        },
        selectMacroKey(index) {
            window.selectMacro(index);
        },
        setMacroScope(scope) {
            window.setActiveMacroScope(scope, this.macros.selectedKey);
        },
        setKeyName(value) {
            window.updateKeyName(this.macros.selectedKey, value);
        },
        setMacroType(value) {
            window.setMacroTypeForIndex(this.macros.selectedKey, value);
        },
        addSequenceStep(stepType) {
            window.addSequenceStep(this.macros.selectedKey, stepType);
        },
        moveSequenceStep(stepId, direction) {
            window.moveSequenceStep(this.macros.selectedKey, stepId, direction);
        },
        removeSequenceStep(stepId) {
            window.removeSequenceStep(this.macros.selectedKey, stepId);
        },
        toggleSequenceModifier(stepId, modifierValue, checked) {
            window.updateSequenceStepModifier(this.macros.selectedKey, stepId, modifierValue, checked);
        },
        updateSequenceKey(stepId, keyIndex, keycode) {
            window.updateSequenceStepKey(this.macros.selectedKey, stepId, keyIndex, keycode);
        },
        updateSequenceText(stepId, text) {
            window.updateSequenceStepText(this.macros.selectedKey, stepId, text);
        },
        updateSequenceDelay(stepId, value) {
            window.updateSequenceStepDelay(this.macros.selectedKey, stepId, value);
        },
        appendStepKey(stepId) {
            window.addStepKey(this.macros.selectedKey, stepId);
        },
        removeStepKey(stepId, keyIndex) {
            window.removeStepKey(this.macros.selectedKey, stepId, keyIndex);
        },
        async saveSelectedMacro() {
            await window.saveMacro(this.macros.selectedKey + 1);
        },
        resetSelectedMacro() {
            window.cancelMacroChanges(this.macros.selectedKey);
        },
        updateLedColor(index, color) {
            window.updateLedColor(index, color);
        },
        async applyLedColor(index) {
            await window.setLEDColor(index);
        },
        async applyColorToAll(index) {
            await window.setAllLEDColors(index);
        },
        async applyBrightness() {
            await window.setBrightness();
        },
        async refreshDeviceSettings() {
            await window.listSettings();
        },
        async resetDeviceDefaults() {
            await window.resetDefaults();
        },
        exportDeviceConfig() {
            window.exportConfig();
        },
        clearActivityLog() {
            window.clearLog();
        },
        get saveStateClass() {
            return `status-${this.session.save.kind === 'saved' ? 'saved' : this.session.save.kind === 'saving' ? 'saving' : this.session.save.kind === 'error' ? 'error' : 'neutral'}`;
        }
    };
}

window.macroPassApp = macroPassApp;

function syncShellState() {
    if (!appShell) return;
    appShell.session.connected = isConnected;
    appShell.session.save.kind = saveStateKind;
    appShell.session.save.text = saveStateText;
    appShell.device.os = activeDeviceOS;
    appShell.device.brightness = deviceBrightness;
    appShell.tabs.active = activeTab;
    appShell.macros.selectedKey = selectedMacroIndex;
    appShell.macros.keys = Array.from({ length: 12 }, (_, i) => {
        const config = getMacroConfig(i);
        return {
            index: i,
            label: getDisplayKeyLabel(i),
            meta: `Key ${i + 1}`,
            disabled: config.type === 0
        };
    });
    const selectedConfig = getMacroConfig(selectedMacroIndex);
    const selectedKeyName = selectedConfig.type === 4 ? getMacroName(selectedMacroIndex) : '';
    appShell.macros.selected = {
        index: selectedMacroIndex,
        name: selectedKeyName,
        title: `Key ${selectedMacroIndex + 1}${selectedKeyName ? ` / ${selectedKeyName}` : ''}`,
        type: selectedConfig.type,
        steps: JSON.parse(JSON.stringify(getStepBucket(selectedMacroIndex, appShell.macros.scope))),
        previewLines: getSequencePreviewLines(selectedMacroIndex),
        hasChanges: macroHasChanges(selectedMacroIndex),
        canSave: macroCanSave(selectedMacroIndex),
        scopeLabel: getScopeLabel(appShell.macros.scope)
    };
    appShell.lighting.zones = Array.from({ length: 6 }, (_, i) => ({
        index: i,
        label: `LED ${i}`,
        color: ledColors[i]
    }));
    appShell.logs = [...logEntries];
}

function ensureSequenceState(index) {
    if (!sequenceSteps[index]) {
        sequenceSteps[index] = { windows: [], mac: [] };
    }
    if (!sequenceSteps[index].windows) sequenceSteps[index].windows = [];
    if (!sequenceSteps[index].mac) sequenceSteps[index].mac = [];
}

function getMacroConfig(index) {
    ensureSequenceState(index);

    if (loadedMacros[index]) {
        const macro = JSON.parse(JSON.stringify(loadedMacros[index]));
        if (macro.type === 1 || macro.type === 2 || macro.type === 3) {
            macro.type = 4;
        }
        return macro;
    }

    return {
        type: 4,
        modifier: 0,
        keycode: 0,
        data: '',
        keyName: customKeyNames[index] ?? ''
    };
}

function getMacroName(index) {
    return (customKeyNames[index] ?? loadedMacros[index]?.keyName ?? '').trim();
}

function getDisplayKeyLabel(index, options = {}) {
    const { forOled = false } = options;
    const macroConfig = getMacroConfig(index);
    const currentType = macroConfig.type;

    if (currentType === 0) {
        return forOled ? '[X]' : `K${String(index + 1).padStart(2, '0')}`;
    }

    const explicit = getMacroName(index).trim();
    if (explicit) {
        return explicit.toUpperCase().slice(0, 4);
    }

    return `K${String(index + 1).padStart(2, '0')}`;
}

function getScopeLabel(scope) {
    return scope === 'windows'
        ? '(Windows)'
        : scope === 'mac'
            ? '(macOS)'
            : '(Same for Both)';
}

function initializeMacroOriginalState(index) {
    const macroConfig = getMacroConfig(index);
    const keyName = getMacroName(index);

    originalMacros[index] = {
        type: macroConfig.type,
        modifier: macroConfig.modifier || 0,
        keycode: macroConfig.keycode || 0,
        data: macroConfig.data || '',
        keyName,
        sequenceSteps: JSON.parse(JSON.stringify(sequenceSteps[index] || { windows: [], mac: [] }))
    };
}

function normalizeTabId(tabId) {
    if (!tabId) return 'macros';
    const normalized = tabId.startsWith('#') ? tabId.slice(1) : tabId;
    if (normalized.includes('tabMacros')) return 'macros';
    if (normalized.includes('tabLighting')) return 'lighting';
    if (normalized.includes('tabSecurity')) return 'security';
    if (normalized.includes('tabDevice')) return 'device';
    if (normalized.includes('tabLogs')) return 'logs';
    if (normalized === 'tabMacros') return 'macros';
    if (normalized === 'tabLighting') return 'lighting';
    if (normalized === 'tabSecurity') return 'security';
    if (normalized === 'tabDevice') return 'device';
    if (normalized === 'tabLogs') return 'logs';
    return normalized;
}

function setActiveTab(tabId, options = {}) {
    const normalized = normalizeTabId(tabId);
    activeTab = normalized;
    syncShellState();

    if (!isConnected && !options.force) {
        return;
    }

    const hashTarget = appShell?.tabs?.items?.find((tab) => tab.key === normalized)?.panelId || normalized;
    if (!options.skipHashUpdate && window.location.hash !== `#${hashTarget}`) {
        window.location.hash = hashTarget;
    }
}

function setSaveState(kind, text) {
    saveStateKind = kind;
    saveStateText = text;
    syncShellState();
}

function updateHeaderOSChip(os) {
    activeDeviceOS = os;
    syncShellState();
}

function updateConnectionStatus(connected) {
    isConnected = connected;
    if (connected) {
        updateHeaderOSChip(activeDeviceOS);
    }

    updateWorkspaceAvailability(connected);
    syncShellState();
}

function updateWorkspaceAvailability(connected) {
    if (connected) {
        setActiveTab(window.location.hash || activeTab || 'tabMacros', { skipHashUpdate: true, force: true });
    }

    syncShellState();
}

async function handleConnectionToggle() {
    if (isConnected || port) {
        await disconnectSerial();
        return;
    }

    await connectSerial();
}

window.handleConnectionToggle = handleConnectionToggle;

function getOledLabel(index) {
    return getDisplayKeyLabel(index, { forOled: true }).padEnd(4, ' ');
}

function renderOledPreview() {
    syncShellState();
}

function hexToRgb(hexColor) {
    const safeHex = String(hexColor || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) {
        return { r: 56, g: 189, b: 248 };
    }

    return {
        r: parseInt(safeHex.slice(0, 2), 16),
        g: parseInt(safeHex.slice(2, 4), 16),
        b: parseInt(safeHex.slice(4, 6), 16)
    };
}

function updateBrightnessLabel(value) {
    deviceBrightness = Math.max(0, Math.min(255, parseInt(value, 10) || 0));
    syncShellState();
}

function renderLightingPreview() {
    const previewBar = document.getElementById('lightingPreviewBar');
    if (!previewBar) return;

    const brightness = deviceBrightness;
    const glow = 0.2 + (brightness / 255) * 0.8;
    const state = document.getElementById('lightingPreviewState');
    if (state) state.textContent = `Static ${Math.round((brightness / 255) * 100)}%`;

    Array.from(previewBar.children).forEach((segment, index) => {
        const color = ledColors[index] || '#38bdf8';
        const { r, g, b } = hexToRgb(color);
        segment.style.background = `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, ${0.22 + glow * 0.5}), rgba(${r}, ${g}, ${b}, ${0.08 + glow * 0.18}))`;
        segment.style.boxShadow = `0 0 ${10 + glow * 12}px rgba(${r}, ${g}, ${b}, ${0.15 + glow * 0.35}), inset 0 0 0 1px rgba(255, 255, 255, 0.03)`;
        segment.style.opacity = `${0.45 + glow * 0.55}`;
    });
}

function handleBrightnessPreview(value) {
    updateBrightnessLabel(value);
    renderOledPreview();
    renderLightingPreview();
}

window.handleBrightnessPreview = handleBrightnessPreview;

function generateMacroCards() {
    for (let i = 0; i < 12; i++) {
        initializeMacroOriginalState(i);
    }

    syncShellState();
}

function selectMacro(index) {
    selectedMacroIndex = index;
    syncShellState();
}

function getActiveMacroScope() {
    return appShell?.macros?.scope || 'windows';
}

function setActiveMacroScope(scope, index = selectedMacroIndex) {
    ensureSequenceState(index);
    if (scope === 'both') {
        sequenceSteps[index].mac = JSON.parse(JSON.stringify(sequenceSteps[index].windows));
    }
    if (appShell) {
        appShell.macros.scope = scope;
    }
    syncShellState();
    checkMacroChanges(index);
}

function updateKeyName(index, value) {
    const newName = String(value ?? '').slice(0, 12).trim();
    customKeyNames[index] = newName || null;
    syncShellState();
    renderOledPreview();
    checkMacroChanges(index);
}

window.updateKeyName = updateKeyName;

function setMacroTypeForIndex(index, value) {
    const macroType = parseInt(value, 10) || 0;
    const current = getMacroConfig(index);
    loadedMacros[index] = {
        ...current,
        type: macroType,
        keyName: getMacroName(index)
    };
    syncShellState();
    renderOledPreview();
    checkMacroChanges(index);
}

function updateMacroPadStatus() {
    syncShellState();
}

function getCurrentMacroState(index) {
    const type = parseInt(getMacroConfig(index).type ?? (originalMacros[index]?.type ?? 4), 10);
    const keyName = type === 4 ? getMacroName(index) : '';

    if (type === 4) {
        const currentWindowsSteps = sequenceSteps[index]?.windows || [];
        const currentMacSteps = sequenceSteps[index]?.mac || [];
        const originalWindowsSteps = originalMacros[index]?.sequenceSteps?.windows || [];
        const originalMacSteps = originalMacros[index]?.sequenceSteps?.mac || [];
        return {
            type,
            keyName,
            sequenceSteps: JSON.stringify({ windows: currentWindowsSteps, mac: currentMacSteps }),
            originalSequenceSteps: JSON.stringify({ windows: originalWindowsSteps, mac: originalMacSteps })
        };
    }

    return { type, modifier: 0, keycode: 0, data: '', keyName };
}

function sequenceHasAnySteps(index) {
    ensureSequenceState(index);
    const windowsCount = sequenceSteps[index]?.windows?.length || 0;
    const macCount = sequenceSteps[index]?.mac?.length || 0;
    return windowsCount > 0 || macCount > 0;
}

function macroHasChanges(index) {
    if (!originalMacros[index]) return false;

    const current = getCurrentMacroState(index);
    const original = originalMacros[index];

    let hasChanges = false;
    if (current.type === 4) {
        hasChanges = current.sequenceSteps !== current.originalSequenceSteps;
    } else if (current.type !== original.type) {
        hasChanges = true;
    }

    if ((current.keyName || '') !== (original.keyName || '')) {
        hasChanges = true;
    }

    return hasChanges;
}

function macroCanSave(index) {
    const current = getCurrentMacroState(index);
    if (current.type === 4 && !sequenceHasAnySteps(index)) {
        return false;
    }
    return macroHasChanges(index);
}

function checkMacroChanges(index) {
    macroHasChanges(index);
    syncShellState();
}

window.checkMacroChanges = checkMacroChanges;

function cancelMacroChanges(index) {
    const original = originalMacros[index];
    if (!original) return;

    customKeyNames[index] = original.keyName || null;
    sequenceSteps[index] = JSON.parse(JSON.stringify(original.sequenceSteps || { windows: [], mac: [] }));
    loadedMacros[index] = {
        ...(loadedMacros[index] || {}),
        type: original.type,
        modifier: original.modifier || 0,
        keycode: original.keycode || 0,
        data: original.data || '',
        keyName: original.keyName || ''
    };

    if (appShell) {
        appShell.macros.scope = 'windows';
    }
    syncShellState();
    renderOledPreview();
    setSaveState('neutral', 'Reset');
}

window.cancelMacroChanges = cancelMacroChanges;

function getStepPreview(step) {
    if (step.type === 'key') {
        const modifiers = [];
        if (step.modifiers?.includes(1)) modifiers.push('Ctrl');
        if (step.modifiers?.includes(2)) modifiers.push('Shift');
        if (step.modifiers?.includes(4)) modifiers.push('Alt');
        if (step.modifiers?.includes(8)) modifiers.push('Win/Cmd');

        const keys = (step.keys || [])
            .filter((code) => code && code !== 0)
            .map((code) => keyNames[code] || '?');

        return `${modifiers.length ? `${modifiers.join('+')}+` : ''}${keys.length ? keys.join('+') : '?'}`;
    }

    if (step.type === 'text') return `"${step.text || ''}"`;
    if (step.type === 'delay') return `${step.delay || 0}ms`;
    if (step.type === 'release') return 'Release';
    return '';
}

function getSequencePreviewLines(index) {
    ensureSequenceState(index);
    const winSteps = sequenceSteps[index].windows;
    const macSteps = sequenceSteps[index].mac;

    if (winSteps.length === 0 && macSteps.length === 0) {
        return [];
    }

    const parts = [];
    if (winSteps.length > 0) {
        parts.push({ label: 'Windows', text: winSteps.map(getStepPreview).join(' -> ') });
    }
    if (macSteps.length > 0) {
        parts.push({ label: 'macOS', text: macSteps.map(getStepPreview).join(' -> ') });
    }
    return parts;
}

function updateSequencePreview(index) {
    getSequencePreviewLines(index);
    syncShellState();
}

function getStepBucket(index, scope = getActiveMacroScope()) {
    ensureSequenceState(index);
    if (scope === 'both') {
        return sequenceSteps[index].windows;
    }
    return scope === 'mac' ? sequenceSteps[index].mac : sequenceSteps[index].windows;
}

function mirrorIfNeeded(index, scope = getActiveMacroScope()) {
    if (scope === 'both') {
        sequenceSteps[index].mac = JSON.parse(JSON.stringify(sequenceSteps[index].windows));
    }
}

function addSequenceStep(index, stepType) {
    ensureSequenceState(index);
    const step = { id: Date.now() + Math.random(), type: stepType };

    if (stepType === 'key') {
        step.modifiers = [];
        step.keys = [0];
        step.keycode = 0;
    } else if (stepType === 'text') {
        step.text = '';
    } else if (stepType === 'delay') {
        step.delay = 200;
    }

    const scope = getActiveMacroScope();
    const bucket = getStepBucket(index, scope);
    bucket.push(step);
    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function removeSequenceStep(index, stepId) {
    const scope = getActiveMacroScope();
    if (scope === 'both') {
        sequenceSteps[index].windows = sequenceSteps[index].windows.filter((step) => step.id !== stepId);
        mirrorIfNeeded(index, scope);
    } else if (scope === 'mac') {
        sequenceSteps[index].mac = sequenceSteps[index].mac.filter((step) => step.id !== stepId);
    } else {
        sequenceSteps[index].windows = sequenceSteps[index].windows.filter((step) => step.id !== stepId);
    }
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function moveSequenceStep(index, stepId, direction) {
    const scope = getActiveMacroScope();
    const bucket = getStepBucket(index, scope);
    const idx = bucket.findIndex((step) => step.id === stepId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
        [bucket[idx - 1], bucket[idx]] = [bucket[idx], bucket[idx - 1]];
    } else if (direction === 'down' && idx < bucket.length - 1) {
        [bucket[idx + 1], bucket[idx]] = [bucket[idx], bucket[idx + 1]];
    }

    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function updateSequenceStepModifier(index, stepId, modifierValue, checked) {
    const scope = getActiveMacroScope();
    const step = getStepBucket(index, scope).find((item) => item.id === stepId);
    if (!step) return;

    if (!step.modifiers) step.modifiers = [];
    if (checked && !step.modifiers.includes(modifierValue)) {
        step.modifiers.push(modifierValue);
    } else if (!checked) {
        step.modifiers = step.modifiers.filter((value) => value !== modifierValue);
    }

    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function updateSequenceStepKey(index, stepId, keyIndex, keycode) {
    const scope = getActiveMacroScope();
    const step = getStepBucket(index, scope).find((item) => item.id === stepId);
    if (!step) return;

    if (!Array.isArray(step.keys)) step.keys = [0];
    step.keys[keyIndex] = parseInt(keycode, 10);
    step.keycode = step.keys[0] || 0;

    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function updateSequenceStepText(index, stepId, text) {
    const scope = getActiveMacroScope();
    const step = getStepBucket(index, scope).find((item) => item.id === stepId);
    if (!step) return;
    step.text = text;
    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function updateSequenceStepDelay(index, stepId, value) {
    const scope = getActiveMacroScope();
    const step = getStepBucket(index, scope).find((item) => item.id === stepId);
    if (!step) return;
    const parsed = Math.min(5000, Math.max(0, parseInt(value, 10) || 0));
    step.delay = parsed;
    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function addStepKey(index, stepId) {
    const scope = getActiveMacroScope();
    const step = getStepBucket(index, scope).find((item) => item.id === stepId);
    if (!step) return;
    if (!Array.isArray(step.keys)) step.keys = [0];
    step.keys.push(0);
    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function removeStepKey(index, stepId, keyIndex) {
    const scope = getActiveMacroScope();
    const step = getStepBucket(index, scope).find((item) => item.id === stepId);
    if (!step || !Array.isArray(step.keys) || step.keys.length <= 1) return;
    step.keys.splice(keyIndex, 1);
    mirrorIfNeeded(index, scope);
    syncShellState();
    updateSequencePreview(index);
    checkMacroChanges(index);
}

function generateLEDConfig() {
    syncShellState();
    renderLightingPreview();
}

async function connectSerial() {
    try {
        if (!('serial' in navigator)) {
            log('Web Serial API not supported. Use Chrome or Edge.', 'error');
            return;
        }

        if (port || reader || writer) {
            await disconnectSerial();
        }

        const usbFilters = [
            { usbVendorId: 0x303A },
            { usbVendorId: 0x239A }
        ];

        let selectedPort;
        try {
            selectedPort = await navigator.serial.requestPort({ filters: usbFilters });
        } catch (filterErr) {
            log('No ESP32-S3 selected from filtered list, showing all ports...', 'info');
            selectedPort = await navigator.serial.requestPort();
        }

        port = selectedPort;
        await port.open({ baudRate: 115200 });

        writer = port.writable.getWriter();
        reader = port.readable.getReader();

        isConnected = true;
        updateConnectionStatus(true);
        setSaveState('neutral', 'Connected');
        log('Connected to MacroPass.', 'success');

        readSerial();
        setTimeout(() => sendCommand('LIST'), 500);
    } catch (err) {
        setSaveState('error', 'Connect Error');
        log(`Connection error: ${err.message}`, 'error');
    }
}

async function disconnectSerial() {
    if (!port) {
        log('Already disconnected.', 'info');
        return;
    }

    isConnected = false;
    updateConnectionStatus(false);

    try {
        if (reader) {
            try { await reader.cancel(); } catch (e) { /* ignore */ }
            try { reader.releaseLock(); } catch (e) { /* ignore */ }
            reader = null;
        }

        if (writer) {
            try { writer.releaseLock(); } catch (e) { /* ignore */ }
            writer = null;
        }

        try { await port.close(); } catch (e) { /* ignore */ }
        port = null;
    } catch (err) {
        log(`Disconnect error: ${err.message}`, 'error');
    } finally {
        serialBuffer = '';
        listParsingState = 'idle';
        setSaveState('neutral', 'Disconnected');
        log('Disconnected.', 'info');
    }
}

async function readSerial() {
    try {
        while (isConnected && reader) {
            const { value, done } = await reader.read();
            if (done) break;

            serialBuffer += new TextDecoder().decode(value);
            const lines = serialBuffer.split('\n');
            serialBuffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (parseListOutput(trimmed)) continue;
                log(`Device: ${trimmed}`, 'info');
            }
        }
    } catch (err) {
        if (isConnected) {
            setSaveState('error', 'Read Error');
            log(`Read error: ${err.message}`, 'error');
        }
    }
}

async function sendCommand(cmd) {
    if (!isConnected || !writer) {
        log('Not connected.', 'error');
        return false;
    }

    try {
        const data = new TextEncoder().encode(`${cmd}\n`);
        await writer.write(data);
        log(`Sent: ${cmd}`, 'info');
        return true;
    } catch (err) {
        setSaveState('error', 'Send Error');
        log(`Send error: ${err.message}`, 'error');
        return false;
    }
}

function log(message, type = 'info') {
    logEntries.push({
        type,
        text: `[${new Date().toLocaleTimeString()}] ${message}`
    });
    if (logEntries.length > 300) {
        logEntries = logEntries.slice(-300);
    }
    syncShellState();
    queueMicrotask(() => {
        const logDiv = document.getElementById('log');
        if (logDiv) {
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    });
}

function clearLog() {
    logEntries = [];
    syncShellState();
}

async function saveMacro(keyNum) {
    const idx = keyNum - 1;
    const currentConfig = getMacroConfig(idx);
    const type = String(currentConfig.type);
    const isSequenceType = currentConfig.type === 4;
    const currentName = isSequenceType ? getMacroName(idx) : '';
    const originalName = originalMacros[idx]?.keyName || '';

    if (!macroCanSave(idx)) {
        log(`Key ${keyNum} cannot be saved yet. Add at least one sequence step before saving.`, 'info');
        return;
    }

    setSaveState('saving', 'Saving...');

    try {
        if (currentName !== originalName && currentName.length > 0) {
            await sendCommand(`NAME ${keyNum} ${currentName}`);
            customKeyNames[idx] = currentName;
        }

        if (type === '4') {
            await saveSequenceMacro(keyNum, idx);
        } else {
            await sendCommand(`MACRO ${keyNum} ${type} 0 0`);
            customKeyNames[idx] = null;
            loadedMacros[idx] = {
                ...(loadedMacros[idx] || {}),
                type: parseInt(type, 10),
                modifier: 0,
                keycode: 0,
                data: '',
                keyName: ''
            };
            log(`Key ${keyNum} updated.`, 'success');
        }

        initializeMacroOriginalState(idx);
        renderOledPreview();
        checkMacroChanges(idx);
        setSaveState('saved', 'Saved Just Now');
    } catch (err) {
        setSaveState('error', 'Save Error');
        log(`Save error: ${err.message}`, 'error');
    }
}

async function saveSequenceMacro(keyNum, idx) {
    ensureSequenceState(idx);
    await sendCommand(`MACRO ${keyNum} 4 0 0`);

    const osTypes = ['windows', 'mac'];
    for (const os of osTypes) {
        const steps = sequenceSteps[idx][os];
        if (!steps || !steps.length) continue;

        const encoded = steps.map((step) => {
            if (step.type === 'key') {
                const modifier = step.modifiers ? step.modifiers.reduce((sum, value) => sum + value, 0) : 0;
                const keys = (step.keys || []).filter((value) => value && value !== 0).join(',') || '0';
                return `K:${modifier}:${keys}`;
            }
            if (step.type === 'text') return `T:${step.text || ''}`;
            if (step.type === 'delay') return `D:${step.delay || 200}`;
            return 'R';
        }).join('|');

        const osShort = os === 'windows' ? 'win' : 'mac';
        await sendCommand(`SEQUENCE ${keyNum} ${osShort} ${encoded}`);
        log(`Sequence macro ${keyNum} (${os}) saved: ${steps.length} steps`, 'success');
    }
}

async function setLEDColor(index) {
    const color = ledColors[index];
    if (!color) return;
    ledColors[index] = color;
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);

    setSaveState('saving', 'Saving...');
    await sendCommand(`LED ${index} ${r} ${g} ${b}`);
    syncShellState();
    renderLightingPreview();
    setSaveState('saved', `LED ${index} Saved`);
}

async function setAllLEDColors(sourceIndex) {
    const color = ledColors[sourceIndex];
    if (!color) return;
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);

    ledColors = ledColors.map(() => color);
    syncShellState();
    setSaveState('saving', 'Applying To All...');
    for (let i = 0; i < ledColors.length; i++) {
        await sendCommand(`LED ${i} ${r} ${g} ${b}`);
    }
    renderLightingPreview();
    setSaveState('saved', 'All LEDs Updated');
}

async function setBrightness() {
    const brightness = deviceBrightness;
    setSaveState('saving', 'Saving...');
    await sendCommand(`BRIGHTNESS ${brightness}`);
    renderOledPreview();
    renderLightingPreview();
    setSaveState('saved', 'Brightness Saved');
}

async function selectOS(os) {
    updateHeaderOSChip(os);
    setSaveState('saving', 'Saving...');
    await sendCommand(`OS ${os}`);
    renderOledPreview();
    setSaveState('saved', 'Profile Saved');
}

async function listSettings() {
    await sendCommand('LIST');
}

async function refreshSettings() {
    await sendCommand('LIST');
}

async function resetDefaults() {
    if (!confirm('Reset all device settings to defaults?')) return;
    setSaveState('saving', 'Resetting...');
    await sendCommand('RESET');
    setSaveState('saved', 'Reset Sent');
}

function exportConfig() {
    log('Export functionality is not implemented yet.', 'info');
}

function updateLedColor(index, color) {
    ledColors[index] = color;
    syncShellState();
    renderLightingPreview();
}

function parseSequenceString(seqStr) {
    if (!seqStr) return [];

    return seqStr.split('|').map((part, idx) => {
        const step = { id: Date.now() + Math.random() + idx };
        if (part.startsWith('K:')) {
            step.type = 'key';
            const [, modStr, keyStr] = part.split(':');
            const mod = parseInt(modStr, 10) || 0;
            step.modifiers = [];
            if (mod & 1) step.modifiers.push(1);
            if (mod & 2) step.modifiers.push(2);
            if (mod & 4) step.modifiers.push(4);
            if (mod & 8) step.modifiers.push(8);
            step.keys = (keyStr || '0').split(',').map((value) => parseInt(value, 10) || 0);
            step.keycode = step.keys[0] || 0;
        } else if (part.startsWith('T:')) {
            step.type = 'text';
            step.text = part.substring(2);
        } else if (part.startsWith('D:')) {
            step.type = 'delay';
            step.delay = parseInt(part.substring(2), 10) || 200;
        } else {
            step.type = 'release';
        }
        return step;
    }).filter((step) => step.type);
}

function parseListOutput(line) {
    if (line.includes('=== MACRO CONFIGURATION ===')) {
        listParsingState = 'macros';
        loadedMacros = new Array(12).fill(null);
        customKeyNames = new Array(12).fill(null);
        deviceSequences = {};
        return true;
    }

    if (line.includes('=== SEQUENCES ===')) {
        listParsingState = 'sequences';
        return true;
    }

    if (line.includes('=== LED COLORS ===')) {
        if (listParsingState === 'macros' || listParsingState === 'sequences') {
            updateUIWithLoadedMacros();
        }
        listParsingState = 'leds';
        return true;
    }

    if (listParsingState === 'leds') {
        const ledMatch = line.match(/^LED\s+(\d+):\s*RGB\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (ledMatch) {
            const idx = parseInt(ledMatch[1], 10);
            const r = parseInt(ledMatch[2], 10);
            const g = parseInt(ledMatch[3], 10);
            const b = parseInt(ledMatch[4], 10);
            const hex = `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
            ledColors[idx] = hex;
            syncShellState();
            renderLightingPreview();
            return true;
        }
    }

    if (line.startsWith('OS Mode:')) {
        const os = line.includes('macOS') ? 'mac' : 'win';
        activeDeviceOS = os;
        updateHeaderOSChip(os);
        renderOledPreview();
        return true;
    }

    if (line.startsWith('LED Brightness:')) {
        const val = parseInt(line.split(':')[1], 10) || 50;
        updateBrightnessLabel(val);
        renderOledPreview();
        renderLightingPreview();
        return true;
    }

    if (listParsingState === 'sequences') {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const keyNum = parseInt(line.substring(0, colonIdx), 10);
            if (!Number.isNaN(keyNum) && keyNum >= 1 && keyNum <= 12) {
                const rest = line.substring(colonIdx + 1);
                const osIdx = rest.indexOf(':');
                if (osIdx > 0) {
                    const os = rest.substring(0, osIdx);
                    const seqStr = rest.substring(osIdx + 1);
                    const idx = keyNum - 1;
                    if (!deviceSequences[idx]) deviceSequences[idx] = {};
                    deviceSequences[idx][os === 'mac' ? 'mac' : 'windows'] = parseSequenceString(seqStr);
                    return true;
                }
            }
        }
    }

    if (listParsingState === 'macros' && line.includes('|')) {
        const parts = line.split('|').map((part) => part.trim());
        const keyNum = parseInt(parts[0], 10);
        if (!Number.isNaN(keyNum) && keyNum >= 1 && keyNum <= 12) {
            const idx = keyNum - 1;
            const keyName = parts[1] || '';
            const typeStr = parts[2] || '';
            const modifier = parseInt(parts[3], 10) || 0;
            const keycode = parseInt(parts[4], 10) || 0;
            const data = parts[5] || '';
            let type = 0;
            if (typeStr.includes('KEYCOMBO')) type = 1;
            else if (typeStr.includes('STRING')) type = 2;
            else if (typeStr.includes('SPECIAL')) type = 3;
            else if (typeStr.includes('SEQUENCE')) type = 4;
            loadedMacros[idx] = { type, modifier, keycode, data, keyName };
            customKeyNames[idx] = keyName || null;
            return true;
        }
    }

    return false;
}

function updateUIWithLoadedMacros() {
    for (let i = 0; i < 12; i++) {
        if (deviceSequences[i]) {
            sequenceSteps[i] = {
                windows: deviceSequences[i].windows || [],
                mac: deviceSequences[i].mac || []
            };
        }
        initializeMacroOriginalState(i);
    }

    generateMacroCards();
    renderOledPreview();
    renderLightingPreview();
    const loadedCount = loadedMacros.filter((macro) => macro !== null).length;
    log(`Loaded ${loadedCount} macros from device.`, 'success');
}

Object.assign(window, {
    setActiveTab,
    handleConnectionToggle,
    selectMacro,
    setActiveMacroScope,
    updateKeyName,
    setMacroTypeForIndex,
    addSequenceStep,
    removeSequenceStep,
    moveSequenceStep,
    updateSequenceStepModifier,
    updateSequenceStepKey,
    updateSequenceStepText,
    updateSequenceStepDelay,
    addStepKey,
    removeStepKey,
    saveMacro,
    setLEDColor,
    setAllLEDColors,
    setBrightness,
    selectOS,
    listSettings,
    resetDefaults,
    exportConfig,
    clearLog,
    updateLedColor
});

function initUI() {
    generateMacroCards();
    generateLEDConfig();
    renderOledPreview();
    updateBrightnessLabel(deviceBrightness);
    renderLightingPreview();
    setSaveState('neutral', 'Waiting for Device');
    updateHeaderOSChip(activeDeviceOS);
    setActiveTab(window.location.hash || 'tabMacros', { skipHashUpdate: true, force: true });
}

function seedPreviewState() {
    isConnected = true;
    activeDeviceOS = 'win';
    deviceBrightness = 80;
    selectedMacroIndex = 11;
    customKeyNames[11] = 'COPYY';
    loadedMacros[11] = { type: 4, modifier: 0, keycode: 0, data: '', keyName: 'COPYY' };
    sequenceSteps[11] = {
        windows: [
            { id: 1, type: 'key', modifiers: [1, 2], keys: [6, 25], keycode: 6 },
            { id: 2, type: 'text', text: 'demo' },
            { id: 3, type: 'delay', delay: 250 },
            { id: 4, type: 'release' }
        ],
        mac: [
            { id: 11, type: 'key', modifiers: [8], keys: [6], keycode: 6 },
            { id: 12, type: 'release' }
        ]
    };
    ledColors = ['#0f172a', '#38bdf8', '#facc15', '#14b8a6', '#38bdf8', '#facc15'];
    generateMacroCards();
    updateConnectionStatus(true);
    setSaveState('saved', 'Preview Ready');
    if (appShell) {
        appShell.macros.scope = 'windows';
    }
    originalMacros[11] = {
        type: 4,
        modifier: 0,
        keycode: 0,
        data: '',
        keyName: 'COPYY',
        sequenceSteps: JSON.parse(JSON.stringify(sequenceSteps[11]))
    };
    syncShellState();
}

window.addEventListener('load', () => {
    initUI();
    if (window.location.search.includes('preview=connected') || window.location.hash.includes('previewConnected')) {
        seedPreviewState();
    } else {
        updateConnectionStatus(false);
    }
    renderOledPreview();
    renderLightingPreview();
    log('Configurator ready. Connect to MacroPass to unlock macros, lighting, device controls, and logs.', 'info');
});

window.addEventListener('hashchange', () => {
    setActiveTab(window.location.hash || 'tabMacros', { skipHashUpdate: true });
});
