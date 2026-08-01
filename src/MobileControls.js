/**
 * MobileControls.js
 * Joystick virtual en pantalla y controles táctiles responsivos para dispositivos móviles y tablets.
 * Permite realizar toda la prueba utilizando exclusivamente la pantalla táctil.
 */
class MobileControls {
    constructor(scene, inputManager) {
        this.scene = scene;
        this.inputManager = inputManager;

        // Configuración del Joystick
        this.baseRadius = 55;
        this.stickRadius = 25;
        this.isPointerDown = false;

        this.createVirtualJoystick();
    }

    createVirtualJoystick() {
        const cam = this.scene.cameras.main;
        
        // Posicionamiento en esquina inferior izquierda fijo en pantalla
        const defaultX = 110;
        const defaultY = cam.height - 110;

        // Grupo contenedor estático fijado a la cámara (ScrollFactor = 0)
        this.container = this.scene.add.container(defaultX, defaultY).setScrollFactor(0).setDepth(100);

        // Base del Joystick (Círculo translucido)
        this.base = this.scene.add.circle(0, 0, this.baseRadius, 0x1e293b, 0.5)
            .setStrokeStyle(3, 0x38bdf8, 0.7);

        // Palanca Central del Joystick
        this.stick = this.scene.add.circle(0, 0, this.stickRadius, 0x0284c7, 0.85)
            .setStrokeStyle(2, 0xbae6fd, 0.9);

        // Texto indicativo para pantalla táctil
        this.touchLabel = this.scene.add.text(0, this.baseRadius + 18, 'JOYSTICK TÁCTIL', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '11px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.container.add([this.base, this.stick, this.touchLabel]);
        this.container.setVisible(false); // Oculto: El movimiento es 100% automático

        // Eventos táctiles y de puntero
        this.scene.input.on('pointerdown', (pointer) => {
            // Activar si el toque ocurre en la mitad izquierda de la pantalla
            if (pointer.x < cam.width * 0.45 && pointer.y > cam.height * 0.3) {
                this.isPointerDown = true;
                this.updateJoystickPosition(pointer);
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (this.isPointerDown) {
                this.updateJoystickPosition(pointer);
            }
        });

        this.scene.input.on('pointerup', () => {
            this.resetJoystick();
        });
    }

    updateJoystickPosition(pointer) {
        // Calcular diferencia desde el centro del contenedor
        const dx = pointer.x - this.container.x;
        const dy = pointer.y - this.container.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let angle = Math.atan2(dy, dx);
        let clampedDist = Math.min(distance, this.baseRadius);

        // Mover el stick gráfico
        this.stick.x = Math.cos(angle) * clampedDist;
        this.stick.y = Math.sin(angle) * clampedDist;

        // Normalizar vector (-1 a 1) para el InputManager
        const normX = this.stick.x / this.baseRadius;
        const normY = this.stick.y / this.baseRadius;

        this.inputManager.setJoystickVector(normX, normY);
    }

    resetJoystick() {
        this.isPointerDown = false;
        this.stick.x = 0;
        this.stick.y = 0;
        this.inputManager.setJoystickVector(0, 0);
    }
}

window.MobileControls = MobileControls;
