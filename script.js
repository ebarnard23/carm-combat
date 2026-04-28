const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const STORAGE_KEY_COINS = 'carmCombatCoins';

function loadCoins() {
    const saved = Number(localStorage.getItem(STORAGE_KEY_COINS));
    return Number.isFinite(saved) ? saved : 0;
}

function saveCoins() {
    localStorage.setItem(STORAGE_KEY_COINS, coins);
}

// Upgrade system
let healthUpgrades = 0;
let abilityUpgrades = { fire: 0, water: 0, lightning: 0 };
let combatUpgrades = { vanguard: 0, gunman: 0, warp: 0 };
let ownedClothes = { common: false, uncommon: false, rare: false, epic: false, legendary: false, mythic: false };
let equippedClothes = null;
let availableAuraChests = 0;
let ownedAuras = { moving: false, armor: false, aimbot: false };
let equippedAura = null;
let auraEnabled = false;
let auraCooldown = 0;
let movingAuraActive = 0;
let movingAuraPulse = 0;

function loadUpgrades() {
    healthUpgrades = Number(localStorage.getItem('carmCombatHealthUpgrades')) || 0;
    abilityUpgrades.fire = Number(localStorage.getItem('carmCombatAbilityFire')) || 0;
    abilityUpgrades.water = Number(localStorage.getItem('carmCombatAbilityWater')) || 0;
    abilityUpgrades.lightning = Number(localStorage.getItem('carmCombatAbilityLightning')) || 0;
    combatUpgrades.vanguard = Number(localStorage.getItem('carmCombatCombatVanguard')) || 0;
    combatUpgrades.gunman = Number(localStorage.getItem('carmCombatCombatGunman')) || 0;
    combatUpgrades.warp = Number(localStorage.getItem('carmCombatCombatWarp')) || 0;
    unlockedAbilities = JSON.parse(localStorage.getItem('carmCombatUnlockedAbilities') || '[]');
    activeAbility = localStorage.getItem('carmCombatActiveAbility') || null;
    ownedClothes.common = localStorage.getItem('carmCombatClothesCommon') === 'true';
    ownedClothes.uncommon = localStorage.getItem('carmCombatClothesUncommon') === 'true';
    ownedClothes.rare = localStorage.getItem('carmCombatClothesRare') === 'true';
    ownedClothes.epic = localStorage.getItem('carmCombatClothesEpic') === 'true';
    ownedClothes.legendary = localStorage.getItem('carmCombatClothesLegendary') === 'true';
    ownedClothes.mythic = localStorage.getItem('carmCombatClothesMythic') === 'true';
    equippedClothes = localStorage.getItem('carmCombatEquippedClothes') || null;
    availableAuraChests = Number(localStorage.getItem('carmCombatAuraChests')) || 0;
    ownedAuras.moving = localStorage.getItem('carmCombatAuraMoving') === 'true';
    ownedAuras.armor = localStorage.getItem('carmCombatAuraArmor') === 'true';
    ownedAuras.aimbot = localStorage.getItem('carmCombatAuraAimbot') === 'true';
    equippedAura = localStorage.getItem('carmCombatEquippedAura') || null;
    auraEnabled = localStorage.getItem('carmCombatAuraEnabled') === 'true';
}

function saveUpgrades() {
    localStorage.setItem('carmCombatHealthUpgrades', healthUpgrades);
    localStorage.setItem('carmCombatAbilityFire', abilityUpgrades.fire);
    localStorage.setItem('carmCombatAbilityWater', abilityUpgrades.water);
    localStorage.setItem('carmCombatAbilityLightning', abilityUpgrades.lightning);
    localStorage.setItem('carmCombatCombatVanguard', combatUpgrades.vanguard);
    localStorage.setItem('carmCombatCombatGunman', combatUpgrades.gunman);
    localStorage.setItem('carmCombatCombatWarp', combatUpgrades.warp);
    localStorage.setItem('carmCombatClothesCommon', ownedClothes.common);
    localStorage.setItem('carmCombatClothesUncommon', ownedClothes.uncommon);
    localStorage.setItem('carmCombatClothesRare', ownedClothes.rare);
    localStorage.setItem('carmCombatClothesEpic', ownedClothes.epic);
    localStorage.setItem('carmCombatClothesLegendary', ownedClothes.legendary);
    localStorage.setItem('carmCombatClothesMythic', ownedClothes.mythic);
    localStorage.setItem('carmCombatEquippedClothes', equippedClothes);
    localStorage.setItem('carmCombatUnlockedAbilities', JSON.stringify(unlockedAbilities));
    localStorage.setItem('carmCombatActiveAbility', activeAbility);
    localStorage.setItem('carmCombatAuraChests', availableAuraChests);
    localStorage.setItem('carmCombatAuraMoving', ownedAuras.moving);
    localStorage.setItem('carmCombatAuraArmor', ownedAuras.armor);
    localStorage.setItem('carmCombatAuraAimbot', ownedAuras.aimbot);
    localStorage.setItem('carmCombatEquippedAura', equippedAura);
    localStorage.setItem('carmCombatAuraEnabled', auraEnabled);
}

let gameState = 'MENU', isPaused = false, selectedClass = 'GUNMAN', player, enemies = [], projectiles = [], enemyProjectiles = [], particles = [], wave = 1, coins = loadCoins(), keys = {}, mouse = {x:0,y:0}, moveData = {active:false,dx:0,dy:0}, aimData = {active:false,dx:0,dy:0}, isFiring = false, shake = 0, animationId, waveActive = false;
let unlockedAbilities = [];
let activeAbility = null;
let abilityCooldown = 0;
const ABILITY_COOLDOWN_MAX = 600;

loadUpgrades();

const auraData = {
    moving: { name: 'Moving Aura', text: 'Slash from player to mouse.' },
    armor: { name: 'Armor Aura', text: 'Damage enemies near you automatically.' },
    aimbot: { name: 'Aim Bot Aura', text: 'Launch an aura orb every 2 seconds.' }
};

function getHumanAuraName(type) {
    return auraData[type] ? auraData[type].name : type;
}

function updateAuraMenu() {
    document.getElementById('chestCount').innerText = availableAuraChests;
    ['moving', 'armor', 'aimbot'].forEach(type => {
        const btn = document.getElementById(`aura${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
        if (!btn) return;
        btn.classList.remove('opacity-40');
        if (equippedAura === type) {
            btn.innerText = 'Equipped';
            btn.classList.add('btn-green');
            btn.classList.remove('btn-pink');
        } else if (ownedAuras[type]) {
            btn.innerText = 'Equip';
            btn.classList.remove('btn-green');
            btn.classList.add('btn-pink');
        } else {
            btn.innerText = 'Locked';
            btn.classList.remove('btn-green');
            btn.classList.remove('btn-pink');
            btn.classList.add('opacity-40');
        }
    });
}

function populateInventory() {
    const abilitiesEl = document.getElementById('inventoryAbilities');
    const clothesEl = document.getElementById('inventoryClothes');
    const auraEl = document.getElementById('inventoryAura');

    abilitiesEl.innerHTML = '';
    ['FIRE','WATER','LIGHTNING'].forEach(type => {
        const unlocked = unlockedAbilities.includes(type);
        abilitiesEl.insertAdjacentHTML('beforeend', `
            <div class="flex items-center justify-between gap-2 p-3 bg-white/5 rounded border border-white/10">
                <div>
                    <div class="font-bold">${type}</div>
                    <div class="text-[10px] opacity-60">${unlocked ? 'Unlocked' : 'Locked'}</div>
                </div>
                <button class="btn !py-1 !px-3 !text-xs" onclick="equipAbility('${type}')">${activeAbility===type ? 'Equipped' : (unlocked ? 'Equip' : 'Locked')}</button>
            </div>
        `);
    });

    clothesEl.innerHTML = '';
    Object.keys(ownedClothes).forEach(rarity => {
        const owned = ownedClothes[rarity];
        clothesEl.insertAdjacentHTML('beforeend', `
            <div class="flex items-center justify-between gap-2 p-3 bg-white/5 rounded border border-white/10">
                <div>
                    <div class="font-bold">${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Armor</div>
                    <div class="text-[10px] opacity-60">${owned ? 'Owned' : 'Buy to equip'}</div>
                </div>
                <button class="btn !py-1 !px-3 !text-xs" onclick="buyClothes('${rarity}')">${equippedClothes===rarity ? 'Equipped' : (owned ? 'Equip' : 'Buy')}</button>
            </div>
        `);
    });

    auraEl.innerHTML = '';
    ['moving', 'armor', 'aimbot'].forEach(type => {
        const owned = ownedAuras[type];
        auraEl.insertAdjacentHTML('beforeend', `
            <div class="flex items-center justify-between gap-2 p-3 bg-white/5 rounded border border-white/10">
                <div>
                    <div class="font-bold">${getHumanAuraName(type)}</div>
                    <div class="text-[10px] opacity-60">${owned ? 'Unlocked' : 'Locked'}</div>
                </div>
                <button class="btn !py-1 !px-3 !text-xs" onclick="equipAura('${type}')">${equippedAura===type ? 'Equipped' : (owned ? 'Equip' : 'Locked')}</button>
            </div>
        `);
    });
}

function openAuraChest() {
    if (availableAuraChests <= 0) {
        return alert('No boss chests available. Defeat a boss first to earn one.');
    }
    availableAuraChests--;
    const available = ['moving', 'armor', 'aimbot'].filter(type => !ownedAuras[type]);
    const rewardType = available.length ? available[Math.floor(Math.random() * available.length)] : ['moving', 'armor', 'aimbot'][Math.floor(Math.random() * 3)];
    ownedAuras[rewardType] = true;
    equippedAura = rewardType;
    saveUpgrades();
    updateAuraMenu();
    alert(`Opened a chest and unlocked ${getHumanAuraName(rewardType)}! It is now equipped.`);
}

function equipAura(type) {
    if (!ownedAuras[type]) {
        return alert('This aura is locked. Open more boss chests first.');
    }
    equippedAura = type;
    auraEnabled = true;
    saveUpgrades();
    updateAuraMenu();
    updateAuraCooldownDisplay();
    if (document.getElementById('auraButton')) {
        document.getElementById('auraButton').innerText = 'AURA ON';
    }
    alert(`Equipped ${getHumanAuraName(type)}.`);
}

function setAuraEnabled(value) {
    auraEnabled = value;
    saveUpgrades();
    updateAuraCooldownDisplay();
    if (document.getElementById('auraButton')) {
        document.getElementById('auraButton').innerText = auraEnabled ? 'AURA ON' : 'AURA OFF';
    }
}

function toggleAuraEnabled() {
    if (!equippedAura) {
        return alert('No aura equipped. Equip one in Inventory or Aura menu.');
    }
    setAuraEnabled(!auraEnabled);
}

function equipAbility(type) {
    if (!unlockedAbilities.includes(type)) {
        return alert('You must unlock this ability before equipping it.');
    }
    activeAbility = type;
    saveUpgrades();
    alert(`${type} ability equipped.`);
}

function updateAuraCooldownDisplay() {
    const text = document.getElementById('auraCooldownText');
    if (!equippedAura) {
        text.innerText = 'No aura equipped';
    } else if (!auraEnabled) {
        text.innerText = 'Aura OFF';
    } else if (equippedAura === 'aimbot' && auraCooldown > 0) {
        text.innerText = `Aim Bot ready in ${(auraCooldown/60).toFixed(1)}s`;
    } else {
        text.innerText = `${getHumanAuraName(equippedAura)} ON`;
    }
}

function activateAura() {
    toggleAuraEnabled();
}

function getAuraTarget() {
    if (!enemies.length) return null;
    const mouseTarget = enemies.reduce((best, enemy) => {
        const d = Math.hypot(enemy.x - mouse.x, enemy.y - mouse.y);
        return (!best || d < best.d) ? { enemy, d } : best;
    }, null);
    if (mouseTarget && mouseTarget.d <= 220) {
        return mouseTarget.enemy;
    }
    return enemies.reduce((best, enemy) => {
        const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        return (!best || d < best.d) ? { enemy, d } : best;
    }, null)?.enemy;
}


// DASH SYSTEM
let dashCooldown = 0;
let isDashTargeting = false;
const DASH_COOLDOWN_MAX = 300;
const DASH_SPEED = 20;

// WARP SYSTEM
let isWarpTargeting = false;
let warpTargetX = 0;
let warpTargetY = 0;

const ENEMY_TYPES = [
    { name: 'Drone', color: '#39ff14', radius: 12, speed: 2.1, hp: 12, damage: 4, hasWeapon: false, reward: 25 },
    { name: 'Inforcer', color: '#ff00ff', radius: 20, speed: 1.1, hp: 45, damage: 8, hasWeapon: true, reward: 50 },
    { name: 'Titan', color: '#bc13fe', radius: 40, speed: 0.7, hp: 300, damage: 20, hasWeapon: true, reward: 50 },
    { name: 'Commander', color: '#ff3131', radius: 80, speed: 0.5, hp: 1500, damage: 40, hasWeapon: true, isBoss: true, reward: 100 },
    { name: 'Mirror', color: '#ffffff', radius: 110, speed: 1.1, hp: 8000, damage: 60, isMirror: true, reward: 100 }
];

window.showSubMenu = function(menuId) {
    const menus = ['mainMenu', 'classMenu', 'skinsMenu', 'clothesMenu', 'auraMenu', 'inventoryMenu', 'abilitiesMenu', 'upgradeMenu', 'settingsMenu', 'pauseMenu', 'gameOver'];
    menus.forEach(m => document.getElementById(m)?.classList.add('hidden'));
    document.getElementById(menuId)?.classList.remove('hidden');
    if (menuId === 'inventoryMenu') populateInventory();
    if (menuId === 'auraMenu') updateAuraMenu();
    updateCoinDisplays();
};

function updateCoinDisplays() {
    document.querySelectorAll('.coin-display').forEach(el => el.innerText = coins);
    document.getElementById('coinVal').innerText = coins;
    saveCoins();
}

window.buyAbility = function(type) {
    if (coins >= 1000 && !unlockedAbilities.includes(type)) {
        coins -= 1000;
        unlockedAbilities.push(type);
        activeAbility = type;
        saveUpgrades();
        const btn = document.querySelector(`#ability-${type.toLowerCase()} .btn`);
        if (btn) btn.innerText = "EQUIPPED";
        updateCoinDisplays();
        document.getElementById('abilityHud').classList.remove('hidden');
        document.getElementById('abilityNameDisplay').innerText = type + " READY";
    } else if (unlockedAbilities.includes(type)) {
        activeAbility = type;
        saveUpgrades();
        document.getElementById('abilityNameDisplay').innerText = type + " READY";
    }
};

const clothesData = {
    common: { price: 100, health: 10, color: '#808080' },
    uncommon: { price: 250, health: 20, color: '#00ff00' },
    rare: { price: 500, health: 35, color: '#0080ff' },
    epic: { price: 1000, health: 50, color: '#8000ff' },
    legendary: { price: 2000, health: 75, color: '#ff8000' },
    mythic: { price: 5000, health: 100, color: '#ff0000' }
};

window.buyClothes = function(rarity) {
    const data = clothesData[rarity];
    if (coins >= data.price && !ownedClothes[rarity]) {
        coins -= data.price;
        ownedClothes[rarity] = true;
        equippedClothes = rarity;
        updateCoinDisplays();
        saveUpgrades();
        alert(`Bought ${rarity} armor! +${data.health} Health`);
    } else if (ownedClothes[rarity]) {
        equippedClothes = rarity;
        saveUpgrades();
        alert(`Equipped ${rarity} armor!`);
    } else {
        alert('Not enough credits!');
    }
};

window.upgradeHealth = function() {
    if (coins >= 250) {
        coins -= 250;
        healthUpgrades++;
        saveUpgrades();
        updateCoinDisplays();
    }
};

window.upgradeAbility = function(type) {
    if (coins >= 500) {
        coins -= 500;
        abilityUpgrades[type]++;
        saveUpgrades();
        updateCoinDisplays();
    }
};

window.upgradeCombat = function(type) {
    if (coins >= 750) {
        if (type === 'vanguard' && combatUpgrades.vanguard < 5) {
            coins -= 750;
            combatUpgrades.vanguard++;
        } else if (type === 'gunman' && combatUpgrades.gunman < 8) {
            coins -= 750;
            combatUpgrades.gunman++;
        } else if (type === 'warp' && combatUpgrades.warp < 5) {
            coins -= 750;
            combatUpgrades.warp++;
        }
        saveUpgrades();
        updateCoinDisplays();
    }
};

window.togglePause = function() {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    document.getElementById('pauseMenu').classList.toggle('hidden', !isPaused);
};

window.selectClass = function(id, el) {
    selectedClass = id;
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
};

class Player {
    constructor() {
        this.x = canvas.width/2; this.y = canvas.height/2; this.radius = 20; 
        let armorBonus = equippedClothes ? clothesData[equippedClothes].health : 0;
        this.maxHp = (300 + armorBonus) * (1 + healthUpgrades * 0.05);
        this.hp = this.maxHp;
        this.color = selectedClass === 'WARP' ? '#ff00ff' : (selectedClass === 'VANGUARD' ? '#39ff14' : '#00f3ff');
        this.armorColor = equippedClothes ? clothesData[equippedClothes].color : this.color;
        this.speed = selectedClass === 'WARP' ? 0 : 5.8; this.attackCooldown = 0; this.angle = 0; this.vx = 0; this.vy = 0;
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.shadowBlur = 15; ctx.shadowColor = this.armorColor; ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        ctx.strokeRect(-15, -15, 30, 30); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-15, -15, 30, 30);
        if (selectedClass === 'GUNMAN') { ctx.fillStyle = this.color; ctx.fillRect(15, -5, 12, 10); }
        else if (selectedClass === 'VANGUARD') { ctx.fillStyle = 'rgba(57, 255, 20, 0.3)'; ctx.fillRect(15, -10, 80, 20); ctx.strokeStyle = '#39ff14'; ctx.strokeRect(15, -10, 80, 20); }
        ctx.restore();
    }
    update() {
        if(isPaused) return;
        if(aimData.active) this.angle = Math.atan2(aimData.dy, aimData.dx);
        else this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        
        // Update warp targeting position
        if(isWarpTargeting && selectedClass === 'WARP') {
            warpTargetX = mouse.x;
            warpTargetY = mouse.y;
        }
        
        if (selectedClass !== 'WARP') {
            let ax = moveData.active ? moveData.dx : (keys['d']?1:0) - (keys['a']?1:0);
            let ay = moveData.active ? moveData.dy : (keys['s']?1:0) - (keys['w']?1:0);
            this.vx += ax * 0.8; this.vy += ay * 0.8; this.vx *= 0.9; this.vy *= 0.9;
            this.x += this.vx; this.y += this.vy;
        }
        if (selectedClass === 'VANGUARD') this.bladeCheck();
        else if (selectedClass === 'GUNMAN' && isFiring) this.attack();
        this.x = Math.max(20, Math.min(canvas.width-20, this.x)); this.y = Math.max(20, Math.min(canvas.height-20, this.y));
        if(this.attackCooldown > 0) this.attackCooldown--;

        if(abilityCooldown > 0) {
            abilityCooldown--;
            document.getElementById('abilityCooldownFill').style.width = (abilityCooldown / ABILITY_COOLDOWN_MAX * 100) + '%';
        }
        if (auraCooldown > 0) {
            auraCooldown--;
            updateAuraCooldownDisplay();
        }
        if (equippedAura === 'armor' && auraEnabled) {
            enemies.forEach(e => {
                if (Math.hypot(e.x - this.x, e.y - this.y) < e.radius + 110) {
                    e.hp -= 0.7;
                    spawnParticles(e.x, e.y, '#6ee7b7', 1);
                }
            });
        }
        if(dashCooldown > 0) dashCooldown--;

        document.getElementById('hpFill').style.width = Math.max(0, (this.hp/this.maxHp)*100) + '%';
        if(this.hp <= 0) endGame();
    }
    bladeCheck() {
        const tx = this.x + Math.cos(this.angle) * 95, ty = this.y + Math.sin(this.angle) * 95;
        enemies.forEach(e => { if(distToSeg({x:e.x,y:e.y}, {x:this.x,y:this.y}, {x:tx,y:ty}) < e.radius + 10) { e.hp -= 8 * (1 + combatUpgrades.vanguard); shake = 2; } });
    }
    attack() { 
        if(this.attackCooldown <= 0) { 
            const bulletCount = 1 + combatUpgrades.gunman;
            for(let i = 0; i < bulletCount; i++) {
                const spread = (i - (bulletCount-1)/2) * 0.1; // small spread
                projectiles.push(new Projectile(this.x, this.y, this.angle + spread, true, this.color)); 
            }
            this.attackCooldown = 8; shake = 1; 
        } 
    }
    warp(tx, ty) {
        if(isPaused || this.attackCooldown > 0) return; 
        this.attackCooldown = 25;
        const warpRadius = 50 + combatUpgrades.warp * 30;
        const baseDamage = 50 * (1 + combatUpgrades.warp * 0.5);
        
        // Damage along the warp path
        const points = 20 + combatUpgrades.warp * 5;
        for(let i=0; i<=points; i++){
            const px = this.x + (tx - this.x)*(i/points), py = this.y + (ty - this.y)*(i/points);
            enemies.forEach(e => { if(Math.hypot(e.x-px, e.y-py) < e.radius+25) e.hp -= baseDamage; });
        }
        
        // Damage at destination area
        enemies.forEach(e => {
            if(Math.hypot(e.x - tx, e.y - ty) < warpRadius + e.radius) { 
                e.hp -= baseDamage * 1.5;
            }
        });
        
        this.x = tx; this.y = ty; shake = 10; spawnParticles(tx, ty, this.color, 15);
    }
    dash(tx, ty) {
        if(isPaused || dashCooldown > 0 || selectedClass === 'WARP') return;
        dashCooldown = DASH_COOLDOWN_MAX;
        const d = Math.hypot(tx - this.x, ty - this.y);
        if(d === 0) return;
        const speed = Math.min(d, 250);
        this.x = this.x + (tx - this.x) / d * speed;
        this.y = this.y + (ty - this.y) / d * speed;
        shake = 8;
        spawnParticles(this.x, this.y, this.color, 20);
    }
    useAbility() {
        if (abilityCooldown > 0 || !activeAbility || isPaused) return;
        abilityCooldown = ABILITY_COOLDOWN_MAX;
        shake = 15;

        if (activeAbility === 'FIRE') {
            const damage = 500 * (1 + abilityUpgrades.fire);
            spawnParticles(this.x, this.y, '#ff4400', 50);
            enemies.forEach(e => {
                if(Math.hypot(e.x - this.x, e.y - this.y) < 300) { e.hp -= damage; spawnParticles(e.x, e.y, '#ff4400', 5); }
            });
        } else if (activeAbility === 'WATER') {
            const damage = 300 * (1 + abilityUpgrades.water);
            spawnParticles(this.x, this.y, '#00ffff', 50);
            enemies.forEach(e => {
                if(Math.hypot(e.x - this.x, e.y - this.y) < 400) { e.speed *= 0.5; e.hp -= damage; }
            });
        } else if (activeAbility === 'LIGHTNING') {
            const damage = 800 * (1 + abilityUpgrades.lightning);
            enemies.forEach(e => {
                ctx.beginPath(); ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 3;
                ctx.moveTo(this.x, this.y); ctx.lineTo(e.x, e.y); ctx.stroke();
                e.hp -= damage; spawnParticles(e.x, e.y, '#ffff00', 10);
            });
        }
    }
}

class Enemy {
    constructor(waveNum, config = {}) {
        let t = config.isMirror ? ENEMY_TYPES[4] : (config.isBoss ? ENEMY_TYPES[3] : ENEMY_TYPES[Math.floor(Math.random()*(waveNum > 15 ? 3 : (waveNum > 8 ? 2 : 1)))]);
        const s = Math.floor(Math.random()*4);
        this.x = s===0?-100:(s===1?canvas.width+100:Math.random()*canvas.width); this.y = s===2?-100:(s===3?canvas.height+100:Math.random()*canvas.height);
        this.radius = t.radius; this.color = config.isMirror ? player.color : t.color;
        this.hp = t.hp * (1 + waveNum*0.08); this.maxHp = this.hp; this.speed = t.speed;
        this.damage = t.damage; this.hasWeapon = t.hasWeapon || config.isMirror;
        this.isBoss = t.isBoss || config.isMirror; this.isMirror = config.isMirror;
        this.reward = t.reward; // Storing the reward value based on enemy type
        this.cooldown = 60; this.angle = 0; this.mirrorClass = selectedClass;
    }
    draw() {
        const w = this.radius * 2, p = this.hp/this.maxHp;
        ctx.fillStyle = 'rgba(255,0,0,0.3)'; ctx.fillRect(this.x-w/2, this.y-this.radius-15, w, 5);
        ctx.fillStyle = this.color; ctx.fillRect(this.x-w/2, this.y-this.radius-15, w*p, 5);
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.strokeStyle = this.color; ctx.lineWidth = this.isBoss ? 4 : 2; ctx.strokeRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2); ctx.restore();
    }
    update() {
        if(isPaused) return;
        const d = Math.hypot(player.x-this.x, player.y-this.y); this.angle = Math.atan2(player.y-this.y, player.x-this.x);
        if (d > (this.hasWeapon?250:0)) { this.x += Math.cos(this.angle)*this.speed; this.y += Math.sin(this.angle)*this.speed; }
        if(d < this.radius + 20) player.hp -= this.damage/70;
        this.cooldown--;
        if(this.cooldown <= 0 && this.hasWeapon) {
            enemyProjectiles.push(new Projectile(this.x, this.y, this.angle, false, this.color));
            this.cooldown = this.isBoss ? 40 : 100;
        }
    }
}

class Projectile {
    constructor(x, y, a, f, c, radius = null, damage = null, speed = null, splash = null) {
        this.x = x; this.y = y; this.f = f; this.c = c;
        this.radius = radius ?? (f ? 12 : 5);
        this.damage = damage ?? (f ? 40 : 12);
        this.vx = Math.cos(a) * (speed ?? (f ? 18 : 7));
        this.vy = Math.sin(a) * (speed ?? (f ? 18 : 7));
        this.life = 120;
        this.splash = splash ?? (f ? 45 : 0);
    }
    draw() { ctx.fillStyle = this.c; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); }
    update() {
        if(isPaused) return;
        this.x += this.vx; this.y += this.vy; this.life--;
        if(this.f) {
            enemies.forEach(e => {
                if(Math.hypot(this.x - e.x, this.y - e.y) < e.radius + this.radius) {
                    e.hp -= this.damage;
                    if (this.splash > 0) {
                        enemies.forEach(follow => {
                            if (follow !== e && Math.hypot(follow.x - e.x, follow.y - e.y) < this.splash) {
                                follow.hp -= this.damage * 0.55;
                            }
                        });
                        spawnParticles(e.x, e.y, this.c, 18);
                    }
                    this.life = 0;
                }
            });
        } else if (Math.hypot(this.x - player.x, this.y - player.y) < 25) {
            player.hp -= this.damage;
            this.life = 0;
            shake = 5;
        }
    }
}

function handleAuraEffects() {
    if (!equippedAura || !auraEnabled || isPaused) return;

    if (equippedAura === 'aimbot') {
        if (auraCooldown <= 0 && enemies.length > 0) {
            const target = getAuraTarget();
            if (target) {
                const angle = Math.atan2(target.y - player.y, target.x - player.x);
                projectiles.push(new Projectile(player.x, player.y, angle, true, '#ffff80', 18, 55, 18, 100));
                auraCooldown = 120;
                updateAuraCooldownDisplay();
            }
        }
    }

    if (equippedAura === 'moving') {
        movingAuraPulse--;
        if (movingAuraPulse <= 0) {
            movingAuraPulse = 6;
            const target = { x: mouse.x, y: mouse.y };
            enemies.forEach(e => {
                if (distToSeg({ x: e.x, y: e.y }, { x: player.x, y: player.y }, target) < e.radius + 22) {
                    e.hp -= 24;
                    spawnParticles(e.x, e.y, '#ff0033', 10);
                }
            });
        }
    }
}

function spawnParticles(x,y,c,n) { for(let i=0; i<n; i++) particles.push({x,y,vx:(Math.random()-0.5)*12,vy:(Math.random()-0.5)*12,a:1,c}); }
function distToSeg(p, v, w) {
    const l2 = Math.pow(v.x-w.x, 2) + Math.pow(v.y-w.y, 2); if (l2 === 0) return Math.hypot(p.x-v.x, p.y-v.y);
    let t = Math.max(0, Math.min(1, ((p.x-v.x)*(w.x-v.x) + (p.y-v.y)*(w.y-v.y))/l2));
    return Math.hypot(p.x - (v.x + t*(w.x-v.x)), p.y - (v.y + t*(w.y-v.y)));
}

window.startGame = function() {
    gameState = 'PLAYING'; isPaused = false;
    document.getElementById('classMenu').classList.add('hidden');
    document.getElementById('gameHud').classList.remove('hidden'); document.getElementById('waveHud').classList.remove('hidden');
    document.getElementById('touchControls').classList.remove('hidden'); document.getElementById('pauseBtn').classList.remove('hidden');
    if(activeAbility) document.getElementById('abilityHud').classList.remove('hidden');
    if(equippedAura) {
        document.getElementById('auraHud').classList.remove('hidden');
        updateAuraCooldownDisplay();
    } else {
        document.getElementById('auraHud').classList.add('hidden');
    }
    canvas.style.display = 'block';
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    player = new Player(); enemies = []; projectiles = []; enemyProjectiles = []; particles = []; wave = 1;
    initWave(); animate();
};

function initWave() {
    waveActive = false; const isM = wave > 0 && wave % 20 === 0; const isB = !isM && wave > 0 && wave % 10 === 0;
    const b = document.getElementById('waveBanner'), bt = document.getElementById('bannerText');
    bt.innerText = isM ? "MIRROR BOSS" : (isB ? "BOSS SECTOR" : `WAVE ${wave}`);
    bt.className = `text-5xl md:text-7xl font-black italic tracking-tighter ${isM?'neon-text-pink':(isB?'neon-text-red':'neon-text-blue')}`;
    b.style.opacity = '1'; setTimeout(() => { b.style.opacity = '0'; spawnWave(isB, isM); }, 2000);
    document.getElementById('waveVal').innerText = wave;
}

function spawnWave(isB, isM) {
    waveActive = true;
    if(isM) enemies.push(new Enemy(wave, {isMirror:true}));
    else if(isB) { enemies.push(new Enemy(wave, {isBoss:true})); for(let i=0; i<3; i++) enemies.push(new Enemy(wave)); }
    else { for(let i=0; i<Math.min(25, 4+wave); i++) setTimeout(() => { if(gameState==='PLAYING' && !isPaused) enemies.push(new Enemy(wave)); }, i*400); }
}

function endGame() { gameState='GAMEOVER'; cancelAnimationFrame(animationId); document.getElementById('finalWave').innerText = wave-1; document.getElementById('gameOver').classList.remove('hidden'); document.getElementById('pauseBtn').classList.add('hidden'); }

function animate() {
    if(gameState !== 'PLAYING') return;
    animationId = requestAnimationFrame(animate);
    ctx.setTransform(1,0,0,1,0,0); if(shake>0 && !isPaused) { ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake); shake *= 0.9; }
    ctx.fillStyle = '#020205'; ctx.fillRect(0,0,canvas.width,canvas.height);
    player.update(); player.draw();
    if(!isPaused) { projectiles = projectiles.filter(p => p.life > 0); enemyProjectiles = enemyProjectiles.filter(p => p.life > 0); }
    [...projectiles, ...enemyProjectiles].forEach(p => { p.update(); p.draw(); });

    handleAuraEffects();

    if (equippedAura === 'moving' && auraEnabled) {
        const target = { x: mouse.x, y: mouse.y };
        ctx.strokeStyle = '#ff3131'; ctx.lineWidth = 8; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(target.x, target.y); ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(255, 50, 50, 0.75)';
        ctx.beginPath(); ctx.arc(target.x, target.y, 28, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    enemies.forEach((e, i) => {
        e.update();
        e.draw();
        if(e.hp <= 0) {
            coins += e.reward;
            if (e.isBoss || e.isMirror) {
                availableAuraChests++;
                saveUpgrades();
            }
            updateCoinDisplays();
            spawnParticles(e.x,e.y,e.color,10);
            enemies.splice(i,1);
        }
    });

    particles.forEach((p, i) => { if(!isPaused) { p.x+=p.vx; p.y+=p.vy; p.a-=0.02; } ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,4,4); if(p.a<=0) particles.splice(i,1); });
    
    // Draw warp targeting indicator
    if(isWarpTargeting && selectedClass === 'WARP' && gameState === 'PLAYING') {
        const warpRadius = 50 + combatUpgrades.warp * 30;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(warpTargetX, warpTargetY, warpRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw size indicator
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`SIZE: ${Math.floor(warpRadius)} px`, warpTargetX, warpTargetY - warpRadius - 15);
    }
    
    ctx.globalAlpha=1; if(waveActive && enemies.length === 0 && !isPaused) { waveActive=false; setTimeout(() => { if(!isPaused) { wave++; initWave(); } }, 1000); }
}

window.onkeydown = e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'f') toggleAuraEnabled();
    if(e.key.toLowerCase() === 'p' || e.key === 'Escape') togglePause();
    if(e.code === 'Space') { e.preventDefault(); isDashTargeting = !isDashTargeting; }
    if(e.code === 'KeyQ') player.useAbility();
};
window.onkeyup = e => keys[e.key.toLowerCase()] = false;
window.onmousemove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
window.onmousedown = e => { 
    if(gameState==='PLAYING' && !isPaused) { 
        if(isDashTargeting) { 
            isDashTargeting = false; 
            player.dash(e.clientX, e.clientY); 
        } else if(selectedClass==='WARP') { 
            isWarpTargeting = true;
        } else { 
            isFiring=true; 
        } 
    } 
};
window.onmouseup = () => { 
    if(isWarpTargeting && selectedClass === 'WARP') {
        isWarpTargeting = false;
        player.warp(warpTargetX, warpTargetY);
    }
    isFiring = false; 
};

function setupJoy(id, dat, kId) {
    const z = document.getElementById(id), k = document.getElementById(kId); if(!z) return;
    const move = (e) => { if(isPaused) return; e.preventDefault(); const t = e.touches[0]; const r = z.getBoundingClientRect(); const dx = t.clientX-(r.left+50), dy = t.clientY-(r.top+50); const d = Math.hypot(dx,dy); const ndx = d>50?(dx/d)*50:dx, ndy = d>50?(dy/d)*50:dy; dat.active=true; dat.dx=ndx/50; dat.dy=ndy/50; k.style.transform=`translate(calc(-50% + ${ndx}px), calc(-50% + ${ndy}px))`; };
    z.ontouchstart = move; z.ontouchmove = move; z.ontouchend = () => { dat.active=false; k.style.transform='translate(-50%,-50%)'; };
}
setupJoy('moveJoystick', moveData, 'moveKnob'); setupJoy('aimJoystick', aimData, 'aimKnob');
document.getElementById('spellBtn').ontouchstart = (e) => { e.preventDefault(); player.useAbility(); };
document.getElementById('dashBtn').ontouchstart = (e) => { e.preventDefault(); if(gameState==='PLAYING' && !isPaused && selectedClass !== 'WARP') isDashTargeting = !isDashTargeting; };
document.getElementById('fireBtn').ontouchstart = (e) => { 
    if(isPaused) return; 
    e.preventDefault(); 
    if(isDashTargeting) { 
        isDashTargeting = false; 
        const dashDist = aimData.active ? 250 : 250; 
        const dashAngle = aimData.active ? Math.atan2(aimData.dy, aimData.dx) : player.angle; 
        player.dash(player.x + Math.cos(dashAngle) * dashDist, player.y + Math.sin(dashAngle) * dashDist); 
    } else if(selectedClass==='WARP') { 
        isWarpTargeting = true;
    } else { 
        isFiring=true; 
    }
};
document.getElementById('fireBtn').ontouchend = () => { 
    if(isWarpTargeting && selectedClass === 'WARP') {
        isWarpTargeting = false;
        player.warp(player.x+Math.cos(player.angle)*300, player.y+Math.sin(player.angle)*300);
    }
    isFiring=false; 
};
