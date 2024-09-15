# autonomous-manual-driving
autonomous and manual car physics demo with three.js

A simple playground built on Three JS and Cannon JS for experimenting with car physics and autonomous driving. There are two modes, manual and autonomous. Autonomous mode uses one of the most basic algorithms for autonomous navigation called “Pure Pursuit”. Autonomous mode still has lots of room for improvement.

How Pure Pursuit works:

On each frame, the current forward vector line of the vehicle is calculated along with a “look ahead” point on that line. A second vector line is then calculated which lies perpendicular to the forward vector. The point where this perpendicular vector line intersects with the “road” curve is then calculated and a triangle is formed using point A (vehicle), point B (look ahead), and point C (intersection). The required steering value is then calculated by finding the angle theta of this triangle.

![Screenshot (819)](https://github.com/user-attachments/assets/1a61e985-f481-4e81-b940-265417c1160f)

Creating new paths:

This application uses SVG path syntax to represent the “road” and translates this syntax into Three JS CubicBezierCurve3 objects. If you want to create your own paths but do not have access to paid vector graphics software, such as Adobe Illustrator, then I recommend using the free online SVG path editor that is linked below. I used it to create the paths that currently exist in the application.

https://yqnn.github.io/svg-path-editor/

![Screenshot (820)](https://github.com/user-attachments/assets/7ac286f4-bf62-4060-8f77-bf4b87708f22)

Running locally:

Besides Node JS, no other software installations are necessary. Make sure node is installed and then download this repository to your machine. Open up your command line terminal and then navigate to the root directory of this repository. Run the command “node server”. The application is now running on your machine using localhost.

Credits:

The logic for the car handling was borrowed from this repository:
https://github.com/swift502/Sketchbook

The car model used in this application was downloaded from cgtrader:
https://www.cgtrader.com/free-3d-models/car/luxury-car/aston-martin-db4gt-zagato-1960-1963
