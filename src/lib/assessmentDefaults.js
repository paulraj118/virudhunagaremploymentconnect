export const fallbackQuestions = [
  // ==================== REACT EASY (10 questions) ====================
  {
    domain: 'React',
    questionText: 'What is the Virtual DOM in React?',
    options: [
      'A lightweight copy of the actual DOM',
      'A new HTML element',
      'A backend rendering engine',
      'A browser plugin'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'Which method is used to update state in a React class component?',
    options: [
      'setState()',
      'updateState()',
      'changeState()',
      'modifyState()'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'What hook is used to perform side effects in functional components?',
    options: [
      'useEffect',
      'useState',
      'useContext',
      'useReducer'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'What are props in React?',
    options: [
      'Short for properties, used to pass data between components',
      'Internal state of a component',
      'Methods to select DOM elements',
      'HTML attributes'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'React is primarily built around which architectural pattern?',
    options: [
      'Component-based architecture',
      'Model-View-Controller (MVC)',
      'Model-View-ViewModel (MVVM)',
      'Service-oriented architecture'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'How do you create a React application using the command line?',
    options: [
      'npx create-react-app my-app',
      'npm install react-app',
      'npx new react-app',
      'react-admin create my-app'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'In React, what is the purpose of a key prop when rendering a list?',
    options: [
      'To identify which items have changed, been added, or been removed',
      'To apply unique CSS styles',
      'To bind click handlers',
      'To encrypt list data'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'What is the default port used by the local development server in Create React App?',
    options: [
      '3000',
      '8080',
      '5000',
      '4200'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'Which of the following is used to handle multiple states in a single Hook?',
    options: [
      'useReducer',
      'useState',
      'useEffect',
      'useMemo'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'React',
    questionText: 'What does JSX stand for?',
    options: [
      'JavaScript XML',
      'JavaScript Extension',
      'Java Syntax Extension',
      'JSON XML'
    ],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },

  // ==================== REACT MEDIUM (10 questions) ====================
  {
    domain: 'React',
    questionText: 'What is the purpose of the useMemo hook in React?',
    options: [
      'To memoize expensive calculations and optimize performance',
      'To cache network requests',
      'To remember component state across re-renders',
      'To delay function execution'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'How does the useContext hook help in state management?',
    options: [
      'It allows consuming values from a React context without nesting',
      'It stores state directly in local storage',
      'It creates a global Redux store',
      'It optimizes state updates using web workers'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'What is the difference between controlled and uncontrolled components?',
    options: [
      'Controlled components have state managed by React; uncontrolled use the DOM directly',
      'Controlled components are functional; uncontrolled are class-based',
      'Controlled components use hooks; uncontrolled components do not',
      'Controlled components are safer but slower'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'What is the correct way to pass a ref to a child component (forwardRef)?',
    options: [
      'React.forwardRef((props, ref) => ...)',
      'React.createRef((props, ref) => ...)',
      'React.useRef((props) => ...)',
      'React.passRef((props, ref) => ...)'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'What is the purpose of React.memo?',
    options: [
      'A higher-order component that shallowly compares props to prevent unnecessary re-renders',
      'A hook to cache return values of standard functions',
      'A class method to log rendering times',
      'A decorator to store state in history'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'In React Router, which hook is used to programmatically navigate?',
    options: [
      'useNavigate',
      'useHistory',
      'useRedirect',
      'useRouter'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'What is Strict Mode in React?',
    options: [
      'A tool for highlighting potential problems in an application by running double-renders in dev mode',
      'A security layer that blocks cross-site scripting',
      'A compiler flag that enables strict TypeScript checks',
      'A runtime mode that prevents component errors from crashing the page'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'What does a custom hook name need to start with by convention?',
    options: [
      'use',
      'get',
      'handle',
      'custom'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'Which hook should be used to store a mutable value that does not cause a re-render when updated?',
    options: [
      'useRef',
      'useState',
      'useMemo',
      'useCallback'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'React',
    questionText: 'What is the purpose of the cleanup function in useEffect?',
    options: [
      'To clean up subscriptions, timers, or event listeners before the component unmounts or re-renders',
      'To clear the browser cache',
      'To reset the component state to default values',
      'To garbage collect unused variables'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },

  // ==================== REACT HARD (10 questions) ====================
  {
    domain: 'React',
    questionText: 'What happens during the reconciliation phase in React?',
    options: [
      'React computes the diff between the new Virtual DOM and the old one to determine minimal real DOM updates',
      'React compiles JSX into plain JavaScript calls',
      'React resolves styling conflicts between components',
      'React synchronizes local state with a backend database'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'How does React\'s Fiber architecture improve performance?',
    options: [
      'By breaking rendering work into incremental chunks and scheduling them based on priority',
      'By compiling React code directly into WebAssembly',
      'By bypassing the Virtual DOM comparison entirely',
      'By executing rendering on multiple browser threads simultaneously'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'What is the correct behavior of the dependency array in useEffect when passing an object variable?',
    options: [
      'It triggers the effect on every render because object references change unless memoized (e.g. via useMemo)',
      'It compares the object properties deeply to see if they changed',
      'It ignores the object variable and logs a warning',
      'It causes a compilation error'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'What are Error Boundaries in React?',
    options: [
      'Class components that catch JavaScript errors anywhere in their child component tree and display a fallback UI',
      'Functional components using the catchError hook',
      'Middleware configurations in Next.js',
      'Try-catch blocks wrapped around JSX'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'How do you implement code splitting in React?',
    options: [
      'Using React.lazy() and Suspense',
      'Using require.ensure()',
      'Using split-chunks-plugin in Webpack config',
      'Using the useSplit hook'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'What is the main benefit of using server components in Next.js/React?',
    options: [
      'They render on the server, reducing the JS bundle sent to the client and improving load performance',
      'They allow direct access to local storage from the server',
      'They eliminate the need for any client-side JavaScript',
      'They run faster in development mode'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'When using useCallback, what is memoized?',
    options: [
      'The function instance itself, preventing its recreation on re-renders unless dependencies change',
      'The returned value of the function',
      'The parameters passed to the function',
      'The component rendering tree'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'What is the purpose of the useLayoutEffect hook?',
    options: [
      'It fires synchronously after all DOM mutations but before the browser paints',
      'It is a faster alternative to useEffect for async operations',
      'It is used specifically for styling CSS transitions',
      'It updates the state before the virtual DOM is constructed'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'In a custom hook, how do you handle state shareability?',
    options: [
      'State inside a custom hook is isolated; each component using the hook gets its own independent state',
      'State is automatically shared globally among all components importing the hook',
      'You must wrap the hook inside a Context Provider to share state',
      'You must pass the state as arguments to other components'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'React',
    questionText: 'What is the purpose of hydration in React SSR?',
    options: [
      'The process of attaching event listeners to the server-rendered static HTML on the client side',
      'The process of fetching initial data before rendering a page',
      'Compiling CSS styles into JavaScript bundles',
      'Caching server-side components in the browser database'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },

  // ==================== NODE.JS / BACKEND (10 questions) ====================
  {
    domain: 'Node.js',
    questionText: 'Which core module in Node.js is used to handle file paths?',
    options: ['path', 'fs', 'url', 'http'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Node.js',
    questionText: 'What is the default package manager for Node.js?',
    options: ['npm', 'yarn', 'pnpm', 'bower'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Node.js',
    questionText: 'How can you read environmental variables inside Node.js?',
    options: ['process.env.VARIABLE_NAME', 'process.variable.VARIABLE_NAME', 'env.VARIABLE_NAME', 'system.env.VARIABLE_NAME'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Node.js',
    questionText: 'Which function is used to load external modules in CommonJS syntax in Node.js?',
    options: ['require()', 'import()', 'load()', 'include()'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Node.js',
    questionText: 'What is the Event Loop in Node.js?',
    options: [
      'A mechanism that offloads operations to the system kernel and executes callbacks asynchronously',
      'A loop that runs database queries sequentially',
      'A tool to schedule web page refreshes in the browser',
      'A multi-threaded compiler that optimizes execution speed'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Node.js',
    questionText: 'Which Node.js core module provides stream capabilities?',
    options: ['stream', 'fs', 'net', 'buffer'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Node.js',
    questionText: 'What does libuv provide to Node.js?',
    options: [
      'A thread pool and event loop for handling non-blocking asynchronous I/O operations',
      'The V8 JavaScript compilation engine',
      'HTTP parsing capabilities',
      'Cryptographic utilities'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Node.js',
    questionText: 'How do you handle unhandled promise rejections in Node.js?',
    options: [
      'process.on(\'unhandledRejection\', callback)',
      'process.on(\'uncaughtException\', callback)',
      'window.onerror = callback',
      'try { ... } catch (err) { ... }'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Node.js',
    questionText: 'What is backpressure in Node.js streams?',
    options: [
      'A build-up of data in buffer when the readable stream reads faster than the writable stream can write',
      'A CPU overhead when network latency increases',
      'A database locking error during high write volumes',
      'An memory leak in the Event Loop queue'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },
  {
    domain: 'Node.js',
    questionText: 'How does worker_threads module differ from cluster module in Node.js?',
    options: [
      'worker_threads share memory space and run in a single process; cluster creates multiple separate processes',
      'worker_threads create new server ports; cluster runs on a single port',
      'worker_threads are only for class systems; cluster is for functional architectures',
      'worker_threads are managed by the browser; cluster is managed by the operating system'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },

  // ==================== PYTHON (10 questions) ====================
  {
    domain: 'Python',
    questionText: 'Which data type in Python is mutable?',
    options: ['list', 'tuple', 'string', 'int'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Python',
    questionText: 'How do you add an element to a list in Python?',
    options: ['append()', 'add()', 'push()', 'insert_last()'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Python',
    questionText: 'What keyword is used to define a function in Python?',
    options: ['def', 'function', 'fun', 'define'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Python',
    questionText: 'What does the list comprehension [x**2 for x in range(3)] produce?',
    options: ['[0, 1, 4]', '[1, 4, 9]', '[0, 1, 8]', '[1, 2, 3]'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Python',
    questionText: 'What is the purpose of the __init__ method in a Python class?',
    options: [
      'To initialize the attributes of an object upon creation',
      'To import modules inside a class',
      'To destroy the object instance and free memory',
      'To inherit methods from a parent class'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Python',
    questionText: 'What is the Global Interpreter Lock (GIL) in Python?',
    options: [
      'A mutex that allows only one thread to execute Python bytecodes at a time',
      'A system that locks script files from being edited during execution',
      'A encryption mechanism for database credentials',
      'A compiler flag that turns off standard exception handling'
    ],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  },

  // ==================== APTITUDE (10 questions) ====================
  {
    domain: 'Aptitude',
    questionText: 'If 5 workers can build a wall in 12 days, how many days will it take 6 workers to build the same wall?',
    options: ['10 days', '8 days', '14 days', '9 days'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Aptitude',
    questionText: 'A car travels at 60 km/h for 2 hours, and then at 80 km/h for 3 hours. What is its average speed?',
    options: ['72 km/h', '70 km/h', '75 km/h', '68 km/h'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Aptitude',
    questionText: 'Find the next number in the series: 2, 6, 12, 20, 30, ...',
    options: ['42', '40', '36', '45'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Aptitude',
    questionText: 'What is the simple interest on $5000 for 3 years at a rate of 5% per annum?',
    options: ['$750', '$600', '$900', '$500'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Aptitude',
    questionText: 'A train 150m long passes a telegraph pole in 9 seconds. What is the speed of the train in km/h?',
    options: ['60 km/h', '54 km/h', '72 km/h', '80 km/h'],
    correctOptionIndex: 0,
    difficulty: 0 // wait, let's calculate: speed = 150 / 9 m/s = (150/9) * 18/5 km/h = 30 * 2 = 60. So index 0 is correct.
  },
  {
    domain: 'Aptitude',
    questionText: 'The ratio of ages of A and B is 4:5. If the sum of their ages is 36 years, what is B\'s age?',
    options: ['20 years', '16 years', '25 years', '18 years'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Aptitude',
    questionText: 'In a group of 80 people, 45 speak English, 30 speak Tamil, and 15 speak both. How many speak neither English nor Tamil?',
    options: ['20', '15', '10', '25'],
    correctOptionIndex: 0,
    difficulty: 'Medium' // 45 + 30 - 15 = 60 speak English or Tamil. 80 - 60 = 20 speak neither.
  },
  {
    domain: 'Aptitude',
    questionText: 'A shopkeeper sells an item at 20% discount on marked price, yet makes 8% profit. By what percentage is marked price above cost price?',
    options: ['35%', '30%', '25%', '40%'],
    correctOptionIndex: 0,
    difficulty: 'Hard' // SP = 0.8 * MP, SP = 1.08 * CP => 0.8 * MP = 1.08 * CP => MP / CP = 1.08 / 0.8 = 1.35. Marked price is 35% above CP.
  },
  {
    domain: 'Aptitude',
    questionText: 'A can do a work in 10 days, B in 12 days, and C in 15 days. They start together but A leaves after 2 days. In how many days is work completed?',
    options: ['5 1/3 days', '6 days', '5 days', '4 2/3 days'],
    correctOptionIndex: 0,
    difficulty: 'Hard' // 1 day work: 1/10 + 1/12 + 1/15 = (6+5+4)/60 = 15/60 = 1/4. In 2 days, 2/4 = 1/2 work is done. Remaining work = 1/2. B and C do 1/12 + 1/15 = 9/60 = 3/20 work/day. Days for B and C: (1/2) / (3/20) = 10/3 = 3 1/3 days. Total days = 2 + 3 1/3 = 5 1/3 days. Correct!
  },

  // ==================== DATA STRUCTURES (10 questions) ====================
  {
    domain: 'Data Structures',
    questionText: 'Which data structure works on a Last In First Out (LIFO) basis?',
    options: ['Stack', 'Queue', 'Linked List', 'Binary Tree'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Data Structures',
    questionText: 'What is the time complexity to access an element in an array by index?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOptionIndex: 0,
    difficulty: 'Easy'
  },
  {
    domain: 'Data Structures',
    questionText: 'What is the worst-case time complexity of sorting an array using Quick Sort?',
    options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(2^n)'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Data Structures',
    questionText: 'In a binary search tree, what traversal yields elements in sorted ascending order?',
    options: ['In-order traversal', 'Pre-order traversal', 'Post-order traversal', 'Level-order traversal'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Data Structures',
    questionText: 'Which algorithm is used to find the shortest path in a weighted graph with non-negative edge weights?',
    options: ['Dijkstra\'s Algorithm', 'Kruskal\'s Algorithm', 'Prim\'s Algorithm', 'Depth First Search'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Data Structures',
    questionText: 'Which of the following data structures is used for implementing Depth First Search (DFS)?',
    options: ['Stack', 'Queue', 'Min-Heap', 'Hash Table'],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Data Structures',
    questionText: 'What is a collision in a Hash Table?',
    options: [
      'When two different keys map to the same hash value/index',
      'When the load factor exceeds 1.0',
      'When memory allocation fails during insertion',
      'When key strings have identical character lengths'
    ],
    correctOptionIndex: 0,
    difficulty: 'Medium'
  },
  {
    domain: 'Data Structures',
    questionText: 'What is the minimum height of a binary tree with N nodes?',
    options: ['floor(log2(N)) + 1', 'N', 'ceil(N/2)', 'sqrt(N)'],
    correctOptionIndex: 0,
    difficulty: 'Hard'
  }
];
