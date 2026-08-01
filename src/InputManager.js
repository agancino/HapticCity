/**
 * InputManager.js
 * Modo Autocontrol Automático: retorna (0,0) para dejar el movimiento 100% automático.
 */
class InputManager {
    constructor(scene) {
        this.scene = scene;
    }

    setJoystickVector(x, y) {}

    getInputVector() {
        return { x: 0, y: 0 };
    }
}

window.InputManager = InputManager;
