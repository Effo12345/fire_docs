// The guide's table of contents. Reading order here is the order of the sidebar.
export const SITE_TITLE = 'Fire Docs';

export const curriculum = [
    { label: 'Start Here', dir: 'start-here', pages: [
        ['inside-a-computer', 'Inside a Computer'],
        ['what-code-does', 'What Code Actually Does'],
        ['how-to-use-this-guide', 'How to Use This Guide'],
        ['changelog', 'Changelog'],
    ]},
    { label: 'C++ Foundations', dir: 'cpp-foundations', pages: [
        ['variables-types-scope', 'Variables, Types, and Scope'],
        ['math-and-decisions', 'Math and Decisions'],
        ['arrays-and-loops', 'Arrays and Loops'],
        ['functions', 'Functions'],
        ['pointers-and-references', 'Pointers and References'],
    ]},
    { label: 'Your First Robot Program', dir: 'first-robot-program', pages: [
        ['installing-pros', 'Installing PROS'],
        ['inside-a-pros-project', 'Inside a PROS Project'],
        ['connecting-wirelessly', 'Connecting Wirelessly'],
        ['driver-control', 'Driver Control'],
        ['first-autonomous', 'Your First Autonomous'],
        ['git-basics', 'Saving Your Work with Git'],
    ]},
    { label: 'Sensing the World', dir: 'sensors', pages: [
        ['why-sensors', 'Why Robots Need Sensors'],
        ['limit-and-bump-switches', 'Limit and Bump Switches'],
        ['motor-encoders', 'Motor Encoders'],
        ['rotation-and-shaft-encoders', 'Rotation Sensors and Shaft Encoders'],
        ['potentiometers', 'Potentiometers'],
        ['inertial-sensor', 'The Inertial Sensor'],
        ['distance-sensor', 'The Distance Sensor (Depth)'],
        ['optical-sensor', 'The Optical Sensor'],
    ]},
    { label: 'Feedback Control', dir: 'feedback-control', pages: [
        ['why-control-theory', 'Why Control Theory Matters'],
        ['units-and-frames', 'Units and Coordinate Frames'],
        ['closing-the-loop', 'Closing the Loop'],
        ['pid', 'PID'],
    ]},
    { label: 'Seeing Inside Your Robot', dir: 'seeing-inside', pages: [
        ['brain-screen', 'Using the Brain Screen'],
        ['sd-card-logging', 'Logging to the SD Card'],
        ['tasks', 'Doing Two Things at Once'],
    ]},
    { label: 'Organizing Bigger Programs', dir: 'bigger-programs', pages: [
        ['multiple-files', 'Splitting Code Across Files'],
        ['structs', 'Structs'],
        ['classes', 'Classes'],
        ['composition-and-inheritance', 'Composition and Inheritance'],
        ['virtual-functions', 'Virtual Functions and Custom Motors'],
        ['smart-pointers', 'Smart Pointers'],
        ['vector', 'std::vector'],
    ]},
    { label: 'Knowing Where You Are', dir: 'localization', pages: [
        ['why-wheel-odometry', 'Why Wheel Odometry'],
        ['tracking-wheels', 'Tracking Wheels'],
        ['position-tracking-math', 'The Math of Position Tracking'],
    ]},
    { label: 'Following Paths', dir: 'following-paths', pages: [
        ['pure-pursuit', 'Pure Pursuit'],
        ['boomerang', 'Boomerang'],
        ['choosing-a-follower', 'Choosing a Path Follower'],
    ]},
];
