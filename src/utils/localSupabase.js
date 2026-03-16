import { DEFAULT_PROJECT_BACKGROUND } from './brandAssets';

const DB_KEY = 'rcui-local-db-v1';
const SESSION_KEY = 'rcui-local-session-v1';
const TEAM_PLAN = 'team';
const LIBRARY_ID = 'local-library';
const authListeners = new Set();
const channels = new Set();

const now = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));
const id = () => typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const err = (message, code = 'LOCAL_MODE_ERROR') => ({ code, message });
const hasStorage = () => {
    try {
        return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
        return false;
    }
};
const getItem = (key) => {
    if (!hasStorage()) return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
};
const setItem = (key, value) => {
    if (!hasStorage()) return;
    try { window.localStorage.setItem(key, value); } catch {}
};
const removeItem = (key) => {
    if (!hasStorage()) return;
    try { window.localStorage.removeItem(key); } catch {}
};

const buildElements = () => ([
    {
        id: id(),
        type: 'Panel',
        parent: 'Overlay',
        color: '0.08 0.12 0.18 0.94',
        opacity: 100,
        anchor: { min: '0.28 0.26', max: '0.72 0.70' },
        offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        rotation: 0,
        align: 'MiddleCenter',
    },
    {
        id: id(),
        type: 'Text',
        parent: 'Overlay',
        text: 'Welcome to Rust CUI Builder',
        color: '#f4fbff',
        opacity: 100,
        font: 'RobotoCondensed-Bold.ttf',
        fontSize: 32,
        anchor: { min: '0.34 0.57', max: '0.66 0.63' },
        offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        rotation: 0,
        align: 'MiddleCenter',
    },
    {
        id: id(),
        type: 'Button',
        parent: 'Overlay',
        text: 'Edit me',
        color: '0.05 0.39 0.71 0.98',
        opacity: 100,
        textColor: '#ffffff',
        font: 'RobotoCondensed-Bold.ttf',
        fontSize: 22,
        anchor: { min: '0.40 0.38', max: '0.60 0.46' },
        offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        rotation: 0,
        align: 'MiddleCenter',
    },
]);

const createWelcomeProject = (userId) => ({
    id: id(),
    user_id: userId,
    name: 'Welcome HUD',
    elements: buildElements(),
    settings: {
        backgroundUrl: DEFAULT_PROJECT_BACKGROUND,
        is_public: false,
        is_draft: false,
        share_access: 'view',
        collaborators: [],
        uiName: 'WelcomeHUD',
        layer: 'Overlay',
        chatCommand: '/welcomeui',
        consoleCommand: '',
        permission: '',
        user_tags: { [userId]: ['welcome', 'starter'] },
    },
    is_deleted: false,
    marked_for_deletion: false,
    last_modified: now(),
    created_at: now(),
});

const createCommunityProject = () => ({
    id: 'local-community-project',
    user_id: LIBRARY_ID,
    name: 'Starter Shop Layout',
    elements: buildElements(),
    settings: {
        backgroundUrl: DEFAULT_PROJECT_BACKGROUND,
        is_public: true,
        is_draft: false,
        is_community_published: true,
        share_access: 'view',
        collaborators: [],
        uiName: 'StarterShop',
        layer: 'Overlay',
        chatCommand: '/shop',
        consoleCommand: '',
        permission: '',
        tags: ['shop', 'starter'],
        user_tags: {},
    },
    is_deleted: false,
    marked_for_deletion: false,
    last_modified: now(),
    created_at: now(),
});

const createWelcomeNotification = (userId) => ({
    id: id(),
    user_id: userId,
    type: 'welcome',
    title: 'Local workspace is ready',
    message: 'This browser is running in local mode. Your data is stored locally.',
    metadata: {},
    read: false,
    created_at: now(),
});

const createWelcomeTicket = (userId) => {
    const ticketId = id();
    return {
        ticket: {
            id: ticketId,
            user_id: userId,
            subject: 'Welcome to local mode',
            status: 'open',
            claimed_by: null,
            created_at: now(),
            updated_at: now(),
        },
        message: {
            id: id(),
            ticket_id: ticketId,
            sender_id: 'support-bot',
            message: 'This is a demo support thread. You can reply and test attachments without Supabase.',
            attachments: [],
            created_at: now(),
        },
    };
};

const emptyDb = () => ({
    version: 1,
    users: [],
    profiles: [],
    user_profiles: [],
    projects: [],
    notifications: [],
    tickets: [],
    ticket_messages: [],
    storage: { 'ticket-files': {} },
    presence: [],
});

const normalizeDb = (input) => {
    const db = input && typeof input === 'object' ? input : emptyDb();
    db.version = 1;
    db.users = Array.isArray(db.users) ? db.users : [];
    db.profiles = Array.isArray(db.profiles) ? db.profiles : [];
    db.user_profiles = Array.isArray(db.user_profiles) ? db.user_profiles : [];
    db.projects = Array.isArray(db.projects) ? db.projects : [];
    db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
    db.tickets = Array.isArray(db.tickets) ? db.tickets : [];
    db.ticket_messages = Array.isArray(db.ticket_messages) ? db.ticket_messages : [];
    db.storage = db.storage && typeof db.storage === 'object' ? db.storage : {};
    db.storage['ticket-files'] = db.storage['ticket-files'] && typeof db.storage['ticket-files'] === 'object' ? db.storage['ticket-files'] : {};
    db.presence = Array.isArray(db.presence) ? db.presence : [];
    if (!db.profiles.some((profile) => profile.id === LIBRARY_ID)) {
        db.profiles.push({ id: LIBRARY_ID, email: 'library@local.demo', username: 'Library', plan: TEAM_PLAN, is_admin: false });
    }
    if (!db.projects.some((project) => project.id === 'local-community-project')) {
        db.projects.push(createCommunityProject());
    }
    return db;
};

const loadDb = () => {
    const raw = getItem(DB_KEY);
    if (!raw) {
        const db = normalizeDb(emptyDb());
        setItem(DB_KEY, JSON.stringify(db));
        return db;
    }
    try {
        const db = normalizeDb(JSON.parse(raw));
        setItem(DB_KEY, JSON.stringify(db));
        return db;
    } catch {
        const db = normalizeDb(emptyDb());
        setItem(DB_KEY, JSON.stringify(db));
        return db;
    }
};

const saveDb = (db) => setItem(DB_KEY, JSON.stringify(db));
const loadSessionUserId = () => getItem(SESSION_KEY);
const saveSessionUserId = (userId) => userId ? setItem(SESSION_KEY, userId) : removeItem(SESSION_KEY);
const findUserByEmail = (db, email) => {
    if (!email) return null;
    return db.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
};

const buildUser = (record) => ({
    id: record.id,
    email: record.email,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: record.created_at,
    updated_at: record.updated_at || record.created_at,
    last_sign_in_at: record.last_sign_in_at || record.created_at,
    email_confirmed_at: record.email_confirmed_at,
    app_metadata: record.app_metadata || { provider: 'email' },
    user_metadata: record.user_metadata || {},
});

const buildSession = (record) => ({
    access_token: `local-access-${record.id}`,
    refresh_token: `local-refresh-${record.id}`,
    expires_in: 31536000,
    expires_at: Math.floor(Date.now() / 1000) + 31536000,
    token_type: 'bearer',
    user: buildUser(record),
});

const currentUserRecord = (db = loadDb()) => {
    const userId = loadSessionUserId();
    if (!userId) return null;
    const record = db.users.find((user) => user.id === userId) || null;
    if (!record) saveSessionUserId(null);
    return record;
};

const currentSession = (db = loadDb()) => {
    const record = currentUserRecord(db);
    return record ? buildSession(record) : null;
};

const emitAuth = (event, session) => {
    authListeners.forEach((listener) => {
        try {
            listener(event, session ? clone(session) : null);
        } catch {}
    });
};

const ensureUserWorkspace = (db, record) => {
    if (!db.profiles.some((profile) => profile.id === record.id)) {
        db.profiles.push({
            id: record.id,
            email: record.email,
            username: record.email.split('@')[0],
            plan: TEAM_PLAN,
            is_admin: db.users.length === 1,
        });
    }
    if (!db.user_profiles.some((profile) => profile.user_id === record.id)) {
        db.user_profiles.push({
            user_id: record.id,
            favorites: [],
            onboarding_completed: false,
            primary_use: '',
            experience_level: '',
            project_type: '',
            team_size: '',
            goals: [],
            updated_at: now(),
        });
    }
    if (!db.projects.some((project) => project.user_id === record.id)) {
        db.projects.push(createWelcomeProject(record.id));
    }
    if (!db.notifications.some((notification) => notification.user_id === record.id)) {
        db.notifications.push(createWelcomeNotification(record.id));
    }
    if (!db.tickets.some((ticket) => ticket.user_id === record.id)) {
        const welcome = createWelcomeTicket(record.id);
        db.tickets.push(welcome.ticket);
        db.ticket_messages.push(welcome.message);
    }
};

const createUser = (db, { email, password = '', provider = 'email', metadata = {} }) => {
    const record = {
        id: id(),
        email,
        password,
        created_at: now(),
        updated_at: now(),
        email_confirmed_at: now(),
        app_metadata: { provider },
        user_metadata: metadata,
        last_sign_in_at: now(),
    };
    db.users.push(record);
    ensureUserWorkspace(db, record);
    return record;
};

const parseValue = (value) => {
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    const numeric = Number(value);
    return !Number.isNaN(numeric) && `${numeric}` === value ? numeric : value;
};

const matchesCondition = (row, field, operator, rawValue) => {
    const value = row?.[field];
    const parsed = parseValue(rawValue);
    switch (operator) {
        case 'eq':
            return value === parsed;
        case 'neq':
            return value !== parsed;
        case 'is':
            return rawValue === 'null' ? value == null : value === parsed;
        default:
            return false;
    }
};

const buildOrMatcher = (expression) => {
    const conditions = expression
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const [field, operator, ...rest] = entry.split('.');
            return { field, operator, rawValue: rest.join('.') };
        });
    return (row) => conditions.some((condition) => matchesCondition(row, condition.field, condition.operator, condition.rawValue));
};

const buildChannelMatcher = (expression) => {
    if (!expression) return () => true;
    const [field, rule = ''] = expression.split('=');
    const [operator, ...rest] = rule.split('.');
    return (row) => matchesCondition(row, field, operator, rest.join('.'));
};

const pickColumns = (columns, row) => {
    if (!columns || columns === '*') return clone(row);
    return columns
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean)
        .reduce((accumulator, field) => {
            accumulator[field] = row[field];
            return accumulator;
        }, {});
};

const orderRows = (rows, orderBy) => {
    if (!orderBy?.field) return rows;
    const sorted = [...rows].sort((left, right) => {
        const a = left[orderBy.field];
        const b = right[orderBy.field];
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        return a > b ? 1 : a < b ? -1 : 0;
    });
    return orderBy.ascending === false ? sorted.reverse() : sorted;
};

const makeSingleResponse = (rows, maybeSingle) => {
    if (rows.length === 1) return { data: rows[0], error: null };
    if (!rows.length && maybeSingle) return { data: null, error: null };
    return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
};

const emitPostgres = (table, event, nextRow, previousRow) => {
    channels.forEach((channel) => {
        channel.handlers.forEach((handler) => {
            if (handler.type !== 'postgres_changes') return;
            if (handler.filter?.table !== table) return;
            if (handler.filter?.event && handler.filter.event !== '*' && handler.filter.event !== event) return;
            const matcher = buildChannelMatcher(handler.filter?.filter);
            const row = nextRow || previousRow;
            if (!matcher(row)) return;
            handler.callback({
                eventType: event,
                new: nextRow ? clone(nextRow) : null,
                old: previousRow ? clone(previousRow) : null,
            });
        });
    });
};

const emitBroadcast = (channelName, event, payload) => {
    channels.forEach((channel) => {
        if (channel.name !== channelName) return;
        channel.handlers.forEach((handler) => {
            if (handler.type !== 'broadcast') return;
            if (handler.filter?.event && handler.filter.event !== event) return;
            handler.callback({ payload: clone(payload) });
        });
    });
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
});

const normalizeInsert = (table, row) => {
    const base = clone(row);
    switch (table) {
        case 'projects':
            return {
                id: base.id || id(),
                user_id: base.user_id,
                name: base.name || 'Untitled',
                elements: Array.isArray(base.elements) ? base.elements : [],
                settings: base.settings || {},
                is_deleted: Boolean(base.is_deleted),
                marked_for_deletion: Boolean(base.marked_for_deletion),
                deletion_scheduled_at: base.deletion_scheduled_at || null,
                created_at: base.created_at || now(),
                last_modified: base.last_modified || now(),
            };
        case 'notifications':
            return {
                id: base.id || id(),
                user_id: base.user_id,
                type: base.type || 'info',
                title: base.title || 'Notification',
                message: base.message || '',
                metadata: base.metadata || {},
                read: Boolean(base.read),
                created_at: base.created_at || now(),
            };
        case 'tickets':
            return {
                id: base.id || id(),
                user_id: base.user_id,
                subject: base.subject || 'Untitled ticket',
                status: base.status || 'pending',
                claimed_by: base.claimed_by || null,
                created_at: base.created_at || now(),
                updated_at: base.updated_at || now(),
            };
        case 'ticket_messages':
            return {
                id: base.id || id(),
                ticket_id: base.ticket_id,
                sender_id: base.sender_id,
                message: base.message || '',
                attachments: Array.isArray(base.attachments) ? base.attachments : [],
                created_at: base.created_at || now(),
            };
        case 'profiles':
            return { id: base.id || id(), email: base.email || '', username: base.username || '', plan: base.plan || TEAM_PLAN, is_admin: Boolean(base.is_admin) };
        case 'user_profiles':
            return {
                user_id: base.user_id,
                favorites: Array.isArray(base.favorites) ? base.favorites : [],
                onboarding_completed: Boolean(base.onboarding_completed),
                primary_use: base.primary_use || '',
                experience_level: base.experience_level || '',
                project_type: base.project_type || '',
                team_size: base.team_size || '',
                goals: Array.isArray(base.goals) ? base.goals : [],
                updated_at: base.updated_at || now(),
            };
        default:
            return { id: base.id || id(), ...base };
    }
};

const normalizeUpdate = (table, row, patch) => {
    const next = { ...row, ...clone(patch) };
    if (table === 'projects') {
        next.settings = patch.settings ? clone(patch.settings) : clone(row.settings || {});
        next.last_modified = patch.last_modified || now();
    }
    if (table === 'tickets') next.updated_at = patch.updated_at || now();
    if (table === 'user_profiles') next.updated_at = patch.updated_at || now();
    return next;
};

const touchTicket = (db, ticketId) => {
    const ticketIndex = db.tickets.findIndex((ticket) => ticket.id === ticketId);
    if (ticketIndex < 0) return;
    const previous = clone(db.tickets[ticketIndex]);
    const next = { ...db.tickets[ticketIndex], updated_at: now() };
    db.tickets[ticketIndex] = next;
    emitPostgres('tickets', 'UPDATE', next, previous);
};

const createQueryBuilder = (table) => {
    const state = {
        table,
        action: 'select',
        payload: null,
        selectColumns: '*',
        selectOptions: {},
        filters: [],
        orderBy: null,
        limitBy: null,
        single: false,
        maybeSingle: false,
        upsertOptions: {},
        returnRows: true,
    };

    const applyFilters = (rows) => rows.filter((row) => state.filters.every((filter) => filter(row)));
    const finalizeRows = (rows, count = null) => {
        const ordered = orderRows(rows, state.orderBy);
        const limited = state.limitBy ? ordered.slice(0, state.limitBy) : ordered;
        const projected = state.selectOptions.head ? null : limited.map((row) => pickColumns(state.selectColumns, row));
        if (state.single || state.maybeSingle) return makeSingleResponse(projected || [], state.maybeSingle);
        return { data: projected, count, error: null };
    };

    const execute = async () => {
        const db = loadDb();
        if (!Array.isArray(db[state.table])) db[state.table] = [];
        const rows = db[state.table];

        if (state.action === 'select') {
            const filtered = applyFilters(rows);
            const count = state.selectOptions.count === 'exact' ? filtered.length : null;
            return finalizeRows(filtered, count);
        }

        if (state.action === 'insert') {
            const inserted = (Array.isArray(state.payload) ? state.payload : [state.payload])
                .filter(Boolean)
                .map((row) => normalizeInsert(state.table, row));

            inserted.forEach((row) => {
                rows.push(row);
                emitPostgres(state.table, 'INSERT', row, null);
                if (state.table === 'ticket_messages' && row.ticket_id) {
                    touchTicket(db, row.ticket_id);
                }
            });

            saveDb(db);
            return state.returnRows ? finalizeRows(inserted) : { data: null, error: null };
        }

        if (state.action === 'update') {
            const updated = [];

            rows.forEach((row, index) => {
                if (!state.filters.every((filter) => filter(row))) return;
                const previous = clone(row);
                const next = normalizeUpdate(state.table, row, state.payload || {});
                rows[index] = next;
                updated.push(next);
                emitPostgres(state.table, 'UPDATE', next, previous);
            });

            saveDb(db);
            return state.returnRows ? finalizeRows(updated) : { data: null, error: null };
        }

        if (state.action === 'delete') {
            const removed = [];
            const remaining = [];

            rows.forEach((row) => {
                if (state.filters.every((filter) => filter(row))) {
                    removed.push(row);
                    emitPostgres(state.table, 'DELETE', null, row);
                } else {
                    remaining.push(row);
                }
            });

            db[state.table] = remaining;
            saveDb(db);
            return state.returnRows ? finalizeRows(removed) : { data: null, error: null };
        }

        if (state.action === 'upsert') {
            const entries = (Array.isArray(state.payload) ? state.payload : [state.payload]).filter(Boolean);
            const updatedOrInserted = [];
            const conflictFields = `${state.upsertOptions.onConflict || 'id'}`
                .split(',')
                .map((field) => field.trim())
                .filter(Boolean);

            entries.forEach((entry) => {
                const row = normalizeInsert(state.table, entry);
                const existingIndex = rows.findIndex((existing) => conflictFields.every((field) => existing[field] === row[field]));

                if (existingIndex >= 0) {
                    const previous = clone(rows[existingIndex]);
                    const next = normalizeUpdate(state.table, rows[existingIndex], entry);
                    rows[existingIndex] = next;
                    updatedOrInserted.push(next);
                    emitPostgres(state.table, 'UPDATE', next, previous);
                    return;
                }

                rows.push(row);
                updatedOrInserted.push(row);
                emitPostgres(state.table, 'INSERT', row, null);
            });

            saveDb(db);
            return state.returnRows ? finalizeRows(updatedOrInserted) : { data: null, error: null };
        }

        return { data: null, error: err(`Unsupported local query action: ${state.action}`) };
    };

    const builder = {
        select: (columns = '*', options = {}) => {
            state.selectColumns = columns || '*';
            state.selectOptions = options || {};
            state.returnRows = true;
            return builder;
        },
        insert: (payload) => {
            state.action = 'insert';
            state.payload = payload;
            state.returnRows = false;
            return builder;
        },
        update: (payload) => {
            state.action = 'update';
            state.payload = payload;
            state.returnRows = false;
            return builder;
        },
        delete: () => {
            state.action = 'delete';
            state.returnRows = false;
            return builder;
        },
        upsert: (payload, options = {}) => {
            state.action = 'upsert';
            state.payload = payload;
            state.upsertOptions = options || {};
            state.returnRows = false;
            return builder;
        },
        eq: (field, value) => {
            state.filters.push((row) => row?.[field] === value);
            return builder;
        },
        neq: (field, value) => {
            state.filters.push((row) => row?.[field] !== value);
            return builder;
        },
        match: (criteria = {}) => {
            Object.entries(criteria).forEach(([field, value]) => {
                state.filters.push((row) => row?.[field] === value);
            });
            return builder;
        },
        or: (expression) => {
            state.filters.push(buildOrMatcher(expression));
            return builder;
        },
        order: (field, options = {}) => {
            state.orderBy = { field, ascending: options.ascending !== false };
            return builder;
        },
        limit: (value) => {
            state.limitBy = value;
            return builder;
        },
        single: async () => {
            state.single = true;
            if (state.action !== 'select' && !state.returnRows) state.returnRows = true;
            return execute();
        },
        maybeSingle: async () => {
            state.maybeSingle = true;
            if (state.action !== 'select' && !state.returnRows) state.returnRows = true;
            return execute();
        },
        then: (resolve, reject) => execute().then(resolve, reject),
        catch: (reject) => execute().catch(reject),
        finally: (handler) => execute().finally(handler),
    };

    return builder;
};

const createChannel = (name) => {
    const channel = {
        name,
        handlers: [],
        subscribed: false,
        on(type, filter, callback) {
            this.handlers.push({ type, filter, callback });
            return this;
        },
        subscribe(callback) {
            this.subscribed = true;
            channels.add(this);
            if (typeof callback === 'function') {
                Promise.resolve().then(() => callback('SUBSCRIBED'));
            }
            return this;
        },
        unsubscribe() {
            channels.delete(this);
            this.subscribed = false;
        },
        async send({ type, event, payload }) {
            if (type === 'broadcast') {
                emitBroadcast(this.name, event, payload || {});
            }
            return { error: null };
        },
        async track(payload) {
            const db = loadDb();
            db.presence = db.presence.filter((entry) => entry.channel !== this.name);
            db.presence.push({
                id: id(),
                channel: this.name,
                payload: typeof payload === 'object' && payload !== null ? clone(payload) : { value: payload },
                updated_at: now(),
            });
            saveDb(db);
            return { error: null };
        },
    };

    return channel;
};

const resolveStorageBucket = (db, bucket) => {
    if (!db.storage[bucket] || typeof db.storage[bucket] !== 'object') {
        db.storage[bucket] = {};
    }
    return db.storage[bucket];
};

export const createLocalSupabaseClient = () => ({
    auth: {
        getSession: async () => ({ data: { session: currentSession() }, error: null }),
        getUser: async () => {
            const session = currentSession();
            return { data: { user: session?.user || null }, error: null };
        },
        onAuthStateChange: (listener) => {
            authListeners.add(listener);
            return {
                data: {
                    subscription: {
                        unsubscribe: () => authListeners.delete(listener),
                    },
                },
            };
        },
        signUp: async ({ email, password, options = {} }) => {
            const db = loadDb();
            if (!email) return { data: null, error: err('Email is required', 'AUTH_INVALID') };
            if (findUserByEmail(db, email)) {
                return { data: null, error: err('An account with this email already exists', 'USER_ALREADY_EXISTS') };
            }

            const record = createUser(db, {
                email,
                password: password || '',
                provider: 'email',
                metadata: options.data || {},
            });

            saveDb(db);
            saveSessionUserId(record.id);
            const session = buildSession(record);
            emitAuth('SIGNED_IN', session);
            return { data: { user: session.user, session }, error: null };
        },
        signInWithPassword: async ({ email, password }) => {
            const db = loadDb();
            const record = findUserByEmail(db, email);
            if (!record || record.password !== password) {
                return { data: null, error: err('Invalid email or password', 'INVALID_LOGIN_CREDENTIALS') };
            }

            record.last_sign_in_at = now();
            record.updated_at = now();
            ensureUserWorkspace(db, record);
            saveDb(db);
            saveSessionUserId(record.id);
            const session = buildSession(record);
            emitAuth('SIGNED_IN', session);
            return { data: { user: session.user, session }, error: null };
        },
        signInWithOtp: async ({ email }) => {
            const db = loadDb();
            if (!email) return { data: null, error: err('Email is required', 'AUTH_INVALID') };

            const record = findUserByEmail(db, email) || createUser(db, {
                email,
                password: '',
                provider: 'email',
                metadata: {},
            });

            record.last_sign_in_at = now();
            record.updated_at = now();
            ensureUserWorkspace(db, record);
            saveDb(db);
            saveSessionUserId(record.id);
            const session = buildSession(record);
            emitAuth('SIGNED_IN', session);
            return { data: { user: session.user, session }, error: null };
        },
        signInWithOAuth: async ({ provider = 'oauth' } = {}) => {
            const db = loadDb();
            const email = `${provider}-demo@local.demo`;
            const name = `${provider[0]?.toUpperCase() || 'O'}${provider.slice(1)} Demo User`;
            const record = findUserByEmail(db, email) || createUser(db, {
                email,
                password: '',
                provider,
                metadata: { full_name: name },
            });

            record.last_sign_in_at = now();
            record.updated_at = now();
            record.app_metadata = { provider };
            record.user_metadata = { ...(record.user_metadata || {}), full_name: name };
            ensureUserWorkspace(db, record);
            saveDb(db);
            saveSessionUserId(record.id);
            const session = buildSession(record);
            emitAuth('SIGNED_IN', session);
            return { data: { user: session.user, session, provider }, error: null };
        },
        verifyOtp: async ({ email }) => {
            if (!email) return { data: null, error: err('Email is required', 'AUTH_INVALID') };
            const db = loadDb();
            const record = findUserByEmail(db, email);
            if (!record) return { data: null, error: err('No account found for this email', 'AUTH_USER_NOT_FOUND') };

            record.last_sign_in_at = now();
            record.updated_at = now();
            ensureUserWorkspace(db, record);
            saveDb(db);
            saveSessionUserId(record.id);
            const session = buildSession(record);
            emitAuth('SIGNED_IN', session);
            return { data: { user: session.user, session }, error: null };
        },
        resetPasswordForEmail: async (email) => {
            const db = loadDb();
            const record = findUserByEmail(db, email);
            if (!record) return { data: {}, error: null };

            const notification = normalizeInsert('notifications', {
                user_id: record.id,
                type: 'security',
                title: 'Password reset requested',
                message: 'Local mode does not send emails. Open Settings after signing in to change your password.',
                read: false,
            });

            db.notifications.push(notification);
            saveDb(db);
            emitPostgres('notifications', 'INSERT', notification, null);
            return { data: {}, error: null };
        },
        updateUser: async (changes = {}) => {
            const db = loadDb();
            const record = currentUserRecord(db);
            if (!record) return { data: null, error: err('No active session', 'AUTH_SESSION_MISSING') };

            if (typeof changes.email === 'string' && changes.email && changes.email !== record.email) {
                const existing = findUserByEmail(db, changes.email);
                if (existing && existing.id !== record.id) {
                    return { data: null, error: err('Email is already in use', 'USER_ALREADY_EXISTS') };
                }
                record.email = changes.email;
            }

            if (typeof changes.password === 'string' && changes.password) {
                record.password = changes.password;
            }

            if (changes.data && typeof changes.data === 'object') {
                record.user_metadata = { ...(record.user_metadata || {}), ...changes.data };
            }

            record.updated_at = now();
            ensureUserWorkspace(db, record);

            const profile = db.profiles.find((entry) => entry.id === record.id);
            if (profile) {
                profile.email = record.email;
                if (record.user_metadata?.full_name) {
                    profile.username = record.user_metadata.full_name;
                }
            }

            saveDb(db);
            const session = buildSession(record);
            emitAuth('USER_UPDATED', session);
            return { data: { user: session.user }, error: null };
        },
        signOut: async () => {
            saveSessionUserId(null);
            emitAuth('SIGNED_OUT', null);
            return { error: null };
        },
    },
    from: (table) => createQueryBuilder(table),
    channel: (name) => createChannel(name),
    removeChannel: (channel) => {
        if (channel?.unsubscribe) channel.unsubscribe();
    },
    storage: {
        from: (bucket) => ({
            upload: async (path, file) => {
                try {
                    const db = loadDb();
                    const target = resolveStorageBucket(db, bucket);
                    target[path] = {
                        path,
                        name: file?.name || path.split('/').pop() || 'file',
                        type: file?.type || 'application/octet-stream',
                        size: file?.size || 0,
                        dataUrl: file instanceof File ? await readFileAsDataUrl(file) : String(file),
                        updated_at: now(),
                    };
                    saveDb(db);
                    return { data: { path }, error: null };
                } catch (error) {
                    return { data: null, error: err(error.message || 'Failed to upload file', 'STORAGE_UPLOAD_FAILED') };
                }
            },
            getPublicUrl: (path) => {
                const db = loadDb();
                const target = resolveStorageBucket(db, bucket);
                const entry = target[path];
                return {
                    data: {
                        publicUrl: entry?.dataUrl || path,
                    },
                };
            },
        }),
    },
});
