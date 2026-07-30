/**
 * Map.js
 * Gestiona el mapa top-down de la ciudad pixel art para Haptic City.
 * Crea el entramado de calles, aceras, vegetación, casas y los 4 edificios principales.
 * Las zonas de audio fueron removidas — ahora los sonidos aparecen aleatoriamente.
 */
class CityMap {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32;
        this.cols = 40; // 40 tiles * 32px = 1280px
        this.rows = 25; // 25 tiles * 32px = 800px

        // Grupo de físicas estáticas para colisiones (paredes, árboles, construcciones)
        this.colliders = this.scene.physics.add.staticGroup();

        this.buildMap();
    }

    buildMap() {
        // 1. Capa Terreno Base (Pasto en toda la superficie)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.scene.add.image(c * this.tileSize + 16, r * this.tileSize + 16, 'tile_grass');
            }
        }

        // 2. Red Vial (Calles de asfalto y Cruce Principal)
        // Calle Horizontal Principal (Filas 11 y 12)
        for (let c = 0; c < this.cols; c++) {
            this.scene.add.image(c * this.tileSize + 16, 11 * this.tileSize + 16, 'tile_road');
            this.scene.add.image(c * this.tileSize + 16, 12 * this.tileSize + 16, 'tile_road');
        }

        // Calle Vertical Principal (Columnas 19 y 20)
        for (let r = 0; r < this.rows; r++) {
            this.scene.add.image(19 * this.tileSize + 16, r * this.tileSize + 16, 'tile_road');
            this.scene.add.image(20 * this.tileSize + 16, r * this.tileSize + 16, 'tile_road');
        }

        // Pasos Peatonales (Crosswalks) en la intersección central
        this.scene.add.image(17 * this.tileSize + 16, 11 * this.tileSize + 16, 'tile_crosswalk');
        this.scene.add.image(17 * this.tileSize + 16, 12 * this.tileSize + 16, 'tile_crosswalk');
        this.scene.add.image(22 * this.tileSize + 16, 11 * this.tileSize + 16, 'tile_crosswalk');
        this.scene.add.image(22 * this.tileSize + 16, 12 * this.tileSize + 16, 'tile_crosswalk');

        // 3. Acerado alrededor de las manzanas
        this.buildSidewalks();

        // 4. Construcción de Edificios (solo decoración, sin carteles ni zonas)
        this.buildHospital(4, 2);
        this.buildPoliceStation(28, 2);
        this.buildFireStation(4, 15);

        // 5. Zonas Residenciales y Parque
        this.buildResidentialZone(27, 15);
        this.buildParkZone(13, 2);

        // 6. Límites externos de la ciudad
        this.buildWorldBounds();
    }

    buildSidewalks() {
        for (let c = 0; c < this.cols; c++) {
            if (c < 18 || c > 21) {
                this.scene.add.image(c * this.tileSize + 16, 10 * this.tileSize + 16, 'tile_sidewalk');
                this.scene.add.image(c * this.tileSize + 16, 13 * this.tileSize + 16, 'tile_sidewalk');
            }
        }
        for (let r = 0; r < this.rows; r++) {
            if (r < 10 || r > 13) {
                this.scene.add.image(18 * this.tileSize + 16, r * this.tileSize + 16, 'tile_sidewalk');
                this.scene.add.image(21 * this.tileSize + 16, r * this.tileSize + 16, 'tile_sidewalk');
            }
        }
    }

    /**
     * Hospital (Noroeste) — Solo estructura visual, sin zona de audio
     */
    buildHospital(startCol, startRow) {
        const widthTiles = 6;
        const heightTiles = 5;
        for (let r = 0; r < heightTiles; r++) {
            for (let c = 0; c < widthTiles; c++) {
                const tileX = (startCol + c) * this.tileSize + 16;
                const tileY = (startRow + r) * this.tileSize + 16;
                const buildingPart = this.scene.add.image(tileX, tileY, 'building_hospital');
                this.colliders.add(buildingPart);
            }
        }
    }

    /**
     * Estación de Policía (Noreste) — Solo estructura visual
     */
    buildPoliceStation(startCol, startRow) {
        const widthTiles = 6;
        const heightTiles = 5;
        for (let r = 0; r < heightTiles; r++) {
            for (let c = 0; c < widthTiles; c++) {
                const tileX = (startCol + c) * this.tileSize + 16;
                const tileY = (startRow + r) * this.tileSize + 16;
                const buildingPart = this.scene.add.image(tileX, tileY, 'building_police');
                this.colliders.add(buildingPart);
            }
        }
    }

    /**
     * Estación de Bomberos (Suroeste) — Solo estructura visual
     */
    buildFireStation(startCol, startRow) {
        const widthTiles = 6;
        const heightTiles = 5;
        for (let r = 0; r < heightTiles; r++) {
            for (let c = 0; c < widthTiles; c++) {
                const tileX = (startCol + c) * this.tileSize + 16;
                const tileY = (startRow + r) * this.tileSize + 16;
                const buildingPart = this.scene.add.image(tileX, tileY, 'building_fire');
                this.colliders.add(buildingPart);
            }
        }
    }

    /**
     * Barrio Residencial con Casas
     */
    buildResidentialZone(startCol, startRow) {
        const houseCoords = [
            { c: startCol, r: startRow },
            { c: startCol + 5, r: startRow },
            { c: startCol, r: startRow + 4 },
            { c: startCol + 5, r: startRow + 4 }
        ];
        houseCoords.forEach(pos => {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const housePart = this.scene.add.image((pos.c + c) * this.tileSize + 16, (pos.r + r) * this.tileSize + 16, 'building_house');
                    this.colliders.add(housePart);
                }
            }
        });
    }

    /**
     * Parque Urbano con Árboles y Naturaleza
     */
    buildParkZone(startCol, startRow) {
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                if ((r + c) % 2 === 0) {
                    const tree = this.scene.add.image((startCol + c) * this.tileSize + 16, (startRow + r) * this.tileSize + 16, 'object_tree');
                    this.colliders.add(tree);
                }
            }
        }
    }

    /**
     * Barreras de colisión externas
     */
    buildWorldBounds() {
        const totalWidth = this.cols * this.tileSize;
        const totalHeight = this.rows * this.tileSize;
        const top = this.scene.add.rectangle(totalWidth / 2, -10, totalWidth, 20);
        const bottom = this.scene.add.rectangle(totalWidth / 2, totalHeight + 10, totalWidth, 20);
        const left = this.scene.add.rectangle(-10, totalHeight / 2, 20, totalHeight);
        const right = this.scene.add.rectangle(totalWidth + 10, totalHeight / 2, 20, totalHeight);

        [top, bottom, left, right].forEach(rect => {
            this.scene.physics.add.existing(rect, true);
            this.colliders.add(rect);
        });
    }
}
