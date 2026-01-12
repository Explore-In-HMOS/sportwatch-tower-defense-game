export default {
    data: {
        tower: { x: 227, y: 227 },
        enemies: [],
        bullets: [],
        playerHp: 20,
        attackSpeed: 800,
        damage: 1,
        score: 0,
        time: 0,
        showLevelUp: false,
        gameRunning: false,
        gameOverState: false,
        canvasW: 454,
        canvasH: 454,
        attackTimer: null,
        enemyTimer: null,
        lastUpdate: 0,
        levelUpButtons: [
          { text: `Attack Speed +`, action: 'increaseAttackSpeed' },
          { text: `Damage +`, action: 'increaseDamage' },
          { text: `HP +`, action: 'increaseHp' }
        ]
    },

    onShow() {
        this.resetGame()
        this.startGame()
    },

    resetGame() {
        this.enemies = []
        this.bullets = []
        this.playerHp = 20
        this.attackSpeed = 800
        this.damage = 1
        this.score = 0
        this.time = 0
        this.showLevelUp = false
        this.gameOverState = false
        this.gameRunning = true
        this.lastUpdate = Date.now()
    },

    startGame() {
        this.gameRunning = true
        this.lastUpdate = Date.now()

        this.spawnLoop()
        this.shootLoop()

        this.gameLoop()
    },

    spawnLoop() {
        if (this.enemyTimer) {
            clearTimeout(this.enemyTimer)
        }

        const spawnEnemy = () => {
            if (!this.gameRunning) {
                return
            }

            const radius = this.canvasW / 2 - 20
            const angle = Math.random() * Math.PI * 2
            const x = this.canvasW / 2 + radius * Math.cos(angle)
            const y = this.canvasH / 2 + radius * Math.sin(angle)

            this.enemies.push({
                x, y,
                hp: 2 + Math.floor(this.time / 20),
                damage: 2 + Math.floor(this.time / 40)
            })

            const interval = Math.max(400, 2000 - this.time * 30)
            this.enemyTimer = setTimeout(spawnEnemy, interval)
        }

        spawnEnemy()
    },

    shootLoop() {
        if (this.attackTimer){
            clearInterval(this.attackTimer)
        } 
        this.attackTimer = setInterval(() => {
            if (this.gameRunning){
            this.shoot()
            } 
        }, this.attackSpeed)
    },


    findClosestEnemy() {
        if (this.enemies.length === 0) {
            return null
        }
        return this.enemies.reduce((a, b) => {
            const da = Math.hypot(a.x - this.tower.x, a.y - this.tower.y)
            const db = Math.hypot(b.x - this.tower.x, b.y - this.tower.y)
            return da < db ? a : b
        })
    },

    shoot() {
        const target = this.findClosestEnemy()
        if (!target) {
            return
        }
        this.bullets.push({ x: this.tower.x, y: this.tower.y, target })
    },


    moveEnemies(delta) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i]
            const dx = this.tower.x - e.x
            const dy = this.tower.y - e.y
            const dist = Math.hypot(dx, dy) || 1
            const speed = (0.8 + this.time * 0.005) * delta * 60

            e.x += (dx / dist) * speed
            e.y += (dy / dist) * speed

            if (dist < 20) {
                this.playerHp -= e.damage
                this.enemies.splice(i, 1)
                if (this.playerHp <= 0){
                this.gameOver()
                } 
            }
        }
    }
,

    moveBullets(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i]
            const t = b.target
            if (!t) {
                 this.bullets.splice(i, 1); continue 
                }
            const dx = t.x - b.x
            const dy = t.y - b.y
            const dist = Math.hypot(dx, dy) || 1

            const speed = 6 * delta * 60

            if (dist <= speed) {
                if (t.hp > 0) {
                    t.hp -= this.damage
                    if (t.hp <= 0 && !t.dead) {
                        t.dead = true
                        const idx = this.enemies.indexOf(t)
                        if (idx !== -1){
                            this.enemies.splice(idx, 1)
                        } 
                        this.score++
                        if (this.score % 5 === 0){
                            this.levelUpMenu()
                        } 
                    }
                }
                this.bullets.splice(i, 1)
                continue
            }


            b.x += (dx / dist) * speed
            b.y += (dy / dist) * speed
        }
    }

,

    levelUpMenu() {
        this.showLevelUp = true
        this.gameRunning = false

        if (this.enemyTimer) { clearTimeout(this.enemyTimer); this.enemyTimer = null }
        if (this.attackTimer) { clearInterval(this.attackTimer); this.attackTimer = null }
    },

    onCanvasTouch(e) {
        const x = e.globalX
        const y = e.globalY - 50
        if (this.showLevelUp) {
            const menuX = 50, menuY = 90, menuW = 220, btnH = 30, margin = 10
            for (let i = 0; i < this.levelUpButtons.length; i++) {
                const bx = menuX + 15
                const by = menuY + 45 + i * (btnH + margin)
                const bw = menuW - 30
                if (x >= bx && x <= bx + bw && y >= by && y <= by + btnH) {
                    const btn = this.levelUpButtons[i]
                    this[btn.action]()
                    this.showLevelUp = false
                    this.startGame()
                    return
                }
            }
        }

        if (this.gameOverState) {
            const bx = 110, by = 200, bw = 120, bh = 40
            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                this.resetGame()
                this.startGame()
            }
        }
    },

    drawGame() {
        const el = this.$refs.canvas1
        if (!el) {
            return
        }
        const ctx = el.getContext('2d')

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, this.canvasW, this.canvasH)

        ctx.fillStyle = '#713105'
        ctx.fillRect(this.tower.x - 6, this.tower.y - 6, 24, 24)

        ctx.strokeStyle = '#ff0000'
        this.enemies.forEach(e => {
            ctx.beginPath()
            ctx.lineWidth = 12
            ctx.arc(e.x, e.y, 6, 0, Math.PI * 2)
            ctx.stroke()
        })

        ctx.strokeStyle = '#0000ff'
        this.bullets.forEach(b => {
            ctx.beginPath()
            ctx.lineWidth = 6
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2)
            ctx.stroke()
        })

        ctx.fillStyle = '#000'
        ctx.font = '12px sans-serif'
        ctx.fillText(`HP: ${this.playerHp} |`, 70, 60)
        ctx.fillText(`Score: ${this.score} |`, 155, 60)
        ctx.fillText(`Time: ${Math.floor(this.time)}s`, 185, 20)
        ctx.fillText(`Enemies: ${this.enemies.length} `, 260, 60)

        if (this.showLevelUp) {
            const menuX = 50 * this.canvasW / 340
            const menuY = 90 * this.canvasH / 340
            const menuW = 240 * this.canvasW / 340
            const menuH = 170 * this.canvasH / 340
            ctx.fillStyle = 'rgba(230,230,230,0.95)'
            ctx.fillRect(menuX, menuY, menuW, menuH)
            ctx.strokeStyle = '#000'
            ctx.strokeRect(menuX, menuY, menuW, menuH)
            ctx.fillStyle = '#000'
            ctx.font = '18px sans-serif'
            ctx.fillText('LEVEL UP!', menuX + 80, menuY + 15)

            const btnH = 30 * this.canvasH / 340
            const margin = 10 * this.canvasH / 340
            for (let i = 0; i < this.levelUpButtons.length; i++) {
                const bx = menuX + 15
                const by = menuY + 45 + i * (btnH + margin)
                const bw = menuW - 30
                ctx.fillStyle = '#fff'
                ctx.fillRect(bx, by, bw, btnH)
                ctx.strokeStyle = '#000'
                ctx.strokeRect(bx, by, bw, btnH)
                ctx.fillStyle = '#000'
                ctx.font = '14px sans-serif'
                ctx.fillText(this.levelUpButtons[i].text, bx + 10, by + 7)
            }
        }

        if (this.gameOverState) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'
            ctx.fillRect(0, 0, this.canvasW, this.canvasH)
            ctx.fillStyle = '#fff'
            ctx.font = '35px sans-serif'
            ctx.fillText('GAME OVER', 165, 150)
            ctx.font = '16px sans-serif'
            ctx.fillText(`Score: ${this.score}`, 180, 190)

            const bx = 110 * this.canvasW / 340
            const by = 200 * this.canvasH / 340
            const bw = 120 * this.canvasW / 340
            const bh = 40 * this.canvasH / 340
            ctx.fillStyle = '#fff'
            ctx.fillRect(bx, by, bw, bh)
            ctx.strokeStyle = '#000'
            ctx.strokeRect(bx, by, bw, bh)
            ctx.fillStyle = '#000'
            ctx.font = '16px sans-serif'
            ctx.fillText('Restart', bx + 40, by + 15)
        }
    },


    gameLoop() {
        if (!this.gameRunning) {
            return
        }
        const now = Date.now()
        const delta = (now - this.lastUpdate) / 1000
        this.lastUpdate = now

        this.moveEnemies(delta)
        this.moveBullets(delta)
        this.time += delta
        this.drawGame()

        const elapsed = Date.now() - now
        const delay = Math.max(0, 16 - elapsed)
        this._gameLoopTimeout ??= () => this.gameLoop()
        setTimeout(this._gameLoopTimeout, delay)
    }

,

    gameOver() {
        this.gameRunning = false
        this.gameOverState = true
        clearInterval(this.enemyTimer)
        clearInterval(this.attackTimer)
    },


    increaseAttackSpeed() {
        this.attackSpeed = Math.max(10, this.attackSpeed * 0.9)
        if (this.gameRunning) {
            clearInterval(this.attackTimer)
            this.shootLoop()
        }
    },
    increaseDamage() { this.damage++ },
    increaseHp() { this.playerHp += 5 }
}
