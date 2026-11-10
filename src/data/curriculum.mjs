// The guide's table of contents. Reading order here is the order of the sidebar.
export const SITE_TITLE = 'Fire Docs';

export const curriculum = [
    { label: 'Start Here', blurb: 'What a computer really does, what code is, and how to get the most out of this guide.', dir: 'start-here', pages: [
        ['inside-a-computer', 'Inside a Computer'],
        ['what-code-does', 'What Code Actually Does'],
        ['how-to-use-this-guide', 'How to Use This Guide'],
        ['changelog', 'Changelog'],
    ]},
    { label: 'C++ Foundations', blurb: 'The language itself: variables, decisions, loops, functions and pointers.', dir: 'cpp-foundations', pages: [
        ['variables-types-scope', 'Variables, Types, and Scope'],
        ['math-and-decisions', 'Math and Decisions'],
        ['arrays-and-loops', 'Arrays and Loops'],
        ['functions', 'Functions'],
        ['pointers-and-references', 'Pointers and References'],
    ]},
    { label: 'Your First Robot Program', blurb: 'Install PROS, drive with a controller, write your first autonomous, and save your work with Git.', dir: 'first-robot-program', pages: [
        ['installing-pros', 'Installing PROS'],
        ['inside-a-pros-project', 'Inside a PROS Project'],
        ['connecting-wirelessly', 'Connecting Wirelessly'],
        ['driver-control', 'Driver Control'],
        ['first-autonomous', 'Your First Autonomous'],
        ['git-basics', 'Saving Your Work with Git'],
    ]},
    { label: 'Sensing the World', blurb: 'How each V5 sensor works, what it can and can\'t tell you, and how to read it in code.', dir: 'sensors', pages: [
        ['why-sensors', 'Why Robots Need Sensors'],
        ['limit-and-bump-switches', 'Limit and Bump Switches'],
        ['motor-encoders', 'Motor Encoders'],
        ['rotation-and-shaft-encoders', 'Rotation Sensors and Shaft Encoders'],
        ['potentiometers', 'Potentiometers'],
        ['inertial-sensor', 'The Inertial Sensor'],
        ['distance-sensor', 'The Distance Sensor (Depth)'],
        ['optical-sensor', 'The Optical Sensor'],
    ]},
    { label: 'Feedback Control', blurb: 'Why robots correct themselves, and how to write and tune a PID controller.', dir: 'feedback-control', pages: [
        ['why-control-theory', 'Why Control Theory Matters'],
        ['units-and-frames', 'Units and Coordinate Frames'],
        ['closing-the-loop', 'Closing the Loop'],
        ['pid', 'PID'],
    ]},
    { label: 'Seeing Inside Your Robot', blurb: 'Debugging with the Brain screen, logging to an SD card, and running several tasks at once.', dir: 'seeing-inside', pages: [
        ['brain-screen', 'Using the Brain Screen'],
        ['sd-card-logging', 'Logging to the SD Card'],
        ['tasks', 'Doing Two Things at Once'],
    ]},
    { label: 'Organizing Bigger Programs', blurb: 'Headers, structs, classes, inheritance, smart pointers and vectors, using real robot code.', dir: 'bigger-programs', pages: [
        ['multiple-files', 'Splitting Code Across Files'],
        ['structs', 'Structs'],
        ['classes', 'Classes'],
        ['composition-and-inheritance', 'Composition and Inheritance'],
        ['virtual-functions', 'Virtual Functions and Custom Motors'],
        ['smart-pointers', 'Smart Pointers'],
        ['vector', 'std::vector'],
    ]},
    { label: 'Knowing Where You Are', blurb: 'Odometry: tracking wheels, the math that turns their readings into a position on the field, and correcting drift with distance sensors.', dir: 'localization', pages: [
        ['why-wheel-odometry', 'Why Wheel Odometry'],
        ['tracking-wheels', 'Tracking Wheels'],
        ['position-tracking-math', 'The Math of Position Tracking'],
        ['monte-carlo-localization', 'Monte Carlo Localization'],
    ]},
    { label: 'Following Paths', blurb: 'Pure pursuit and boomerang, and how to choose between them.', dir: 'following-paths', pages: [
        ['pure-pursuit', 'Pure Pursuit'],
        ['boomerang', 'Boomerang'],
        ['choosing-a-follower', 'Choosing a Path Follower'],
    ]},
    { label: 'Reference', blurb: 'Every technical term in the guide, with a link to where it\'s explained.', dir: 'reference', pages: [
        ['glossary', 'Glossary'],
    ]},
];

// Pages still being written. They keep their URLs so links into them work, but stay out of the sidebar
const unwritten = new Set([
    'seeing-inside/brain-screen',
    'seeing-inside/sd-card-logging',
    'seeing-inside/tasks',
    'bigger-programs/multiple-files',
    'bigger-programs/structs',
    'bigger-programs/classes',
    'bigger-programs/composition-and-inheritance',
    'bigger-programs/virtual-functions',
    'bigger-programs/smart-pointers',
    'bigger-programs/vector',
    'localization/why-wheel-odometry',
    'localization/tracking-wheels',
    'localization/position-tracking-math',
    'localization/monte-carlo-localization',
    'following-paths/pure-pursuit',
    'following-paths/boomerang',
    'following-paths/choosing-a-follower',
]);

// The table of contents without unwritten pages. A section with nothing written has no pages here
export const writtenCurriculum = curriculum.map((section) => ({
    ...section,
    pages: section.pages.filter(([slug]) => !unwritten.has(`${section.dir}/${slug}`)),
}));
