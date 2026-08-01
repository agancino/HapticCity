/**
 * Player.js
 * Clase que controla la física, animaciones y comportamiento del personaje principal.
 * Movimiento Top-Down en 8 direcciones optimizado para PC (WASD/Flechas) y Móviles (Joystick).
 */
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = 190; // Velocidad de movimiento px/s

        // Determinar qué textura usar (imagen real o procedimental)
        const textureKey = this.scene.textures.exists('player_sprite') ? 'player_sprite' : 'player_procedural';

        // Crear Sprite de Arcade Physics
        this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);

        // Ajuste fino de la caja de colisión para que navegue sin atorarse por el asfalto
        this.sprite.body.setSize(12, 12);
        this.sprite.body.setOffset(10, 10);

        // Dirección actual para animaciones
        this.currentDirection = 'down';

        this.initAnimations();
    }

    initAnimations() {
        // En caso de que se utilicen spritesheets con múltiples marcos o animaciones sintéticas
        if (!this.scene.anims.exists('player_walk_down')) {
            this.scene.anims.create({
                key: 'player_walk_down',
                frames: [{ key: this.sprite.texture.key, frame: 0 }],
                frameRate: 8,
                repeat: -1
            });
        }
    }

    /**
     * Aplica el vector de velocidad al personaje y orienta la animación
     * @param {Object} inputVector - Vector con valores normalizados { x: [-1, 1], y: [-1, 1] }
     */
    move(inputVector) {
        if (!this.sprite || !this.sprite.body) return;

        let vx = inputVector.x * this.speed;
        let vy = inputVector.y * this.speed;

        // Si se mueve en diagonal, normalizar para evitar velocidad excesiva
        if (inputVector.x !== 0 && inputVector.y !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.sprite.setVelocity(vx, vy);

        // Actualizar dirección visual
        if (Math.abs(inputVector.x) > Math.abs(inputVector.y)) {
            if (inputVector.x > 0) {
                this.currentDirection = 'right';
            } else if (inputVector.x < 0) {
                this.currentDirection = 'left';
            }
        } else if (Math.abs(inputVector.y) > 0) {
            if (inputVector.y > 0) {
                this.currentDirection = 'down';
            } else if (inputVector.y < 0) {
                this.currentDirection = 'up';
            }
        }
    }

    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
