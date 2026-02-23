import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";
import { delay } from "../../../utils.js";

const MODULE_NAME = 'CT-BoundaryHiddenMessagesCount';
const extensionFolderPath = `scripts/extensions/third-party/${MODULE_NAME}`;

// Initialize the extension
const init = () => {
    const leftSendForm = document.getElementById('leftSendForm');
    if (!leftSendForm) {
        console.error(`[${MODULE_NAME}] Could not find #leftSendForm element`);
        return;
    }

    // Create trigger button with ghost icon
    const trigger = document.createElement('div');
    {
        trigger.id = 'ctbhmc--trigger';
        trigger.classList.add('ctbhmc--trigger');
        trigger.classList.add('fa-solid', 'fa-fw', 'fa-ghost');
        trigger.classList.add('interactable');
        trigger.tabIndex = 0;
        trigger.title = 'Hidden Messages Overview';
        trigger.addEventListener('click', () => {
            panel.classList.toggle('ctbhmc--isActive');
            if (panel.classList.contains('ctbhmc--isActive')) {
                updatePanel();
            }
        });
        leftSendForm.append(trigger);
    }

    // Create panel for displaying messages list
    const panel = document.createElement('div');
    {
        panel.id = 'ctbhmc--panel';
        panel.classList.add('ctbhmc--panel');
        panel.innerHTML = 'Loading...';
        document.body.append(panel);
    }

    let currentBadgeValue = '';
    let isUpdating = false;

    /**
     * Get all hidden messages except System Instruction messages
     * @returns {{hiddenMessages: Array, boundaries: Array, totalCount: number}}
     */
    const getHiddenMessagesData = () => {
        const context = getContext();
        const allMessages = context.chat || [];
        const hiddenMessages = [];
        const boundaries = [];
        let lastWasHidden = false;

        for (let i = 0; i < allMessages.length; i++) {
            const msg = allMessages[i];
            const isHidden = msg.is_system === true;
            
            // Check if it's a System Instruction message (exclude from count)
            const isSystemInstruction = isHidden && 
                msg.name === 'Instruction' && 
                msg.extra?.type === 'narrator';

            if (isHidden && !isSystemInstruction) {
                hiddenMessages.push(i);
            }

            // Track boundaries (first unhidden after hidden section)
            if (!isHidden && lastWasHidden) {
                boundaries.push(i);
            }

            lastWasHidden = isHidden;
        }

        return {
            hiddenMessages,
            boundaries,
            totalCount: hiddenMessages.length
        };
    };

    /**
     * Group consecutive message IDs into ranges
     * @param {Array<number>} messageIds
     * @returns {Array<{start: number, end: number}>}
     */
    const groupIntoRanges = (messageIds) => {
        if (messageIds.length === 0) return [];
        
        const ranges = [];
        let rangeStart = messageIds[0];
        let rangeEnd = messageIds[0];

        for (let i = 1; i < messageIds.length; i++) {
            if (messageIds[i] === rangeEnd + 1) {
                rangeEnd = messageIds[i];
            } else {
                ranges.push({ start: rangeStart, end: rangeEnd });
                rangeStart = messageIds[i];
                rangeEnd = messageIds[i];
            }
        }
        ranges.push({ start: rangeStart, end: rangeEnd });
        
        return ranges;
    };

    /**
     * Navigate to a specific message
     * @param {number} mesId Message ID
     * @param {string} position 'start' or 'end' for ranges
     */
    const navigateToMessage = (mesId, position = 'start') => {
        const targetElement = $(`.mes[mesid="${mesId}"]`);
        
        if (targetElement.length > 0) {
            targetElement[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight briefly
            targetElement.addClass('ctbhmc--highlight');
            setTimeout(() => {
                targetElement.removeClass('ctbhmc--highlight');
            }, 2000);
            
            toastr.success(`Navigated to message #${mesId}`, MODULE_NAME);
        } else {
            // Message not loaded - scroll to top to load more messages
            $('#chat').animate({ scrollTop: 0 }, 'smooth');
            toastr.info(`Message #${mesId} not loaded. Scroll to top and click "Show More Messages" to load earlier messages.`, MODULE_NAME);
        }
    };

    /**
     * Create a message entry element
     * @param {number|Object} messageData Message ID or range object
     * @param {boolean} isRange Whether this is a range
     * @returns {HTMLElement}
     */
    const createMessageEntry = (messageData, isRange = false) => {
        const entry = document.createElement('div');
        entry.classList.add('ctbhmc--entry');

        if (isRange) {
            const { start, end } = messageData;
            const text = document.createElement('span');
            text.textContent = `Messages #${start} - #${end}`;
            entry.appendChild(text);

            const navButtons = document.createElement('div');
            navButtons.classList.add('ctbhmc--nav-buttons');

            const startBtn = document.createElement('button');
            startBtn.classList.add('ctbhmc--nav-btn', 'menu_button');
            startBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Start';
            startBtn.title = `Navigate to message #${start}`;
            startBtn.addEventListener('click', () => navigateToMessage(start, 'start'));

            const endBtn = document.createElement('button');
            endBtn.classList.add('ctbhmc--nav-btn', 'menu_button');
            endBtn.innerHTML = 'End <i class="fa-solid fa-arrow-right"></i>';
            endBtn.title = `Navigate to message #${end}`;
            endBtn.addEventListener('click', () => navigateToMessage(end, 'end'));

            navButtons.appendChild(startBtn);
            navButtons.appendChild(endBtn);
            entry.appendChild(navButtons);
        } else {
            // Get message content for preview
            const context = getContext();
            const message = context.chat[messageData];
            const messageContent = message?.mes || '';
            const preview = messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : '');
            
            const messageInfo = document.createElement('div');
            messageInfo.classList.add('ctbhmc--message-info');
            
            const messageNumber = document.createElement('div');
            messageNumber.classList.add('ctbhmc--message-number');
            messageNumber.textContent = `#${messageData}`;
            
            const messagePreview = document.createElement('div');
            messagePreview.classList.add('ctbhmc--message-preview');
            messagePreview.textContent = preview;
            messagePreview.title = messageContent;
            
            messageInfo.appendChild(messageNumber);
            messageInfo.appendChild(messagePreview);
            entry.appendChild(messageInfo);

            const navBtn = document.createElement('button');
            navBtn.classList.add('ctbhmc--nav-btn', 'menu_button');
            navBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i>';
            navBtn.title = `Navigate to message #${messageData}`;
            navBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToMessage(messageData);
            });
            entry.appendChild(navBtn);
            
            // Make entire entry clickable
            entry.addEventListener('click', () => navigateToMessage(messageData));
        }

        return entry;
    };

    /**
     * Update the badge label with animations
     * @param {string} newValue - New string to display
     */
    const updateBadge = async (newValue) => {
        if (isUpdating) return;
        isUpdating = true;

        try {
            const isNoMessages = newValue === '0' || newValue === '';
            
            if (currentBadgeValue !== newValue) {
                if (isNoMessages) {
                    trigger.classList.add('ctbhmc--badge-out');
                    await delay(510);
                    trigger.setAttribute('data-ctbhmc--badge-count', newValue);
                    trigger.classList.remove('ctbhmc--badge-out');
                } else if (currentBadgeValue === '' || currentBadgeValue === '0') {
                    trigger.setAttribute('data-ctbhmc--badge-count', newValue);
                    trigger.classList.add('ctbhmc--badge-in');
                    await delay(510);
                    trigger.classList.remove('ctbhmc--badge-in');
                } else {
                    trigger.setAttribute('data-ctbhmc--badge-count', newValue);
                    trigger.classList.add('ctbhmc--badge-bounce');
                    await delay(1010);
                    trigger.classList.remove('ctbhmc--badge-bounce');
                }
                currentBadgeValue = newValue;
            }
        } finally {
            isUpdating = false;
        }
    };

    /**
     * Update the panel content
     */
    const updatePanel = () => {
        const data = getHiddenMessagesData();
        panel.innerHTML = '';

        // Hidden Messages Section
        const hiddenSection = document.createElement('div');
        hiddenSection.classList.add('ctbhmc--section');

        const hiddenHeader = document.createElement('div');
        hiddenHeader.classList.add('ctbhmc--section-header');
        hiddenHeader.textContent = 'Hidden Messages';
        hiddenSection.appendChild(hiddenHeader);

        if (data.hiddenMessages.length === 0) {
            const empty = document.createElement('div');
            empty.classList.add('ctbhmc--empty');
            empty.textContent = 'No hidden messages';
            hiddenSection.appendChild(empty);
        } else {
            const ranges = groupIntoRanges(data.hiddenMessages);
            ranges.forEach(range => {
                if (range.start === range.end) {
                    hiddenSection.appendChild(createMessageEntry(range.start, false));
                } else {
                    hiddenSection.appendChild(createMessageEntry(range, true));
                }
            });
        }

        panel.appendChild(hiddenSection);

        // Boundary Messages Section
        const boundarySection = document.createElement('div');
        boundarySection.classList.add('ctbhmc--section');

        const boundaryHeader = document.createElement('div');
        boundaryHeader.classList.add('ctbhmc--section-header');
        boundaryHeader.textContent = 'Boundary Messages';
        boundarySection.appendChild(boundaryHeader);

        if (data.boundaries.length === 0) {
            const empty = document.createElement('div');
            empty.classList.add('ctbhmc--empty');
            empty.textContent = 'No boundary messages';
            boundarySection.appendChild(empty);
        } else {
            data.boundaries.forEach(mesId => {
                boundarySection.appendChild(createMessageEntry(mesId, false));
            });
        }

        panel.appendChild(boundarySection);

        // Update badge
        updateBadge(String(data.totalCount));

        // Update trigger title
        if (data.totalCount > 0) {
            trigger.title = `Hidden Messages: ${data.totalCount}`;
        } else {
            trigger.title = 'Hidden Messages Overview';
        }
    };

    /**
     * Main update function
     */
    const updateCounter = () => {
        const data = getHiddenMessagesData();
        updateBadge(String(data.totalCount));

        if (data.totalCount > 0) {
            trigger.title = `Hidden Messages: ${data.totalCount}`;
        } else {
            trigger.title = 'Hidden Messages Overview';
        }

        if (panel.classList.contains('ctbhmc--isActive')) {
            updatePanel();
        }
    };

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !trigger.contains(e.target)) {
            panel.classList.remove('ctbhmc--isActive');
        }
    });

    // Setup MutationObserver to detect hide/unhide operations
    const setupHideUnhideObserver = () => {
        const chatContainer = document.getElementById('chat');
        if (!chatContainer) {
            console.warn(`[${MODULE_NAME}] Chat container not found for observer`);
            return;
        }

        let updateTimeout;
        const debouncedUpdate = () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                updateCounter();
            }, 100);
        };

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'is_system' &&
                    mutation.target.classList.contains('mes')) {
                    debouncedUpdate();
                    break;
                }
            }
        });

        observer.observe(chatContainer, {
            attributes: true,
            attributeFilter: ['is_system'],
            subtree: true
        });
    };

    // Register event listeners
    eventSource.on(event_types.CHAT_CHANGED, () => updateCounter());
    eventSource.on(event_types.MESSAGE_RECEIVED, () => updateCounter());
    eventSource.on(event_types.MESSAGE_DELETED, () => updateCounter());
    eventSource.on(event_types.MESSAGE_EDITED, () => updateCounter());
    eventSource.on(event_types.MESSAGE_UPDATED, () => updateCounter());
    eventSource.on(event_types.MESSAGE_SWIPED, () => updateCounter());
    eventSource.on(event_types.CHAT_UPDATED, () => updateCounter());
    eventSource.on(event_types.APP_READY, () => {
        updateCounter();
        setupHideUnhideObserver();
    });

    setupHideUnhideObserver();
    updateCounter();

    console.log(`[${MODULE_NAME}] Extension loaded`);
};

// Initialize when ready
jQuery(async () => {
    await init();
});
