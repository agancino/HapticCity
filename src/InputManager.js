/**
 * InputManager.js
 * Captura y unifica las entradas de teclado (WASD / Flechas) y Controles Táctiles (Joystick móvil).
 */
class InputManager {
    constructor(scene) {
        this.scene = scene;

        // Configuración de Teclas PC (WASD y Flechas)
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Vector del Joystick táctil externo (suministrado por MobileControls)
        this.joystickVector = { x: 0, y: 0 };
    }

    /**
     * Establece el vector del joystick móvil desde MobileControls
     */
    setJoystickVector(x, y) {
        this.joystickVector.x = x;
        this.joystickVector.y = y;
    }

    /**
     * Calcula y retorna el vector de dirección unificado (-1 a 1 en X e Y)
     */
    getInputVector() {
        let x = 0;
        let y = 0;

        // 1. Lectura del Teclado (PC)
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            x -= 1;
        }
        if (this.cursors.right.isDown || this.wasd.right.isDown) {
            x += 1;
        }
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            y -= 1;
        }
        if (this.cursors.down.isDown || this.wasd.down.isDown) {
            y += 1;
        }

        // 2. Si el Joystick Táctil tiene prioridad o entrada activa
        if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
            x = this.joystickVector.x;
            y = this.joystickVector.y;
        }

        return { x, y };
    }
}
