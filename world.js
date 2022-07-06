"use strict";

function World(project)
{
	this.planetExtents = project.planetExtents;
	this.planetRadius = project.planetRadius;
	this.shipRadius = project.shipRadius;
	
	this.keyboardForwardBackward = 0;
	this.keyboardRotateLeftRight = 0;
	
	this.planet = new PlanetPlane(this);
	
	// Keyboard stuff
	let self = this;
	
	document.addEventListener("keydown", function(event)
	{
		// Key Down alert (keep this)
		//alert("event: " + event.code + " " + event.which + " " + event.key + " " + event.keyCode);
	 
		// Note that both rotation and translation values work opposite of OpenGL
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
				}
				else if (project.displayPlanet === 1)
				{
					self.planet = null;
					self.planet = new PlanetSphere(self);
				}
				else if (project.displayPlanet === 2)
				{
					self.planet = null;
					self.planet = new PlanetBox(self);
				}
			break;
		
			case "w": // w
			case "ArrowUp": // ArrowUp
				self.planet.keyboardForwardBackward =-1;
			break;
	 
			case "s": // s
			case "ArrowDown": // ArrowDown
				self.planet.keyboardForwardBackward = 1;
			break;
	 
			case "a": // a
			case "ArrowLeft": // ArrowLeft
				self.planet.keyboardRotateLeftRight = 1;
			break;
	 
			case "d": // d
			case "ArrowRight": // ArrowRight
				self.planet.keyboardRotateLeftRight =-1;
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

// Box Planet
	this.planetExtents = world.planetExtents;
	this.planetPosition = [0,0,-10]; // [0,0,-10]
	this.planetAngle = [0,0,0];
// Box SpaceShip
	this.shipRadius = world.shipRadius;
	this.shipPosition = [0,this.shipRadius + this.planetExtents[1] + 2,-10]; // [0,5,-10]
	this.shipVelocity = [0,0,0];
	
	this.shipAngle = [0,0,0];
	this.shipAngularVelocity = [0,0,0];
	
	this.gravityAcceleration = [0,0,0];
	this.gravityVelocity = [0,0,0];

	this.normal = [0,1,0];
	this.oldNormal = [0,1,0];

	this.rightAxis = [1,0,0];
	this.upAxis = [0,1,0];
	this.forwardAxis = [0,0,1];
	
	this.shipRotateVelocity = 0;
}

PlanetBox.prototype.updatePlanetBox = function(modelViewMatrix, timeStep)
{
	modelViewMatrix = mat4Translation(modelViewMatrix, this.planetPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.planetAngle);
	
	return modelViewMatrix;
}

PlanetBox.prototype.updateBoxSpaceship = function(modelViewMatrix, timeStep)
{	
	// Point = tests how far the point is from the sdf
	// sdf returns: inside = - | outside = + | surface = 0 |
	// Position = the center of the sdf
	let point = vec3Subtract(this.shipPosition, this.planetPosition);
	let distance = sdfBox(point, this.planetExtents, this.shipRadius);
	this.oldNormal = this.normal;
	this.normal = sdfBoxNormal(point, this.planetExtents, this.shipRadius);
	// Use the penetration vector to back the ship out of the planet it hit
	let penetration = vec3MultiplyScalar(this.normal, distance);

	let gravity =-10;

	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	return matrixMotion(modelViewMatrix, timeStep, this);
}

function PlanetSphere(world)
{
	this.keyboardForwardBackward = 0;
	this.keyboardRotateLeftRight = 0;
	
// Sphere Planet
	this.planetPosition = [0,0,-10]; // [0,0,-10]
	this.planetAngle = [0,0,0];
	this.planetRadius = world.planetRadius;
	
// Sphere Spaceship
	this.shipRadius = world.shipRadius;
	this.shipPosition = [0,this.shipRadius + this.planetRadius + 2,-10]; // [0,6,-10]
	this.shipVelocity = [0,0,0];

	this.shipAngle = [0,0,0];
	this.shipAngularVelocity = [0,0,0];

	this.gravityAcceleration = [0,0,0];
	this.gravityVelocity = [0,0,0];

	this.normal = [0,1,0];
	this.oldNormal = [0,1,0];

	this.rightAxis = [1,0,0];
	this.upAxis = [0,1,0];
	this.forwardAxis = [0,0,1];
	
	this.shipRotateVelocity = 0;
}

PlanetSphere.prototype.updatePlanetSphere = function(modelViewMatrix, timeStep)
{
	modelViewMatrix = mat4Translation(modelViewMatrix, this.planetPosition);
	modelViewMatrix = mat4Translation(modelViewMatrix, this.planetAngle);
	
	return modelViewMatrix;
}

// Convert polar coordinates to cartesian
PlanetSphere.prototype.updateSphereSpaceship = function(modelViewMatrix, timeStep)
{
	// Point = tests how far the point is from the sdf
	// sdf returns: inside = - | outside = + | surface = 0 |
	// Position = the center of the sdf
	let radius = this.shipRadius + this.planetRadius;
	let point = vec3Subtract(this.shipPosition, this.planetPosition);
	let distance = sdfSphere(point, radius);
	this.oldNormal = this.normal;
	this.normal = sdfSphereNormal(point, radius);
	// Use the penetration vector to back the ship out of the planet it hit
	let penetration = vec3MultiplyScalar(this.normal, distance);
	
	let gravity =-10;
	this.gravityAcceleration = vec3MultiplyScalar(this.normal, gravity);
	this.gravityVelocity = vec3Add(this.gravityVelocity, vec3MultiplyScalar(this.gravityAcceleration, timeStep));
	this.shipPosition = vec3Add(this.shipPosition, vec3MultiplyScalar(this.gravityVelocity, timeStep));
	
	if (distance < 0)
	{
		this.shipPosition = vec3Subtract(this.shipPosition, penetration);
		this.gravityVelocity = [0,0,0];
	}
	
	return matrixMotion(modelViewMatrix, timeStep, this);
}

function PlanetPlane(world)
{
	this.keyboardForwardBackward = 0;
	this.keyboardRotateLeftRight = 0;

// Plane Planet
	this.planetPosition = [0,0,-10];
	this.planetAngle = [0,0,0];
	this.planetDistance = 0;
	this.planetNormal = [0,1,0];

// Plane Spaceship
	this.shipRadius = world.shipRadius;
	this.shipPosition = [0,this.shipRadius + 2,-10];
	this.shipVelocity = [0,0,0];

	this.shipAngle = [0,0,0]; 
	this.shipAngularVelocity = [0,0,0];

	this.gravityAcceleration = [0,0,0];
	this.gravityVelocity = [0,0,0]
	
	this.normal = [0,1,0];
	this.oldNormal = [0,1,0];
	
	this.rightAxis = [1,0,0];
	this.upAxis = [0,1,0];
	this.forwardAxis = [0,0,1];
	
	this.shipRotateVelocity = 0;
}

PlanetPlane.prototype.updatePlanetPlane = function(modelViewMatrix, timeStep)
{
	let matrix = mat4EulerAngle(mat4Identity(), this.planetAngle);
	matrix = mat4Translation(matrix, [0,1,0]);
	this.planetNormal = vec3TranslationMat4(matrix);
	this.planetDistance = -dotProductVec3(this.normal, this.planetPosition);
	
	modelViewMatrix = mat4Translation(modelViewMatrix, this.planetPosition);
	modelViewMatrix = mat4EulerAngle(modelViewMatrix, this.planetAngle);
	
	return modelViewMatrix;
}

// Convert polar coordinates to cartesian
PlanetPlane.prototype.updatePlaneSpaceship = function(modelViewMatrix, timeStep)
{
	// Point = tests how far the point is from the sdf
	// sdf returns: inside = - | outside = + | surface = 0 |
	// Position = the center of the sdf
	let point = this.shipPosition;
	let distance = sdfPlane(point, this.planetNormal, this.planetDistance) - this.shipRadius;
	this.oldNormal = this.normal;
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
	
	return matrixMotion(modelViewMatrix, timeStep, this);
}

// MARK: - SDF Shapes

/*float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}*/

function sdfBox(point, extents, radius)
{
	let q = [];
	
	q[0] = Math.abs(point[0]) - extents[0];
	q[1] = Math.abs(point[1]) - extents[1];
	q[2] = Math.abs(point[2]) - extents[2];
	
	return magnitudeVec3([Math.max(q[0],0.0), Math.max(q[1],0.0), Math.max(q[2],0.0)]) + Math.min(Math.max(q[0],Math.max(q[1],q[2])),0.0) - radius;
}

function sdfBoxNormal(point, extents, radius)
{
	let epsilon = [0.0001, 0];
	
	let xscenep = sdfBox(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), extents, radius);
	let xscenen = sdfBox(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), extents, radius);
	
	let yscenep = sdfBox(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), extents, radius);
	let yscenen = sdfBox(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), extents, radius);
	
	let zscenep = sdfBox(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), extents, radius);
	let zscenen = sdfBox(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), extents, radius);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// Sphere Code: float sdSphere(vec3 p, float r){return length(p) - r;}
function sdfSphere(point, radius)
{
	return magnitudeVec3(point) - radius;
}

function sdfSphereNormal(point, radius)
{
    let epsilon = [0.0001, 0];
	
	let xscenep = sdfSphere(vec3Add(point, [epsilon[0], epsilon[1], epsilon[1]]), radius);
	let xscenen = sdfSphere(vec3Subtract(point, [epsilon[0], epsilon[1], epsilon[1]]), radius);
	
	let yscenep = sdfSphere(vec3Add(point, [epsilon[1], epsilon[0], epsilon[1]]), radius);
	let yscenen = sdfSphere(vec3Subtract(point, [epsilon[1], epsilon[0], epsilon[1]]), radius);
	
	let zscenep = sdfSphere(vec3Add(point, [epsilon[1], epsilon[1], epsilon[0]]), radius);
	let zscenen = sdfSphere(vec3Subtract(point, [epsilon[1], epsilon[1], epsilon[0]]), radius);
	
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
    let epsilon = 0.0001;
	
	let xscenep = sdfPlane(vec3Add(point, [epsilon, 0, 0]), normal, distance);
	let xscenen = sdfPlane(vec3Subtract(point, [epsilon, 0, 0]), normal, distance);
	
	let yscenep = sdfPlane(vec3Add(point, [0, epsilon, 0]), normal, distance);
	let yscenen = sdfPlane(vec3Subtract(point, [0, epsilon, 0]), normal, distance);
	
	let zscenep = sdfPlane(vec3Add(point, [0, 0, epsilon]), normal, distance);
	let zscenen = sdfPlane(vec3Subtract(point, [0, 0, epsilon]), normal, distance);
	
    return vec3Normalize([xscenep - xscenen, yscenep - yscenen, zscenep - zscenen]);
}

// MARK: Spaceship Motion
function matrixMotion(modelViewMatrix, timeStep, self)
{
	// Craete an axis angle from the last normal and the current normal.
	let angle = Math.acos(dotProductVec3(self.oldNormal, self.normal));
	let axis = vec3Normalize(vec3CrossProduct(self.oldNormal, self.normal));
	
	// Rotate the spaceship when a keyboard key is pressed.
	self.shipRotateVelocity = self.keyboardRotateLeftRight * timeStep;
	// Rotate the spaceship around the up axis (y axis).
	let matrix = mat4AxisAngle(mat4Identity(), self.upAxis, self.shipRotateVelocity);
	
	// Find the angle from the last position to the current if there is none don't rotate.
	if (Math.abs(angle) > 0.00001)
	{
		matrix = mat4AxisAngle(matrix, axis, angle);
	}
	
	// Rotate the forward axis (z axis) with a matrix that has all of the axis angle rotations.
	matrix = mat4Translation(matrix, self.forwardAxis)
	// (Green Line)
	self.forwardAxis = vec3TranslationMat4(matrix);
	// (Blue Line)
	self.upAxis = self.normal;
	// (Red Line) Find the right axis from the cross product of the other two axes.
	self.rightAxis = vec3CrossProduct(self.upAxis, self.forwardAxis);
	// Move the spaceship forward when the keyboard is pressed.
	self.shipVelocity = vec3MultiplyScalar(self.forwardAxis, self.keyboardForwardBackward);
	// Find position change.
	self.shipPosition = vec3Add(self.shipPosition, vec3MultiplyScalar(self.shipVelocity, timeStep));
	
	let matrixAxes = [];
	
	// Create a 4x4 matrix with all of the axes for the angle
	matrixAxes[0] = self.rightAxis[0];
	matrixAxes[1] = self.rightAxis[1];
	matrixAxes[2] = self.rightAxis[2];
	matrixAxes[3] = 0;
	
	matrixAxes[4] = self.upAxis[0];
	matrixAxes[5] = self.upAxis[1];
	matrixAxes[6] = self.upAxis[2];
	matrixAxes[7] = 0;
	
	matrixAxes[8] = self.forwardAxis[0];
	matrixAxes[9] = self.forwardAxis[1];
	matrixAxes[10] = self.forwardAxis[2];
	matrixAxes[11] = 0;

	matrixAxes[12] = 0;
	matrixAxes[13] = 0;
	matrixAxes[14] = 0;
	matrixAxes[15] = 1;

	// Add the position to the main matrix
	modelViewMatrix = mat4Translation(modelViewMatrix, self.shipPosition);
	// Add the rotation matrix to the main matrix
	modelViewMatrix = mat4Multiply(matrixAxes, modelViewMatrix);
	
	return modelViewMatrix;
}
