# CT-BoundaryHiddenMessagesCount

A SillyTavern/CozyTavern extension that provides an overview and navigation for hidden messages (excluding System Instruction messages) and boundary messages in your chat.

## What Does This Extension Do?

This extension helps you track and navigate:

1. **Hidden Messages** - All messages marked as hidden/system (with `is_system: true`), except for System Instruction messages (messages with name "Instruction" and type "narrator")
2. **Boundary Messages** - The first visible messages that appear after hidden sections in your chat

## Features

### 👻 Ghost Button with Counter

A ghost icon button appears in the left send form area that:
- Shows a **badge counter** indicating the total number of hidden messages (excluding System Instructions)
- **Animates** when the count changes (pop-in, bounce effects)
- **Opens a panel** when clicked to show detailed information

### 📋 Compact Overview Panel

Click the ghost button to open a panel featuring:

#### Hidden Messages Section
- Lists all hidden messages (excluding System Instruction messages)
- **Groups consecutive messages** into ranges for compact display
  - Single messages: Shows message number and content preview
  - Ranges: Shows "Messages #X - #Y" format
- **Navigate buttons** to jump to specific messages
  - Single messages: Location arrow icon button
  - Ranges: "Start" and "End" buttons with arrow icons
- **Message preview** for single messages (first 50 characters)
- **Hover tooltip** shows full message content

#### Boundary Messages Section
- Lists all boundary messages (first visible message after hidden sections)
- Shows message number and content preview
- Navigate button to jump to each boundary

### 🎯 Smart Navigation

- **Click to navigate** - Click any entry or navigation button to scroll to that message
- **Highlight effect** - Navigated messages briefly highlight with a pulse animation
- **Pagination aware** - If a message isn't loaded, scrolls to top and notifies you to load more messages
- **Smooth scrolling** - Centers the target message in view

### 🎨 Visual Design

- **Compact layout** - Efficient use of space with clean, modern design
- **Theme integration** - Uses SillyTavern's theme colors and variables
- **Responsive** - Adapts to different screen sizes (max 400px width, 50vh height)
- **Animated badges** - Smooth animations for counter changes

## Installation

1. Open SillyTavern
2. Go to Extensions → Install Extension
3. Paste the GitHub URL: `https://github.com/leyam3k/CT-BoundaryHiddenMessagesCount`
4. Refresh the page

Or manually place the extension folder in:
```
public/scripts/extensions/third-party/CT-BoundaryHiddenMessagesCount/
```

## How It Works

### Hidden Messages Detection

The extension scans all messages in the current chat and identifies:
- Messages with `is_system: true` (hidden messages)
- **Excludes** System Instruction messages (name: "Instruction", type: "narrator")
- Groups consecutive hidden messages into ranges for compact display

### Boundary Messages Detection

Boundary messages are identified as:
- The first visible message (not hidden) that appears after a hidden section
- Helps you quickly jump between conversation segments

### Real-time Updates

The extension automatically updates when:
- Chat is changed
- Messages are added, deleted, or edited
- Messages are hidden or unhidden
- Messages are swiped

## Use Cases

- **Track hidden messages** - See how many messages are hidden at a glance
- **Navigate hidden sections** - Quickly jump to specific hidden messages
- **Find boundaries** - Locate where visible conversation resumes after hidden sections
- **Review chat structure** - Understand the layout of your conversation
- **Efficient navigation** - Jump to any message without scrolling

## Technical Details

- **No settings required** - Works out of the box
- **Lightweight** - Minimal performance impact
- **Event-driven** - Uses SillyTavern's event system for updates
- **Mutation observer** - Detects hide/unhide operations in real-time
- **CSS animations** - Smooth, hardware-accelerated animations

## License

MIT
