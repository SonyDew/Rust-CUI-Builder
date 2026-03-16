const logEvent = async (type, details) => {
    if (type === 'MOUSE' && details === 'Right Click Attempt') return;
    try {
        await fetch('/api/security/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, details })
        });
    } catch (e) {
    }
};

// Track all listeners and intervals so we can tear them down for admins
let _cleanupFns = [];
let _intervals = [];
let _securityActive = false;

export const initSecurity = () => {
    if (_securityActive) return;
    _securityActive = true;

    const addListener = (target, event, handler, options) => {
        target.addEventListener(event, handler, options);
        _cleanupFns.push(() => target.removeEventListener(event, handler, options));
    };

    const addInterval = (fn, ms) => {
        const id = setInterval(fn, ms);
        _intervals.push(id);
    };

    addListener(document, 'contextmenu', (e) => {
        e.preventDefault();
        logEvent('MOUSE', 'Right Click Attempt');
        return false;
    });

    const keydownHandler = (e) => {
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            logEvent('KEYBOARD', 'Ctrl+U Attempt');
            return false;
        }

        if (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault();
            logEvent('KEYBOARD', 'Ctrl+Shift+I Attempt');
            return false;
        }

        if (e.ctrlKey && e.shiftKey && (e.key === 'j' || e.key === 'J')) {
            e.preventDefault();
            logEvent('KEYBOARD', 'Ctrl+Shift+J Attempt');
            return false;
        }

        if (e.ctrlKey && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            logEvent('KEYBOARD', 'Ctrl+Shift+C Attempt');
            return false;
        }

        if (e.key === 'F12') {
            e.preventDefault();
            logEvent('KEYBOARD', 'F12 Attempt');
            return false;
        }

        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            logEvent('KEYBOARD', 'Ctrl+S Attempt');
            return false;
        }

        if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            logEvent('KEYBOARD', 'Print Attempt');
            return false;
        }
    };
    addListener(document, 'keydown', keydownHandler);

    const dragHandler = (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    };
    addListener(document, 'dragstart', dragHandler);

    const resizeHandler = () => {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        if (widthDiff > threshold || heightDiff > threshold) {
             logEvent('RESIZE', 'Suspicious Window Resize (DevTools?)');
        }
    };
    addListener(window, 'resize', resizeHandler);

    if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
        logEvent('DEVTOOLS', 'Firebug Detected');
        triggerFunnyAlert("Firebug? Really? What year is this?");
    }

    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;

        if (widthThreshold || heightThreshold) {
            logEvent('DEVTOOLS', 'Dimensions Threshold Exceeded');
            triggerFunnyAlert("Hey! You lost? Or just looking for the secret sauce?");
        }
    };

    addInterval(checkDevTools, 2000);

    console.log("%cSTOP!", "color: red; font-size: 50px; font-weight: bold; -webkit-text-stroke: 1px black;");
    console.log("%cThis area is off limits. Please return to the safe zone immediately.", "font-size: 20px; color: yellow;");
};

/**
 * Completely removes all security listeners and intervals.
 * Call this when the user is confirmed as an admin.
 */
export const disableSecurity = () => {
    _cleanupFns.forEach((fn) => fn());
    _cleanupFns = [];
    _intervals.forEach((id) => clearInterval(id));
    _intervals = [];
    _securityActive = false;
    alertShown = false;
    console.clear();
    console.log("%c🔧 Admin mode — dev tools unlocked.", "color: #0d99ff; font-size: 16px; font-weight: bold;");
};

let alertShown = false;
const triggerFunnyAlert = (message) => {
    if (alertShown) return;
    alertShown = true;

    try {
        document.body.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #111; color: #fff; display: flex;
                flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
                z-index: 999999; text-align: center;
                padding: 20px;
            ">
                <div style="margin-bottom: 20px;">
                    <picture>
                        <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1fae3/512.webp" type="image/webp">
                        <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1fae3/512.gif" alt="🫣" width="150" height="150">
                    </picture>
                </div>
                <h1 style="font-size: 3rem; color: #0d99ff; margin-bottom: 10px;">${message}</h1>
                <p style="font-size: 1.5rem; color: #aaa; max-width: 600px;">
                    We saw you trying to open the developer tools.
                    <br/><br/>
                    <span style="color: #ff4d4d;">Please refresh the page to continue using the app normally.</span>
                </p>
                <button onclick="window.location.reload()" style="
                    margin-top: 30px;
                    padding: 15px 30px;
                    background: #0d99ff;
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-size: 1.2rem;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    Start Over 🔄
                </button>
            </div>
        `;

    } catch (e) {
        console.error("Security Halt");
    }
};
