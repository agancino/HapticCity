/**
 * LoadingScene.js
 * Genera todas las texturas del juego en memoria usando Canvas 2D nativo (createCanvas)
 * para garantizar la compatibilidad al 100% en cualquier navegador y protocolo.
 */
class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    create() {
        // Generar texturas Pixel Art de forma nativa e infalible
        this.generateProceduralGraphics();

        // Pasar a la pantalla de menú principal
        this.scene.start('MenuScene');
    }

    /**
     * Generador de texturas usando la API nativa HTML5 Canvas 2D de Phaser
     */
    generateProceduralGraphics() {
        // 1. Textura del Jugador (32x32)
        if (!this.textures.exists('player_sprite')) {
            const playerCanvas = this.textures.createCanvas('player_sprite', 32, 32);
            const pCtx = playerCanvas.context;
            // Camiseta Azul
            pCtx.fillStyle = '#0284c7';
            pCtx.fillRect(8, 12, 16, 14);
            // Cabeza / Piel
            pCtx.fillStyle = '#fde047';
            pCtx.fillRect(10, 4, 12, 10);
            // Pelo
            pCtx.fillStyle = '#78350f';
            pCtx.fillRect(9, 2, 14, 4);
            // Ojos
            pCtx.fillStyle = '#0f172a';
            pCtx.fillRect(12, 7, 2, 3);
            pCtx.fillRect(18, 7, 2, 3);
            // Pantalones
            pCtx.fillStyle = '#1e3a8a';
            pCtx.fillRect(9, 24, 6, 8);
            pCtx.fillRect(17, 24, 6, 8);
            // Zapatos
            pCtx.fillStyle = '#090d16';
            pCtx.fillRect(8, 30, 7, 2);
            pCtx.fillRect(17, 30, 7, 2);
            playerCanvas.refresh();
        }

        // 2. Pasto (tile_grass - 32x32)
        if (!this.textures.exists('tile_grass')) {
            const grassCanvas = this.textures.createCanvas('tile_grass', 32, 32);
            const gCtx = grassCanvas.context;
            gCtx.fillStyle = '#15803d';
            gCtx.fillRect(0, 0, 32, 32);
            gCtx.fillStyle = '#22c55e';
            gCtx.fillRect(4, 4, 4, 4);
            gCtx.fillRect(20, 16, 4, 4);
            gCtx.fillRect(12, 24, 4, 4);
            grassCanvas.refresh();
        }

        // 3. Calle Asfalto (tile_road - 32x32)
        if (!this.textures.exists('tile_road')) {
            const roadCanvas = this.textures.createCanvas('tile_road', 32, 32);
            const rCtx = roadCanvas.context;
            rCtx.fillStyle = '#334155';
            rCtx.fillRect(0, 0, 32, 32);
            roadCanvas.refresh();
        }

        // 4. Cruce Peatonal (tile_crosswalk - 32x32)
        if (!this.textures.exists('tile_crosswalk')) {
            const cwCanvas = this.textures.createCanvas('tile_crosswalk', 32, 32);
            const cwCtx = cwCanvas.context;
            cwCtx.fillStyle = '#334155';
            cwCtx.fillRect(0, 0, 32, 32);
            cwCtx.fillStyle = '#f8fafc';
            cwCtx.fillRect(4, 12, 24, 8);
            cwCanvas.refresh();
        }

        // 5. Acera Peatonal (tile_sidewalk - 32x32)
        if (!this.textures.exists('tile_sidewalk')) {
            const swCanvas = this.textures.createCanvas('tile_sidewalk', 32, 32);
            const swCtx = swCanvas.context;
            swCtx.fillStyle = '#94a3b8';
            swCtx.fillRect(0, 0, 32, 32);
            swCtx.fillStyle = '#cbd5e1';
            swCtx.strokeRect(1, 1, 30, 30);
            swCanvas.refresh();
        }

        // 6. Edificio Hospital (building_hospital - 32x32)
        if (!this.textures.exists('building_hospital')) {
            const hospCanvas = this.textures.createCanvas('building_hospital', 32, 32);
            const hCtx = hospCanvas.context;
            hCtx.fillStyle = '#ef4444';
            hCtx.fillRect(0, 0, 32, 32);
            hCtx.fillStyle = '#ffffff';
            hCtx.fillRect(12, 4, 8, 24);
            hCtx.fillRect(4, 12, 24, 8);
            hospCanvas.refresh();
        }

        // 7. Estación de Policía (building_police - 32x32)
        if (!this.textures.exists('building_police')) {
            const polCanvas = this.textures.createCanvas('building_police', 32, 32);
            const polCtx = polCanvas.context;
            polCtx.fillStyle = '#2563eb';
            polCtx.fillRect(0, 0, 32, 32);
            polCtx.fillStyle = '#facc15';
            polCtx.fillRect(10, 10, 12, 12);
            polCanvas.refresh();
        }

        // 8. Estación de Bomberos (building_fire - 32x32)
        if (!this.textures.exists('building_fire')) {
            const fireCanvas = this.textures.createCanvas('building_fire', 32, 32);
            const fCtx = fireCanvas.context;
            fCtx.fillStyle = '#b91c1c';
            fCtx.fillRect(0, 0, 32, 32);
            fCtx.fillStyle = '#f97316';
            fCtx.fillRect(8, 8, 16, 16);
            fireCanvas.refresh();
        }

        // 9. Casa (building_house - 32x32)
        if (!this.textures.exists('building_house')) {
            const houseCanvas = this.textures.createCanvas('building_house', 32, 32);
            const houseCtx = houseCanvas.context;
            houseCtx.fillStyle = '#d97706';
            houseCtx.fillRect(0, 0, 32, 32);
            houseCtx.fillStyle = '#78350f';
            houseCtx.fillRect(6, 6, 20, 20);
            houseCanvas.refresh();
        }

        // 10. Árbol (object_tree - 32x32)
        if (!this.textures.exists('object_tree')) {
            const treeCanvas = this.textures.createCanvas('object_tree', 32, 32);
            const tCtx = treeCanvas.context;
            tCtx.fillStyle = '#15803d';
            tCtx.fillRect(0, 0, 32, 32);
            tCtx.fillStyle = '#166534';
            tCtx.beginPath();
            tCtx.arc(16, 14, 10, 0, Math.PI * 2);
            tCtx.fill();
            tCtx.fillStyle = '#92400e';
            tCtx.fillRect(14, 24, 4, 8);
            treeCanvas.refresh();
        }
    }
}
