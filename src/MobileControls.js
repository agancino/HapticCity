/**
 * MobileControls.js
 * Deshabilitado para modo 100% autocontrol automático.
 */
class MobileControls {
    constructor(scene, inputManager) {
        this.scene = scene;
        this.inputManager = inputManager;
    }

    createVirtualJoystick() {
        // En modo autocontrol automático no se dibuja joystick
        return;
    }

    updateJoystickPosition() {}
    resetJoystick() {}
}

window.MobileControls = MobileControls;
