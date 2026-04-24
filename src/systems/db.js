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
            campaign: dbRow.campaign || dbRow.extra_data?.campaign || dbRow.player?.campaign || null,
            player: dbRow.player,
            timestamp: new Date(dbRow.updated_at).getTime()
        }));
    },

    async upsertSave(slotId, rawSaveData) {
        if (!this.isLoggedIn()) return false;
        
        // Ensure waypoints is an array for JSONB storage
        let waypointsArray = rawSaveData.waypoints;
        if (waypointsArray instanceof Set) {
            waypointsArray = Array.from(waypointsArray);
        } else if (!Array.isArray(waypointsArray)) {
            waypointsArray = [0];
        }

        const payload = {
            slot_id: slotId,
            user_id: this.session.user.id,
            zone_level: rawSaveData.zoneLevel,
            player: rawSaveData.player,
            stash: rawSaveData.stash,
            cube: rawSaveData.cube,
            mercenary: rawSaveData.mercenary,
            waypoints: waypointsArray,
            difficulty: rawSaveData.difficulty,
            extra_data: {
                ...(rawSaveData.extra_data || {}),
                campaign: rawSaveData.campaign
            },
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
            .select('*')
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error('Fetch shared stash error:', error);
            return null;
        }

        const defaultStash = {
            tabs: [
                { name: 'Shared 1', items: Array(100).fill(null) },
                { name: 'Shared 2', items: Array(100).fill(null) },
                { name: 'Shared 3', items: Array(100).fill(null) },
                { name: 'Private', items: Array(100).fill(null) }
            ],
            gold: 0
        };

        if (!data) return defaultStash;

        // Cloud Data Migration: Handle various formats
        
        // 1. Newest format { tabs: [...], gold: N }
        if (data.tabs && Array.isArray(data.tabs)) {
            return data;
        }

        // 2. Data is just the array of tabs stored in the 'data' field?
        if (Array.isArray(data) && data.length > 0 && data[0].items) {
             return { tabs: data, gold: 0 };
        }

        // 3. Old format { items: [...], gold: N }
        if (data.items && !data.tabs) {
            const items = Array.isArray(data.items) ? data.items : [];
            return {
                tabs: [
                    { name: 'Shared 1', items: items.concat(Array(Math.max(0, 100 - items.length)).fill(null)) },
                    { name: 'Shared 2', items: Array(100).fill(null) },
                    { name: 'Shared 3', items: Array(100).fill(null) },
                    { name: 'Private', items: Array(100).fill(null) }
                ],
                gold: data.gold || 0
            };
        }

        return data || defaultStash;
    },

    async upsertSharedStash(tabs, gold) {
        if (!this.isLoggedIn()) return false;
        
        const payload = {
            user_id: this.session.user.id,
            tabs,
            gold,
            updated_at: new Date().toISOString()
        };

        const { error } = await this.client
            .from('shared_stash')
            .upsert(payload, { onConflict: 'user_id' });
        
        if (error) {
            console.error('Upsert shared stash error:', error);
            return false;
        }
        return true;
    },

    // --- Social & Chat System ---
    
    async findUserByName(charName) {
        // Buscamos en la tabla de saves donde el jsonb 'player' tiene el nombre
        const { data, error } = await this.client
            .from('saves')
            .select('user_id, player')
            .eq('player->>charName', charName)
            .maybeSingle();
        
        if (error) console.error('Error finding user:', error);
        return data;
    },

    async sendMessage(content, receiverId = null, isWhisper = false) {
        if (!this.isLoggedIn()) return false;
        
        // Get character name from global player object if available
        const senderName = window.player?.charName || 'Me';

        const { error } = await this.client
            .from('messages')
            .insert({
                sender_id: this.session.user.id,
                sender_name: senderName,
                receiver_id: receiverId,
                content: content,
                is_whisper: isWhisper
            });
        return !error;
    },

    async getRecentMessages() {
        // Obtenemos los últimos 50 mensajes (globales o dirigidos a mí)
        const { data, error } = await this.client
            .from('messages')
            .select('*, sender:sender_id(id)') // En un sistema real usaríamos el username del perfil
            .or(`receiver_id.is.null,receiver_id.eq.${this.session.user.id},sender_id.eq.${this.session.user.id}`)
            .order('created_at', { ascending: false })
            .limit(50);
        
        return data ? data.reverse() : [];
    },

    async addFriend(friendId) {
        if (!this.isLoggedIn()) return false;
        const { error } = await this.client
            .from('friends')
            .upsert({
                user_id: this.session.user.id,
                friend_id: friendId,
                status: 'pending'
            });
        return !error;
    },

    async getFriends() {
        if (!this.isLoggedIn()) return [];
        const { data, error } = await this.client
            .from('friends')
            .select('*')
            .or(`user_id.eq.${this.session.user.id},friend_id.eq.${this.session.user.id}`);
        return data || [];
    },

    // Suscripción en tiempo real a mensajes
    subscribeToChat(callback) {
        if (this.chatChannel) {
            this.client.removeChannel(this.chatChannel);
        }
        this.chatChannel = this.client
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                callback(payload.new);
            })
            .subscribe();
        return this.chatChannel;
    },

    // --- Presence & Online Status ---
    
    trackPresence(charName, zoneLevel) {
        if (!this.isLoggedIn()) return null;
        
        if (this.presenceChannel) {
            this.client.removeChannel(this.presenceChannel);
        }

        const channel = this.client.channel('online-users', {
            config: { presence: { key: this.session.user.id } }
        });

        this.presenceChannel = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                bus.emit('social:presenceSync', state);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                bus.emit('social:playerOnline', newPresences[0]);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                bus.emit('social:playerOffline', leftPresences[0]);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        charName,
                        zoneLevel,
                        online_at: new Date().toISOString()
                    });
                }
            });

        return channel;
    },

    // --- Party System ---

    async createParty() {
        if (!this.isLoggedIn()) return null;
        const { data: party, error: pError } = await this.client
            .from('parties')
            .insert({ leader_id: this.session.user.id })
            .select()
            .single();
        
        if (pError) return null;

        await this.client
            .from('party_members')
            .insert({ party_id: party.id, user_id: this.session.user.id });
        
        return party;
    },

    async joinParty(partyId) {
        if (!this.isLoggedIn()) return false;
        const { error } = await this.client
            .from('party_members')
            .insert({ party_id: partyId, user_id: this.session.user.id });
        return !error;
    },

    async leaveParty() {
        if (!this.isLoggedIn()) return false;
        const { error } = await this.client
            .from('party_members')
            .delete()
            .eq('user_id', this.session.user.id);
        return !error;
    },

    async getPartyMembers(partyId) {
        const { data, error } = await this.client
            .from('party_members')
            .select('user_id, joined_at')
            .eq('party_id', partyId);
        return data || [];
    },

    // --- Auction House ---

    async getAuctions() {
        const { data, error } = await this.client
            .from('auctions')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        return data || [];
    },

    async postAuction(item, price, charName) {
        if (!this.isLoggedIn()) return false;
        const { error } = await this.client
            .from('auctions')
            .insert({
                seller_id: this.session.user.id,
                seller_name: charName,
                item_data: item,
                price: price
            });
        return !error;
    },

    async buyAuction(auctionId, price) {
        if (!this.isLoggedIn()) return false;
        
        // Usar RPC para transacción atómica
        const { data, error } = await this.client.rpc('buy_auction', {
            p_auction_id: auctionId,
            p_buyer_id: this.session.user.id,
            p_price: price
        });
        
        if (error) {
            console.error('Auction purchase error:', error.message);
            return false;
        }
        return data; // Retorna el item_data
    }
};
