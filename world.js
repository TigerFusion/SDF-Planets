"use strict";

function World(project)
{
	this.planetExtents = project.planetExtents;
	this.planetRadius = project.planetRadius;
	this.shipRadius = project.shipRadius;
		
	// MARK: First Planet
	this.planet = new PlanetPlane(this);
	//this.planet = new PlanetSphere(this);
	//this.planet = new PlanetBox(this);
	this.planet.inverted = false;
	
	// Keyboard stuff
	const self = this;
		
	document.addEventListener("keydown", function(event)
	{
		// Key Down alert (keep this)
		//alert("event: " + event.code + " " + event.which + " " + event.key + " " + event.keyCode);
	 
		switch (event.key)
		{
			case " ":
				project.displayPlanet++;
				
				if (project.displayPlanet > 2)
				{
					project.displayPlanet = 0;
				}
								
				if (project.displayPlanet === 0)
				{
					self.planet = null;
					self.planet = new PlanetPlane(self);
					self.planet.inverted = false;
				}
				else if (project.displayPlanet === 1)
				{
					self.planet = null;
					self.planet = new PlanetSphere(self);
					self.planet.inverted = false;
				}
				else if (project.displayPlanet === 2)
				{
					self.planet = null;
					self.planet = new PlanetBox(self);
					self.planet.inverted = false;
				}
			break;

			// invert camera
			case "i":
				self.planet.inverted = !self.planet.inverted;
			break;			
			
			// Jump up
			case "0":
				self.planet.keyboardUpDown = 4;
			break;
			
			// Translate on the x axis
			case "q":
				self.planet.keyboardStrafeLeftRight =-2;
			break;
			// Translate on the x axis
			case "e":
				self.planet.keyboardStrafeLeftRight = 2;
			break;
					
			// Translate on the z axis
			case "w":
			case "ArrowUp":
				self.planet.keyboardForwardBackward =-4;
			break;
			// Translate on the z axis
			case "s":
			case "ArrowDown":
				self.planet.keyboardForwardBackward = 4;
			break;
			
			// Rotate on the y axis
			case "d":
			case "ArrowRight":
				self.planet.keyboardRotateLeftRight =-1;
			break;
			// Rotate on the y axis
			case "a":
			case "ArrowLeft":
				self.planet.keyboardRotateLeftRight = 1;
			break;
		}
	}, false);

	document.addEventListener("keyup", function(event)
	{
		// Key Up alert (keep this)
		//alert("event: " + event.key);
	 
		switch (event.key)
		{			
			case "0":
				self.planet.keyboardUpDown = 0;
			break;
			
			case "q":
			case "e":
				self.planet.keyboardStrafeLeftRight = 0;
			break;
			
			case "w":
			case "ArrowUp":
			case "s":
			case "ArrowDown":
				self.planet.keyboardForwardBackward = 0;
			break;
	 
			case "a":
			case "ArrowLeft":
			case "d":
			case "ArrowRight":
				self.planet.keyboardRotateLeftRight = 0;
			break;
		}
	}, false);
}

function PlanetBox(world)
{
	this.keyboardForwardBackward = 0;
	this.keyboardRotateLeftRight = 0;
	this.keyboardUpDown = 0;
	this.keyboardStrafeLeftRight = 0;
	
// Box Planet
	this.planetExtents = world.planetExtents;
	this.planetPosition = [0,0,0]; // [0,0,-10]
	this.planetAngle = [0,0,0];
// Box SpaceShip
	this.shipRadius = world.shipRadius;
	this.shipPosition = [0,this.shipRadius + this.planetExtents[1] + 2,0]; // [0,5,-10]
	this.shipVelocity = [0,0,0];
	
	this.shipAngle = [0,0,0];

	this.gravityAcceleration = [0,0,0];
	this.gravityVelocity = [0,0,0];
	
	this.normal = [0,1,0];
	this.oldNormal = [0,1,0];
	
	this.rightAxis = [1,0,0];
	this.upAxis = [0,1,0];
	this.forwardAxis = [0,0,1];

	this.cameraAngle = vec3RadFromDeg([20,0,0]);
	this.cameraPosition = [0,0,-10];
}

PlanetBox.prototype.updatePlanetBox = function(modelViewMatrix, timeStep)
{
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.cameraAngle);
	
// **** Inverted Motion ****
	if (this.inverted === true)
	{
		let matrix = mat4EulerAngle(mat4Identity(), this.shipAngle);
		matrix = mat4Translation(matrix, vec3MultiplyScalar(this.shipPosition,-1));
		this.playerPosition = vec3TranslationMat4(matrix);
		this.playerAngle = this.shipAngle;
		
		modelViewMatrix = mat4Translation(modelViewMatrix, this.playerPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.playerAngle);
	}
// **** Inverted Motion ****
	
	return modelViewMatrix;
}

PlanetBox.prototype.updateBoxSpaceship = function(modelViewMatrix, timeStep)
{	
	// Point = tests how far the point is from the sdf
	// sdf returns: inside = - | outside = + | surface = 0 |
	// Position = the center of the sdf
	const point = vec3Subtract(this.shipPosition, this.planetPosition);
	const distance = sdRoundedBox(point, this.planetExtents, this.shipRadius);
	this.oldNormal = this.normal;
	this.normal = sdRoundedBoxNormal(point, this.planetExtents, this.shipRadius);
	const gravity =-10;
	
	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		// Use the penetration vector to back the ship out of the planet it hit
		const penetration = vec3MultiplyScalar(this.normal, distance);
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	matrixMotion(timeStep, this);
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.cameraAngle);
	
// **** Standard Motion ****
	if (this.inverted === false)
	{
		modelViewMatrix = mat4Translation(modelViewMatrix, this.shipPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.shipAngle);
	}
// **** Standard Motion ****
	
	return modelViewMatrix;
}

function PlanetSphere(world)
{
	this.keyboardForwardBackward = 0;
	this.keyboardRotateLeftRight = 0;
	this.keyboardUpDown = 0;
	this.keyboardStrafeLeftRight = 0;
	
// Sphere Planet
	this.planetPosition = [0,0,0]; // [0,0,-10]
	this.planetAngle = [0,0,0];
	this.planetRadius = world.planetRadius;
	
// Sphere Spaceship
	this.shipRadius = world.shipRadius;
	this.shipPosition = [0,this.shipRadius + this.planetRadius + 2,0]; // [0,6,-10]
	this.shipVelocity = [0,0,0];
	
	this.shipAngle = [0,0,0];

	this.gravityAcceleration = [0,0,0];
	this.gravityVelocity = [0,0,0];

	this.normal = [0,1,0];
	this.oldNormal = [0,1,0];

	this.rightAxis = [1,0,0];
	this.upAxis = [0,1,0];
	this.forwardAxis = [0,0,1];

	this.cameraAngle = vec3RadFromDeg([20,0,0]);
	this.cameraPosition = [0,0,-10];
}

PlanetSphere.prototype.updatePlanetSphere = function(modelViewMatrix, timeStep)
{
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.cameraAngle);
	
// **** Inverted Motion ****
	if (this.inverted === true)
	{
		let matrix = mat4EulerAngle(mat4Identity(), this.shipAngle);
		matrix = mat4Translation(matrix, vec3MultiplyScalar(this.shipPosition,-1));
		this.playerPosition = vec3TranslationMat4(matrix);
		this.playerAngle = this.shipAngle;

		modelViewMatrix = mat4Translation(modelViewMatrix, this.playerPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.playerAngle);
	}
// **** Inverted Motion ****
	return modelViewMatrix;
}

PlanetSphere.prototype.updateSphereSpaceship = function(modelViewMatrix, timeStep)
{
	// Point = tests how far the point is from the sdf
	// sdf returns: inside = - | outside = + | surface = 0 |
	// Position = the center of the sdf
	const radius = this.shipRadius + this.planetRadius;
	const point = vec3Subtract(this.shipPosition, this.planetPosition);
	const distance = sdSphere(point, radius);
	this.oldNormal = this.normal;
	this.normal = sdSphereNormal(point, radius);
	const gravity =-10;
	
	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		// Use the penetration vector to back the ship out of the planet it hit
		const penetration = vec3MultiplyScalar(this.normal, distance);
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	matrixMotion(timeStep, this);
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.cameraAngle);
	
// **** Standard Motion ****
	if (this.inverted === false)
	{
		modelViewMatrix = mat4Translation(modelViewMatrix, this.shipPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.shipAngle);
	}
// **** Standard Motion ****
	return modelViewMatrix;
}

function PlanetPlane(world)
{
	this.keyboardForwardBackward = 0;
	this.keyboardRotateLeftRight = 0;
	this.keyboardUpDown = 0;
	this.keyboardStrafeLeftRight = 0;
	
// Plane Planet
	this.planetPosition = [0,0,0];
	this.planetAngle = [0,0,0];
	this.planetDistance = 0;
	this.planetNormal = [0,1,0];
	
// Plane Spaceship
	this.shipRadius = world.shipRadius;
	this.shipPosition = [0,this.shipRadius + 2,0];
	this.shipVelocity = [0,0,0];

	this.shipAngle = [0,0,0];

	this.gravityAcceleration = [0,0,0];
	this.gravityVelocity = [0,0,0]
	
	this.normal = [0,1,0];
	this.oldNormal = [0,1,0];
	
	this.rightAxis = [1,0,0];
	this.upAxis = [0,1,0];
	this.forwardAxis = [0,0,1];

	this.cameraAngle = vec3RadFromDeg([20,0,0]);
	this.cameraPosition = [0,0,-10];
}

PlanetPlane.prototype.updatePlanetPlane = function(modelViewMatrix, timeStep)
{
	let matrix = mat4EulerAngle(mat4Identity(), this.planetAngle);
	matrix = mat4Translation(matrix, [0,1,0]);
	this.planetNormal = vec3TranslationMat4(matrix);
	this.planetDistance = -dotProductVec3(this.normal, this.planetPosition);
	
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.cameraAngle);
	
	// **** Inverted Motion ****
	if (this.inverted === true)
	{		
		matrix = mat4EulerAngle(mat4Identity(), this.shipAngle);
		matrix = mat4Translation(matrix, vec3MultiplyScalar(this.shipPosition,-1));
		this.playerPosition = vec3TranslationMat4(matrix);
		this.playerAngle = this.shipAngle;

		modelViewMatrix = mat4Translation(modelViewMatrix, this.playerPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.playerAngle);
	}
	// **** Inverted Motion ****
		
	return modelViewMatrix;
}

PlanetPlane.prototype.updatePlaneSpaceship = function(modelViewMatrix, timeStep)
{
	// Point = tests how far the point is from the sdf
	// sdf returns: inside = - | outside = + | surface = 0 |
	// Position = the center of the sdf
	const point = this.shipPosition;
	const distance = sdPlane(point, this.planetNormal, this.planetDistance) - this.shipRadius;
	this.oldNormal = this.normal;
	this.normal = sdPlaneNormal(point, this.planetNormal, this.planetDistance);
	const gravity =-10;
	
	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		// Use the penetration vector to back the ship out of the planet it hit
		const penetration = vec3MultiplyScalar(this.normal, distance);
		//surface_pos = pos - sdf_normal(pos) * sdf_distance(pos)
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	matrixMotion(timeStep, this);
	
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.cameraAngle);
	
// **** Standard Motion ****
	if (this.inverted === false)
	{
		modelViewMatrix = mat4Translation(modelViewMatrix, this.shipPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.shipAngle);
	}
// **** Standard Motion ****
	
	return modelViewMatrix;
}

// MARK: - SDF Shapes

// Taken from here: https://iquilezles.org/articles/distfunctions/
// float sdRoundBox(vec3 p, vec3 b, float r)
// {
//   vec3 q = abs(p) - b;
//   return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
// }

function sdRoundedBox(point, extents, radius)
{
	const q = [];
	
	q[0] = Math.abs(point[0]) - extents[0];
	q[1] = Math.abs(point[1]) - extents[1];
	q[2] = Math.abs(point[2]) - extents[2];
	
	return magnitudeVec3([Math.max(q[0],0.0), Math.max(q[1],0.0), Math.max(q[2],0.0)]) + Math.min(Math.max(q[0],Math.max(q[1],q[2])),0.0) - radius;
}

// Taken from here: https://iquilezles.org/articles/normalsSDF/
function sdRoundedBoxNormal(point, extents, radius)
{
	const epsilon = [0.0001, 0];
	
	const xscenep = sdRoundedBox(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), extents, radius);
	const xscenen = sdRoundedBox(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), extents, radius);
	
	const yscenep = sdRoundedBox(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), extents, radius);
	const yscenen = sdRoundedBox(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), extents, radius);
	
	const zscenep = sdRoundedBox(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), extents, radius);
	const zscenen = sdRoundedBox(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), extents, radius);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// Taken from here: https://iquilezles.org/articles/distfunctions/
// Sphere Code: float sdSphere(vec3 p, float r){return length(p) - r;}
function sdSphere(point, radius)
{
	return magnitudeVec3(point) - radius;
}

// Taken from here: https://iquilezles.org/articles/normalsSDF/
function sdSphereNormal(point, radius)
{
    const epsilon = [0.0001, 0];
	
	const xscenep = sdSphere(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), radius);
	const xscenen = sdSphere(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), radius);
	
	const yscenep = sdSphere(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), radius);
	const yscenen = sdSphere(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), radius);
	
	const zscenep = sdSphere(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), radius);
	const zscenen = sdSphere(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), radius);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// Taken from here: https://iquilezles.org/articles/distfunctions/
// n = direction normal of plane
// d  = distance of plane to 0
// Note: n must be normalized
//float sdPlane(vec3 p, vec3 n, float d){return dot( p, n ) + d}
function sdPlane(point, normal, distance)
{
	return dotProductVec3(point, normal) + distance;
}

// Taken from here: https://iquilezles.org/articles/normalsSDF/
function sdPlaneNormal(point, normal, distance)
{
    const epsilon = [0.0001, 0];
	
	const xscenep = sdPlane(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), normal, distance);
	const xscenen = sdPlane(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), normal, distance);
	
	const yscenep = sdPlane(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), normal, distance);
	const yscenen = sdPlane(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), normal, distance);
	
	const zscenep = sdPlane(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), normal, distance);
	const zscenen = sdPlane(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), normal, distance);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// MARK: Spaceship Motion
function matrixMotion(timeStep, self)
{	
	// Create an axis angle from the last normal and the current normal.	
	const angle = vec3Angle(self.oldNormal, self.normal);
	const axis = vec3Axis(self.oldNormal, self.normal);

	let matrix = mat4Identity();
	// Rotate the spaceship when a keyboard key is pressed.
	let shipRotateVelocity = self.keyboardRotateLeftRight * timeStep;
	// Rotate the spaceship around the up axis (y axis).
	matrix = mat4AxisAngle(matrix, self.normal, shipRotateVelocity);

	// Find the angle from the last position to the current if there is none don't rotate.
	if (Math.abs(angle) > 1e-6 && isNaN(angle) === false) // 0.000001
	{
		matrix = mat4AxisAngle(matrix, axis, angle);
	}
	
	// (Blue Line) Rotate the forward axis (z axis) with a matrix from the axis angle rotations.
	self.forwardAxis = vec3Normalize(vec3TransformMat4(matrix, self.forwardAxis));
	// (Green Line) the gravity normal
	self.upAxis = vec3Normalize(self.normal);
	// (Red Line) Find the right axis from the cross product of the other two axes.
	self.rightAxis = vec3CrossProduct(self.upAxis, self.forwardAxis);

	let matrixAxes = [];

	// Create a 3x3 matrix with all of the axes for the angle
	matrixAxes[0] = self.rightAxis[0];
	matrixAxes[1] = self.rightAxis[1];
	matrixAxes[2] = self.rightAxis[2];
	
	matrixAxes[3] = self.upAxis[0];
	matrixAxes[4] = self.upAxis[1];
	matrixAxes[5] = self.upAxis[2];
	
	matrixAxes[6] = self.forwardAxis[0];
	matrixAxes[7] = self.forwardAxis[1];
	matrixAxes[8] = self.forwardAxis[2];

	// Send the new angle from the matrix
	self.shipVelocity = vec3TransformMat3(matrixAxes, [self.keyboardStrafeLeftRight, self.keyboardUpDown, self.keyboardForwardBackward]);
	// Find position change.
	self.shipPosition = vec3Add(self.shipPosition, vec3MultiplyScalar(self.shipVelocity, timeStep));
	
	if (self.inverted === false)
	{
		matrixAxes = mat3Transpose(matrixAxes);
	}
	
	// Taken from here: https://en.wikipedia.org/wiki/Euler_angles
	// Row major ZYX Euler Angle for the XYZ Euler Matrix (Works but the angle can jump around)
	self.shipAngle[0] = Math.atan2(matrixAxes[7], matrixAxes[8]); // 32, 33
	self.shipAngle[1] = Math.atan2(-matrixAxes[6], Math.sqrt(1 - matrixAxes[6] * matrixAxes[6])); // 31
	self.shipAngle[2] = Math.atan2(matrixAxes[3], matrixAxes[0]); // 21, 11
}