import * as THREE from 'three';
import { HalfedgeDS, Face, Vertex, Halfedge } from 'three-mesh-halfedge';
import { LogicalMesh } from '../data/LogicalMesh';

/**
 * Simple importer for OBJ files that preserves the original face structure
 */
export class OBJImporter {
    /**
     * Parse OBJ file content and create a LogicalMesh
     */
    static parseOBJ(content: string): LogicalMesh {
        const lines = content.split('\n');
        const positions: THREE.Vector3[] = [];
        const faceIndices: number[][] = [];
        
        // Parse OBJ file
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            
            if (parts[0] === 'v') {
                // Vertex position
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                positions.push(new THREE.Vector3(x, y, z));
            } 
            else if (parts[0] === 'f') {
                // Face definition
                // OBJ indices are 1-based, so we subtract 1
                const indices = parts.slice(1).map(vertexDef => {
                    // Handle "v/vt/vn" format by taking only the first number
                    return parseInt(vertexDef.split('/')[0]) - 1;
                });
                
                // Store the face (preserving n-gons)
                faceIndices.push(indices);
            }
        }
        
        // Create a new half-edge data structure
        const struct = new HalfedgeDS();
        
        // Add all vertices
        const vertices: Vertex[] = [];
        for (const position of positions) {
            vertices.push(struct.addVertex(position));
        }
        
        // Add faces while preserving the original face structure
        for (const face of faceIndices) {
            if (face.length < 3) continue; // Skip degenerate faces
            
            // Create halfedges around the face
            const halfedges: Halfedge[] = [];
            
            for (let i = 0; i < face.length; i++) {
                const currentIndex = face[i];
                const nextIndex = face[(i + 1) % face.length];
                
                const currentVertex = vertices[currentIndex];
                const nextVertex = vertices[nextIndex];
                
                // Create or get the halfedge between these vertices
                const halfedge = struct.addEdge(currentVertex, nextVertex);
                halfedges.push(halfedge);
            }
            
            // Add the face using the halfedges
            struct.addFace(halfedges);
        }
        
        return new LogicalMesh(struct);
    }
    
    /**
     * Import OBJ data from a string
     */
    static createFromString(objData: string): LogicalMesh {
        return this.parseOBJ(objData);
    }
    
    /**
     * Import OBJ from a file object
     */
    static async createFromFile(file: File): Promise<LogicalMesh> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const logicalMesh = this.parseOBJ(content);
                    resolve(logicalMesh);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }
}

export default OBJImporter;