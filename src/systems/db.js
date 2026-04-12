import { bus } from '../engine/EventBus.js';

const SUPABASE_URL = 'https://rkarxmetbktowmmxkfam.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXJ4bWV0Ymt0b3dtbXhrZmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDY3MjksImV4cCI6MjA5MTUyMjcyOX0.eVctkjVHkscDH_o6G_txKpo-3MOabmHJySbWdsZFnIE';

export const DB = {
    client: null,
    session: null,

    init() {
        if (!window.supabase) {
            console.error('Supabase library not loaded.');
            return false;
        }
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // Check active session on load
        this.client.auth.getSession().then(({ data: { session } }) => {
            this.session = session;
            if (this.session) {
                console.log('✅ Supabase connected as', this.session.user.email);
            }
            bus.emit('auth:stateChanged', this.session);
        });

        // Listen for auth state changes
        this.client.auth.onAuthStateChange((_event, session) => {
            this.session = session;
            bus.emit('auth:stateChanged', this.session);
        });

        return true;
    },

    isLoggedIn() {
        return this.session !== null;
    },

    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async signUp(email, password) {
        // Supabase sign ups by default require email confirmation unless disabled in Auth -> Providers.
        // We handle the basic call here.
        const { data, error } = await this.client.auth.signUp({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    // --- Save System wrappers ---
    async getSaves() {
        if (!this.isLoggedIn()) return [];
        const { data, error } = await this.client
            .from('saves')
            .select('*');
        if (error) {
            console.error('Fetch saves error:', error);
            return [];
        }
        
        // Map postgres snake_case to the JS app's expected layout.
        return data.map(dbRow => ({
            id: dbRow.slot_id,
            name: dbRow.player?.charName || dbRow.player?.className || 'Unknown',
            classId: dbRow.player?.classId || 'warrior', // Extract from player jsonb
            className: dbRow.player?.className || 'Warrior',
            level: dbRow.player?.level || 1,
            zoneLevel: dbRow.zone_level || 0,
            stash: dbRow.stash || [],
            cube: dbRow.cube || [],
            mercenary: dbRow.mercenary || null,
            difficulty: dbRow.difficulty || 0,
            waypoints: dbRow.waypoints || [0],
            player: dbRow.player,
            timestamp: new Date(dbRow.updated_at).getTime()
        }));
    },

    async upsertSave(slotId, rawSaveData) {
        if (!this.isLoggedIn()) return false;
        const payload = {
            slot_id: slotId,
            user_id: this.session.user.id,
            zone_level: rawSaveData.zoneLevel,
            player: rawSaveData.player,
            stash: rawSaveData.stash,
            cube: rawSaveData.cube,
            mercenary: rawSaveData.mercenary,
            waypoints: rawSaveData.waypoints,
            difficulty: rawSaveData.difficulty,
            updated_at: new Date().toISOString()
        };

        const { error } = await this.client
            .from('saves')
            .upsert(payload, { onConflict: 'slot_id' });

        if (error) {
            console.error('Upsert save error:', error);
            return false;
        }
        return true;
    },

    async deleteSave(slotId) {
        if (!this.isLoggedIn()) return false;
        const { error } = await this.client
            .from('saves')
            .delete()
            .eq('slot_id', slotId)
            .eq('user_id', this.session.user.id);
        return !error;
    },

    async getSharedStash() {
        if (!this.isLoggedIn()) return null;
        const { data, error } = await this.client
            .from('shared_stash')
            .select('items, gold')
            .limit(1)
            .single();
        
        // It's normal for no row to exist initially
        if (error && error.code !== 'PGRST116') {
            console.error('Fetch shared stash error:', error);
            return null;
        }
        return data || { items: Array(20).fill(null), gold: 0 };
    },

    async upsertSharedStash(items, gold) {
        if (!this.isLoggedIn()) return false;
        const { error } = await this.client
            .from('shared_stash')
            .upsert({
                user_id: this.session.user.id,
                items,
                gold,
                updated_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Upsert shared stash error:', error);
            return false;
        }
        return true;
    }
};
