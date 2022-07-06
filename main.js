"use strict";

var RESOLUTION = 1; // 0.5 is half the resolution

var VSHADER_SQUARE_SOURCE =
"attribute vec3 a_Position;\n" +
"uniform mat4 u_ModelViewMatrix;\n" +
"uniform mat4 u_ProjectionMatrix;\n" +
"void main()\n" +
"{\n" +
"	gl_Position = u_ProjectionMatrix * u_ModelViewMatrix * vec4(a_Position, 1.0);\n" +
" 	gl_PointSize = 10.0;\n" +
"}\n";

var FSHADER_SQUARE_SOURCE =
"precision mediump float;\n" +
"uniform vec4 u_Color;\n" +
"void main()\n" +
"{\n" +
"	gl_FragColor = u_Color;\n" +
"}\n";

function create ()
{
	// This makes the body the full size of the window
	document.body.style.margin = "0px";
	document.body.style.padding = "0px";
	document.body.style.width = "100%";
	document.body.style.height = "100%";
	document.body.style.overflow = "hidden";
	
	// This resizes the webgl view to the full size of the window view
	let canvas = document.createElement("canvas");
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	
	document.body.appendChild(canvas);
	
	let fpsNode = document.createElement("div");
	fpsNode.style.backgroundColor = "rgba(100%, 100%, 100%, 0.5)";
	fpsNode.style.margin = "0px 5px";
	fpsNode.style.padding = "6px 5px";
	fpsNode.style.borderRadius = "5px";
	fpsNode.style.width = "50px";
	fpsNode.style.fontSize = "15px";
	fpsNode.style.textAlign = "center";
	fpsNode.style.color = "white";
	fpsNode.style.top = "15px";
	fpsNode.style.left = "10px";
	fpsNode.style.position = "fixed";
	fpsNode.style.display = "none";
	fpsNode.style.zIndex = 1;
	fpsNode.style.display = "block";
	fpsNode.innerHTML = "00FPS";
	
	document.body.appendChild(fpsNode);
	
	let cpuNode = document.createElement("div");
	cpuNode.style.backgroundColor = "rgba(100%, 100%, 100%, 0.5)";
	cpuNode.style.margin = "0px 5px";
	cpuNode.style.padding = "6px 5px";
	cpuNode.style.borderRadius = "5px";
	cpuNode.style.width = "60px";
	cpuNode.style.fontSize = "15px";
	cpuNode.style.textAlign = "center";
	cpuNode.style.color = "white";
	cpuNode.style.top = "15px";
	cpuNode.style.left = "80px";
	cpuNode.style.position = "fixed";
	cpuNode.style.display = "none";
	cpuNode.style.zIndex = 1;
	cpuNode.style.display = "block";
	cpuNode.innerHTML = "000MS";
	
	document.body.appendChild(cpuNode);
	
	let project = new Project(cpuNode, fpsNode, canvas);
	
	project.planetExtents = [2,2,2];
	project.planetRadius = 3;
	project.shipRadius = 1;
	
	project.wirePlanetBox = boxWire(project.gl, project.planetExtents);
	project.wireBoxSpaceship = sphereWire(project.gl, project.shipRadius);
	
	project.wirePlanetSphere = sphereWire(project.gl, project.planetRadius);
	project.wireSphereSpaceship = sphereWire(project.gl, project.shipRadius);

	project.wirePlanetPlane = planeWire(project.gl);
	project.wirePlaneSpaceship = sphereWire(project.gl, project.shipRadius);

	let world = new World(project);
	project.update(world);
}

function Project(cpuNode, fpsNode, canvas)
{
	let gl = getWebGLContext(canvas);

	if (!gl)
	{
		console.log("Failed to get the rendering context for WebGL");
		return;
	}

	this.shaderProgram = initShaderProgram(gl, VSHADER_SQUARE_SOURCE, FSHADER_SQUARE_SOURCE);
	
	if (!this.shaderProgram)
	{
		console.log("Failed to intialize shaders.");
		return;
	}
	
	this.projectionMatrix = [];

	this.cpuNode = cpuNode;
	this.fpsNode = fpsNode;
	this.gl = gl;

	let self = this;

	window.addEventListener("resize", function(event) 
	{
		// event.preventDefault(); prevents a system beep from older browsers

		canvas.width = window.innerWidth * RESOLUTION;
		canvas.height = window.innerHeight * RESOLUTION;
		
		// normalize the width and height then find the frustum
		let x = canvas.width;
		let y = canvas.height;
		let length = Math.sqrt((x * x) + (y * y));
		let nx = x / length;
		let ny = y / length;
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		self.projectionMatrix = mat4Frustum(mat4Identity(), -nx, nx, -ny, ny, 1.0, 10000);
	}, false);
	
	this.shaderProgram.u_Color = gl.getUniformLocation(this.shaderProgram, "u_Color");
	this.shaderProgram.u_ModelViewMatrix = gl.getUniformLocation(this.shaderProgram, "u_ModelViewMatrix");
	this.shaderProgram.u_ProjectionMatrix = gl.getUniformLocation(this.shaderProgram, "u_ProjectionMatrix");

	this.shaderProgram.a_Position = gl.getAttribLocation(this.shaderProgram, "a_Position");
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	
	// MARK: Variables
	this.startDragging = false;
	this.dragAngleX = 0;
	this.dragAngleY = 0;
	this.offsetX = 0;
	this.offsetY = 0;
	this.displayPlanet = 0;
	
	// Frames per second
	this.frameLoop =
	{
		frameCount:0,
		timeElapsed:0,
		now:0,
		timeStep:0,
		// In milliseconds
		lastTime:Date.now(),
		averageTime:0,
		oldTime:0,
	}

	canvas.width = window.innerWidth * RESOLUTION;
	canvas.height = window.innerHeight * RESOLUTION;
	
	// normalize the width and height then find the frustum
	let x = canvas.width;
	let y = canvas.height;
	let length = Math.sqrt((x * x) + (y * y));
	let nx = x / length;
	let ny = y / length;
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	this.projectionMatrix = mat4Frustum(mat4Identity(), -nx, nx, -ny, ny, 1.0, 10000);
		
	document.addEventListener("mousedown", function(event)
	{
		event.preventDefault();
		self.offsetX = event.clientX;
		self.offsetY = event.clientY;
		self.startDragging = true;
	}, false);

	document.addEventListener("mousemove", function(event)
	{
		if (self.startDragging === true)
		{
			if (self.dragAngleX > 90)
			{
				self.dragAngleX = 90;
			}
			else if (self.dragAngleX < -90)
			{
				self.dragAngleX = -90;
			}
			else
			{
				// Find the segment that has changed also known as the delta
				// The values are flipped because of the rotation axises
				self.dragAngleX += (event.clientY - self.offsetY);
				self.dragAngleY += (event.clientX - self.offsetX);
				
				// These are not flipped because they are used with the "event.client"
				self.offsetX = event.clientX;
				self.offsetY = event.clientY;
			}
		}
	}, false);
	
	document.addEventListener("mouseup", function(event)
	{
		if (self.startDragging === true)
		{
			self.offsetX = event.clientX;
			self.offsetY = event.clientY;
			
			self.startDragging = false;
		}
	}, false);
}

Project.prototype.update = function(world)
{
	let frameLoop = this.frameLoop;
	let gl = this.gl;
	let self = this;

	var updateAnimation = function()
	{
		frameLoop.now = Date.now();
		// 1000 converts it to seconds
		frameLoop.timeStep = (frameLoop.now - frameLoop.lastTime) / 1000;
		frameLoop.lastTime = frameLoop.now;
		frameLoop.frameCount++;
		frameLoop.timeElapsed += frameLoop.timeStep;

		if (frameLoop.timeElapsed >= 1)
		{
			self.fpsNode.innerHTML = Math.round(frameLoop.frameCount / frameLoop.timeElapsed) + "FPS";
			frameLoop.frameCount = 0;
			frameLoop.timeElapsed = 0;
		}
		
		if (frameLoop.averageTime >= 10)
		{
			self.cpuNode.innerHTML = Math.round((Date.now() - frameLoop.oldTime) / frameLoop.averageTime) + "MS";
			frameLoop.averageTime = 0;
		}
		else if (frameLoop.averageTime === 0)
		{
			frameLoop.oldTime = Date.now();
			frameLoop.averageTime++;
		}
		else
		{
			frameLoop.averageTime++;
		}
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		let modelViewMatrix = null;
		
	// MARK: Yellow Wire Box Planet
		if (self.displayPlanet === 2)
		{
			modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
			modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
			
			modelViewMatrix = world.planet.updatePlanetBox(modelViewMatrix, frameLoop.timeStep);
			
			gl.useProgram(self.shaderProgram);
			gl.enableVertexAttribArray(self.shaderProgram.a_Position);
			
			gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);
			gl.uniformMatrix4fv(self.shaderProgram.u_ProjectionMatrix, false, self.projectionMatrix);

			gl.uniform4f(self.shaderProgram.u_Color, 1, 1, 0, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.wirePlanetBox.vertexBuffer);
			gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wirePlanetBox.indexBuffer);
			gl.drawElements(gl.LINES, self.wirePlanetBox.indicesLength, gl.UNSIGNED_SHORT, 0)
		// White Wire Box Spaceship
			modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
			modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
		
			modelViewMatrix = world.planet.updateBoxSpaceship(modelViewMatrix, frameLoop.timeStep);
		
			gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);

			gl.uniform4f(self.shaderProgram.u_Color, 1, 1, 1, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.wireBoxSpaceship.vertexBuffer);
			gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wireBoxSpaceship.indexBuffer);
			gl.drawElements(gl.LINES, self.wireBoxSpaceship.indicesLength, gl.UNSIGNED_SHORT, 0);
		}
		else if (self.displayPlanet === 1)
		{
		// MARK: Red Wire Sphere Planet
			modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
			modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
			
			modelViewMatrix = world.planet.updatePlanetSphere(modelViewMatrix, frameLoop.timeStep);
			
			gl.useProgram(self.shaderProgram);
			gl.enableVertexAttribArray(self.shaderProgram.a_Position);
			
			gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);
			gl.uniformMatrix4fv(self.shaderProgram.u_ProjectionMatrix, false, self.projectionMatrix);

			gl.uniform4f(self.shaderProgram.u_Color, 1, 0, 0, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.wirePlanetSphere.vertexBuffer);
			gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wirePlanetSphere.indexBuffer);
			gl.drawElements(gl.LINES, self.wirePlanetSphere.indicesLength, gl.UNSIGNED_SHORT, 0);
		// Cyan Wire Sphere Spaceship
			modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
			modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
		
			modelViewMatrix = world.planet.updateSphereSpaceship(modelViewMatrix, frameLoop.timeStep);
		
			gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);

			gl.uniform4f(self.shaderProgram.u_Color, 0, 1, 1, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.wireSphereSpaceship.vertexBuffer);
			gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wireSphereSpaceship.indexBuffer);
			gl.drawElements(gl.LINES, self.wireSphereSpaceship.indicesLength, gl.UNSIGNED_SHORT, 0);
		}
		else if (self.displayPlanet === 0)
		{
		// MARK: Orange Wire Plane Planet
			modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
			modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
			
			modelViewMatrix = world.planet.updatePlanetPlane(modelViewMatrix, frameLoop.timeStep);
			
			gl.useProgram(self.shaderProgram);
			gl.enableVertexAttribArray(self.shaderProgram.a_Position);
			
			gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);
			gl.uniformMatrix4fv(self.shaderProgram.u_ProjectionMatrix, false, self.projectionMatrix);

			gl.uniform4f(self.shaderProgram.u_Color, 1, 0.5, 0, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.wirePlanetPlane.vertexBuffer);
			gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wirePlanetPlane.indexBuffer);
			gl.drawElements(gl.LINES, self.wirePlanetPlane.indicesLength, gl.UNSIGNED_SHORT, 0)
		// Green Wire Plane Spaceship
			modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
			modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
			modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
		
			modelViewMatrix = world.planet.updatePlaneSpaceship(modelViewMatrix, frameLoop.timeStep);
		
			gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);

			gl.uniform4f(self.shaderProgram.u_Color, 0, 1, 0, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.wirePlaneSpaceship.vertexBuffer);
			gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wirePlaneSpaceship.indexBuffer);
			gl.drawElements(gl.LINES, self.wirePlaneSpaceship.indicesLength, gl.UNSIGNED_SHORT, 0);
		}
		
// Start line for Ship Sphere segment code
		modelViewMatrix = mat4Translation(mat4Identity(), [0, 0,-10]);
		modelViewMatrix = mat4AxisAngle(modelViewMatrix, [1, 0, 0], radiansFromDegrees(self.dragAngleX));
		modelViewMatrix = mat4AxisAngle(modelViewMatrix, [0, 1, 0], radiansFromDegrees(self.dragAngleY));
		modelViewMatrix = mat4Translation(modelViewMatrix, [0, 0, 10]);
	
		modelViewMatrix = mat4Translation(modelViewMatrix, world.planet.shipPosition);
	
		gl.uniformMatrix4fv(self.shaderProgram.u_ModelViewMatrix, false, modelViewMatrix);

	// Green Line forward Axis
		self.wireVector = lineWire(gl, [0,0,0], vec3MultiplyScalar(world.planet.forwardAxis, -1));
		
		gl.uniform4f(self.shaderProgram.u_Color, 0, 1, 0, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, self.wireVector.vertexBuffer);
		gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wireVector.indexBuffer);
		gl.drawElements(gl.LINES, self.wireVector.indicesLength, gl.UNSIGNED_SHORT, 0);
		
		gl.deleteBuffer(self.wireVector.vertexBuffer);
		gl.deleteBuffer(self.wireVector.indexBuffer);

	// Red line right axis
		self.wireVector = lineWire(gl, [0,0,0], vec3Normalize(world.planet.rightAxis));

		gl.uniform4f(self.shaderProgram.u_Color, 1, 0, 0, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, self.wireVector.vertexBuffer);
		gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wireVector.indexBuffer);
		gl.drawElements(gl.LINES, self.wireVector.indicesLength, gl.UNSIGNED_SHORT, 0);

		gl.deleteBuffer(self.wireVector.vertexBuffer);
		gl.deleteBuffer(self.wireVector.indexBuffer);

	// Blue line up Axis
		self.wireVector = lineWire(gl, [0,0,0], vec3Normalize(world.planet.upAxis));

		gl.uniform4f(self.shaderProgram.u_Color, 0, 0, 1, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, self.wireVector.vertexBuffer);
		gl.vertexAttribPointer(self.shaderProgram.a_Position, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.wireVector.indexBuffer);
		gl.drawElements(gl.LINES, self.wireVector.indicesLength, gl.UNSIGNED_SHORT, 0);

		gl.deleteBuffer(self.wireVector.vertexBuffer);
		gl.deleteBuffer(self.wireVector.indexBuffer);

		window.requestAnimationFrame(updateAnimation);
	}

	updateAnimation();
}

function boxWire(gl, halfSize)
{
	let verticesArray = [];
	let indicesArray = [];

	let widthExtent = halfSize[0] + 0.01;
	let heightExtent = halfSize[1] + 0.01;
	let lengthExtent = halfSize[2] + 0.01;

	// Front
	verticesArray.push(widthExtent);
	verticesArray.push(heightExtent);
	verticesArray.push(lengthExtent);

	verticesArray.push(widthExtent);
	verticesArray.push(-heightExtent);
	verticesArray.push(lengthExtent);

	verticesArray.push(-widthExtent);
	verticesArray.push(-heightExtent);
	verticesArray.push(lengthExtent);

	verticesArray.push(-widthExtent);
	verticesArray.push(heightExtent);
	verticesArray.push(lengthExtent);

	// Back
	verticesArray.push(widthExtent);
	verticesArray.push(heightExtent);
	verticesArray.push(-lengthExtent);

	verticesArray.push(widthExtent);
	verticesArray.push(-heightExtent);
	verticesArray.push(-lengthExtent);

	verticesArray.push(-widthExtent);
	verticesArray.push(-heightExtent);
	verticesArray.push(-lengthExtent);

	verticesArray.push(-widthExtent);
	verticesArray.push(heightExtent);
	verticesArray.push(-lengthExtent);
	
	// Front Indices
	indicesArray.push(0);
	indicesArray.push(1);
	
	indicesArray.push(1);
	indicesArray.push(2);
	
	indicesArray.push(2);
	indicesArray.push(3);
	
	indicesArray.push(3);
	indicesArray.push(0);

	// Back Indices
	indicesArray.push(4);
	indicesArray.push(5);
	
	indicesArray.push(5);
	indicesArray.push(6);
	
	indicesArray.push(6);
	indicesArray.push(7);
	
	indicesArray.push(7);
	indicesArray.push(4);

	// Side Indices
	indicesArray.push(0);
	indicesArray.push(4);

	indicesArray.push(1);
	indicesArray.push(5);

	indicesArray.push(2);
	indicesArray.push(6);

	indicesArray.push(3);
	indicesArray.push(7);

	let wireBoxBuffers =
	{
		type:"BoxWire",
		vertexBuffer:gl.createBuffer(),
		indexBuffer:gl.createBuffer(),
		indicesLength:indicesArray.length
	};
	
	gl.bindBuffer(gl.ARRAY_BUFFER, wireBoxBuffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireBoxBuffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);

	return wireBoxBuffers;
}

function sphereWire(gl, radius)
{
	let verticesArray = [];
	let indicesArray = [];

	let segments = 12;
	
	radius += 0.03;
	
	for (let i = 0; i < segments; i++)
    {
        let angle = 2.0 * Math.PI * i / segments;
		
		// X Axis
		verticesArray.push(0);
		verticesArray.push(radius * -Math.sin(angle));
		verticesArray.push(radius * Math.cos(angle));

		indicesArray.push(i);
		
		if (i == segments - 1)
		{
			indicesArray.push(0);
		}
		else
		{
			indicesArray.push(i + 1);
		}
	}

	for (let i = 0; i < segments; i++)
    {
        let angle = 2.0 * Math.PI * i / segments;
		
		// Y Axis
		verticesArray.push(radius * Math.cos(angle));
		verticesArray.push(0);
		verticesArray.push(radius * -Math.sin(angle));

		indicesArray.push(i + segments);
		
		if (i == segments - 1)
		{
			indicesArray.push(segments);
		}
		else
		{
			indicesArray.push(i + segments + 1);
		}
	}

	for (let i = 0; i < segments; i++)
    {
        let angle = 2.0 * Math.PI * i / segments;
		
		// Z Axis
		verticesArray.push(radius * Math.cos(angle));
		verticesArray.push(radius * Math.sin(angle));
		verticesArray.push(0);

		indicesArray.push(i + segments * 2);
		
		if (i == segments - 1)
		{
			indicesArray.push(segments * 2);
		}
		else
		{
			indicesArray.push(i + segments * 2 + 1);
		}
	}

	let wireSphereBuffers =
	{
		type:"SphereWire",
		vertexBuffer:gl.createBuffer(),
		indexBuffer:gl.createBuffer(),
		indicesLength:indicesArray.length
	};
	
	gl.bindBuffer(gl.ARRAY_BUFFER, wireSphereBuffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireSphereBuffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);

	return wireSphereBuffers;
}

function planeWire(gl)
{
	let verticesArray = [];
	let indicesArray = [];

	verticesArray =
	[
		-20, 0, 0,
		 20, 0, 0,
		 0, 0,-20,
		 0, 0, 20,
		 0, 0, 0,
		 0, 1, 0,
		 0, 1, 0,
		-0.5, 0.5, 0
	];

	indicesArray = [0, 1, 2, 3, 4, 5, 6, 7];

	let planeBuffers =
	{
		type:"PlaneWire",
		vertexBuffer:gl.createBuffer(),
		indexBuffer:gl.createBuffer(),
		indicesLength:indicesArray.length
	};
	
	gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeBuffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);

	return planeBuffers;
}

function lineWire(gl, point1, point2)
{
	let verticesArray = [];
	
	verticesArray.push(point1[0]);
	verticesArray.push(point1[1]);
	verticesArray.push(point1[2]);
	
	verticesArray.push(point2[0]);
	verticesArray.push(point2[1]);
	verticesArray.push(point2[2]);

	let indicesArray = [0,1];
	
	let wireLineBuffers =
	{
		type:"LineWire",
		vertexBuffer:gl.createBuffer(),
		indexBuffer:gl.createBuffer(),
		indicesLength:indicesArray.length
	};
	
	gl.bindBuffer(gl.ARRAY_BUFFER, wireLineBuffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireLineBuffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);

	return wireLineBuffers;
}
