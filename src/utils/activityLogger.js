
export const logActivity = async (type, details, userEmail = null, level = 'INFO') => {
    try {
        await fetch('/api/security/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                details,
                level,
                user: userEmail
            })
        });
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
};
