import { DB } from '../systems/db.js';

export class SocialHUD {
    constructor(network) {
        this.network = network;
        this.pendingRequests = [];
        this.initUI();
    }

    initUI() {
        // Create popup container
        const container = document.createElement('div');
        container.id = 'social-popup-container';
        container.style.position = 'absolute';
        container.style.top = '10%';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '1000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
        this.container = container;

        // Create Social Panel (Friends & Party)
        const panel = document.createElement('div');
        panel.id = 'social-panel';
        panel.className = 'window hidden';
        panel.style.width = '350px';
        panel.style.height = '450px';
        panel.style.top = '20%';
        panel.style.left = '20%';
        panel.style.zIndex = '900';
        panel.innerHTML = `
            <div class="window-header">Social <span class="close-btn" id="close-social-btn">X</span></div>
            <div class="window-content" style="display:flex; flex-direction:column; gap:10px; height: calc(100% - 30px);">
                <div style="display:flex; gap:5px;">
                    <input type="text" id="social-add-input" placeholder="Player Name..." style="flex:1; background:#111; color:#fff; border:1px solid #555; padding:5px;">
                    <button id="social-add-friend-btn" class="btn" style="padding: 5px;">Add Friend</button>
                    <button id="social-invite-party-btn" class="btn" style="padding: 5px;">Inv Party</button>
                </div>
                <div style="color: #b8860b; font-family: Cinzel; border-bottom: 1px solid #555; padding-bottom: 5px;">Friends List</div>
                <div id="social-friends-list" style="flex:1; overflow-y:auto; border:1px solid #333; padding:5px; background:rgba(0,0,0,0.5);">
                    <!-- Friends populated here -->
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        this.panel = panel;

        document.getElementById('close-social-btn').addEventListener('click', () => this.togglePanel(false));
        document.getElementById('social-add-friend-btn').addEventListener('click', () => {
            const name = document.getElementById('social-add-input').value.trim();
            if (name) this.network.addFriend(name);
            document.getElementById('social-add-input').value = '';
        });
        document.getElementById('social-invite-party-btn').addEventListener('click', () => {
            const name = document.getElementById('social-add-input').value.trim();
            if (name) this.network.sendPartyInvite(name);
            document.getElementById('social-add-input').value = '';
        });
    }

    togglePanel(force) {
        if (typeof force === 'boolean') {
            if (force) this.panel.classList.remove('hidden');
            else this.panel.classList.add('hidden');
        } else {
            this.panel.classList.toggle('hidden');
        }
        
        if (!this.panel.classList.contains('hidden')) {
            this.refreshFriendsList();
        }
    }

    async refreshFriendsList() {
        const list = document.getElementById('social-friends-list');
        list.innerHTML = '<div style="color:#aaa; text-align:center;">Loading friends...</div>';
        
        if (DB.isLoggedIn()) {
            const friends = await DB.getFriends();
            list.innerHTML = '';
            if (!friends || friends.length === 0) {
                list.innerHTML = '<div style="color:#777; text-align:center; padding-top:10px;">No friends found. Use the search above to add some.</div>';
                return;
            }
            
            friends.forEach(f => {
                const el = document.createElement('div');
                el.style.display = 'flex';
                el.style.justifyContent = 'space-between';
                el.style.alignItems = 'center';
                el.style.padding = '5px';
                el.style.borderBottom = '1px solid #333';
                el.innerHTML = `
                    <span style="color:#fff; font-weight:bold;">${f.friend_name || 'Unknown'}</span>
                    <div style="display:flex; gap:5px;">
                        <button class="btn" style="padding:2px 8px; font-size:11px;" onclick="window.networkManager.sendPartyInvite('${f.friend_name}')">Party</button>
                        <button class="btn" style="padding:2px 8px; font-size:11px;" onclick="window.networkManager.sendTradeInvite('${f.friend_name}')">Trade</button>
                    </div>
                `;
                list.appendChild(el);
            });
        } else {
            list.innerHTML = '<div style="color:#f44336; text-align:center;">Log in to use social features.</div>';
        }
    }

    addRequest(fromId, fromName, type) {
        // Prevent duplicates
        if (this.pendingRequests.some(r => r.fromId === fromId && r.type === type)) return;

        const reqId = Date.now() + Math.random();
        
        const popup = document.createElement('div');
        popup.className = 'window';
        popup.style.padding = '15px';
        popup.style.border = '2px solid #b8860b';
        popup.style.backgroundColor = 'rgba(10,10,10,0.95)';
        popup.style.boxShadow = '0 0 20px rgba(0,0,0,0.8)';
        popup.style.textAlign = 'center';
        popup.style.minWidth = '280px';
        popup.style.pointerEvents = 'auto'; // allow clicks
        
        let title = '';
        if (type === 'party') title = 'Party Invitation';
        if (type === 'trade') title = 'Trade Request';
        if (type === 'duel') title = 'Duel Challenge';
        
        popup.innerHTML = `
            <div style="color:#b8860b; font-size:18px; margin-bottom:10px; font-family:Cinzel,serif; text-shadow: 0 0 5px #b8860b;">${title}</div>
            <div style="color:#fff; margin-bottom:15px; font-size: 14px;"><strong>${fromName}</strong> has invited you.</div>
            <div style="display:flex; justify-content:center; gap:15px;">
                <button id="btn-accept-${reqId}" class="btn" style="background:#1a3311; border-color:#4caf50; color:#4caf50; width: 100px;">Accept (Y)</button>
                <button id="btn-decline-${reqId}" class="btn" style="background:#331111; border-color:#f44336; color:#f44336; width: 100px;">Decline (N)</button>
            </div>
            <div style="height:3px; background:#444; margin-top:12px; width:100%; border-radius: 2px; overflow: hidden;">
                <div id="bar-${reqId}" style="height:100%; width:100%; background:linear-gradient(90deg, #f44336, #b8860b); transition: width 15s linear;"></div>
            </div>
        `;
        
        this.container.appendChild(popup);
        
        const req = { id: reqId, fromId, fromName, type, element: popup };
        this.pendingRequests.push(req);
        
        // Force reflow then animate bar
        popup.offsetHeight;
        const bar = document.getElementById(`bar-${reqId}`);
        if (bar) bar.style.width = '0%';

        const acceptBtn = document.getElementById(`btn-accept-${reqId}`);
        const declineBtn = document.getElementById(`btn-decline-${reqId}`);
        
        acceptBtn.onclick = () => this.handleResponse(reqId, true);
        declineBtn.onclick = () => this.handleResponse(reqId, false);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (this.pendingRequests.includes(req)) {
                this.handleResponse(reqId, false);
            }
        }, 15000);
    }

    handleResponse(reqId, accepted) {
        const reqIndex = this.pendingRequests.findIndex(r => r.id === reqId);
        if (reqIndex === -1) return;
        
        const req = this.pendingRequests[reqIndex];
        this.pendingRequests.splice(reqIndex, 1);
        req.element.remove();
        
        if (accepted) {
            window.addCombatLog?.(`Accepted ${req.type} from ${req.fromName}`, 'log-info');
            if (req.type === 'trade') this.network.acceptTrade();
            else if (req.type === 'party') this.network.acceptPartyInvite(req.fromId);
            else if (req.type === 'duel') this.network.acceptDuel();
        } else {
            window.addCombatLog?.(`Declined ${req.type} from ${req.fromName}`, 'log-info');
        }
    }
    
    handleInput(key) {
        if (key === 'o' || key === 'O') {
            this.togglePanel();
            return true;
        }

        if (this.pendingRequests.length === 0) return false;
        
        const req = this.pendingRequests[0]; // Process the oldest request first
        
        if (key === 'y') {
            this.handleResponse(req.id, true);
            return true;
        } else if (key === 'n') {
            this.handleResponse(req.id, false);
            return true;
        }
        return false;
    }
}
