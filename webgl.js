"use strict";

// MARK: Scalar
function radiansFromDegrees(degrees)
{
	return degrees * Math.PI / 180.0;
}

function degreesFromRadians(radians)
{
	return radians * 180.0 / Math.PI;
}

function magnitudeVec3(vector)
{
	return Math.sqrt(dotProductVec3(vector, vector));
}

function magnitudeVec3Squared(vector)
{
	return dotProductVec3(vector, vector);
}

function dotProductVec3(left, right)
{
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

// MARK: - Vectors

function vec3Add(left, right)
{
	return [
		left[0] + right[0],
	 	left[1] + right[1],
	 	left[2] + right[2],
	];
}

function vec3Subtract(left, right)
{
	return [
		left[0] - right[0],
	 	left[1] - right[1],
	 	left[2] - right[2],
	];
}

function vec3Normalize(vector)
{
	let magnitude = magnitudeVec3(vector);
	
	if (magnitude === 0)
	{
		return [0, 0, 0];
	}
	
	let length = (1.0 / magnitude);
	return vec3MultiplyScalar(vector, length);
}

function vec3CrossProduct(left, right)
{
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

function vec3MultiplyScalar(vector, scalar)
{
	return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
}

// For a 4x4 matrix
function vec3TranslationMat4(matrix)
{
	return [matrix[12], matrix[13], matrix[14]];
}

// MARK: - Matrices
function mat4Identity()
{
	return [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1];
}

function mat4Multiply(matA, matB)
{
	return matMulitply(matA, 4, 4, matB, 4, 4);
}

function matMulitply(matA, aRows, aCols, matB, bRows, bCols)
{
	if (aCols !== bRows)
	{
		return null;
	}
	
	let matrix = [];
	
	for (let i = 0; i < aRows; i++)
	{
		for (let j = 0; j < bCols; j++)
		{
			matrix[bCols * i + j] = 0;
			
			for (let k = 0; k < bRows; k++)
			{
				matrix[bCols * i + j] += matA[aCols * i + k] * matB[bCols * k + j];
			}
		}
	}
	
	return matrix;
}

function mat4Frustum(matrix, left, right, bottom, top, near, far)
{
    let x = (2 * near) / (right - left);
    let y = (2 * near) / (top - bottom);
    let a = (right + left) / (right - left);
    let b = (top + bottom) / (top - bottom);
    let c = -(far + near) / (far - near);
    let d = (-2 * far * near) / (far - near);

	return mat4Multiply(
    [
    	x, 0, 0, 0,
    	0, y, 0, 0,
    	a, b, c,-1,
		0, 0, d, 0
    ], matrix);
}

// This matrix uses YXZ matrix
function mat4EulerAngle(oldMatrix, radians)
{
	const matrix = [];
	
	// This matrix uses YXZ matrix
	// Yaw = Y, Pitch = X, Roll = Z
	const cosY = Math.cos(radians[1]); // Yaw
	const sinY = Math.sin(radians[1]);

	const cosP = Math.cos(radians[0]); // Pitch
	const sinP = Math.sin(radians[0]);

    const cosR = Math.cos(radians[2]); // Roll
    const sinR = Math.sin(radians[2]);
	
	// Matrix is column major and cos/sin are Row Major aka Row|Column 
	matrix[0] = cosY * cosR + sinY * sinP * sinR; // 11
	matrix[1] = cosR * sinY * sinP - sinR * cosY; // 12
	matrix[2] = cosP * sinY; // 13
	matrix[3] = 0;

	matrix[4] = cosP * sinR; // 21
	matrix[5] = cosR * cosP; // 22
	matrix[6] = -sinP; // 23
	matrix[7] = 0;
	
	matrix[8] = sinR * cosY * sinP - sinY * cosR; // 31
	matrix[9] = sinY * sinR + cosR * cosY * sinP; // 32
	matrix[10] = cosP * cosY; // 33
	matrix[11] = 0;
	
	matrix[12] = 0;
	matrix[13] = 0;
	matrix[14] = 0;
	matrix[15] = 1;
	
	return mat4Multiply(matrix, oldMatrix);
}

// This is like OpenGL's glRotate() function
function mat4AxisAngle(matrix, axis, radians)
{
	let c = Math.cos(radians);
	let s = Math.sin(radians);
	let t = 1 - Math.cos(radians);
	
	let x = axis[0];
	let y = axis[1];
	let z = axis[2];
	
	if (magnitudeVec3Squared(axis) === 0)
	{
		return matrix;//mat4Identity();
	}
	
	let inverseLength = 1 / magnitudeVec3(axis);
	
	x *= inverseLength;
	y *= inverseLength;
	z *= inverseLength;
	
	return mat4Multiply(
	[
		t * (x * x) + c, t * x * y + s * z, t * x * z - s * y, 0,
		t * x * y - s * z, t * (y * y) + c, t * y * z + s * x, 0,
		t * x * z + s * y, t * y * z - s * x, t * (z * z) + c, 0,
		0, 0, 0, 1
	], matrix);
}

function mat4Translation(matrix, position)
{
	return mat4Multiply(
	[
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		position[0], position[1], position[2], 1
	], matrix);
}

function matTranspose(matrix, rows, cols)
{
	let transposeMatrix = [];
	
	for (let i = 0; i < rows * cols; i++)
	{
		// This needs to be converted to integers
		let row = parseInt(i / rows);
		let col = parseInt(i % rows);
		transposeMatrix[i] = matrix[cols * col + row];
	}
	
	return transposeMatrix;
}

function mat3Transpose(matrix)
{
	return matTranspose(matrix, 3, 3);
}

function getWebGLContext(canvas)
{
	var context = canvas.getContext("webgl");

	if (context === null)
	{
		context = canvas.getContext("experimental-webgl");
	}
	
	if (context === null)
	{
		context = canvas.getContext("webkit-3d");
	}
	
	if (context === null)
	{
		context = canvas.getContext("moz-webgl");
	}

	return context;
}

function initShaderProgram(gl, vShader, fShader)
{
	var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vShader);
	var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fShader);

	if (!vertexShader || !fragmentShader)
	{
		return null;
	}

	var shaderProgram = gl.createProgram();
	
	if (!shaderProgram)
	{
		alert("Error: cannot create program");
		return null;
	}
	
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Error: shader program " + gl.getProgramInfoLog(shaderProgram));
		gl.deleteProgram(shaderProgram);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}
	
	return shaderProgram;
}

function loadShader(gl, type, source)
{
	var shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		if (type == gl.VERTEX_SHADER)
		{
			alert("Error: vertex shader " + gl.getShaderInfoLog(shader));
		}
		else if (type == gl.FRAGMENT_SHADER)
		{
			alert("Error: fragment shader " + gl.getShaderInfoLog(shader));
		}
		
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}
