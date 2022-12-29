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

			case "i": // i
				self.planet.inverted = !self.planet.inverted;
			break;			

			case "q": // q
				self.planet.keyboardLeftRight =-2;
			break;
			
			case "e": // e
				self.planet.keyboardLeftRight = 2;
			break;
					
			case "w": // w
			case "ArrowUp": // ArrowUp
				self.planet.keyboardForwardBackward =-4;
			break;
	 
			case "s": // s
			case "ArrowDown": // ArrowDown
				self.planet.keyboardForwardBackward = 4;
			break;

			case "d": // d
			case "ArrowRight": // ArrowRight
				self.planet.keyboardRotateLeftRight =-1;
			break;
	 
			case "a": // a
			case "ArrowLeft": // ArrowLeft
				self.planet.keyboardRotateLeftRight = 1;
			break;
		}
	}, false);

	document.addEventListener("keyup", function(event)
	{
		// Key Up alert (keep this)
		//alert("event: " + event.key);
	 
		// 0 is x and 1 is y
		switch (event.key)
		{
			case "q": // q
			case "e": // e
				self.planet.keyboardLeftRight = 0;
			break;
			
			case "w": // w
			case "ArrowUp": // ArrowUp
			case "s": // s
			case "ArrowDown": // ArrowDown
				self.planet.keyboardForwardBackward = 0;
			break;
	 
			case "a": // a
			case "ArrowLeft": // ArrowLeft
			case "d": // d
			case "ArrowRight": // ArrowRight
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
	this.keyboardLeftRight = 0;

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
	
	this.cameraStartPosition = [0,0,-10];
}

PlanetBox.prototype.updatePlanetBox = function(modelViewMatrix, timeStep)
{
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraStartPosition);
			
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
	const distance = sdfBox(point, this.planetExtents, this.shipRadius);
	this.normal = sdfBoxNormal(point, this.planetExtents, this.shipRadius);
	
	// Use the penetration vector to back the ship out of the planet it hit
	const penetration = vec3MultiplyScalar(this.normal, distance);

	const gravity =-10;

	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	matrixMotion(timeStep, this);
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraStartPosition);
	
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
	this.keyboardLeftRight = 0;
	
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
		
	this.cameraStartPosition = [0,0,-10];
}

PlanetSphere.prototype.updatePlanetSphere = function(modelViewMatrix, timeStep)
{
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraStartPosition);
		
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
	const distance = sdfSphere(point, radius);
	
	this.normal = sdfSphereNormal(point, radius);
	// Use the penetration vector to back the ship out of the planet it hit
	const penetration = vec3MultiplyScalar(this.normal, distance);
	
	let gravity =-10;
	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
		
	matrixMotion(timeStep, this);
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraStartPosition);
	
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
	this.keyboardLeftRight = 0;

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
	
	this.cameraStartPosition = [0,0,-10];
}

PlanetPlane.prototype.updatePlanetPlane = function(modelViewMatrix, timeStep)
{
	let matrix = mat4EulerAngle(mat4Identity(), this.planetAngle);
	matrix = mat4Translation(matrix, [0,1,0]);
	this.planetNormal = vec3TranslationMat4(matrix);
	this.planetDistance = -dotProductVec3(this.normal, this.planetPosition);
	
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraStartPosition);
			
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
	const distance = sdfPlane(point, this.planetNormal, this.planetDistance) - this.shipRadius;
	this.normal = sdfPlaneNormal(point, this.planetNormal, this.planetDistance);
	// Use the penetration vector to back the ship out of the planet it hit
	let penetration = vec3MultiplyScalar(this.normal, distance);
	
	let gravity =-10;
	
	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		//surface_pos = pos - sdf_normal(pos) * sdf_distance(pos)
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	matrixMotion(timeStep, this);
	modelViewMatrix = mat4Translation(modelViewMatrix, this.cameraStartPosition);
	
// **** Standard (Works) ****
	if (this.inverted === false)
	{
		modelViewMatrix = mat4Translation(modelViewMatrix, this.shipPosition);
		modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.shipAngle);
	}
// **** Standard (Works) ****
	
	return modelViewMatrix;
}

// MARK: - SDF Shapes

/*float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}*/

function sdfBox(point, extents, radius)
{
	const q = [];
	
	q[0] = Math.abs(point[0]) - extents[0];
	q[1] = Math.abs(point[1]) - extents[1];
	q[2] = Math.abs(point[2]) - extents[2];
	
	return magnitudeVec3([Math.max(q[0],0.0), Math.max(q[1],0.0), Math.max(q[2],0.0)]) + Math.min(Math.max(q[0],Math.max(q[1],q[2])),0.0) - radius;
}

function sdfBoxNormal(point, extents, radius)
{
	const epsilon = [0.0001, 0];
	
	const xscenep = sdfBox(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), extents, radius);
	const xscenen = sdfBox(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), extents, radius);
	
	const yscenep = sdfBox(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), extents, radius);
	const yscenen = sdfBox(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), extents, radius);
	
	const zscenep = sdfBox(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), extents, radius);
	const zscenen = sdfBox(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), extents, radius);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// Sphere Code: float sdSphere(vec3 p, float r){return length(p) - r;}
function sdfSphere(point, radius)
{
	return magnitudeVec3(point) - radius;
}

function sdfSphereNormal(point, radius)
{
    const epsilon = [0.0001, 0];
	
	const xscenep = sdfSphere(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), radius);
	const xscenen = sdfSphere(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), radius);
	
	const yscenep = sdfSphere(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), radius);
	const yscenen = sdfSphere(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), radius);
	
	const zscenep = sdfSphere(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), radius);
	const zscenen = sdfSphere(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), radius);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// n.xyz = point on plane
// n.w   = distance to plane
// Note: N must be normalized!
//float sdfPlane( vec3 p, vec4 n ){return dot( p, n.xyz ) + n.w;}
function sdfPlane(point, normal, distance)
{
	return dotProductVec3(point, normal) + distance;
}

function sdfPlaneNormal(point, normal, distance)
{
    const epsilon = 0.0001;
	
	const xscenep = sdfPlane(vec3Add(point, [epsilon, 0, 0]), normal, distance);
	const xscenen = sdfPlane(vec3Subtract(point, [epsilon, 0, 0]), normal, distance);
	
	const yscenep = sdfPlane(vec3Add(point, [0, epsilon, 0]), normal, distance);
	const yscenen = sdfPlane(vec3Subtract(point, [0, epsilon, 0]), normal, distance);
	
	const zscenep = sdfPlane(vec3Add(point, [0, 0, epsilon]), normal, distance);
	const zscenen = sdfPlane(vec3Subtract(point, [0, 0, epsilon]), normal, distance);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// MARK: Spaceship Motion
function matrixMotion(timeStep, self)
{	
	// Craete an axis angle from the last normal and the current normal.
	const angle = Math.acos(dotProductVec3(self.oldNormal, self.normal));
	const axis = vec3Normalize(vec3CrossProduct(self.oldNormal, self.normal));
	self.oldNormal = self.normal;
	
	let matrix = mat4Identity();
	// Rotate the spaceship when a keyboard key is pressed.
	const shipRotateVelocity = self.keyboardRotateLeftRight * timeStep;
	// Rotate the spaceship around the up axis (y axis).
	matrix = mat4AxisAngle(matrix, self.normal, shipRotateVelocity);
	
	// Find the angle from the last position to the current if there is none don't rotate.
	if (Math.abs(angle) > 0.00001)
	{
		matrix = mat4AxisAngle(matrix, axis, angle);
	}
	
	// Rotate the forward axis (z axis) with a matrix that has all of the axis angle rotations.
	matrix = mat4Translation(matrix, self.forwardAxis);
	// (Green Line)
	self.forwardAxis = vec3TranslationMat4(matrix);
	// (Blue Line)
	self.upAxis = self.normal;
	// (Red Line) Find the right axis from the cross product of the other two axes.
	self.rightAxis = vec3CrossProduct(self.upAxis, self.forwardAxis);
	// Move the spaceship forward when the keyboard is pressed.
	self.shipVelocity = vec3MultiplyScalar(self.forwardAxis, self.keyboardForwardBackward);
	// Make the spaceship jump when the keyboard is pressed.
	self.shipVelocity = vec3Add(self.shipVelocity, vec3MultiplyScalar(self.upAxis, self.keyboardUpDown));
	// Make the spaceship strafe when the keyboard is pressed.
	self.shipVelocity = vec3Add(self.shipVelocity, vec3MultiplyScalar(self.rightAxis, self.keyboardLeftRight));

	// Find position change.
	self.shipPosition = vec3Add(self.shipPosition, vec3MultiplyScalar(self.shipVelocity, timeStep));
	
	let matrixAxes = [];
	
	// Create a 4x4 matrix with all of the axes for the angle
	matrixAxes[0] = self.rightAxis[0];
	matrixAxes[1] = self.rightAxis[1];
	matrixAxes[2] = self.rightAxis[2];
	
	matrixAxes[3] = self.upAxis[0];
	matrixAxes[4] = self.upAxis[1];
	matrixAxes[5] = self.upAxis[2];
	
	matrixAxes[6] = self.forwardAxis[0];
	matrixAxes[7] = self.forwardAxis[1];
	matrixAxes[8] = self.forwardAxis[2];
	
	// Transpose the rotation of the camera and fly around the planet
	if (self.inverted === true)
	{
		matrixAxes = mat3Transpose(matrixAxes);
	}
// Euler with row major matrix YXZ
	self.shipAngle[0] = Math.asin(-matrixAxes[5]); // mat[3][2] Pitch
	
	if (Math.cos(self.shipAngle[0]) > 0.0001) // 0.0001 Not at poles
    {
		self.shipAngle[1] = Math.atan2(matrixAxes[2], matrixAxes[8]); // mat[3][1], mat[3][3] Yaw
        self.shipAngle[2] = Math.atan2(matrixAxes[3], matrixAxes[4]); // mat[1][2], mat[2][2] Roll
	}
	else
    {
		self.shipAngle[1] = 0; // Yaw
        self.shipAngle[2] = Math.atan2(-matrixAxes[1], matrixAxes[0]); // mat[2][1], mat[1][1] Roll
    }
}
