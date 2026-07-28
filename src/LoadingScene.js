/**
 * LoadingScene.js
 * Escena de carga inicial. Genera las texturas en create() cuando el renderizador ya está listo.
 */
class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // En Phaser 3 la precarga se deja limpia para evitar errores de renderizador no inicializado
    }

    create() {
        // Generar texturas procedimentales en memoria ahora que el canvas/renderer está 100% listo
        this.generateProceduralGraphics();

        // Transición directa a la escena del menú principal
        this.scene.start('MenuScene');
    }

    /**
     * Genera texturas Pixel Art directamente en memoria para ejecución out-of-the-box
     */
    generateProceduralGraphics() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // 1. Textura del Jugador (Pixel Art Character: 32x32)
        gfx.clear();
        // Cuerpo / Camiseta (Azul)
        gfx.fillStyle(0x0284c7, 1);
        gfx.fillRect(8, 12, 16, 14);
        // Cabeza / Piel
        gfx.fillStyle(0xfde047, 1);
        gfx.fillRect(10, 4, 12, 10);
        // Pelo (Marrón)
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(9, 2, 14, 4);
        // Ojos
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillRect(12, 7, 2, 3);
        gfx.fillRect(18, 7, 2, 3);
        // Pantalones (Azul Oscuro)
        gfx.fillStyle(0x1e3a8a, 1);
        gfx.fillRect(9, 24, 6, 8);
        gfx.fillRect(17, 24, 6, 8);
        // Zapatos (Negros)
        gfx.fillStyle(0x090d16, 1);
        gfx.fillRect(8, 30, 7, 2);
        gfx.fillRect(17, 30, 7, 2);

        gfx.generateTexture('player_procedural', 32, 32);
        gfx.generateTexture('player_sprite', 32, 32);

        // 2. Texturas Procedimentales de Edificios y Suelos (32x32 tiles)
        // Pasto / Parque
        gfx.clear();
        gfx.fillStyle(0x15803d, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillRect(4, 4, 4, 4);
        gfx.fillRect(20, 16, 4, 4);
        gfx.fillRect(12, 24, 4, 4);
        gfx.generateTexture('tile_grass', 32, 32);

        // Asfalto / Calle
        gfx.clear();
        gfx.fillStyle(0x334155, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.generateTexture('tile_road', 32, 32);

        // Cruce Peatonal / Línea Calle
        gfx.clear();
        gfx.fillStyle(0x334155, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0xf8fafc, 1);
        gfx.fillRect(4, 12, 24, 8);
        gfx.generateTexture('tile_crosswalk', 32, 32);

        // Acera / Peatonal
        gfx.clear();
        gfx.fillStyle(0x94a3b8, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0xcbd5e1, 1);
        gfx.drawRect(0, 0, 32, 32);
        gfx.generateTexture('tile_sidewalk', 32, 32);

        // Hospital (Rojo / Blanco)
        gfx.clear();
        gfx.fillStyle(0xef4444, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0xffffff, 1);
        gfx.fillRect(12, 4, 8, 24);
        gfx.fillRect(4, 12, 24, 8);
        gfx.generateTexture('building_hospital', 32, 32);

        // Estación de Policía (Azul)
        gfx.clear();
        gfx.fillStyle(0x2563eb, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0xfacc15, 1);
        gfx.fillRect(10, 10, 12, 12);
        gfx.generateTexture('building_police', 32, 32);

        // Estación de Bomberos (Naranja/Rojo Oscuro)
        gfx.clear();
        gfx.fillStyle(0xb91c1c, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0xf97316, 1);
        gfx.fillRect(8, 8, 16, 16);
        gfx.generateTexture('building_fire', 32, 32);

        // Casa (Marrón / Teja)
        gfx.clear();
        gfx.fillStyle(0xd97706, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(6, 6, 20, 20);
        gfx.generateTexture('building_house', 32, 32);

        // Árbol
        gfx.clear();
        gfx.fillStyle(0x15803d, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0x166534, 1);
        gfx.fillCircle(16, 14, 12);
        gfx.fillStyle(0x92400e, 1);
        gfx.fillRect(14, 24, 4, 8);
        gfx.generateTexture('object_tree', 32, 32);
    }
}
