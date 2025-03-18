import * as THREE from 'three'

class HEVertex {
    constructor(position) {
        this.position = new THREE.Vector3().copy(position);
        this.edge = null; 
    }
}

class HEEdge {
    constructor() {
        this.vertex = null; 
        this.face = null; 
        this.next = null; 
        this.opposite = null; 
    }
}

class HEFace {
    constructor() {
        this.edge = null; 
        // For convenience, you could store normal or other attributes here
    }
}

class HEMesh {
    constructor() {
        this.vertices = [];
        this.edges = [];
        this.faces = [];
    }

    createBox(size = 1) {
        // Hardcode a cube's vertex positions
        const hs = size / 2;
        const positions = [
            new THREE.Vector3(-hs, -hs, hs),
            new THREE.Vector3(hs, -hs, hs),
            new THREE.Vector3(hs, hs, hs),
            new THREE.Vector3(-hs, hs, hs),
            new THREE.Vector3(-hs, -hs, -hs),
            new THREE.Vector3(hs, -hs, -hs),
            new THREE.Vector3(hs, hs, -hs),
            new THREE.Vector3(-hs, hs, -hs)
        ];


        const faces = [
            [0, 1, 2, 3], // front
            [5, 4, 7, 6], // back
            [4, 0, 3, 7], // left
            [1, 5, 6, 2], // right
            [3, 2, 6, 7], // top
            [4, 5, 1, 0]  // bottom
        ];

        // Build vertices
        for (let p of positions) {
            this.vertices.push(new HEVertex(p));
        }

        // For each face, build 4 edges and 1 face
        faces.forEach(faceIdx => {
            const heFace = new HEFace();

            // Create edges
            const e0 = new HEEdge();
            const e1 = new HEEdge();
            const e2 = new HEEdge();
            const e3 = new HEEdge();
            this.edges.push(e0, e1, e2, e3);
            this.faces.push(heFace);

            // Link face <-> edges
            heFace.edge = e0;
            e0.face = heFace;
            e1.face = heFace;
            e2.face = heFace;
            e3.face = heFace;

            // Set next
            e0.next = e1; e1.next = e2; e2.next = e3; e3.next = e0;

            // Set the vertices each edge goes to
            // e0 -> faceIdx[0] -> faceIdx[1]
            e0.vertex = this.vertices[faceIdx[1]];
            e1.vertex = this.vertices[faceIdx[2]];
            e2.vertex = this.vertices[faceIdx[3]];
            e3.vertex = this.vertices[faceIdx[0]];

            // Point one of the half-edges from each vertex
            this.vertices[faceIdx[0]].edge = e3; // the edge entering v0 is e3
            this.vertices[faceIdx[1]].edge = e0; // entering v1 is e0
            this.vertices[faceIdx[2]].edge = e1;
            this.vertices[faceIdx[3]].edge = e2;
        });

        // For simplicity, do not compute opposites thoroughly for all
        // robust approach would pair edges with matching endpoints
        // This is enough for the structure without tears
        // You can do partial or full pairing
        for (let i = 0; i < this.edges.length; i++) {
            let eA = this.edges[i];
            for (let j = i + 1; j < this.edges.length; j++) {
                let eB = this.edges[j];
                // If eA goes to eB.vertex, and eB goes to eA.vertex, we consider them opposites
                if (eA.vertex === eB.next.vertex && eB.vertex === eA.next.vertex) {
                    eA.opposite = eB;
                    eB.opposite = eA;
                }
            }
        }
    }

    // Convert the half-edge mesh into a Three.js BufferGeometry for rendering
    toBufferGeometry() {
        // Collect faces as triangles. Each quad can be formed by two triangles
        const positions = [];
        for (let face of this.faces) {
            // get the 4 vertices for the face
            const verts = [];
            let startEdge = face.edge;
            let current = startEdge;
            do {
                verts.push(current.vertex.position);
                current = current.next;
            } while (current !== startEdge);

            // Triangulate the quad (verts 0,1,2) and (0,2,3)
            if (verts.length === 4) {
                positions.push(
                    verts[0].x, verts[0].y, verts[0].z,
                    verts[1].x, verts[1].y, verts[1].z,
                    verts[2].x, verts[2].y, verts[2].z,

                    verts[0].x, verts[0].y, verts[0].z,
                    verts[2].x, verts[2].y, verts[2].z,
                    verts[3].x, verts[3].y, verts[3].z,
                );
            }
            // If a face has 3 or more than 4 edges, you'd handle those differently.
        }

        const geom = new THREE.BufferGeometry();
        const posAttr = new THREE.Float32BufferAttribute(new Float32Array(positions), 3);
        geom.setAttribute('position', posAttr);
        geom.computeVertexNormals();
        return geom;
    }
}

export default HEMesh;