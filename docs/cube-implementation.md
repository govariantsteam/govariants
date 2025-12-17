# 3D Cube Go Board Implementation

## Overview

This implementation adds a 3D Go (Baduk) variant where the board is drawn on the surface of a cube. The game follows standard Go rules but with the unique property that the playing surface wraps around a 3D cube with 6 faces.

## Architecture

### Backend (Shared Package)

#### 1. Board Factory (`packages/shared/src/lib/abstractBoard/boardFactory.ts`)

- Added `BoardPattern.Cube` to the enum of supported board patterns
- Defined `CubeBoardConfig` interface with `faceSize` parameter
- Implemented `createCubeBoard()` function that:
  - Creates 6 faces, each as a grid of the specified size
  - Connects intersections within each face in a grid pattern
  - Connects edges between adjacent faces according to cube topology
  - Positions intersections in a 2D cube net layout for visualization

#### Cube Topology

The cube has 6 faces with the following connections:
- **Face 0 (Front)**: connects to Top, Right, Bottom, Left
- **Face 1 (Right)**: connects to Top, Back, Bottom, Front
- **Face 2 (Back)**: connects to Top, Left, Bottom, Right
- **Face 3 (Left)**: connects to Top, Front, Bottom, Back
- **Face 4 (Top)**: connects to Back, Right, Front, Left
- **Face 5 (Bottom)**: connects to Front, Right, Back, Left

#### 2. Cube Variant (`packages/shared/src/variants/cube.ts`)

- `CubeBaduk` class extends the base `Baduk` class
- Reuses all Go logic: captures, ko detection, scoring, etc.
- Custom config interface `CubeBadukConfig` with cube board configuration
- Default configuration: 9x9 grid on each face with komi of 6.5

#### 3. Variant Registration

- Added to `variant_map.ts` as "cube"
- Exported from `packages/shared/src/index.ts`

### Frontend (Vue Client)

#### 1. 3D Board Component (`packages/vue-client/src/components/boards/CubeBoard.vue`)

Uses **three.js** to render an interactive 3D cube:

**Features:**
- Real-time 3D rendering with WebGL
- Orbit controls for rotating and zooming the cube
- Interactive intersection highlighting on hover
- Click to place stones
- Visual representation of:
  - Cube wireframe
  - Grid lines on each face
  - Intersection points
  - Black and white stones as 3D spheres
  - Last move annotation (circle marker)

**Implementation Details:**
- Each face is positioned on the cube surface using 3D coordinates
- Intersections are small semi-transparent spheres
- Lines connect adjacent intersections (both within and across faces)
- Raycasting detects mouse interaction with intersections
- Stones are rendered as larger spheres at intersection positions

#### 2. Configuration Form (`packages/vue-client/src/components/GameCreation/CubeBadukConfigForm.vue`)

Simple form allowing users to configure:
- Face size: 5x5, 7x7, 9x9, 11x11, or 13x13
- Komi value

#### 3. Registration

- Added to `board_map.ts` to use the custom 3D board component
- Added to `config_form_map.ts` to use the cube config form

## How It Works

### Game Flow

1. **Board Creation**: When a game starts, the backend creates a graph structure representing the cube surface with `6 × faceSize²` intersections
2. **Move Encoding**: Moves are encoded as string indices (e.g., "0", "1", "42") representing the intersection number
3. **Move Validation**: The standard Baduk logic validates moves (no self-capture, no ko)
4. **Capture Detection**: Groups are detected across face boundaries - a group can span multiple faces
5. **Scoring**: Standard area scoring applies, with territory computed across the 3D surface

### 3D Visualization

1. **Camera Setup**: Perspective camera positioned to view the entire cube
2. **Orbit Controls**: Users can rotate, zoom, and pan to view different faces
3. **Interaction**: Raycasting detects which intersection the mouse is over
4. **Stone Rendering**: Stones are rendered at their 3D positions on the cube surface

## Testing

Basic tests verify:
- Correct number of intersections (6 × faceSize²)
- Ability to place stones
- Turn progression

Run tests with:
```bash
cd packages/shared
npm test -- cube.test.ts
```

## Future Enhancements

Potential improvements:
1. Better 3D stone rendering (with shadows, better materials)
2. Animations for stone placement
3. Show territory and captured stones in 3D
4. Different cube net layouts
5. Camera animations to focus on active areas
6. Minimap showing the full cube at once
7. Multiple camera presets (one per face)

## Dependencies

Added to the project:
- `three` - 3D graphics library
- `@types/three` - TypeScript definitions

## Files Modified/Created

### Shared Package
- `src/lib/abstractBoard/boardFactory.ts` - Added cube board pattern and factory
- `src/variants/cube.ts` - New cube variant implementation
- `src/variants/__tests__/cube.test.ts` - Tests for cube variant
- `src/variant_map.ts` - Registered cube variant
- `src/index.ts` - Exported cube types

### Vue Client
- `src/components/boards/CubeBoard.vue` - 3D board component
- `src/components/GameCreation/CubeBadukConfigForm.vue` - Config form
- `src/board_map.ts` - Registered cube board component
- `src/config_form_map.ts` - Registered cube config form
- `package.json` - Added three.js dependencies
