/**
 * Map.js
 * Gestiona el mapa top-down de la ciudad pixel art para Haptic City.
 * Crea el entramado de calles, aceras, vegetación, casas y los 4 edificios/zonas principales:
 * - Hospital (Noroeste)
 * - Estación de Policía (Noreste)
 * - Estación de Bomberos (Suroeste)
 * - Cruce Principal (Centro)
 */
class CityMap {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32;
        this.cols = 40; // 40 tiles * 32px = 1280px
        this.rows = 25; // 25 tiles * 32px = 800px

        // Grupo de físicas estáticas para colisiones (paredes, árboles, construcciones)
        this.colliders = this.scene.physics.add.staticGroup();

        // Arreglo de zonas de activación de audio
        this.triggerZones = [];

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

        // Passos Peatonales (Crosswalks) en la intersección central
        // Cruce Peatonal Oeste
        this.scene.add.image(17 * this.tileSize + 16, 11 * this.tileSize + 16, 'tile_crosswalk');
        this.scene.add.image(17 * this.tileSize + 16, 12 * this.tileSize + 16, 'tile_crosswalk');
        // Cruce Peatonal Este
        this.scene.add.image(22 * this.tileSize + 16, 11 * this.tileSize + 16, 'tile_crosswalk');
        this.scene.add.image(22 * this.tileSize + 16, 12 * this.tileSize + 16, 'tile_crosswalk');

        // 3. Acerado alrededor de las manzanas
        this.buildSidewalks();

        // 4. Construcción de Edificios Principales y Zonas
        this.buildHospital(4, 2);      // Noroeste
        this.buildPoliceStation(28, 2); // Noreste
        this.buildFireStation(4, 15);   // Suroeste
        this.buildMainIntersection(18, 10); // Centro

        // 5. Zonas Residenciales y Parque
        this.buildResidentialZone(27, 15);
        this.buildParkZone(13, 2);

        // 6. Límites externos de la ciudad
        this.buildWorldBounds();
    }

    buildSidewalks() {
        // Aceras bordeando la calle horizontal
        for (let c = 0; c < this.cols; c++) {
            if (c < 18 || c > 21) {
                this.scene.add.image(c * this.tileSize + 16, 10 * this.tileSize + 16, 'tile_sidewalk');
                this.scene.add.image(c * this.tileSize + 16, 13 * this.tileSize + 16, 'tile_sidewalk');
            }
        }
        // Aceras bordeando la calle vertical
        for (let r = 0; r < this.rows; r++) {
            if (r < 10 || r > 13) {
                this.scene.add.image(18 * this.tileSize + 16, r * this.tileSize + 16, 'tile_sidewalk');
                this.scene.add.image(21 * this.tileSize + 16, r * this.tileSize + 16, 'tile_sidewalk');
            }
        }
    }

    /**
     * Hospital (Zona Noroeste - Sirena Ambulancia 🚑)
     */
    buildHospital(startCol, startRow) {
        const widthTiles = 6;
        const heightTiles = 5;

        // Estructura del edificio
        for (let r = 0; r < heightTiles; r++) {
            for (let c = 0; c < widthTiles; c++) {
                const tileX = (startCol + c) * this.tileSize + 16;
                const tileY = (startRow + r) * this.tileSize + 16;
                const buildingPart = this.scene.add.image(tileX, tileY, 'building_hospital');
                this.colliders.add(buildingPart);
            }
        }

        // Cartel del Hospital
        const labelText = this.scene.add.text((startCol + 3) * this.tileSize, (startRow - 0.7) * this.tileSize, '🚑 HOSPITAL', {
            fontFamily: 'monospace, Arial, sans-serif',
            fontSize: '12px',
            color: '#ef4444',
            backgroundColor: '#0f172a',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5);

        // Área de Activación de Sonido (Entrada/Estacionamiento de Ambulancias)
        const zoneX = (startCol + 3) * this.tileSize;
        const zoneY = (startRow + heightTiles + 0.5) * this.tileSize;
        const zoneWidth = 7 * this.tileSize;
        const zoneHeight = 3 * this.tileSize;

        // Indicador visual discreto del área en el suelo
        const zoneRect = this.scene.add.rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0xef4444, 0.15)
            .setStrokeStyle(2, 0xef4444, 0.6);

        this.triggerZones.push({
            id: 'hospital',
            name: '🚑 Ambulancia',
            soundKey: 'sound_ambulance',
            x: zoneX,
            y: zoneY,
            width: zoneWidth,
            height: zoneHeight,
            rect: zoneRect
        });
    }

    /**
     * Estación de Policía (Zona Noreste - Sirena Policía 🚓)
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

        const labelText = this.scene.add.text((startCol + 3) * this.tileSize, (startRow - 0.7) * this.tileSize, '🚓 POLICÍA', {
            fontFamily: 'monospace, Arial, sans-serif',
            fontSize: '12px',
            color: '#3b82f6',
            backgroundColor: '#0f172a',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5);

        const zoneX = (startCol + 3) * this.tileSize;
        const zoneY = (startRow + heightTiles + 0.5) * this.tileSize;
        const zoneWidth = 7 * this.tileSize;
        const zoneHeight = 3 * this.tileSize;

        const zoneRect = this.scene.add.rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0x3b82f6, 0.15)
            .setStrokeStyle(2, 0x3b82f6, 0.6);

        this.triggerZones.push({
            id: 'police',
            name: '🚓 Policía',
            soundKey: 'sound_police',
            x: zoneX,
            y: zoneY,
            width: zoneWidth,
            height: zoneHeight,
            rect: zoneRect
        });
    }

    /**
     * Estación de Bomberos (Zona Suroeste - Sirena Bomberos 🚒)
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

        const labelText = this.scene.add.text((startCol + 3) * this.tileSize, (startRow - 0.7) * this.tileSize, '🚒 BOMBEROS', {
            fontFamily: 'monospace, Arial, sans-serif',
            fontSize: '12px',
            color: '#f97316',
            backgroundColor: '#0f172a',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5);

        const zoneX = (startCol + 3) * this.tileSize;
        const zoneY = (startRow - 1.5) * this.tileSize;
        const zoneWidth = 7 * this.tileSize;
        const zoneHeight = 3 * this.tileSize;

        const zoneRect = this.scene.add.rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0xf97316, 0.15)
            .setStrokeStyle(2, 0xf97316, 0.6);

        this.triggerZones.push({
            id: 'fire',
            name: '🚒 Bomberos',
            soundKey: 'sound_fire',
            x: zoneX,
            y: zoneY,
            width: zoneWidth,
            height: zoneHeight,
            rect: zoneRect
        });
    }

    /**
     * Cruce Principal de Vehículos (Zona Centro - Bocina de Automóvil 🚗)
     */
    buildMainIntersection(startCol, startRow) {
        const zoneX = (startCol + 1.5) * this.tileSize;
        const zoneY = (startRow + 1.5) * this.tileSize;
        const zoneWidth = 5 * this.tileSize;
        const zoneHeight = 4 * this.tileSize;

        const labelText = this.scene.add.text(zoneX, zoneY - 70, '🚗 CRUCE PRINCIPAL', {
            fontFamily: 'monospace, Arial, sans-serif',
            fontSize: '11px',
            color: '#facc15',
            backgroundColor: '#0f172a',
            padding: { x: 4, y: 3 }
        }).setOrigin(0.5);

        const zoneRect = this.scene.add.rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0xfacc15, 0.15)
            .setStrokeStyle(2, 0xfacc15, 0.6);

        this.triggerZones.push({
            id: 'intersection',
            name: '🚗 Bocina de Auto',
            soundKey: 'sound_horn',
            x: zoneX,
            y: zoneY,
            width: zoneWidth,
            height: zoneHeight,
            rect: zoneRect
        });
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
        // Paredes transparentes en los bordes del mapa
        const totalWidth = this.cols * this.tileSize;
        const totalHeight = this.rows * this.tileSize;

        // Borde superior, inferior, izquierdo y derecho
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
