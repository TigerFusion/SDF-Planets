# Planet Physics with SDFs Version 1.1 5b2
This project uses JavaScript and WebGL to create signed distance field planets. This code is inspired by Super Mario Galaxy and Planetary Annihilation. There are three SDF planets I created (a plane, sphere, and box) but there are plenty more you could try. Also you can try primitive combinations of the sdf planets with the Union, Subtract, and Intersect functions. All that is needed to create a working planet is gravity and normal vectors pointing away from the shape’s surface.

<b>Keyboard Controls</b>

Up, down, left, and right arrow keys to move.<br>
Spacebar to switch between SDF planets.<br>
Hold down left mouse button and drag to rotate the scene.<br>
Press i to invert the motion of the player on the planet.

Test it out here: https://tigerfusion.github.io/SDF-Planets/

Lessons Learned:

Euler angles can be used with matrices you just have to careful what order they are sent in and taken out. Note that the matrixMotion() function only needs a normalized vector to orient the player sphere to the planet. Also the matrixMotion() function will probably work with quaternions I just like using matrices better when working with euler angles.

For more SDF shapes and the functions for combining primitives check this article out:
https://iquilezles.org/articles/distfunctions/
