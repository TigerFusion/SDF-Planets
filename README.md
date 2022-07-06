# Planet Physics with SDFs Version 1.0.0 3b4
This project uses JavaScript and WebGL to create signed distance fields as planets. They are inspired by Super Mario Galaxy and Planetary Annihilation. In this demo there are three SDF planets (a plane, sphere, and box) and there are plenty more you could try. Also you can combine planets with the Union, Subtract, and Intersect functions. All that is needed to move around a planet is gravity and a normal vector pointing away from the planet’s surface.

Keyboard Controls

Use the up down left right arrow keys to move the spaceship. Use spacebar to switch between SDF planets. Click and drag the mouse to rotate the scene.

Test it out here: https://tigerfusion.github.io/SDF-Planets/

Lessons Learned

For rotation use Matrices or Quaternions. If you are sending in Euler angles you are fine but there are all kinds of problems extracting an Euler angle from other types of rotation. This project uses a motion function I made called matrixMotion() but could easily be tweaked for quaternions. 

If you are wondering how long it took to figure this out it took me almost a year worth of spare time.
