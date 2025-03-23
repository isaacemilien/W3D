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


    createSphere(radius = 1, widthSegments = 16, heightSegments = 16) {
        // Clear any existing data if you want to reuse the mesh object
        this.vertices = [];
        this.edges = [];
        this.faces = [];

        //  Helper function to add one triangular face (iA->iB->iC) 
        // Creates 3 half-edges, links them together, and points them to the given vertices.
        const addFace = (iA, iB, iC) => {
            const face = new HEFace();

            const e0 = new HEEdge();
            const e1 = new HEEdge();
            const e2 = new HEEdge();

            // Store face & edges
            this.faces.push(face);
            this.edges.push(e0, e1, e2);

            // Face <-> half-edges
            face.edge = e0;
            e0.face = face;
            e1.face = face;
            e2.face = face;

            // next pointers in the cycle (triangle)
            e0.next = e1;
            e1.next = e2;
            e2.next = e0;

            // Half-edge to vertex assignments
            // If the triangle is (iA, iB, iC), we can store them so that:
            //  e0 goes to iB, e1 goes to iC, e2 goes to iA.
            e0.vertex = this.vertices[iB];
            e1.vertex = this.vertices[iC];
            e2.vertex = this.vertices[iA];

            // For convenience, let each vertex reference the half-edge that enters it
            this.vertices[iA].edge = e2; // e2 enters iA
            this.vertices[iB].edge = e0; // e0 enters iB
            this.vertices[iC].edge = e1; // e1 enters iC
        };

        //  Create sphere vertices on a grid (like latitude/longitude) 
        //  have (heightSegments + 1) horizontal rings and
        // (widthSegments + 1) vertices per ring.
        const grid = [];

        for (let iy = 0; iy <= heightSegments; iy++) {
            const row = [];

            // v goes from 0 (top) to 1 (bottom)
            const v = iy / heightSegments;
            // phi is polar angle from top (0) to bottom (π)
            const phi = v * Math.PI;

            for (let ix = 0; ix <= widthSegments; ix++) {
                // u goes from 0 to 1 around the equator
                const u = ix / widthSegments;
                // theta is the azimuthal angle (0..2π)
                const theta = u * Math.PI * 2;

                // Convert spherical -> Cartesian
                const x = -radius * Math.cos(theta) * Math.sin(phi);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(theta) * Math.sin(phi);

                // Create a vertex in the HEMesh
                const vertex = new HEVertex(new THREE.Vector3(x, y, z));
                this.vertices.push(vertex);

                // Record the index of this new vertex in the row array
                row.push(this.vertices.length - 1);
            }
            grid.push(row);
        }

        //  Create faces by connecting adjacent vertices in each grid cell 
        // Each cell is made of two triangles: (a,b,d) + (b,c,d)
        for (let iy = 0; iy < heightSegments; iy++) {
            for (let ix = 0; ix < widthSegments; ix++) {
                const a = grid[iy][ix];
                const b = grid[iy][ix + 1];
                const c = grid[iy + 1][ix + 1];
                const d = grid[iy + 1][ix];

                // top triangle (a,b,d) if not the top-most row
                if (iy !== 0) {
                    addFace(a, b, d);
                }
                // bottom triangle (b,c,d) if not the bottom-most row
                if (iy !== heightSegments - 1) {
                    addFace(b, c, d);
                }
            }
        }

        //  Find and assign opposite edges 
        // eA and eB are opposites if:
        //   eA.vertex === eB.next.vertex && eB.vertex === eA.next.vertex
        for (let i = 0; i < this.edges.length; i++) {
            const eA = this.edges[i];
            for (let j = i + 1; j < this.edges.length; j++) {
                const eB = this.edges[j];
                if (eA.vertex === eB.next.vertex && eB.vertex === eA.next.vertex) {
                    eA.opposite = eB;
                    eB.opposite = eA;
                }
            }
        }
    }

    toBufferGeometry() {
        const positions = [];
        const normals = [];

        for (let face of this.faces) {
            const verts = [];
            let startEdge = face.edge;
            let current = startEdge;

            // Gather all vertices for this face
            do {
                verts.push(current.vertex.position);
                current = current.next;
            } while (current !== startEdge);

            // Calculate face normal
            const normal = new THREE.Vector3();
            if (verts.length >= 3) {
                const v0 = verts[0];
                const v1 = verts[1];
                const v2 = verts[2];

                const edge1 = new THREE.Vector3().subVectors(v1, v0);
                const edge2 = new THREE.Vector3().subVectors(v2, v0);
                normal.crossVectors(edge1, edge2).normalize();
            }

            // If it's a triangle (3 verts)
            if (verts.length === 3) {
                positions.push(
                    verts[0].x, verts[0].y, verts[0].z,
                    verts[1].x, verts[1].y, verts[1].z,
                    verts[2].x, verts[2].y, verts[2].z
                );

                // Add normal for each vertex
                for (let i = 0; i < 3; i++) {
                    normals.push(normal.x, normal.y, normal.z);
                }
            }
            // If it's a quad (4 verts), triangulate as two triangles
            else if (verts.length === 4) {
                positions.push(
                    // Triangle 1
                    verts[0].x, verts[0].y, verts[0].z,
                    verts[1].x, verts[1].y, verts[1].z,
                    verts[2].x, verts[2].y, verts[2].z,
                    // Triangle 2
                    verts[0].x, verts[0].y, verts[0].z,
                    verts[2].x, verts[2].y, verts[2].z,
                    verts[3].x, verts[3].y, verts[3].z
                );

                // Use the same normal for all vertices in the quad
                for (let i = 0; i < 6; i++) {  // 6 vertices (2 triangles)
                    normals.push(normal.x, normal.y, normal.z);
                }
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

        // Don't compute vertex normals, using face normals
        // geom.computeVertexNormals();

        return geom;
    }

    createVertex(x, y, z) {
        const vertex = new HEVertex(new THREE.Vector3(x, y, z));
        // Ensure vertex has an ID
        vertex.id = this.vertices.length;
        this.vertices.push(vertex);
        return vertex;
    }

    // Method to create a face from an array of vertices
    createFace(vertices) {
        if (vertices.length < 3) {
            console.error("Cannot create face with fewer than 3 vertices");
            return null;
        }

        const face = new HEFace();
        this.faces.push(face);

        // Create half-edges for the face
        const edges = [];
        for (let i = 0; i < vertices.length; i++) {
            const edge = new HEEdge();
            edge.vertex = vertices[(i + 1) % vertices.length]; // Point to the next vertex
            edge.face = face;
            this.edges.push(edge);
            edges.push(edge);
        }

        // Connect the edges in a cycle
        for (let i = 0; i < edges.length; i++) {
            const nextIndex = (i + 1) % edges.length;
            edges[i].next = edges[nextIndex];
        }

        // Set face's edge reference
        face.edge = edges[0];

        // Try to find and set opposite edges
        this.findOppositeEdges();

        return face;
    }


    findOppositeEdges() {
        // Clear all existing opposite relationships
        for (const edge of this.edges) {
            edge.opposite = null;
        }

        // Find matching edge pairs
        for (let i = 0; i < this.edges.length; i++) {
            const e1 = this.edges[i];

            if (e1.opposite) continue;

            // Find an edge going in the opposite direction
            for (let j = i + 1; j < this.edges.length; j++) {
                const e2 = this.edges[j];

                if (e2.opposite) continue;

                // If e1 goes from v1->v2 and e2 goes from v2->v1
                if (e1.vertex === e2.next.vertex && e2.vertex === e1.next.vertex) {
                    e1.opposite = e2;
                    e2.opposite = e1;
                    break;
                }
            }
        }
    }

    // Method to remove a face
    removeFace(face) {
        if (!face) return;
        
        // Collect all edges associated with the face
        const edgesToRemove = [];
        let edge = face.edge;
        const startEdge = edge;
        
        do {
            edgesToRemove.push(edge);
            
            // If this edge has an opposite, update the opposite's reference
            if (edge.opposite) {
                edge.opposite.opposite = null;
            }
            
            edge = edge.next;
        } while (edge !== startEdge);
        
        // Remove the edges from the edges array
        for (const edge of edgesToRemove) {
            const index = this.edges.indexOf(edge);
            if (index !== -1) {
                this.edges.splice(index, 1);
            }
        }
        
        // Remove the face from the faces array
        const faceIndex = this.faces.indexOf(face);
        if (faceIndex !== -1) {
            this.faces.splice(faceIndex, 1);
        }
    }

    // Method to connect twin edges
    connectTwins() {
        // Simple implementation, might want to use a more efficient algorithm
        for (let i = 0; i < this.edges.length; i++) {
            const edge1 = this.edges[i];
            if (edge1.twin) continue; // Already has a twin

            for (let j = i + 1; j < this.edges.length; j++) {
                const edge2 = this.edges[j];
                if (edge2.twin) continue; // Already has a twin

                // Check if these edges connect the same vertices in opposite directions
                if (edge1.vertex === edge2.next.vertex && edge2.vertex === edge1.next.vertex) {
                    edge1.twin = edge2;
                    edge2.twin = edge1;
                    break;
                }
            }
        }
    }

    // Method to update element IDs after removal
    updateElementIds() {
        // Update face IDs
        for (let i = 0; i < this.faces.length; i++) {
            this.faces[i].id = i;
        }

        // Update edge IDs
        for (let i = 0; i < this.edges.length; i++) {
            this.edges[i].id = i;
        }

        // Update vertex IDs
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].id = i;
        }
    }

    createEdgeWireframe() {
        this.vertices.forEach((vertex, index) => {
            if (vertex.id === undefined) vertex.id = index;
        });
        const edgePositions = [];
        const processedEdgePairs = new Set();

        // First pass: collect all edges from the mesh
        for (const face of this.faces) {
            let startEdge = face.edge;
            let currentEdge = startEdge;

            do {
                const v1 = currentEdge.vertex;
                const v2 = currentEdge.next.vertex;

                // Create a unique key for this edge (smaller ID first for consistency)
                const minId = Math.min(v1.id, v2.id);
                const maxId = Math.max(v1.id, v2.id);
                const edgeKey = `${minId}-${maxId}`;

                if (!processedEdgePairs.has(edgeKey)) {
                    processedEdgePairs.add(edgeKey);

                    // Add line segment positions
                    edgePositions.push(
                        v1.position.x, v1.position.y, v1.position.z,
                        v2.position.x, v2.position.y, v2.position.z
                    );
                }

                currentEdge = currentEdge.next;
            } while (currentEdge !== startEdge);
        }

        // Create the edges geometry
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));

        const edgeMaterial = new THREE.LineBasicMaterial({
            color: "#91d9fa",  
            linewidth: 4,
            transparent: true,
            opacity: 0.8,
            depthTest: true
        });

        const wireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial);

        // Make wireframe non-interactive for raycasting
        wireframe.raycast = () => { };

        return wireframe;
    }
}

export default HEMesh;