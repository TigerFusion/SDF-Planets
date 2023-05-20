# Planet Physics with SDFs Version 1.2 Build 8
This project uses JavaScript and WebGL to create signed distance field planet physics. This code is inspired by Super Mario Galaxy and Planetary Annihilation. There are three SDF planets I created (a plane, sphere, and box) but there are plenty more you could try. Also you can try primitive combinations of the sdf planets with the Union, Subtract, and Intersect functions. All that is needed to create a working planet is gravity and normal vectors pointing away from the shape’s surface.

<b>Keyboard Controls:</b>

1) Up, down, left, and right arrow keys or "q", "w", "e", "a", "s", and "d" to move. "0" to jump.<br>
2) Spacebar to switch between SDF planets.<br>
3) Hold down left mouse button and drag to rotate the scene.<br>
4) Press i to invert the motion of the player on the planet.

Test it out here: https://tigerfusion.github.io/SDF-Planets/

<b>Lessons Learned:</b>

Euler angles can be used with matrices you just have to be careful what order they are sent in and taken out. Also the matrixMotion() function will probably work with quaternions I just like using matrices better when working with euler angles.

For more SDF shapes and the functions for combining primitives check this article out:
https://iquilezles.org/articles/distfunctions/
