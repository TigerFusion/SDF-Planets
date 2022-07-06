# Planet Physics with SDFs Version 1.0.0 3b4
This project uses JavaScript and WebGL to create signed distance field planets. This code is inspired by Super Mario Galaxy and Planetary Annihilation. There are three SDF planets I created (a plane, sphere, and box) but there are plenty more you could try. Also try combining planets with the Union, Subtract, and Intersect functions. All that is needed to create a working planet is gravity and normal vectors pointing away from the shape’s surface.

Keyboard Controls

Use the up, down, left, and right arrow keys to move and spacebar to switch between SDF planets. Click and drag the mouse to rotate the scene.

Test it out here: https://tigerfusion.github.io/SDF-Planets/

Lessons Learned

For rotation use Matrices or Quaternions not Euler. If you are importing Euler angles you are fine but you will find all kinds of problems returning Euler angles. This project's motion is a matrix function I made called matrixMotion() in world.js but could easily be tweaked for quaternions. 

If you are wondering how long it took to figure this out it took me almost a year of extra time.
