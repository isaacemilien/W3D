/*
 * Author: [Your Name]
 * Created on: [Date]
 *
 * Based on three-mesh-halfedge library by Axel Antoine
 */

import { Vector3 } from "three";
import { HalfedgeDS, Face, Vertex, Halfedge } from 'three-mesh-halfedge';

/**
 * Extrudes a face by creating a new face at an offset along the face's normal.
 * 
 * @param struct The halfedge data structure
 * @param face The face to extrude
 * @param distance The extrusion distance along the normal
 * @param scale Optional scale factor for the extruded face (1.0 = same size)
 * @returns An array of the newly created faces (side faces + top face)
 */
export function extrudeFace(
    struct: HalfedgeDS,
    face: Face,
    distance: number,
    scale: number = 1.0) {
  
  // Get the face normal
  const normal = new Vector3();
  face.getNormal(normal);
  normal.normalize();
  
  // Calculate the midpoint for scaling
  const midpoint = new Vector3();
  const faceVertices: Vertex[] = [];
  const faceHalfedges: Halfedge[] = []; // Store the face's halfedges
  
  // Collect vertices and halfedges of the original face
  for (const halfedge of face.halfedge.nextLoop()) {
    faceVertices.push(halfedge.vertex);
    faceHalfedges.push(halfedge);
    midpoint.add(halfedge.vertex.position);
  }
  
  midpoint.divideScalar(faceVertices.length);
  
  // Create new vertices by offsetting along the normal and optionally scaling
  const newVertices: Vertex[] = [];
  
  for (const vertex of faceVertices) {
    const newPosition = new Vector3();
    
    // Apply scaling if needed
    if (scale !== 1.0) {
      // Calculate vector from midpoint to vertex
      const dir = new Vector3().subVectors(vertex.position, midpoint);
      // Scale this vector
      dir.multiplyScalar(scale);
      // Position is midpoint + scaled direction + normal offset
      newPosition.copy(midpoint).add(dir).add(normal.clone().multiplyScalar(distance));
    } else {
      // Simply offset along normal
      newPosition.copy(vertex.position).add(normal.clone().multiplyScalar(distance));
    }
    
    const newVertex = struct.addVertex(newPosition);
    newVertices.push(newVertex);
  }
  
  // Now we need to create the side faces and the top face
  const createdFaces: Face[] = [];
  
  // First, temporarily remove the original face so we can reuse its edges
  struct.removeFace(face);
  
  // Create side faces (quads) connecting original and extruded edges
  const sideHalfedges: Halfedge[] = [];
  
  for (let i = 0; i < faceVertices.length; i++) {
    const nextI = (i + 1) % faceVertices.length;
    
    const v1 = faceVertices[i];
    const v2 = faceVertices[nextI];
    const v3 = newVertices[nextI];
    const v4 = newVertices[i];
    
    // Use the existing halfedge between v1 and v2 (original face edge)
    const he1 = faceHalfedges[i];
    
    // Create the other edges
    const he2 = struct.addEdge(v2, v3);
    const he3 = struct.addEdge(v3, v4);
    const he4 = struct.addEdge(v4, v1);
    
    // Store side edges for later
    sideHalfedges.push(he4);
    
    // Add face for the quad
    const sideFace = struct.addFace([he1, he2, he3, he4]);
    createdFaces.push(sideFace);
  }
  
  // Create top face (the extruded face)
  const topEdges: Halfedge[] = [];
  for (let i = 0; i < newVertices.length; i++) {
    const nextI = (i + 1) % newVertices.length;
    // For each edge, we need the halfedge that goes from v[i] to v[nextI]
    const outgoing = newVertices[i].getHalfedgeToVertex(newVertices[nextI]);
    if (outgoing) {
      topEdges.push(outgoing);
    } else {
      // If no edge exists yet, create it
      const edge = struct.addEdge(newVertices[i], newVertices[nextI]);
      topEdges.push(edge);
    }
  }
  
  const topFace = struct.addFace(topEdges);
  createdFaces.push(topFace);
  
  return createdFaces;
}
